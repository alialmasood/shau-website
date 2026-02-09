type CardSide = "ar" | "en";

type CardData = {
  serial: string;
  nameAr: string;
  nameEn: string;
  dobLabel: string;
  address: string;
  addressEn: string;
  bloodType: string;
  department: string;
  departmentEn: string;
  stage: string;
  stageEn: string;
  expiryLabel: string;
  issueLabel: string;
  photoUrl: string | null;
  qrDataUrl: string;
  barcodeDataUrl: string;
};

export default function IdCardTemplate({
  side,
  data,
}: {
  side: CardSide;
  data: CardData;
}) {
  const isAr = side === "ar";
  const addressEn = data.addressEn || data.address;
  const departmentEn = data.departmentEn || data.department;
  const stageEn = data.stageEn || data.stage;
  const bgUrl = isAr ? "/id-templates/front.png" : "/id-templates/back.png";

  return (
    <div
      className="relative w-[1016px] h-[638px] text-[#145f42]"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {isAr ? (
        <>
          <div className="absolute right-[300px] top-[208px] w-[240px] text-[32px] leading-[44px] font-black text-right whitespace-nowrap" dir="rtl">
            <div className="absolute right-0 top-0">{data.nameAr}</div>
            <div className="absolute right-0 top-[44px]">{data.dobLabel}</div>
            <div className="absolute right-0 top-[88px]">{data.address}</div>
            <div className="absolute right-0 top-[136px]">{data.bloodType}</div>
            <div className="absolute right-0 top-[178px]">{data.department}</div>
            <div className="absolute right-0 top-[235px]">{data.stage}</div>
          </div>

          <div className="absolute left-[20px] top-[190px] w-[210px] h-[260px] overflow-hidden">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt={data.nameAr} className="w-full h-full object-cover" />
            ) : null}
          </div>

          <img
            src="/id-templates/signature.png"
            alt="signature overlay"
            className="absolute left-[60px] top-[400px] w-[170px] h-auto pointer-events-none z-20"
          />

          <div className="absolute left-[-42px] bottom-[60px] w-[340px] h-[64px]">
            <img src={data.barcodeDataUrl} alt="barcode" className="w-full h-full object-contain" />
          </div>

          <div className="absolute right-[43px] bottom-[14px] text-[27px] font-bold text-white">
            {data.serial}
          </div>

          {/*
            تاريخ الإصدار / النفاذ ثابتين في القالب
          */}
        </>
      ) : (
        <>
          <div className="absolute left-[280px] top-[190px] w-[620px] text-[32px] leading-[42px] font-extrabold text-[#1b6b49] text-left" dir="ltr">
            <div>{data.nameEn}</div>
            <div>{data.dobLabel}</div>
            <div>{addressEn}</div>
            <div className="relative top-[4px]">{data.bloodType}</div>
            <div className="relative top-[6px]">{departmentEn}</div>
            <div className="relative top-[8px]">{stageEn}</div>
          </div>

          <div className="absolute right-[30px] top-[210px] w-[240px] h-[300px] overflow-hidden opacity-15">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt={data.nameEn} className="w-full h-full object-cover" />
            ) : null}
          </div>

          <div className="absolute right-[30px] bottom-[124px] w-[110px] h-[110px]">
            <img src={data.qrDataUrl} alt="qr" className="w-full h-full" />
          </div>

          <div className="absolute right-[34px] bottom-[18px] w-[110px] text-center text-[27px] font-bold text-white whitespace-nowrap">
            {data.serial}
          </div>
        </>
      )}
    </div>
  );
}
