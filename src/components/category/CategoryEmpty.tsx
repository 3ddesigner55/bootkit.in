import { Package } from "lucide-react";

export default function CategoryEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full bg-[#F5F7F5] p-5">
        <Package
          size={42}
          className="text-gray-400"
        />
      </div>

      <h3 className="mt-5 text-lg font-black">
        No Products Available
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Products will appear here once they are added by the admin.
      </p>
    </div>
  );
}