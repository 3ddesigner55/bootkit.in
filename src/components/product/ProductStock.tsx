import { CheckCircle2, AlertCircle } from "lucide-react";
import type { Product } from "@/types/product";

type Props = {
  product: Product;
  stock?: number;
  label?: string;
};

export default function ProductStock({ product, stock = product.stock, label = product.unit.label }: Props) {
  if (stock <= 0) {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={18} />
          <span className="font-black">
            Out of Stock
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle2 size={18} />
        <span className="font-black">
            In Stock ({stock} {label} available)
        </span>
      </div>
    </div>
  );
}
