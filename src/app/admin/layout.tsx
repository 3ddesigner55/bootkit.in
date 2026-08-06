import type { ReactNode } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminSidebar />
      <div className="md:pl-20 lg:pl-64">{children}</div>
    </AdminGuard>
  );
}
