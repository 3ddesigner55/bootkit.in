import { Bell, ChevronDown, MapPin, UserCircle2 } from "lucide-react";

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between pt-5">

      <div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Delivering To
        </p>

        <button className="mt-1 flex items-center gap-1">

          <MapPin
            size={18}
            className="text-[var(--primary)]"
          />

          <span className="text-lg font-black">
            Sardarshahar
          </span>

          <ChevronDown size={18} />

        </button>

      </div>

      <div className="flex items-center gap-3">

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">

          <Bell size={19} />

        </button>

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">

          <UserCircle2 size={22} />

        </button>

      </div>

    </header>
  );
}