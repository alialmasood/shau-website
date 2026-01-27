import { NextResponse } from "next/server";
import { createRegistrationDocument } from "@/lib/registrationDocumentsRepo";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      fullName,
      department,
      stage,
      studyType,
      phone,
      personalPhotoId,
      studentIdFrontId,
      studentIdBackId,
      fatherIdFrontId,
      fatherIdBackId,
      motherIdFrontId,
      motherIdBackId,
      residenceCardFrontId,
      residenceCardBackId,
      highSchoolCertificateId,
      barcodeDocumentId,
    } = body;

    if (!fullName || !department || !stage || !studyType || !phone) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const id = await createRegistrationDocument({
      fullName: String(fullName),
      department: String(department),
      stage: String(stage),
      studyType: String(studyType),
      phone: String(phone),
      personalPhotoId: personalPhotoId || null,
      studentIdFrontId: studentIdFrontId || null,
      studentIdBackId: studentIdBackId || null,
      fatherIdFrontId: fatherIdFrontId || null,
      fatherIdBackId: fatherIdBackId || null,
      motherIdFrontId: motherIdFrontId || null,
      motherIdBackId: motherIdBackId || null,
      residenceCardFrontId: residenceCardFrontId || null,
      residenceCardBackId: residenceCardBackId || null,
      highSchoolCertificateId: highSchoolCertificateId || null,
      barcodeDocumentId: barcodeDocumentId || null,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error creating registration document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ البيانات" },
      { status: 500 }
    );
  }
}
