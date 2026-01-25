"use client";

import { useState } from "react";
import { createProgram, updateProgram } from "./actions";
import type { ProgramRow } from "@/lib/programsRepo";

const STUDY_SHIFTS = [
  { value: "morning", labelAr: "صباحي فقط", labelEn: "Morning only" },
  { value: "evening", labelAr: "مسائي فقط", labelEn: "Evening only" },
  { value: "both", labelAr: "صباحي ومسائي", labelEn: "Both" },
];

const STAGES = [1, 2, 3, 4] as const;
const SHIFTS = [
  { value: "morning" as const, labelAr: "صباحي" },
  { value: "evening" as const, labelAr: "مسائي" },
];

type TableFormItem = {
  stage: 1 | 2 | 3 | 4;
  shift: "morning" | "evening";
  pdfId: string | null;
  pdfFile: File | null;
  imageIds: string[];
  imageFiles: File[];
  htmlAr: string;
  htmlEn: string;
};

function toFormItems(
  items: { stage: number; shift: string; pdf_id: string | null; image_ids: string[]; html_ar: string | null; html_en: string | null }[]
): TableFormItem[] {
  return items.map((x) => ({
    stage: [1, 2, 3, 4].includes(x.stage) ? (x.stage as 1 | 2 | 3 | 4) : 1,
    shift: x.shift === "evening" ? "evening" : "morning",
    pdfId: x.pdf_id || null,
    pdfFile: null,
    imageIds: Array.isArray(x.image_ids) ? x.image_ids : [],
    imageFiles: [],
    htmlAr: x.html_ar || "",
    htmlEn: x.html_en || "",
  }));
}

function ImageSlot({
  label,
  imageId,
  onClear,
  onFile,
  inputCls,
}: {
  label: string;
  imageId: string | null;
  onClear: () => void;
  onFile: (f: File | null) => void;
  inputCls: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-700 mb-1">{label}</label>
      {imageId && (
        <div className="mb-2 flex items-center gap-2">
          <img src={`/api/media/${imageId}`} alt="" className="h-16 w-24 object-cover rounded" />
          <button type="button" onClick={onClear} className="text-red-600 text-sm">إزالة</button>
        </div>
      )}
      <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className={inputCls} />
    </div>
  );
}

function PdfSlot({
  label,
  pdfId,
  pdfFile,
  onClear,
  onFile,
  inputCls,
  labelCls,
}: {
  label: string;
  pdfId: string | null;
  pdfFile: File | null;
  onClear: () => void;
  onFile: (f: File | null) => void;
  inputCls: string;
  labelCls: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {(pdfId || pdfFile) && (
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          {pdfId && !pdfFile && (
            <a href={`/api/media/${pdfId}`} target="_blank" rel="noopener noreferrer" className="text-[#31BD9C] font-medium hover:underline">
              تحميل PDF
            </a>
          )}
          {pdfFile && <span className="text-neutral-600 text-sm">ملف جديد: {pdfFile.name}</span>}
          <button type="button" onClick={onClear} className="text-red-600 text-sm">إزالة</button>
        </div>
      )}
      <input type="file" accept=".pdf,application/pdf" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className={inputCls} />
    </div>
  );
}

function ImagesMulti({
  label,
  imageIds,
  imageFiles,
  onRemoveId,
  onRemoveFile,
  onAdd,
  inputCls,
  labelCls,
}: {
  label: string;
  imageIds: string[];
  imageFiles: File[];
  onRemoveId: (id: string) => void;
  onRemoveFile: (i: number) => void;
  onAdd: (files: File[]) => void;
  inputCls: string;
  labelCls: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {imageIds.map((id) => (
          <div key={id} className="relative">
            <img src={`/api/media/${id}`} alt="" className="h-16 w-24 object-cover rounded border" />
            <button type="button" onClick={() => onRemoveId(id)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
          </div>
        ))}
        {imageFiles.map((f, i) => (
          <div key={`f-${i}`} className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-neutral-300 text-sm">
            <span className="truncate max-w-[120px]">{f.name}</span>
            <button type="button" onClick={() => onRemoveFile(i)} className="text-red-600">×</button>
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { const f = e.target.files; if (f?.length) { onAdd(Array.from(f)); e.target.value = ""; } }}
        className={inputCls}
      />
    </div>
  );
}

function TableRow({
  item,
  onChange,
  onRemove,
  inputCls,
  labelCls,
}: {
  item: TableFormItem;
  onChange: (p: Partial<TableFormItem>) => void;
  onRemove: () => void;
  inputCls: string;
  labelCls: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className={labelCls}>المرحلة</label>
          <select
            value={item.stage}
            onChange={(e) => onChange({ stage: Number(e.target.value) as 1 | 2 | 3 | 4 })}
            className={inputCls}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>المرحلة {["الأولى", "الثانية", "الثالثة", "الرابعة"][s - 1]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>نوع الدراسة</label>
          <select
            value={item.shift}
            onChange={(e) => onChange({ shift: e.target.value === "evening" ? "evening" : "morning" })}
            className={inputCls}
          >
            {SHIFTS.map((s) => (
              <option key={s.value} value={s.value}>{s.labelAr}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={onRemove} className="mt-6 px-3 py-1.5 text-red-600 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50">
          حذف
        </button>
      </div>
      <PdfSlot
        label="ملف PDF (للتحميل)"
        pdfId={item.pdfId}
        pdfFile={item.pdfFile}
        onClear={() => onChange({ pdfId: null, pdfFile: null })}
        onFile={(f) => onChange({ pdfFile: f })}
        inputCls={inputCls}
        labelCls={labelCls}
      />
      <ImagesMulti
        label="صور الجدول (يمكن إضافة أكثر من صورة)"
        imageIds={item.imageIds}
        imageFiles={item.imageFiles}
        onRemoveId={(id) => onChange({ imageIds: item.imageIds.filter((x) => x !== id) })}
        onRemoveFile={(i) => onChange({ imageFiles: item.imageFiles.filter((_, j) => j !== i) })}
        onAdd={(files) => onChange({ imageFiles: [...item.imageFiles, ...files] })}
        inputCls={inputCls}
        labelCls={labelCls}
      />
      <div>
        <label className={labelCls}>HTML (عربي) — اختياري</label>
        <textarea value={item.htmlAr} onChange={(e) => onChange({ htmlAr: e.target.value })} className={inputCls} rows={3} placeholder="&lt;table&gt;...&lt;/table&gt;" />
      </div>
      <div>
        <label className={labelCls}>HTML (إنجليزي)</label>
        <textarea value={item.htmlEn} onChange={(e) => onChange({ htmlEn: e.target.value })} className={inputCls} rows={3} />
      </div>
    </div>
  );
}

export default function ProgramForm({ initial, existingSlugs = [] }: { initial?: ProgramRow | null; existingSlugs?: string[] }) {
  const isEdit = !!initial?.id;

  const [slug, setSlug] = useState(initial?.slug || "");
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [briefAr, setBriefAr] = useState(initial?.briefAr ?? "");
  const [briefEn, setBriefEn] = useState(initial?.briefEn ?? "");
  const [lecturesTables, setLecturesTables] = useState<TableFormItem[]>(() => toFormItems(initial?.lecturesTables ?? []));
  const [examsTables, setExamsTables] = useState<TableFormItem[]>(() => toFormItems(initial?.examsTables ?? []));
  const [studyShift, setStudyShift] = useState(initial?.studyShift || "both");
  const [image1Id, setImage1Id] = useState<string | null>(initial?.image1Id ?? null);
  const [image2Id, setImage2Id] = useState<string | null>(initial?.image2Id ?? null);
  const [image3Id, setImage3Id] = useState<string | null>(initial?.image3Id ?? null);
  const [image4Id, setImage4Id] = useState<string | null>(initial?.image4Id ?? null);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [file3, setFile3] = useState<File | null>(null);
  const [file4, setFile4] = useState<File | null>(null);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive !== false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadFile(f: File | null, existing: string | null): Promise<string | null> {
    if (f) {
      const fd = new FormData();
      fd.append("file", f);
      const up = await fetch("/api/media", { method: "POST", body: fd });
      const j = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(j?.error || "فشل رفع الصورة");
      return String(j.id);
    }
    return existing;
  }

  function addLectures() {
    setLecturesTables((prev) => [...prev, { stage: 1, shift: "morning", pdfId: null, pdfFile: null, imageIds: [], imageFiles: [], htmlAr: "", htmlEn: "" }]);
  }
  function addExams() {
    setExamsTables((prev) => [...prev, { stage: 1, shift: "morning", pdfId: null, pdfFile: null, imageIds: [], imageFiles: [], htmlAr: "", htmlEn: "" }]);
  }

  async function uploadTableItem(it: TableFormItem): Promise<{ pdf_id: string | null; image_ids: string[] }> {
    const pdf_id = await uploadFile(it.pdfFile, it.pdfId);
    const newIds = await Promise.all(it.imageFiles.map((f) => uploadFile(f, null)));
    const image_ids = [...it.imageIds, ...(newIds.filter(Boolean) as string[])];
    return { pdf_id, image_ids };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const [img1, img2, img3, img4, ...rest] = await Promise.all([
        uploadFile(file1, image1Id),
        uploadFile(file2, image2Id),
        uploadFile(file3, image3Id),
        uploadFile(file4, image4Id),
        ...lecturesTables.map((it) => uploadTableItem(it)),
        ...examsTables.map((it) => uploadTableItem(it)),
      ]);
      const imgs = [img1, img2, img3, img4];
      const n = lecturesTables.length;
      const lectureResults = rest.slice(0, n) as { pdf_id: string | null; image_ids: string[] }[];
      const examResults = rest.slice(n) as { pdf_id: string | null; image_ids: string[] }[];

      const lectures_tables = lecturesTables.map((it, i) => ({
        stage: it.stage,
        shift: it.shift,
        pdf_id: lectureResults[i]?.pdf_id ?? null,
        image_ids: lectureResults[i]?.image_ids ?? [],
        html_ar: it.htmlAr.trim() || null,
        html_en: it.htmlEn.trim() || null,
      }));
      const exams_tables = examsTables.map((it, i) => ({
        stage: it.stage,
        shift: it.shift,
        pdf_id: examResults[i]?.pdf_id ?? null,
        image_ids: examResults[i]?.image_ids ?? [],
        html_ar: it.htmlAr.trim() || null,
        html_en: it.htmlEn.trim() || null,
      }));

      const data = {
        slug: slug.trim() || undefined,
        name_ar: nameAr.trim() || null,
        name_en: nameEn.trim() || null,
        brief_ar: briefAr.trim() || null,
        brief_en: briefEn.trim() || null,
        lectures_tables,
        exams_tables,
        study_shift: studyShift,
        image_1_id: imgs[0] ?? null,
        image_2_id: imgs[1] ?? null,
        image_3_id: imgs[2] ?? null,
        image_4_id: imgs[3] ?? null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      if (isEdit && initial?.id) {
        const res = await updateProgram(initial.id, data);
        if (!res.ok) throw new Error(res.error);
        setSuccess("تم حفظ التعديلات.");
      } else {
        const res = await createProgram({ ...data, slug: slug.trim() || "" });
        if (!res.ok) throw new Error(res.error);
        setSuccess("تم إضافة البرنامج.");
        if (res.id) window.location.href = "/admin/programs";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none";
  const labelCls = "block text-sm font-semibold text-neutral-700 mb-1";
  const secCls = "space-y-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">أ) بيانات البرنامج</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>الرابط (slug) *</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="dental-technology" required disabled={isEdit} />
            {isEdit && <p className="text-xs text-neutral-500 mt-1">لا يمكن تغيير الرابط عند التعديل.</p>}
          </div>
          <div><label className={labelCls}>اسم القسم (عربي)</label><input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>اسم القسم (إنجليزي)</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} /></div>
          <div className="md:col-span-2">
            <label className={labelCls}>توفر الدراسة</label>
            <select value={studyShift} onChange={(e) => setStudyShift(e.target.value)} className={inputCls}>
              {STUDY_SHIFTS.map((s) => (
                <option key={s.value} value={s.value}>{s.labelAr}</option>
              ))}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>نبذة عن القسم (عربي)</label><textarea value={briefAr} onChange={(e) => setBriefAr(e.target.value)} className={inputCls} rows={4} /></div>
        <div><label className={labelCls}>نبذة عن القسم (إنجليزي)</label><textarea value={briefEn} onChange={(e) => setBriefEn(e.target.value)} className={inputCls} rows={4} /></div>
      </section>

      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">ب) جدول المحاضرات</h3>
        <p className="text-sm text-neutral-600 mb-2">جدول لكل مرحلة (1–4) ونوع دراسة (صباحي/مسائي). يمكنك رفع ملف PDF للتحميل و/أو أكثر من صورة و/أو HTML.</p>
        <div className="space-y-4">
          {lecturesTables.map((item, i) => (
            <TableRow
              key={i}
              item={item}
              onChange={(p) => setLecturesTables((prev) => { const n = [...prev]; n[i] = { ...n[i], ...p }; return n; })}
              onRemove={() => setLecturesTables((prev) => prev.filter((_, j) => j !== i))}
              inputCls={inputCls}
              labelCls={labelCls}
            />
          ))}
        </div>
        <button type="button" onClick={addLectures} className="mt-2 px-4 py-2 rounded-lg border border-dashed border-[#31BD9C] text-[#31BD9C] font-medium hover:bg-[#31BD9C]/5">
          ＋ إضافة جدول محاضرات
        </button>
      </section>

      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">ج) جدول الامتحانات</h3>
        <p className="text-sm text-neutral-600 mb-2">جدول لكل مرحلة (1–4) ونوع دراسة (صباحي/مسائي). يمكنك رفع ملف PDF للتحميل و/أو أكثر من صورة و/أو HTML.</p>
        <div className="space-y-4">
          {examsTables.map((item, i) => (
            <TableRow
              key={i}
              item={item}
              onChange={(p) => setExamsTables((prev) => { const n = [...prev]; n[i] = { ...n[i], ...p }; return n; })}
              onRemove={() => setExamsTables((prev) => prev.filter((_, j) => j !== i))}
              inputCls={inputCls}
              labelCls={labelCls}
            />
          ))}
        </div>
        <button type="button" onClick={addExams} className="mt-2 px-4 py-2 rounded-lg border border-dashed border-[#31BD9C] text-[#31BD9C] font-medium hover:bg-[#31BD9C]/5">
          ＋ إضافة جدول امتحانات
        </button>
      </section>

      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">د) صور القسم (4 صور)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageSlot label="الصورة 1" imageId={image1Id} onClear={() => { setImage1Id(null); setFile1(null); }} onFile={setFile1} inputCls={inputCls} />
          <ImageSlot label="الصورة 2" imageId={image2Id} onClear={() => { setImage2Id(null); setFile2(null); }} onFile={setFile2} inputCls={inputCls} />
          <ImageSlot label="الصورة 3" imageId={image3Id} onClear={() => { setImage3Id(null); setFile3(null); }} onFile={setFile3} inputCls={inputCls} />
          <ImageSlot label="الصورة 4" imageId={image4Id} onClear={() => { setImage4Id(null); setFile4(null); }} onFile={setFile4} inputCls={inputCls} />
        </div>
      </section>

      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">هـ) التحكم بالعرض</h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> الحالة: ظاهر</label>
          <div><label className={labelCls}>الترتيب</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`w-24 ${inputCls}`} /></div>
        </div>
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={isSaving} className="px-6 py-3 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-bold disabled:opacity-70">{isSaving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة البرنامج"}</button>
        <a href="/admin/programs" className="px-6 py-3 rounded-xl border border-neutral-200 font-semibold">إلغاء</a>
      </div>
    </form>
  );
}
