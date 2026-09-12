"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  IC_IMAGE_ACCEPT,
  IC_MAX_IMAGE_BYTES,
  IC_MAX_PDF_BYTES,
  IC_PDF_ACCEPT,
  type IcUploadedFile,
} from "@/lib/innovationConferenceUi";
import { FieldError, IcIcon, icFocus } from "./IcFormChrome";

type UploadKind = "image" | "pdf";
type UploadLocale = "ar" | "en";

const UPLOAD_COPY = {
  ar: {
    dropHint: "اسحب الملفات هنا أو انقر للاختيار",
    uploading: " · جاري الرفع...",
    uploaded: "تم الرفع",
    retry: "إعادة",
    remove: "إزالة",
    removeFile: (name: string) => `إزالة ${name}`,
    uploadFailed: "تعذر رفع الملف.",
    imageTypeInvalid: "يُقبل JPG أو PNG أو WEBP فقط.",
    imageTooLarge: "حجم الصورة يتجاوز 5MB.",
    pdfTypeInvalid: "يُقبل ملف PDF فقط.",
    pdfTooLarge: "حجم الملف يتجاوز 10MB.",
  },
  en: {
    dropHint: "Drag files here or click to choose",
    uploading: " · uploading...",
    uploaded: "uploaded",
    retry: "Retry",
    remove: "Remove",
    removeFile: (name: string) => `Remove ${name}`,
    uploadFailed: "The file could not be uploaded.",
    imageTypeInvalid: "Only JPG, PNG or WEBP files are accepted.",
    imageTooLarge: "Image size exceeds 5MB.",
    pdfTypeInvalid: "Only PDF files are accepted.",
    pdfTooLarge: "File size exceeds 10MB.",
  },
} as const;

async function uploadFile(file: File, locale: UploadLocale): Promise<IcUploadedFile> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/media/public", { method: "POST", body: fd });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !json.id) {
    // رسالة الخادم عربية دائماً، لذا نعرض رسالتنا في الواجهة الإنجليزية.
    throw new Error(
      locale === "en" ? UPLOAD_COPY.en.uploadFailed : json.error || UPLOAD_COPY.ar.uploadFailed
    );
  }
  return {
    mediaId: String(json.id),
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

function validateClientFile(file: File, kind: UploadKind, locale: UploadLocale): string | null {
  const c = UPLOAD_COPY[locale];
  if (kind === "image") {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!ok) return c.imageTypeInvalid;
    if (file.size > IC_MAX_IMAGE_BYTES) return c.imageTooLarge;
  } else {
    if (file.type !== "application/pdf") return c.pdfTypeInvalid;
    if (file.size > IC_MAX_PDF_BYTES) return c.pdfTooLarge;
  }
  return null;
}

type ItemState = {
  localId: string;
  status: "uploading" | "done" | "error";
  progress: number;
  file?: File;
  uploaded?: IcUploadedFile;
  previewUrl?: string;
  error?: string;
};

type Props = {
  kind: UploadKind;
  label: string;
  hint: string;
  multiple?: boolean;
  maxFiles?: number;
  value: IcUploadedFile[];
  onChange: (files: IcUploadedFile[]) => void;
  error?: string;
  fieldKey: string;
  locale?: UploadLocale;
};

export default function IcFileUploadZone({
  kind,
  label,
  hint,
  multiple = false,
  maxFiles = 1,
  value,
  onChange,
  error,
  fieldKey,
  locale = "ar",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ItemState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const c = UPLOAD_COPY[locale];

  const accept = kind === "image" ? IC_IMAGE_ACCEPT : IC_PDF_ACCEPT;
  const busy = items.some((i) => i.status === "uploading");

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) return;
    const slice = files.slice(0, remaining);

    for (const file of slice) {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const clientErr = validateClientFile(file, kind, locale);
      const previewUrl =
        kind === "image" && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

      if (clientErr) {
        setItems((prev) => [
          ...prev,
          { localId, status: "error", progress: 0, file, previewUrl, error: clientErr },
        ]);
        continue;
      }

      setItems((prev) => [
        ...prev,
        { localId, status: "uploading", progress: 35, file, previewUrl },
      ]);

      try {
        setItems((prev) =>
          prev.map((it) => (it.localId === localId ? { ...it, progress: 70 } : it))
        );
        const uploaded = await uploadFile(file, locale);
        setItems((prev) =>
          prev.map((it) =>
            it.localId === localId
              ? { ...it, status: "done", progress: 100, uploaded }
              : it
          )
        );
        onChange([...value, uploaded]);
        setItems((prev) => prev.filter((it) => it.localId !== localId));
      } catch (e) {
        setItems((prev) =>
          prev.map((it) =>
            it.localId === localId
              ? {
                  ...it,
                  status: "error",
                  progress: 0,
                  error: e instanceof Error ? e.message : c.uploadFailed,
                }
              : it
          )
        );
      }
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) void processFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) void processFiles(e.dataTransfer.files);
  }

  function removeDone(mediaId: string) {
    onChange(value.filter((v) => v.mediaId !== mediaId));
  }

  function removeItem(localId: string) {
    setItems((prev) => {
      const it = prev.find((x) => x.localId === localId);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.localId !== localId);
    });
  }

  async function retry(localId: string) {
    const it = items.find((x) => x.localId === localId);
    if (!it?.file) return;
    removeItem(localId);
    await processFiles([it.file]);
  }

  return (
    <div data-field={fieldKey}>
      <p className="mb-1.5 text-sm font-semibold text-[#163364]">{label}</p>
      <p className="mb-3 text-xs text-neutral-500">{hint}</p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !busy && value.length < maxFiles && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? "border-[#31BD9C] bg-[#eef8f5]"
            : "border-neutral-200 bg-[#F7FAF9] hover:border-[#31BD9C]/50"
        } ${icFocus}`}
        aria-disabled={busy || value.length >= maxFiles}
      >
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#187c67] shadow-sm">
          <IcIcon name="upload" className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-[#163364]">{c.dropHint}</span>
        <span className="mt-1 text-xs text-neutral-500">
          {value.length}/{maxFiles}
          {busy ? c.uploading : ""}
        </span>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
        />
      </div>

      <FieldError message={error} id={`${fieldKey}-error`} />

      <ul className="mt-4 space-y-3">
        {value.map((f) => (
          <li
            key={f.mediaId}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3"
          >
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/media/${f.mediaId}`}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#eef2f8] text-[#163364]">
                <IcIcon name="file" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">{f.fileName}</p>
              <p className="text-xs text-neutral-500">
                {(f.size / 1024).toFixed(0)} KB · {c.uploaded}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeDone(f.mediaId)}
              className={`rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 ${icFocus}`}
              aria-label={c.removeFile(f.fileName)}
            >
              <IcIcon name="trash" className="h-4 w-4" />
            </button>
          </li>
        ))}

        {items.map((it) => (
          <li
            key={it.localId}
            className="rounded-xl border border-neutral-100 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              {it.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.previewUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#eef2f8]">
                  <IcIcon name="file" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.file?.name}</p>
                {it.status === "uploading" && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-[#31BD9C] transition-all"
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                )}
                {it.status === "error" && (
                  <p className="mt-1 text-xs text-red-600">{it.error}</p>
                )}
              </div>
              {it.status === "error" && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={`rounded-lg px-2 py-1 text-xs font-semibold text-[#163364] hover:bg-[#eef2f8] ${icFocus}`}
                    onClick={() => void retry(it.localId)}
                  >
                    {c.retry}
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 ${icFocus}`}
                    onClick={() => removeItem(it.localId)}
                    aria-label={c.remove}
                  >
                    <IcIcon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
