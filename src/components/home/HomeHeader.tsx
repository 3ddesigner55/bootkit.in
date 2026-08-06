"use client";

import { Bell, ChevronDown, MapPin, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomeHeader() {
  const [showHeaderInfo, setShowHeaderInfo] = useState(true);

  useEffect(() => {
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (
      currentScrollY > lastScrollY &&
      currentScrollY > 80
    ) {
      setShowHeaderInfo(false);
    } else {
      setShowHeaderInfo(true);
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener(
    "scroll",
    handleScroll
  );

  return () =>
    window.removeEventListener(
      "scroll",
      handleScroll
    );
}, []);

  return (
   <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 backdrop-blur-xl bg-white/55 border-b border-white/20">

      <div
  className={`overflow-hidden transition-all duration-300 ${
    showHeaderInfo
      ? "max-h-28 opacity-100"
      : "max-h-0 opacity-0"
  }`}
>

  <h1 className="text-[12px] font-brown text-[var(--text-primary)]">
    Bootkit.in
  </h1>

  <p className="text-[20px] font-brown text-[var(--text-primary)]">
    15 minutes in delivery
  </p>

  <button className="mt-1 flex items-center gap-1">

    <MapPin
      size={15}
      className="text-[var(--primary)]"
    />

    <span className="text-[12px] font-bold">
      Sardarshahar
    </span>

    <ChevronDown
      size={15}
      className="text-gray-500"
    />

  </button>

</div>

      <div className="flex items-center gap-3">

        <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,.08)]">

          <Bell size={19} />

        </button>

        <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,.08)]">

          <UserCircle2 size={22} />

        </button>

      </div>

    </header>
  );
}