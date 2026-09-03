export type CollectionHubSlug =
  "beauty" | "electronics" | "pharmacy" | "decor" | "kids" | "gifting";

export const COLLECTION_HUBS: CollectionHubSlug[] = [
  "beauty",
  "electronics",
  "pharmacy",
  "decor",
  "kids",
  "gifting",
];

export function isCollectionHub(slug: string): slug is CollectionHubSlug {
  return COLLECTION_HUBS.includes(slug.toLowerCase() as CollectionHubSlug);
}

export interface HubTheme {
  title: string;
  searchPlaceholder: string;
  bannerGradient: string;
  bannerShadow: string;
  bannerBadgeBg: string;
  bannerBadgeText: string;
  bannerCtaText: string;
  bannerCtaBg: string;
  bannerHeading: string;
  bannerSubtitle: string;
  btnBorder: string;
  btnBg: string;
  btnText: string;
  btnHoverBg: string;
}

export interface CategoryCardItem {
  name: string;
  slug: string;
  image: string;
}

export interface HubCategorySection {
  title: string;
  subtitle?: string;
  seeAllSlug: string;
  categories: CategoryCardItem[];
}

export interface HubBrandAd {
  id: string;
  brandName: string;
  offerTag: string;
  description: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  href: string;
}

export interface HubConfig {
  theme: HubTheme;
  sections: HubCategorySection[];
  brandAds: HubBrandAd[];
}

export const HUB_CONFIGS: Record<CollectionHubSlug, HubConfig> = {
  beauty: {
    theme: {
      title: "Beauty",
      searchPlaceholder: "Search beauty, skincare, makeup...",
      bannerGradient: "from-[#FF6B8B] via-[#FF8E53] to-[#FE5196]",
      bannerShadow: "shadow-[0_12px_28px_rgba(254,81,150,0.28)]",
      bannerBadgeBg: "bg-white/20 text-white",
      bannerBadgeText: "BEAUTY FESTIVAL",
      bannerCtaBg: "bg-white",
      bannerCtaText: "text-[#FE5196]",
      bannerHeading: "Up to 50% Off On\nBeauty Essentials",
      bannerSubtitle: "Top skincare, luxury makeup & salon haircare picks",
      btnBorder: "border-[#FE5196]",
      btnBg: "bg-rose-50/60",
      btnText: "text-[#FE5196]",
      btnHoverBg: "hover:bg-[#FE5196] hover:text-white",
    },
    sections: [
      {
        title: "Accessories to Complete Your Look",
        subtitle: "Everyday essentials & styling tools",
        seeAllSlug: "beauty-accessories",
        categories: [
          { name: "Hair Accessories", slug: "hair-accessories", image: "🎀" },
          { name: "Makeup Brushes", slug: "makeup-brushes", image: "🖌️" },
          { name: "Nail Care & Tools", slug: "nail-care", image: "💅" },
        ],
      },
      {
        title: "Skincare & Everyday Glow",
        subtitle: "Hydration, brightening & sun protection",
        seeAllSlug: "skincare",
        categories: [
          { name: "Face Serums", slug: "face-serums", image: "✨" },
          { name: "Moisturizers", slug: "moisturizers", image: "🧴" },
          { name: "Sunscreen SPF", slug: "sunscreen", image: "☀️" },
        ],
      },
      {
        title: "Haircare & Salon Luxury",
        subtitle: "Nourishment from root to tip",
        seeAllSlug: "haircare",
        categories: [
          { name: "Shampoos", slug: "shampoos", image: "🫧" },
          { name: "Hair Oils & Masks", slug: "hair-oils", image: "🌿" },
          { name: "Conditioners", slug: "conditioners", image: "💧" },
        ],
      },
    ],
    brandAds: [
      {
        id: "loreal",
        brandName: "L'Oréal Paris",
        offerTag: "UP TO 40% OFF",
        description: "Salon-grade Haircare & Hyaluronic Glow",
        gradient: "from-rose-500 via-pink-600 to-rose-700",
        badgeBg: "bg-white/20 text-white",
        badgeText: "PREMIUM PICK",
        href: "/category/beauty?brand=loreal",
      },
      {
        id: "maybelline",
        brandName: "Maybelline New York",
        offerTag: "FLAT 35% OFF",
        description: "SuperStay Matte Ink & Fit Me Essentials",
        gradient: "from-amber-600 via-orange-600 to-rose-600",
        badgeBg: "bg-black/30 text-amber-200",
        badgeText: "HOT DEAL",
        href: "/category/beauty?brand=maybelline",
      },
      {
        id: "minimalist",
        brandName: "Minimalist",
        offerTag: "DEALS FROM ₹299",
        description: "Clean & Active-Rich Clinical Skincare",
        gradient: "from-slate-800 via-slate-900 to-zinc-950",
        badgeBg: "bg-white/20 text-white",
        badgeText: "TRENDING",
        href: "/category/beauty?brand=minimalist",
      },
      {
        id: "nykaa",
        brandName: "Nykaa Cosmetics",
        offerTag: "BUY 2 GET 1",
        description: "Vibrant Lip shades & Quick-Dry Enamels",
        gradient: "from-pink-600 via-rose-600 to-fuchsia-700",
        badgeBg: "bg-white/25 text-white",
        badgeText: "EXCLUSIVE",
        href: "/category/beauty?brand=nykaa",
      },
    ],
  },
  electronics: {
    theme: {
      title: "Electronics",
      searchPlaceholder: "Search earbuds, cables, smart accessories...",
      bannerGradient: "from-[#2563EB] via-[#3B82F6] to-[#1D4ED8]",
      bannerShadow: "shadow-[0_12px_28px_rgba(37,99,235,0.28)]",
      bannerBadgeBg: "bg-white/20 text-white",
      bannerBadgeText: "TECH BONANZA",
      bannerCtaBg: "bg-white",
      bannerCtaText: "text-[#1D4ED8]",
      bannerHeading: "Supercharged Deals On\nSmart Electronics",
      bannerSubtitle: "High-speed charging, premium audio & smart devices",
      btnBorder: "border-[#2563EB]",
      btnBg: "bg-blue-50/60",
      btnText: "text-[#2563EB]",
      btnHoverBg: "hover:bg-[#2563EB] hover:text-white",
    },
    sections: [
      {
        title: "Audio & Entertainment Essentials",
        subtitle: "Wireless earbuds, neckbands & speakers",
        seeAllSlug: "audio",
        categories: [
          { name: "TWS Earbuds", slug: "tws-earbuds", image: "🎧" },
          { name: "Bluetooth Speakers", slug: "speakers", image: "🔊" },
          { name: "Neckbands", slug: "neckbands", image: "🎵" },
        ],
      },
      {
        title: "Power & High-Speed Charging",
        subtitle: "Fast adapters, power banks & braided cables",
        seeAllSlug: "cables-chargers",
        categories: [
          { name: "Fast Chargers", slug: "chargers", image: "⚡" },
          { name: "Power Banks", slug: "powerbanks", image: "🔋" },
          { name: "Type-C Cables", slug: "cables", image: "🔌" },
        ],
      },
      {
        title: "Smart Wearables & Tech Add-ons",
        subtitle: "Fitness trackers, phone mounts & gaming",
        seeAllSlug: "wearables",
        categories: [
          { name: "Smartwatches", slug: "smartwatches", image: "⌚" },
          { name: "Phone Mounts", slug: "mounts", image: "📱" },
          { name: "Gaming Triggers", slug: "gaming-gear", image: "🎮" },
        ],
      },
    ],
    brandAds: [
      {
        id: "boat",
        brandName: "boAt Audio",
        offerTag: "FLAT 50% OFF",
        description: "Airdopes, Bassheads & Rockerz wireless gear",
        gradient: "from-red-600 via-rose-700 to-zinc-900",
        badgeBg: "bg-white/20 text-white",
        badgeText: "BESTSELLER",
        href: "/category/electronics?brand=boat",
      },
      {
        id: "noise",
        brandName: "Noise Smart Tech",
        offerTag: "FROM ₹999",
        description: "ColorFit Smartwatches & Tru Buds lineup",
        gradient: "from-blue-600 via-indigo-700 to-slate-900",
        badgeBg: "bg-white/20 text-white",
        badgeText: "TOP RATED",
        href: "/category/electronics?brand=noise",
      },
      {
        id: "portronics",
        brandName: "Portronics",
        offerTag: "UP TO 45% OFF",
        description: "High-speed adapters, docks & power accessories",
        gradient: "from-cyan-600 via-teal-700 to-slate-900",
        badgeBg: "bg-white/20 text-white",
        badgeText: "VERIFIED",
        href: "/category/electronics?brand=portronics",
      },
    ],
  },
  pharmacy: {
    theme: {
      title: "Pharmacy",
      searchPlaceholder: "Search vitamins, wellness, first aid...",
      bannerGradient: "from-[#059669] via-[#10B981] to-[#047857]",
      bannerShadow: "shadow-[0_12px_28px_rgba(5,150,105,0.28)]",
      bannerBadgeBg: "bg-white/20 text-white",
      bannerBadgeText: "HEALTH & WELLNESS",
      bannerCtaBg: "bg-white",
      bannerCtaText: "text-[#047857]",
      bannerHeading: "100% Genuine Care &\nDaily Wellness",
      bannerSubtitle:
        "Vitamins, immunity boosters, first aid & personal hygiene",
      btnBorder: "border-[#059669]",
      btnBg: "bg-emerald-50/60",
      btnText: "text-[#059669]",
      btnHoverBg: "hover:bg-[#059669] hover:text-white",
    },
    sections: [
      {
        title: "Vitamins & Daily Immunity",
        subtitle: "Multivitamins, minerals & herbal tonics",
        seeAllSlug: "vitamins-supplements",
        categories: [
          { name: "Multivitamins", slug: "multivitamins", image: "💊" },
          { name: "Vitamin C & Zinc", slug: "vitamin-c", image: "🍊" },
          { name: "Herbal Supplements", slug: "herbal-care", image: "🌿" },
        ],
      },
      {
        title: "First Aid & Home Essentials",
        subtitle: "Bandages, pain relief & antiseptic care",
        seeAllSlug: "first-aid",
        categories: [
          { name: "Pain Relief", slug: "pain-relief", image: "🩹" },
          { name: "Antiseptic Liquids", slug: "antiseptic", image: "🧴" },
          { name: "Health Monitors", slug: "health-devices", image: "🩺" },
        ],
      },
      {
        title: "Digestive & Family Health",
        subtitle: "ORS, pro-biotics & respiratory health",
        seeAllSlug: "digestive-care",
        categories: [
          { name: "Digestive Care", slug: "digestive", image: "💧" },
          { name: "Cough & Cold", slug: "cough-cold", image: "☕" },
          { name: "Eye & Ear Care", slug: "eye-care", image: "👁️" },
        ],
      },
    ],
    brandAds: [
      {
        id: "himalaya",
        brandName: "Himalaya Wellness",
        offerTag: "UP TO 30% OFF",
        description: "Pure herbs, daily health & natural vitality",
        gradient: "from-emerald-700 via-teal-800 to-green-950",
        badgeBg: "bg-white/20 text-white",
        badgeText: "AYURVEDIC",
        href: "/category/pharmacy?brand=himalaya",
      },
      {
        id: "dettol",
        brandName: "Dettol Healthcare",
        offerTag: "COMBO DEALS",
        description: "Trusted germ protection for your entire family",
        gradient: "from-teal-600 via-emerald-700 to-slate-900",
        badgeBg: "bg-white/20 text-white",
        badgeText: "ESSENTIAL",
        href: "/category/pharmacy?brand=dettol",
      },
      {
        id: "dabur",
        brandName: "Dabur Health",
        offerTag: "FLAT 25% OFF",
        description: "Chyawanprash, honey & immune health formulas",
        gradient: "from-amber-700 via-orange-800 to-stone-900",
        badgeBg: "bg-white/20 text-white",
        badgeText: "TRUSTED",
        href: "/category/pharmacy?brand=dabur",
      },
    ],
  },
  decor: {
    theme: {
      title: "Decor",
      searchPlaceholder: "Search home accents, lights, organizers...",
      bannerGradient: "from-[#D97706] via-[#F59E0B] to-[#B45309]",
      bannerShadow: "shadow-[0_12px_28px_rgba(217,119,6,0.28)]",
      bannerBadgeBg: "bg-white/20 text-white",
      bannerBadgeText: "HOME MAKEOVER",
      bannerCtaBg: "bg-white",
      bannerCtaText: "text-[#B45309]",
      bannerHeading: "Elegance & Warmth For\nYour Living Space",
      bannerSubtitle:
        "Lamps, cozy fragrances, decorative organizers & kitchenware",
      btnBorder: "border-[#D97706]",
      btnBg: "bg-amber-50/60",
      btnText: "text-[#D97706]",
      btnHoverBg: "hover:bg-[#D97706] hover:text-white",
    },
    sections: [
      {
        title: "Ambient Lighting & Lamps",
        subtitle: "Fairy lights, scented candles & desk lamps",
        seeAllSlug: "lighting-candles",
        categories: [
          { name: "Scented Candles", slug: "candles", image: "🕯️" },
          { name: "Fairy Lights", slug: "fairy-lights", image: "💡" },
          { name: "Accent Lamps", slug: "lamps", image: "🏮" },
        ],
      },
      {
        title: "Vases & Table Accents",
        subtitle: "Ceramic planters, figurines & coasters",
        seeAllSlug: "table-accents",
        categories: [
          { name: "Ceramic Vases", slug: "vases", image: "🏺" },
          { name: "Table Coasters", slug: "coasters", image: "🪵" },
          { name: "Decorative Trays", slug: "trays", image: "🪞" },
        ],
      },
      {
        title: "Kitchen & Dining Decor",
        subtitle: "Dinnerware, glassware & premium containers",
        seeAllSlug: "dining-kitchen",
        categories: [
          { name: "Glass Jars", slug: "glass-jars", image: "🫙" },
          { name: "Ceramic Mugs", slug: "mugs", image: "☕" },
          { name: "Table Mats", slug: "table-mats", image: "🧺" },
        ],
      },
    ],
    brandAds: [
      {
        id: "borosil",
        brandName: "Borosil Home",
        offerTag: "UP TO 35% OFF",
        description: "Borosilicate glassware & aesthetic kitchenware",
        gradient: "from-amber-700 via-orange-800 to-stone-900",
        badgeBg: "bg-white/20 text-white",
        badgeText: "PREMIUM",
        href: "/category/decor?brand=borosil",
      },
      {
        id: "clay-craft",
        brandName: "Clay Craft Living",
        offerTag: "HANDMADE PICKS",
        description: "Fine bone china mugs & artisan dinner sets",
        gradient: "from-stone-700 via-amber-900 to-zinc-950",
        badgeBg: "bg-white/20 text-white",
        badgeText: "ARTISAN",
        href: "/category/decor?brand=clay-craft",
      },
    ],
  },
  kids: {
    theme: {
      title: "Kids & Baby",
      searchPlaceholder: "Search babycare, toys, snacks, diapers...",
      bannerGradient: "from-[#F59E0B] via-[#EC4899] to-[#8B5CF6]",
      bannerShadow: "shadow-[0_12px_28px_rgba(236,72,153,0.28)]",
      bannerBadgeBg: "bg-white/20 text-white",
      bannerBadgeText: "KIDS CARNIVAL",
      bannerCtaBg: "bg-white",
      bannerCtaText: "text-[#EC4899]",
      bannerHeading: "Everything For Happy,\nGrowing Little Ones",
      bannerSubtitle: "Gentle babycare, educational toys & nutritious bites",
      btnBorder: "border-[#EC4899]",
      btnBg: "bg-pink-50/60",
      btnText: "text-[#EC4899]",
      btnHoverBg: "hover:bg-[#EC4899] hover:text-white",
    },
    sections: [
      {
        title: "Gentle Baby Care Essentials",
        subtitle: "Diapers, baby wipes, lotions & shampoos",
        seeAllSlug: "baby-care",
        categories: [
          { name: "Pants Diapers", slug: "diapers", image: "👶" },
          { name: "Gentle Wipes", slug: "wipes", image: "🧻" },
          { name: "Baby Lotions", slug: "baby-lotions", image: "🧴" },
        ],
      },
      {
        title: "Fun Toys & Creative Learning",
        subtitle: "Puzzles, building blocks & art supplies",
        seeAllSlug: "toys-games",
        categories: [
          { name: "Building Blocks", slug: "blocks", image: "🧱" },
          { name: "Board Games", slug: "board-games", image: "🎲" },
          { name: "Art & Colors", slug: "art-colors", image: "🎨" },
        ],
      },
      {
        title: "Healthy Bites & Feeding",
        subtitle: "Baby cereals, fruit purees & sippers",
        seeAllSlug: "baby-food",
        categories: [
          { name: "Baby Cereals", slug: "cereals", image: "🥣" },
          { name: "Sippers & Bottles", slug: "bottles", image: "🍼" },
          { name: "Healthy Snacks", slug: "kids-snacks", image: "🍪" },
        ],
      },
    ],
    brandAds: [
      {
        id: "pampers",
        brandName: "Pampers Active",
        offerTag: "FLAT 25% OFF",
        description: "All-night dryness & ultra-soft comfort",
        gradient: "from-teal-500 via-cyan-600 to-sky-700",
        badgeBg: "bg-white/20 text-white",
        badgeText: "NO. 1 CHOICE",
        href: "/category/kids?brand=pampers",
      },
      {
        id: "johnsons",
        brandName: "Johnson's Baby",
        offerTag: "COMBO SAVINGS",
        description: "Clinically proven mildness for delicate skin",
        gradient: "from-pink-500 via-rose-600 to-purple-700",
        badgeBg: "bg-white/20 text-white",
        badgeText: "CLASSIC",
        href: "/category/kids?brand=johnsons",
      },
      {
        id: "lego",
        brandName: "LEGO & Funskool",
        offerTag: "UP TO 30% OFF",
        description: "Endless creativity & brain-boosting playsets",
        gradient: "from-amber-500 via-red-600 to-rose-700",
        badgeBg: "bg-white/20 text-white",
        badgeText: "POPULAR",
        href: "/category/kids?brand=lego",
      },
    ],
  },
  gifting: {
    theme: {
      title: "Gifting",
      searchPlaceholder: "Search gift hampers, chocolates, flowers...",
      bannerGradient: "from-[#7C3AED] via-[#9333EA] to-[#6D28D9]",
      bannerShadow: "shadow-[0_12px_28px_rgba(124,58,237,0.28)]",
      bannerBadgeBg: "bg-white/20 text-white",
      bannerBadgeText: "CELEBRATION DEALS",
      bannerCtaBg: "bg-white",
      bannerCtaText: "text-[#7C3AED]",
      bannerHeading: "Thoughtful Gifts For\nEvery Special Moment",
      bannerSubtitle: "Artisan chocolates, luxury hampers & curated gift boxes",
      btnBorder: "border-[#7C3AED]",
      btnBg: "bg-purple-50/60",
      btnText: "text-[#7C3AED]",
      btnHoverBg: "hover:bg-[#7C3AED] hover:text-white",
    },
    sections: [
      {
        title: "Artisan Chocolates & Sweets",
        subtitle: "Luxury dark truffles, sweets & gift boxes",
        seeAllSlug: "chocolates-sweets",
        categories: [
          { name: "Premium Truffles", slug: "truffles", image: "🍫" },
          { name: "Traditional Sweets", slug: "sweets", image: "🍬" },
          { name: "Dry Fruit Boxes", slug: "dry-fruits", image: "🌰" },
        ],
      },
      {
        title: "Curated Celebration Hampers",
        subtitle: "Gourmet snacks, wellness & tea gift packs",
        seeAllSlug: "gift-hampers",
        categories: [
          { name: "Snack Hampers", slug: "snack-hampers", image: "🎁" },
          { name: "Gourmet Tea Sets", slug: "tea-sets", image: "🍵" },
          { name: "Aroma Spa Kits", slug: "spa-kits", image: "💐" },
        ],
      },
      {
        title: "Greeting Cards & Gift Wrap",
        subtitle: "Festive wrapping, ribbons & customized cards",
        seeAllSlug: "cards-packaging",
        categories: [
          { name: "Greeting Cards", slug: "greeting-cards", image: "💌" },
          { name: "Gift Bags", slug: "gift-bags", image: "🛍️" },
          { name: "Ribbons & Tags", slug: "ribbons", image: "🎀" },
        ],
      },
    ],
    brandAds: [
      {
        id: "ferrero",
        brandName: "Ferrero Rocher",
        offerTag: "FESTIVE BOXES",
        description: "Crisp hazelnut and milk chocolate pralines",
        gradient: "from-amber-600 via-yellow-700 to-amber-900",
        badgeBg: "bg-black/30 text-amber-200",
        badgeText: "SIGNATURE",
        href: "/category/gifting?brand=ferrero",
      },
      {
        id: "cadbury",
        brandName: "Cadbury Celebrations",
        offerTag: "UP TO 30% OFF",
        description: "Rich silk gift packs for memorable moments",
        gradient: "from-purple-800 via-indigo-900 to-slate-950",
        badgeBg: "bg-white/20 text-white",
        badgeText: "FESTIVE",
        href: "/category/gifting?brand=cadbury",
      },
    ],
  },
};
