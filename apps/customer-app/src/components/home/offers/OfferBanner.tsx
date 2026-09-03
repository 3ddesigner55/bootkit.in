export default function OfferBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#67D7CF] to-[#59C4BD] px-6 pt-8 pb-28">

      {/* Heading */}

      <div className="text-center">

        <h2 className="text-[18px] font-medium text-white">
          Welcome in
        </h2>

        <h1 className="mt-2 text-[38px] font-black text-white">
          Bootkit
        </h1>

        <p className="mt-3 text-[16px] text-white/90">
          Order now and enjoy great offers
        </p>

      </div>

      {/* Bottom Wave */}

      <div className="absolute bottom-0 left-0 h-14 w-full rounded-t-[60px] bg-white/25" />

    </div>
  );
}