const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء seed قاعدة البيانات...");

  // 1. إنشاء صفحات الإدارة
  const pages = [
    { code: "news", nameAr: "الأخبار", nameEn: "News" },
    { code: "programs", nameAr: "البرامج", nameEn: "Programs" },
    { code: "departments", nameAr: "الأقسام", nameEn: "Departments" },
    { code: "users", nameAr: "المستخدمين", nameEn: "Users" },
    { code: "content", nameAr: "المحتوى", nameEn: "Content" },
    { code: "admin", nameAr: "لوحة التحكم", nameEn: "Admin Dashboard" },
    { code: "applications", nameAr: "طلبات التقديم", nameEn: "Applications" },
    { code: "registration", nameAr: "شؤون التسجيل", nameEn: "Registration" },
    { code: "ticker", nameAr: "الشريط الإخباري", nameEn: "Ticker" },
    { code: "social", nameAr: "السوشيال ميديا", nameEn: "Social Media" },
    { code: "tuition", nameAr: "الرسوم الدراسية", nameEn: "Tuition Fees" },
  ];

  console.log("📄 إنشاء صفحات الإدارة...");
  for (const page of pages) {
    await prisma.adminPage.upsert({
      where: { code: page.code },
      update: { nameAr: page.nameAr, nameEn: page.nameEn || null },
      create: page,
    });
  }
  console.log(`✅ تم إنشاء ${pages.length} صفحة`);

  // 2. البحث عن المستخدم admin@shau.edu.iq أو إنشاؤه
  console.log("👤 البحث عن المستخدم admin@shau.edu.iq...");
  let adminUser = await prisma.adminUser.findUnique({
    where: { email: "admin@shau.edu.iq" },
  });

  if (!adminUser) {
    console.log("🔐 إنشاء المستخدم admin@shau.edu.iq...");
    const hashedPassword = await bcrypt.hash("Admin@2024", 10);
    adminUser = await prisma.adminUser.create({
      data: {
        email: "admin@shau.edu.iq",
        password_hash: hashedPassword,
        role: "ADMIN",
        full_name: "المدير الرئيسي",
        is_active: true,
      },
    });
    console.log("✅ تم إنشاء المستخدم");
  } else {
    console.log("✅ المستخدم موجود بالفعل");
  }

  // 3. إعطاء صلاحيات كاملة للمستخدم admin على جميع الصفحات
  console.log("🔑 إعطاء صلاحيات كاملة للمستخدم admin...");
  const allPages = await prisma.adminPage.findMany();

  for (const page of allPages) {
    await prisma.adminPagePermission.upsert({
      where: {
        admin_user_id_page_id: {
          admin_user_id: adminUser.id,
          page_id: page.id,
        },
      },
      update: {
        can_access: true,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_upload: true,
        can_export: true,
        can_publish: true,
      },
      create: {
        admin_user_id: adminUser.id,
        page_id: page.id,
        can_access: true,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_upload: true,
        can_export: true,
        can_publish: true,
      },
    });
  }
  console.log(`✅ تم إعطاء صلاحيات كاملة على ${allPages.length} صفحة`);

  console.log("✅ اكتمل seed قاعدة البيانات بنجاح!");
}

main()
  .catch((e) => {
    console.error("❌ خطأ في seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
