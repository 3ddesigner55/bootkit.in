"use client";

import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Wallet,
  PackageCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  deliveryMinutes: number;
};

export default function ProductDeliveryInfo({
  deliveryMinutes,
}: Props) {
  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <h3 className="text-lg font-black text-[var(--text-primary)]">
        Delivery Information
      </h3>

      <div className="mt-5 space-y-4">

        <InfoRow
          icon={Truck}
          title="Fast Delivery"
          description={`Usually delivered within ${deliveryMinutes} minutes`}
        />

        <InfoRow
          icon={PackageCheck}
          title="Fresh Packaging"
          description="Packed safely before dispatch."
        />

        <InfoRow
          icon={Wallet}
          title="Cash on Delivery"
          description="Available in eligible locations."
        />

        <InfoRow
          icon={RotateCcw}
          title="Easy Returns"
          description="Damaged or incorrect items are eligible for support."
        />

        <InfoRow
          icon={ShieldCheck}
          title="100% Genuine Product"
          description="Directly supplied from trusted brands."
        />

      </div>
    </section>
  );
}

type RowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function InfoRow({
  icon: Icon,
  title,
  description,
}: RowProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={20} />
      </div>

      <div>
        <h4 className="text-sm font-black">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
