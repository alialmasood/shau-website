"use client";

import { usePathname } from "next/navigation";
import AdminNav from "./AdminNav";

export default function AdminNavConditional() {
  const pathname = usePathname() ?? "";
  
  // إخفاء AdminNav في صفحة /admin فقط
  if (pathname === "/admin") {
    return null;
  }
  
  return <AdminNav />;
}
