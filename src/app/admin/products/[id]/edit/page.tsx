"use client";

import { useParams } from "next/navigation";
import AdminProductEditClient from "@/components/admin/AdminProductEditClient";

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || "";

  return <AdminProductEditClient productId={id} />;
}
