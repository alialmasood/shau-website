import crypto from "crypto";

function verifySig(rid: string, sid: string, sig: string) {
  const secret = process.env.RESULT_QR_SECRET!;
  const payload = `${rid}:${sid}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === sig;
}

export default async function VerifyResultPage({ searchParams }: { searchParams: Promise<{ rid?: string; sid?: string; sig?: string }> }) {
  const params = await searchParams;
  const rid = String(params?.rid ?? "");
  const sid = String(params?.sid ?? "");
  const sig = String(params?.sig ?? "");
  const ok = rid && sid && sig ? verifySig(rid, sid, sig) : false;

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">التحقق من النتيجة</h1>
        <div className="mt-4">
          {ok ? (
            <p className="text-green-700">✅ هذه النتيجة صادرة من نظام الكلية وموقعة رقمياً.</p>
          ) : (
            <p className="text-red-700">❌ رابط التحقق غير صحيح أو تم العبث به.</p>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <div>Result ID: {rid || "—"}</div>
          <div>Student ID: {sid || "—"}</div>
        </div>
      </div>
    </main>
  );
}
