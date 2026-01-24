import Link from "next/link";
import { getAllTickerItems } from "@/lib/tickerRepo";
import {
  createTickerItem,
  deleteTickerItem,
  moveTickerItem,
  toggleTickerItem,
  updateTickerItem,
} from "./actions";

export default async function AdminTickerPage() {
  const items = await getAllTickerItems();

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              إدارة الشريط الإخباري
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              أضف/عدّل/احذف عناصر الشريط، وحدد الترتيب والتفعيل.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              رجوع
            </Link>
          </div>
        </div>

        {/* Add new */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            إضافة عنصر جديد
          </h2>
          <form action={createTickerItem} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                النص
              </label>
              <input
                name="text"
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
                placeholder="مثال: تعلن الكلية عن..."
                required
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                النص (إنجليزي، اختياري)
              </label>
              <input
                name="textEn"
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
                placeholder="e.g. The college announces..."
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                رابط (اختياري)
              </label>
              <input
                name="link"
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                الترتيب
              </label>
              <input
                name="sortOrder"
                type="number"
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
                placeholder="تلقائي"
              />
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <input type="checkbox" name="isActive" defaultChecked className="w-4 h-4" />
                فعّال
              </label>

              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                إضافة
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">العناصر</h2>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="text-right px-4 py-3 font-bold">الترتيب</th>
                  <th className="text-right px-4 py-3 font-bold">النص</th>
                  <th className="text-right px-4 py-3 font-bold">الرابط</th>
                  <th className="text-center px-4 py-3 font-bold">الحالة</th>
                  <th className="text-center px-4 py-3 font-bold">تحريك</th>
                  <th className="text-center px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600" colSpan={6}>
                      لا توجد عناصر حالياً. أضف عنصر جديد من الأعلى.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3 align-top">
                        <form action={updateTickerItem} className="flex items-start gap-2">
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            name="sortOrder"
                            type="number"
                            defaultValue={item.sortOrder}
                            className="w-24 px-3 py-2 rounded-lg bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
                          />
                          <input type="hidden" name="text" value={item.text} />
                          <input type="hidden" name="textEn" value={item.textEn ?? ""} />
                          <input type="hidden" name="link" value={item.link ?? ""} />
                          <input type="hidden" name="isActive" value={item.isActive ? "on" : ""} />
                          <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors"
                            aria-label="حفظ الترتيب"
                          >
                            حفظ
                          </button>
                        </form>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <form action={updateTickerItem} className="space-y-2">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="sortOrder" value={item.sortOrder} />
                          <div className="flex flex-col gap-2">
                            <textarea
                              name="text"
                              defaultValue={item.text}
                              className="w-full min-w-[320px] px-3 py-2 rounded-lg bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
                              rows={2}
                              required
                            />
                            <div>
                              <label className="block text-xs font-semibold text-neutral-600 mb-1">النص (إنجليزي، اختياري)</label>
                              <textarea
                                name="textEn"
                                defaultValue={item.textEn ?? ""}
                                className="w-full min-w-[320px] px-3 py-2 rounded-lg bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
                                rows={2}
                              />
                            </div>
                            <input
                              name="link"
                              defaultValue={item.link ?? ""}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
                              placeholder="https://..."
                            />
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700">
                              <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked={item.isActive}
                                className="w-4 h-4"
                              />
                              فعّال
                            </label>
                          </div>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors"
                          >
                            حفظ التعديلات
                          </button>
                        </form>
                      </td>

                      <td className="px-4 py-3 align-top text-neutral-700">
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0b63ce] hover:underline break-all"
                          >
                            {item.link}
                          </a>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top text-center">
                        <form action={toggleTickerItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="next" value={item.isActive ? "0" : "1"} />
                          <button
                            type="submit"
                            className={[
                              "px-3 py-2 rounded-full text-xs font-bold transition-all border",
                              item.isActive
                                ? "bg-[#31BD9C] text-white border-[#31BD9C] hover:bg-[#2aa88a]"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C]",
                            ].join(" ")}
                          >
                            {item.isActive ? "فعّال" : "غير فعّال"}
                          </button>
                        </form>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-center gap-2">
                          <form action={moveTickerItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="dir" value="up" />
                            <button
                              type="submit"
                              disabled={idx === 0}
                              className={[
                                "px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                                idx === 0
                                  ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                                  : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C]",
                              ].join(" ")}
                            >
                              ↑
                            </button>
                          </form>
                          <form action={moveTickerItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="dir" value="down" />
                            <button
                              type="submit"
                              disabled={idx === items.length - 1}
                              className={[
                                "px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                                idx === items.length - 1
                                  ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                                  : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C]",
                              ].join(" ")}
                            >
                              ↓
                            </button>
                          </form>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-center">
                        <form action={deleteTickerItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                          >
                            حذف
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

