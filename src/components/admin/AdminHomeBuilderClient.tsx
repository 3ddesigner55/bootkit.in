"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  History,
  Layers,
  LayoutGrid,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { getApiBaseUrl } from "@/services/api";
import { broadcastHomeConfigUpdate } from "@/services/customerApi.service";

type SectionType =
  | "hero_carousel"
  | "hero_banner"
  | "offer_section"
  | "offer"
  | "best_seller_grid"
  | "best_sellers"
  | "grocery_kitchen"
  | "dry_food_masala"
  | "household_essentials"
  | "sweet_tooth"
  | "featured_this_week"
  | "featured_banner"
  | "snacks_drinks"
  | "beauty_personal_care"
  | "store_spotlight"
  | "category_cards"
  | "product_grid"
  | "category_grid";

type ItemType = "product" | "category" | "banner" | "offer" | "collection" | "store";

type ConfigItem = {
  itemType: ItemType;
  referenceId: string;
  sortOrder: number;
  active: boolean;
  targetType?: string;
  targetValue?: string;
  label?: string; // Display label for admin UI
  displayProductIds?: string[];
};

type ConfigSection = {
  sectionId: string;
  type: SectionType;
  active: boolean;
  sortOrder: number;
  title: string;
  subtitle: string;
  itemMode: "MANUAL" | "BEST_SELLING" | "CATEGORY" | "RECENT";
  items: ConfigItem[];
  sourceCategoryId?: string | null;
  layoutKey?: string | null;
  selectionMode?: string | null;
  rowCount?: number | null;
};

type HomeConfigData = {
  _id?: string;
  schemaVersion: string;
  configVersion: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  scopeType: "GLOBAL" | "CITY" | "STORE";
  sections: ConfigSection[];
  publishedAt?: string;
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero_carousel: "Hero Banner Carousel — 10 max",
  hero_banner: "Hero Banner (Legacy)",
  offer_section: "Offer Cards / Banners — 10 max",
  offer: "Offer Cards (Legacy)",
  best_seller_grid: "Best Sellers Category Grid — 12 max",
  best_sellers: "Best Sellers (Legacy)",
  grocery_kitchen: "Category Grid — 4 per row",
  dry_food_masala: "Product Grid — 3×2",
  household_essentials: "Category Grid — 4 per row",
  sweet_tooth: "Product Grid — 3×2",
  featured_this_week: "Featured This Week — 10 max",
  featured_banner: "Featured Mid Banner (Legacy)",
  snacks_drinks: "Category Grid — 4 per row",
  beauty_personal_care: "Category Grid — 4 per row",
  store_spotlight: "Store Spotlight — 10 max",
  category_cards: "Category Grid — 4 per row",
  product_grid: "Product Grid — 3×2",
  category_grid: "Category Grid — 4 per row",
};

const ALLOWED_ITEM_TYPES_FOR_SECTION: Record<string, ItemType[]> = {
  hero_banner: ["banner"],
  hero_carousel: ["banner"],
  featured_banner: ["banner"],
  featured_this_week: ["banner"],
  offer: ["offer", "banner"],
  offer_section: ["offer", "banner"],
  best_sellers: ["category"],
  best_seller_grid: ["category"],
  grocery_kitchen: ["category"],
  dry_food_masala: ["product"],
  household_essentials: ["category"],
  sweet_tooth: ["product"],
  snacks_drinks: ["category"],
  beauty_personal_care: ["category"],
  store_spotlight: ["store"],
  category_cards: ["category"],
  product_grid: ["product"],
  category_grid: ["category"],
};

const ALLOWED_ADD_SECTION_TYPES: SectionType[] = [
  "category_grid",
  "product_grid",
  "best_sellers",
  "hero_banner",
  "featured_banner",
  "offer",
  "store_spotlight",
];


export default function AdminHomeBuilderClient() {
  const { session } = useAccount();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"sections" | "preview" | "history">("sections");

  const [draftConfig, setDraftConfig] = useState<HomeConfigData | null>(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(0);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemSearch, setAddItemSearch] = useState("");
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Available referenced options for item picker
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableBanners, setAvailableBanners] = useState<any[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);

  // Preview & History Data
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any | null>(null);

  const isItemIncompatible = (sectionType: string, itemType: ItemType): boolean => {
    const allowed = ALLOWED_ITEM_TYPES_FOR_SECTION[sectionType];
    if (!allowed) return false;
    return !allowed.includes(itemType);
  };

  const getItemLabel = (item: ConfigItem): string => {
    if (item.label) return item.label;
    if (item.itemType === "category") {
      return availableCategories.find((c) => c._id === item.referenceId)?.name || item.referenceId;
    }
    if (item.itemType === "product") {
      return availableProducts.find((p) => p._id === item.referenceId)?.name || item.referenceId;
    }
    if (item.itemType === "banner") {
      return availableBanners.find((b) => b._id === item.referenceId)?.title || item.referenceId;
    }
    if (item.itemType === "store") {
      return availableStores.find((s) => s._id === item.referenceId)?.name || item.referenceId;
    }
    return item.referenceId;
  };

  const validateSectionClient = (sec: ConfigSection): string[] => {
    const errors: string[] = [];
    const sectionType = ['category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'category_grid'].includes(sec.type)
      ? 'category_grid'
      : ['sweet_tooth', 'dry_food_masala', 'product_grid'].includes(sec.type)
      ? 'product_grid'
      : ['best_sellers', 'best_seller_grid'].includes(sec.type)
      ? 'best_sellers'
      : sec.type;

    const layoutKey = sec.layoutKey || (sectionType === 'category_grid' ? 'CATEGORY_GRID_4' : sectionType === 'product_grid' ? 'PRODUCT_GRID_3X2' : sectionType === 'best_sellers' ? 'BEST_SELLERS_3X2' : null);
    const rowCount = sec.rowCount || (layoutKey === 'CATEGORY_GRID_4' ? (sec.sectionId === 'grocery_kitchen' ? 1 : 2) : 2);
    const selectionMode = sec.selectionMode || (sec.items && sec.items.length > 0 ? 'MANUAL' : 'AUTOMATIC');

    const resolveCategoryImage = (cat: any): string => {
      const candidates = [cat.image, cat.icon, cat.banner];
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          const url = candidate.trim();
          const isHttps = url.startsWith('https://');
          const isInternalPath = url.startsWith('/') && !url.startsWith('//');
          const isForbidden = url.includes('localhost') || url.startsWith('file://') || url.includes('/uploads/') || url.includes('uploads/');
          if ((isHttps || isInternalPath) && !isForbidden) {
            return url;
          }
        }
      }
      return '';
    };

    if (sectionType === 'category_grid') {
      if (!sec.sourceCategoryId) {
        if (sec.sectionId !== 'grocery_kitchen' && sec.sectionId !== 'household_essentials') {
          errors.push("Missing source Category");
        }
      } else {
        const cat = availableCategories.find(c => c._id === sec.sourceCategoryId);
        if (!cat) {
          errors.push("Source category does not exist");
        } else if (!cat.active) {
          errors.push(`Source category "${cat.name}" is inactive`);
        }
      }

      if (selectionMode === 'MANUAL') {
        const activeItems = (sec.items || []).filter(i => i.active);
        const expected = rowCount * 4;
        if (activeItems.length === 0) {
          errors.push("No manual items selected");
        } else if (activeItems.length > expected) {
          errors.push(`Maximum ${expected} categories allowed (currently has ${activeItems.length})`);
        } else {
          for (const item of activeItems) {
            if (item.itemType !== 'category') {
              errors.push(`Incompatible item type "${item.itemType}". Only category items are allowed.`);
              continue;
            }
            const childCat = availableCategories.find(c => c._id === item.referenceId);
            if (!childCat) {
              errors.push(`Child category reference ${item.referenceId} does not exist`);
            }
          }
        }
      }
    } else if (sectionType === 'product_grid') {
      if (!sec.sourceCategoryId) {
        errors.push("Missing source Category");
      } else {
        const cat = availableCategories.find(c => c._id === sec.sourceCategoryId);
        if (!cat) {
          errors.push("Source category does not exist");
        } else if (!cat.active) {
          errors.push(`Source category "${cat.name}" is inactive`);
        }
      }

      if (selectionMode === 'MANUAL') {
        const activeItems = (sec.items || []).filter(i => i.active);
        if (activeItems.length === 0) {
          errors.push("No manual products selected");
        } else if (activeItems.length > 6) {
          errors.push(`Maximum 6 products allowed (currently has ${activeItems.length})`);
        } else {
          for (const item of activeItems) {
            if (item.itemType !== 'product') {
              errors.push(`Incompatible item type "${item.itemType}". Only product items are allowed.`);
              continue;
            }
            const prod = availableProducts.find(p => p._id === item.referenceId);
            if (!prod) {
              errors.push(`Product reference ${item.referenceId} does not exist`);
            }
          }
        }
      }
    } else if (sectionType === 'best_sellers') {
      if (selectionMode === 'MANUAL') {
        const activeItems = (sec.items || []).filter(i => i.active);
        if (activeItems.length === 0) {
          errors.push("No manual categories selected");
        } else if (activeItems.length > 6) {
          errors.push(`Maximum 6 categories allowed (currently has ${activeItems.length})`);
        } else {
          for (const item of activeItems) {
            if (item.itemType !== 'category') {
              errors.push(`Incompatible item type "${item.itemType}". Only category items are allowed in Best Sellers.`);
            }
          }
        }
      }
    } else if (['hero_banner', 'hero_carousel', 'featured_banner', 'featured_this_week'].includes(sec.type)) {
      const activeItems = (sec.items || []).filter(i => i.active);
      for (const item of activeItems) {
        if (item.itemType !== 'banner') {
          errors.push(`Incompatible item type "${item.itemType}". Only banner items are allowed in ${sec.title || sec.type}.`);
        } else {
          const banner = availableBanners.find(b => b._id === item.referenceId);
          if (!banner) {
            errors.push(`Banner reference ${item.referenceId} does not exist`);
          }
        }
      }
    } else if (sec.type === 'store_spotlight') {
      const activeItems = (sec.items || []).filter(i => i.active);
      if (activeItems.length > 10) {
        errors.push(`Maximum 10 stores allowed (currently has ${activeItems.length})`);
      }
      for (const item of activeItems) {
        if (item.itemType !== 'store') {
          errors.push(`Incompatible item type "${item.itemType}". Only store items are allowed in Store Spotlight.`);
        } else {
          const store = availableStores.find(s => s._id === item.referenceId);
          if (!store) {
            errors.push(`Store reference ${item.referenceId} does not exist`);
          }
        }
      }
    } else if (['offer', 'offer_section'].includes(sec.type)) {
      const activeItems = (sec.items || []).filter(i => i.active);
      for (const item of activeItems) {
        if (item.itemType !== 'offer' && item.itemType !== 'banner') {
          errors.push(`Incompatible item type "${item.itemType}". Only offer items are allowed.`);
        }
      }
    } else {
      const activeItems = (sec.items || []).filter(i => i.active);
      if (activeItems.length === 0) {
        errors.push("No active items attached");
      }
    }
    return errors;
  };

  const handleActivateAllValid = () => {
    if (!draftConfig) return;
    const updatedSections = [...draftConfig.sections];
    const blockers: string[] = [];
    let activatedCount = 0;

    updatedSections.forEach((sec) => {
      if (!sec.active) {
        const errors = validateSectionClient(sec);
        if (errors.length === 0) {
          sec.active = true;
          activatedCount++;
        } else {
          blockers.push(`"${sec.title || sec.sectionId}": ${errors.join(", ")}`);
        }
      }
    });

    setDraftConfig({ ...draftConfig, sections: updatedSections });
    if (blockers.length > 0) {
      setStatusMessage({
        type: "success",
        text: `Activated ${activatedCount} valid sections. Blocker list for invalid sections:\n${blockers.join("\n")}`
      });
    } else {
      setStatusMessage({
        type: "success",
        text: `Activated ${activatedCount} valid sections.`
      });
    }
  };

  const handleHideAll = () => {
    if (!draftConfig) return;
    const updatedSections = draftConfig.sections.map(sec => ({ ...sec, active: false }));
    setDraftConfig({ ...draftConfig, sections: updatedSections });
    setStatusMessage({ type: "success", text: "All sections hidden in Draft." });
  };

  const getManuallySelectableCategories = () => {
    if (!draftConfig || selectedSectionIdx >= draftConfig.sections.length) return [];
    const sec = draftConfig.sections[selectedSectionIdx];
    if (!sec.sourceCategoryId) return availableCategories;
    
    // Sort child categories of sourceCategoryId first, followed by other categories
    return [...availableCategories].sort((a, b) => {
      const aParentId = typeof a.parentCategory === 'object' ? a.parentCategory?._id : a.parentCategory;
      const bParentId = typeof b.parentCategory === 'object' ? b.parentCategory?._id : b.parentCategory;
      const aIsChild = aParentId && String(aParentId) === String(sec.sourceCategoryId) ? 1 : 0;
      const bIsChild = bParentId && String(bParentId) === String(sec.sourceCategoryId) ? 1 : 0;
      if (aIsChild !== bIsChild) return bIsChild - aIsChild;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const getManuallySelectableProducts = () => {
    if (!draftConfig || selectedSectionIdx >= draftConfig.sections.length) return availableProducts;
    const sec = draftConfig.sections[selectedSectionIdx];
    if (!sec?.sourceCategoryId) return availableProducts;

    const getDescendantIds = (catId: string): string[] => {
      const children = availableCategories.filter((c: any) => {
        const pId = typeof c.parentCategory === 'object' ? c.parentCategory?._id : c.parentCategory;
        return pId && String(pId) === String(catId);
      });
      return [String(catId), ...children.flatMap((c: any) => getDescendantIds(c._id))];
    };

    const descendantIds = new Set(getDescendantIds(sec.sourceCategoryId).map(String));
    const descendantSlugs = new Set(
      availableCategories
        .filter((c: any) => descendantIds.has(String(c._id)))
        .map((c: any) => c.slug)
        .filter(Boolean)
    );

    return [...availableProducts].sort((a, b) => {
      const aCatId = String((typeof a.category === 'object' ? a.category?._id : a.category) || a.categoryId || '');
      const bCatId = String((typeof b.category === 'object' ? b.category?._id : b.category) || b.categoryId || '');
      const aCatSlug = String(a.categorySlug || (typeof a.category === 'object' ? a.category?.slug : '') || '');
      const bCatSlug = String(b.categorySlug || (typeof b.category === 'object' ? b.category?.slug : '') || '');

      const aIsDesc = (descendantIds.has(aCatId) || descendantSlugs.has(aCatSlug) || descendantSlugs.has(aCatId)) ? 1 : 0;
      const bIsDesc = (descendantIds.has(bCatId) || descendantSlugs.has(bCatSlug) || descendantSlugs.has(bCatId)) ? 1 : 0;
      if (aIsDesc !== bIsDesc) return bIsDesc - aIsDesc;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const fetchDraft = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();

      const [draftRes, catsRes, prodsRes, bannersRes, storesRes] = await Promise.all([
        fetch(`${apiBase}/admin/home-config/draft`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${apiBase}/admin/categories?limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${apiBase}/admin/products?limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${apiBase}/admin/hero-banners`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${apiBase}/admin/stores?limit=100`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const draftJson = draftRes.ok ? await draftRes.json() : null;
      if (draftJson?.data) {
        setDraftConfig(draftJson.data);
      }

      if (catsRes.ok) {
        const c = await catsRes.json();
        setAvailableCategories(c.data?.categories || c.data || []);
      }
      if (prodsRes.ok) {
        const p = await prodsRes.json();
        setAvailableProducts(p.data?.items || p.data?.products || p.data || []);
      }
      if (bannersRes.ok) {
        const b = await bannersRes.json();
        setAvailableBanners(b.data || []);
      }
      if (storesRes.ok) {
        const s = await storesRes.json();
        setAvailableStores(s.data?.stores || s.data?.items || (Array.isArray(s.data) ? s.data : []));
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load draft configuration." });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/admin/home-config/preview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data.data);
      }
    } catch (err: any) {
      console.error("Preview fetch error:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/admin/home-config/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data.data);
      }
    } catch (err: any) {
      console.error("History fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDraft();
  }, [session?.accessToken]);

  useEffect(() => {
    if (activeTab === "preview") fetchPreview();
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const getEligibleProductsForCategory = (catId: string): any[] => {
    if (!catId) return [];
    const getDescendants = (id: string): string[] => {
      const children = availableCategories.filter((c: any) => {
        const parentId = c.parentCategory?._id || c.parentCategory;
        return parentId && String(parentId) === String(id);
      });
      return [String(id), ...children.flatMap((c: any) => getDescendants(c._id))];
    };
    const descendantIds = getDescendants(catId).map(String);
    const descendantSlugs = new Set(
      availableCategories
        .filter((c: any) => descendantIds.includes(String(c._id)))
        .map((c: any) => c.slug)
        .filter(Boolean)
    );

    const matched = availableProducts.filter((p: any) => {
      const pCatId = String(p.category?._id || p.category || "");
      const pCatSlug = String(p.categorySlug || (typeof p.category === "object" ? p.category?.slug : "") || "");
      return (
        descendantIds.includes(pCatId) ||
        descendantSlugs.has(pCatSlug) ||
        descendantSlugs.has(pCatId)
      );
    });
    return matched.length > 0 ? matched : availableProducts.filter((p: any) => {
      const pCatId = String(p.category?._id || p.category || "");
      const pCatSlug = String(p.categorySlug || (typeof p.category === "object" ? p.category?.slug : "") || "");
      return descendantIds.includes(pCatId) || descendantSlugs.has(pCatSlug) || descendantSlugs.has(pCatId);
    });
  };

  const handleCreateDraft = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();

      const res = await fetch(`${apiBase}/admin/home-config/draft/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scopeType: "GLOBAL",
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || "Failed to initialize draft.");
      }

      setDraftConfig(resJson.data);
      setStatusMessage({ type: "success", text: "Draft initialized successfully." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Error creating draft." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftConfig) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();

      const res = await fetch(`${apiBase}/admin/home-config/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scopeType: draftConfig.scopeType,
          expectedVersion: draftConfig.configVersion,
          sections: draftConfig.sections,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || "Failed to save draft.");
      }

      setDraftConfig(resJson.data);
      setStatusMessage({ type: "success", text: "Draft configuration saved successfully." });
    } catch (err: any) {

      setStatusMessage({ type: "error", text: err.message || "Error saving draft." });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draftConfig) return;
    setPublishing(true);
    setStatusMessage(null);
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();

      // 1. Automatically save current draft state to backend first
      const saveRes = await fetch(`${apiBase}/admin/home-config/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scopeType: draftConfig.scopeType,
          expectedVersion: draftConfig.configVersion,
          sections: draftConfig.sections,
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveJson.message || "Failed to save draft before publishing.");
      }

      // 2. Publish the saved draft
      const res = await fetch(`${apiBase}/admin/home-config/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scopeType: draftConfig.scopeType || "GLOBAL",
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || "Failed to publish configuration.");
      }

      setPublishModalOpen(false);
      broadcastHomeConfigUpdate();
      setStatusMessage({
        type: "success",
        text: `Configuration v${resJson.data.published.configVersion} published to live customer app!`,
      });
      await fetchDraft();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Publish failed." });
    } finally {
      setPublishing(false);
    }
  };

  // Section manipulation helpers
  const handleMoveSection = (fromIdx: number, direction: "up" | "down") => {
    if (!draftConfig) return;
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= draftConfig.sections.length) return;

    const updatedSections = [...draftConfig.sections];
    const [moved] = updatedSections.splice(fromIdx, 1);
    updatedSections.splice(toIdx, 0, moved);

    // Re-assign sortOrder
    updatedSections.forEach((s, idx) => {
      s.sortOrder = idx + 1;
    });

    setDraftConfig({ ...draftConfig, sections: updatedSections });
    setSelectedSectionIdx(toIdx);
  };

  const handleToggleSectionActive = (idx: number) => {
    if (!draftConfig) return;
    const updatedSections = [...draftConfig.sections];
    const section = updatedSections[idx];
    if (!section.active) {
      const errors = validateSectionClient(section);
      if (errors.length > 0) {
        setStatusMessage({
          type: "error",
          text: `Cannot activate section "${section.title || section.sectionId}": ${errors.join(", ")}`
        });
        return;
      }
    }
    section.active = !section.active;
    setDraftConfig({ ...draftConfig, sections: updatedSections });
  };

  const handleDeleteSection = async (idx: number) => {
    if (!draftConfig) return;
    const section = draftConfig.sections[idx];
    setSaving(true);
    setStatusMessage(null);
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();

      const res = await fetch(`${apiBase}/admin/home-config/draft/remove-section`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scopeType: draftConfig.scopeType,
          sectionId: section.sectionId,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || "Failed to remove section.");
      }

      setDraftConfig(resJson.data);
      setSelectedSectionIdx(Math.max(0, idx - 1));
      setStatusMessage({ type: "success", text: "Section removed successfully." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Error removing section." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = (type: SectionType) => {
    if (!draftConfig) return;

    let itemMode: "MANUAL" | "BEST_SELLING" | "CATEGORY" | "RECENT" = "MANUAL";
    let layoutKey: string | null = null;
    let selectionMode: string | null = null;
    let rowCount: number | null = null;

    const isCategoryGridType = [
      "category_grid",
      "category_cards",
      "grocery_kitchen",
      "household_essentials",
      "snacks_drinks",
      "beauty_personal_care",
    ].includes(type);

    const isProductGridType = [
      "product_grid",
      "sweet_tooth",
      "dry_food_masala",
    ].includes(type);

    if (isCategoryGridType) {
      itemMode = "CATEGORY";
      layoutKey = "CATEGORY_GRID_4";
      selectionMode = "AUTOMATIC";
      rowCount = 1;
    } else if (isProductGridType) {
      itemMode = "CATEGORY";
      layoutKey = "PRODUCT_GRID_3X2";
      selectionMode = "AUTOMATIC";
      rowCount = 2;
    } else if (type === "best_sellers" || type === "best_seller_grid") {
      itemMode = "BEST_SELLING";
      layoutKey = "BEST_SELLERS_3X2";
      selectionMode = "AUTOMATIC";
      rowCount = 2;
    } else {
      itemMode = "MANUAL";
      layoutKey = null;
      selectionMode = "MANUAL";
      rowCount = null;
    }

    let suffix = 1;
    while (draftConfig.sections.some((s) => s.sectionId === `${type}_${suffix}`)) {
      suffix++;
    }
    const sectionId = `${type}_${suffix}`;

    const newSection: ConfigSection = {
      sectionId,
      type,
      active: true,
      sortOrder: draftConfig.sections.length + 1,
      title: SECTION_TYPE_LABELS[type] || "New Section",
      subtitle: "",
      itemMode,
      items: [],
      sourceCategoryId: null,
      layoutKey,
      selectionMode,
      rowCount,
    };
    const updated = [...draftConfig.sections, newSection];
    setDraftConfig({ ...draftConfig, sections: updated });
    setSelectedSectionIdx(updated.length - 1);
    setShowAddSectionModal(false);
  };

  // Item manipulation helpers
  const handleAddItemToSection = (itemType: ItemType, referenceId: string, label: string) => {
    if (!draftConfig || selectedSectionIdx >= draftConfig.sections.length) return;
    const currentSection = draftConfig.sections[selectedSectionIdx];
    const newItem: ConfigItem = {
      itemType,
      referenceId,
      sortOrder: currentSection.items.length + 1,
      active: true,
      label,
    };
    const updatedSections = [...draftConfig.sections];
    updatedSections[selectedSectionIdx].items.push(newItem);
    setDraftConfig({ ...draftConfig, sections: updatedSections });
    setShowAddItemModal(false);
  };

  const handleRemoveItem = (itemIdx: number) => {
    if (!draftConfig || selectedSectionIdx >= draftConfig.sections.length) return;
    const updatedSections = [...draftConfig.sections];
    updatedSections[selectedSectionIdx].items.splice(itemIdx, 1);
    updatedSections[selectedSectionIdx].items.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });
    setDraftConfig({ ...draftConfig, sections: updatedSections });
  };

  const handleClearAllItems = () => {
    if (!draftConfig || selectedSectionIdx >= draftConfig.sections.length) return;
    const updatedSections = [...draftConfig.sections];
    updatedSections[selectedSectionIdx].items = [];
    setDraftConfig({ ...draftConfig, sections: updatedSections });
  };

  const handleRemoveIncompatibleItems = () => {
    if (!draftConfig || selectedSectionIdx >= draftConfig.sections.length) return;
    const currentSec = draftConfig.sections[selectedSectionIdx];
    const allowed = ALLOWED_ITEM_TYPES_FOR_SECTION[currentSec.type] || [];
    const filteredItems = (currentSec.items || []).filter((item) => allowed.includes(item.itemType));
    filteredItems.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });
    const updatedSections = [...draftConfig.sections];
    updatedSections[selectedSectionIdx].items = filteredItems;
    setDraftConfig({ ...draftConfig, sections: updatedSections });
    setStatusMessage({ type: "success", text: "Incompatible items removed from section." });
  };

  const currentSection = draftConfig?.sections[selectedSectionIdx];
  const currentSectionType = currentSection
    ? ['category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'category_grid'].includes(currentSection.type)
      ? 'category_grid'
      : ['sweet_tooth', 'dry_food_masala', 'product_grid'].includes(currentSection.type)
      ? 'product_grid'
      : currentSection.type
    : '';

  return (
    <div className="min-h-screen bg-[#F8FAF8] p-4 sm:p-6 lg:p-8 text-[#1A1A1A]">
      {/* Top Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
              Merchandising
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Status: <strong className="text-amber-700 font-bold uppercase">{draftConfig?.status || "DRAFT"}</strong>
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Version: <strong className="text-emerald-700 font-bold">v{draftConfig?.configVersion || 1}</strong>
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Home Merchandising Engine</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Remotely curate and reorder sections, hero banners, and collections without changing compiled customer code.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchDraft}
            disabled={loading}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving || !draftConfig}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-xs font-bold text-white shadow-xs hover:bg-black transition disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Draft"}</span>
          </button>
          <button
            onClick={() => setPublishModalOpen(true)}
            disabled={publishing || !draftConfig}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
          >
            <Send size={14} />
            <span>Publish to Live</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`mb-6 rounded-2xl p-4 text-xs font-bold ${
            statusMessage.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {statusMessage.type === "success" ? "✅ " : "⚠️ "}
          {statusMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("sections")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "sections"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-white text-[var(--text-muted)] hover:bg-gray-100"
          }`}
        >
          <Layers size={14} /> Sections Manager
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "preview"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-white text-[var(--text-muted)] hover:bg-gray-100"
          }`}
        >
          <Eye size={14} /> Admin Preview
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "history"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-white text-[var(--text-muted)] hover:bg-gray-100"
          }`}
        >
          <History size={14} /> Version History & Logs
        </button>
      </div>

      {/* TAB 1: SECTIONS MANAGER */}
      {activeTab === "sections" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Section List & Reordering */}
          <div className="space-y-4 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
                Home Sections ({draftConfig?.sections.length || 0})
              </h2>
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex h-8 items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 text-xs font-bold text-white hover:opacity-90 transition"
              >
                <Plus size={14} /> Add Section
              </button>
            </div>

            <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-[var(--border)]">
              <button
                onClick={handleActivateAllValid}
                className="flex-1 h-8 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-[10px] font-black text-emerald-800 transition"
              >
                Activate All Valid
              </button>
              <button
                onClick={handleHideAll}
                className="flex-1 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-black text-gray-800 transition"
              >
                Hide All
              </button>
            </div>

            <div className="space-y-2">
              {draftConfig?.sections.map((section, idx) => (
                <div
                  key={section.sectionId}
                  onClick={() => setSelectedSectionIdx(idx)}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                    selectedSectionIdx === idx
                      ? "border-[var(--primary)] bg-emerald-50/50 shadow-xs"
                      : "border-[var(--border)] bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 text-[10px] font-black text-gray-700">
                        {idx + 1}
                      </span>
                      <p className="truncate text-xs font-black">{section.title || section.sectionId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                        {SECTION_TYPE_LABELS[section.type] || section.type}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500">
                        • {section.itemMode === 'CATEGORY' || (section as any).selectionMode === 'AUTOMATIC'
                          ? (section.type === 'category_grid' || section.type === 'category_cards' || section.type === 'grocery_kitchen' || section.type === 'household_essentials'
                            ? `${(section as any).rowCount === 1 ? 4 : 8} items (Auto)`
                            : '6 items (Auto)')
                          : `${section.items.filter(i => i.active).length} items`}
                      </span>
                      {(() => {
                        const errors = validateSectionClient(section);
                        return errors.length === 0 ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] px-1.5 py-0.2 rounded font-black">
                            Valid
                          </span>
                        ) : (
                          <span
                            className="bg-rose-50 text-rose-700 border border-rose-200 text-[8px] px-1.5 py-0.2 rounded font-black cursor-help"
                            title={errors.join(", ")}
                          >
                            Invalid
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(idx, "up");
                      }}
                      disabled={idx === 0}
                      className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(idx, "down");
                      }}
                      disabled={idx === (draftConfig?.sections.length || 0) - 1}
                      className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSectionActive(idx);
                      }}
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        section.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {section.active ? "Active" : "Hidden"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Section Configuration */}
          <div className="space-y-6 lg:col-span-8">
            {currentSection ? (
              <div className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">
                      Section #{selectedSectionIdx + 1}
                    </span>
                    <h3 className="text-base font-black">
                      {currentSection.title || currentSection.sectionId}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteSection(selectedSectionIdx)}
                    className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={13} /> Remove Section
                  </button>
                </div>

                {/* Section Meta Inputs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={currentSection.title}
                      onChange={(e) => {
                        const updated = [...draftConfig.sections];
                        updated[selectedSectionIdx].title = e.target.value;
                        setDraftConfig({ ...draftConfig, sections: updated });
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentSection.subtitle}
                      onChange={(e) => {
                        const updated = [...draftConfig.sections];
                        updated[selectedSectionIdx].subtitle = e.target.value;
                        setDraftConfig({ ...draftConfig, sections: updated });
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                      Section Identifier (Unique)
                    </label>
                    <input
                      type="text"
                      value={currentSection.sectionId}
                      onChange={(e) => {
                        const updated = [...draftConfig.sections];
                        updated[selectedSectionIdx].sectionId = e.target.value;
                        setDraftConfig({ ...draftConfig, sections: updated });
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-mono text-xs font-bold focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                      Selection Mode
                    </label>
                    {["category_grid", "product_grid", "best_sellers", "best_seller_grid"].includes(currentSectionType) ? (
                      <select
                        value={(currentSection as any).selectionMode || (currentSection.items && currentSection.items.length > 0 ? "MANUAL" : "AUTOMATIC")}
                        onChange={(e: any) => {
                          const updated = [...draftConfig.sections];
                          const sec = updated[selectedSectionIdx] as any;
                          sec.selectionMode = e.target.value;
                          if (["best_sellers", "best_seller_grid"].includes(currentSectionType)) {
                            sec.itemMode = "BEST_SELLING";
                          } else {
                            sec.itemMode = e.target.value === "MANUAL" ? "MANUAL" : "CATEGORY";
                          }
                          setDraftConfig({ ...draftConfig, sections: updated });
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none bg-white"
                      >
                        <option value="AUTOMATIC">Auto (Deterministic Categories/Products)</option>
                        <option value="MANUAL">Manual curated selection</option>
                      </select>
                    ) : (
                      <select
                        value={currentSection.itemMode}
                        onChange={(e: any) => {
                          const updated = [...draftConfig.sections];
                          updated[selectedSectionIdx].itemMode = e.target.value;
                          setDraftConfig({ ...draftConfig, sections: updated });
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none bg-white"
                      >
                        <option value="MANUAL">Manual Curated Items</option>
                        <option value="BEST_SELLING">Auto: Best Selling</option>
                        <option value="CATEGORY">Auto: By Category</option>
                        <option value="RECENT">Auto: Recent Additions</option>
                      </select>
                    )}
                  </div>

                  {currentSectionType === "category_grid" && (
                    <div>
                      <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                        Row Count
                      </label>
                      <select
                        value={(currentSection as any).rowCount || 1}
                        onChange={(e: any) => {
                          const updated = [...draftConfig.sections];
                          (updated[selectedSectionIdx] as any).rowCount = parseInt(e.target.value) || 1;
                          setDraftConfig({ ...draftConfig, sections: updated });
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none bg-white"
                      >
                        <option value={1}>1 Row (4 Category Cards)</option>
                        <option value={2}>2 Rows (8 Category Cards)</option>
                      </select>
                    </div>
                  )}

                  {currentSectionType === "product_grid" && (
                    <div>
                      <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                        Row Count
                      </label>
                      <select
                        value={2}
                        disabled
                        className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                      >
                        <option value={2}>2 Rows (6 Product Cards - Fixed)</option>
                      </select>
                    </div>
                  )}

                  {["category_grid", "product_grid", "grocery_kitchen", "household_essentials", "snacks_drinks", "beauty_personal_care", "sweet_tooth", "dry_food_masala"].includes(currentSection.type) && (
                    <div className="sm:col-span-2 bg-gray-50 border border-[var(--border)] rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[var(--text-muted)]">
                          View All Route Preview
                        </span>
                        <p className="text-xs font-mono font-bold text-gray-800 mt-0.5">
                          {currentSection.sourceCategoryId
                            ? `/category/${availableCategories.find(c => c._id === currentSection.sourceCategoryId)?.slug || "unknown"}`
                            : "/category/unknown"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                        Whitelist Verified
                      </span>
                    </div>
                  )}
                </div>

                {([
                  "category_cards",
                  "grocery_kitchen",
                  "household_essentials",
                  "snacks_drinks",
                  "beauty_personal_care",
                  "leaf_product_showcase",
                  "product_grid",
                  "sweet_tooth",
                  "category_grid",
                ].includes(currentSection.type)) && (
                  <div className="border-t border-[var(--border)] pt-4">
                    <label className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                      Source Category (Required for Dynamic Content)
                    </label>
                    <select
                      value={currentSection.sourceCategoryId || ""}
                      onChange={(e) => {
                        const updated = [...draftConfig.sections];
                        updated[selectedSectionIdx].sourceCategoryId = e.target.value || null;
                        // Auto populate display title from category name if title is empty
                        if (!updated[selectedSectionIdx].title && e.target.value) {
                          const catName = availableCategories.find(c => c._id === e.target.value)?.name;
                          if (catName) {
                            updated[selectedSectionIdx].title = catName;
                          }
                        }
                        setDraftConfig({ ...draftConfig, sections: updated });
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none bg-white"
                    >
                      <option value="">-- Select Category --</option>
                      {availableCategories.map((cat: any) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name} ({cat.parentCategory ? "Sub/Leaf Category" : "Main Category"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Section Items Manager */}
                <div className="border-t border-[var(--border)] pt-5 space-y-3">
                  {((currentSection as any).selectionMode || (currentSection.items && currentSection.items.length > 0 ? "MANUAL" : "AUTOMATIC")) === "AUTOMATIC" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                          Automatic Resolved Items Preview
                        </h4>
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                          Auto Mode Enabled
                        </span>
                      </div>

                      {(() => {
                        const sectionType = ['category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'category_grid'].includes(currentSection.type)
                          ? 'category_grid'
                          : ['sweet_tooth', 'dry_food_masala', 'product_grid'].includes(currentSection.type)
                          ? 'product_grid'
                          : currentSection.type;

                        if (sectionType === 'category_grid') {
                          const sourceId = currentSection.sourceCategoryId;
                          if (!sourceId) {
                            return (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-rose-600 bg-rose-50/30">
                                Please select a Source Category above to resolve child categories.
                              </div>
                            );
                          }

                          const children = availableCategories.filter((c: any) => {
                            const pId = typeof c.parentCategory === 'object' ? c.parentCategory?._id : c.parentCategory;
                            return pId && String(pId) === String(sourceId);
                          }).sort((a, b) => {
                            if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
                            if ((a.displayOrder || 0) !== (b.displayOrder || 0)) return (a.displayOrder || 0) - (b.displayOrder || 0);
                            return (a.name || '').localeCompare(b.name || '');
                          });

                          const limit = ((currentSection as any).rowCount || 1) * 4;
                          const displayChildren = children.slice(0, limit);

                          if (displayChildren.length === 0) {
                            return (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-amber-600 bg-amber-50/30">
                                No direct child categories found for this Source Category. (Tip: If this is a leaf category, switch to a Product Grid section or select a parent category).
                              </div>
                            );
                          }

                          const resolveCategoryImage = (cat: any): string => {
                            const candidates = [cat.image, cat.icon, cat.banner];
                            for (const candidate of candidates) {
                              if (typeof candidate === 'string' && candidate.trim()) {
                                const url = candidate.trim();
                                if ((url.startsWith('https://') || (url.startsWith('/') && !url.startsWith('//'))) && 
                                    !url.includes('localhost') && !url.startsWith('file://') && !url.includes('uploads/')) {
                                  return url;
                                }
                              }
                            }
                            return '';
                          };

                          return (
                            <div className="space-y-2">
                              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                                Resolving direct child categories (First {limit} sorted by sortOrder → displayOrder → name):
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {displayChildren.map((cat, idx) => {
                                  const imgUrl = resolveCategoryImage(cat);
                                  return (
                                    <div key={cat._id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 bg-gray-50/50">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[var(--border)] text-[10px] font-black">
                                        {idx + 1}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate">{cat.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          {imgUrl ? (
                                            <span className="text-[8px] bg-green-50 text-green-700 px-1 py-0.2 rounded font-black border border-green-100">
                                              Has Image
                                            </span>
                                          ) : (
                                            <span className="text-[8px] bg-rose-50 text-rose-700 px-1 py-0.2 rounded font-black border border-rose-100">
                                              Missing Image
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } else if (sectionType === 'product_grid') {
                          const sourceId = currentSection.sourceCategoryId;
                          if (!sourceId) {
                            return (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-rose-600 bg-rose-50/30">
                                Please select a Source Category above to resolve products.
                              </div>
                            );
                          }

                          const eligible = getEligibleProductsForCategory(sourceId);
                          const resolvedProducts = eligible
                            .sort((a: any, b: any) => {
                              const aBest = a.bestseller || a.isBestseller ? 1 : 0;
                              const bBest = b.bestseller || b.isBestseller ? 1 : 0;
                              if (aBest !== bBest) return bBest - aBest;

                              const aFeat = a.featured || a.isFeatured ? 1 : 0;
                              const bFeat = b.featured || b.isFeatured ? 1 : 0;
                              if (aFeat !== bFeat) return bFeat - aFeat;

                              return (a.displayOrder || 0) - (b.displayOrder || 0);
                            })
                            .slice(0, 6);

                          if (resolvedProducts.length === 0) {
                            return (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-amber-600 bg-amber-50/30">
                                No products found in this category or its child categories.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                                Resolving top products (Bestseller → Featured → Sort Order):
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {resolvedProducts.map((prod: any, idx: number) => {
                                  const imgSrc = prod.thumbnail || prod.image || "/images/placeholder.png";
                                  return (
                                    <div key={prod._id || idx} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2.5 bg-gray-50/50">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[var(--border)] text-[10px] font-black">
                                        {idx + 1}
                                      </span>
                                      <div className="h-9 w-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                        <img src={imgSrc} alt={prod.name} className="h-full w-full object-contain p-0.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate">{prod.name}</p>
                                        <p className="text-[10px] text-emerald-700 font-bold mt-0.5">₹{prod.sellingPrice ?? prod.price ?? 0}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } else if (['best_sellers', 'best_seller_grid'].includes(sectionType)) {
                          const categoriesToShow = currentSection.items && currentSection.items.length > 0
                            ? currentSection.items
                                .filter((i) => i.active && i.itemType === 'category')
                                .map((item) => {
                                  const cat = availableCategories.find((c) => String(c._id) === String(item.referenceId));
                                  const prods = item.displayProductIds?.length
                                    ? item.displayProductIds.map((pId) => availableProducts.find((p) => String(p._id) === String(pId))).filter(Boolean)
                                    : getEligibleProductsForCategory(item.referenceId).slice(0, 4);
                                  return {
                                    name: cat?.name || item.label || 'Category',
                                    products: prods,
                                  };
                                })
                            : availableCategories
                                .filter((c: any) => !c.parentCategory || c.level === 1 || c.level === 2)
                                .slice(0, 6)
                                .map((cat: any) => ({
                                  name: cat.name,
                                  products: getEligibleProductsForCategory(cat._id).slice(0, 4),
                                }));

                          if (categoriesToShow.length === 0) {
                            return (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-amber-600 bg-amber-50/30">
                                No categories available for Best Sellers. Click &quot;Add Item&quot; to pick top categories.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                                Resolving Best Seller Categories (Each shows 4 quadrant product previews):
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {categoriesToShow.map((item, idx) => (
                                  <div key={idx} className="rounded-xl border border-[var(--border)] p-2.5 bg-gray-50/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black truncate">{item.name}</span>
                                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                        {item.products.length}/4 Prods
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {item.products.slice(0, 4).map((p: any, pIdx: number) => {
                                        const imgSrc = p?.thumbnail || p?.image || "/images/placeholder.png";
                                        return (
                                          <div key={pIdx} className="aspect-square bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1 overflow-hidden" title={p?.name}>
                                            <img src={imgSrc} alt={p?.name || ""} className="h-8 w-8 object-contain" />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else if (['hero_carousel', 'hero_banner', 'featured_this_week', 'featured_banner'].includes(sectionType)) {
                          const banners = availableBanners.filter((b) => b.active !== false).slice(0, 6);
                          if (banners.length === 0) {
                            return (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-gray-500">
                                No active banners found in the banner registry.
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-2">
                              <p className="text-[10px] text-[var(--text-muted)] font-bold">Resolving active banners:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {banners.map((b, idx) => (
                                  <div key={b._id || idx} className="rounded-xl border border-[var(--border)] p-2.5 bg-gray-50/50">
                                    <p className="text-xs font-bold truncate">{b.title}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{b.placement || "hero"}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else if (['offer_section', 'offer'].includes(sectionType)) {
                          return (
                            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center text-xs text-emerald-800 font-bold">
                              Default active offer promotions will be resolved automatically on the home page.
                            </div>
                          );
                        } else if (['store_spotlight'].includes(sectionType)) {
                          const stores = availableStores.filter((s) => s.active !== false).slice(0, 6);
                          return (
                            <div className="space-y-2">
                              <p className="text-[10px] text-[var(--text-muted)] font-bold">Resolving active verified stores:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {stores.map((s, idx) => (
                                  <div key={s._id || idx} className="rounded-xl border border-[var(--border)] p-2.5 bg-gray-50/50">
                                    <p className="text-xs font-bold truncate">{s.name}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{s.city || "All Stores"}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--text-muted)]">
                            Auto mode is not supported for this section type.
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                          Curated Section Items ({currentSection.items.length})
                        </h4>
                        <div className="flex items-center gap-2">
                          {currentSection.items.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Are you sure you want to remove all items from this section?")) {
                                  handleClearAllItems();
                                }
                              }}
                              className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                              title="Remove all items from this section"
                            >
                              <Trash2 size={13} /> Remove All
                            </button>
                          )}
                          {currentSection.items.length < (["best_sellers", "best_seller_grid"].includes(currentSectionType) ? 12 : currentSectionType === 'product_grid' ? 12 : (((currentSection as any).rowCount || 2) * 4)) ||
                          !["best_sellers", "best_seller_grid", "category_grid", "product_grid"].includes(currentSectionType) ? (
                            <button
                              onClick={() => {
                                setAddItemSearch("");
                                setShowAddItemModal(true);
                              }}
                              className="flex h-8 items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 text-xs font-bold text-white hover:opacity-90 transition"
                            >
                              <Plus size={14} /> Add Item
                            </button>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
                              Max Items Reached
                            </span>
                          )}
                        </div>
                      </div>

                      {currentSection.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center text-xs text-amber-800 space-y-1">
                          <p className="font-bold">⚠️ No curated items configured in Manual Mode</p>
                          <p className="text-[11px] text-amber-700">
                            Click &quot;+ Add Item&quot; to pick {["best_sellers", "best_seller_grid"].includes(currentSectionType) ? "categories (1 to 6)" : currentSection.type === "store_spotlight" ? "stores (1 to 10)" : ["hero_banner", "featured_banner", "hero_carousel", "featured_this_week"].includes(currentSection.type) ? "banners (1 to 10)" : "items"}, or switch Selection Mode to &quot;Auto&quot;.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {currentSection.items.some((i) => isItemIncompatible(currentSection.type, i.itemType)) && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center justify-between">
                              <div>
                                <p className="font-bold">⚠️ Incompatible Items Detected</p>
                                <p className="text-[11px] text-rose-700">
                                  Allowed item type: &quot;{ALLOWED_ITEM_TYPES_FOR_SECTION[currentSection.type]?.join(", ")}&quot;. Remove incompatible items to save or publish.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveIncompatibleItems}
                                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition flex-shrink-0"
                              >
                                Remove Incompatible
                              </button>
                            </div>
                          )}

                          {currentSection.items.map((item, itemIdx) => {
                            const incompatible = isItemIncompatible(currentSection.type, item.itemType);
                            return (
                              <div
                                key={`${item.referenceId}-${itemIdx}`}
                                className={`flex flex-col rounded-xl border p-3 space-y-2 ${
                                  incompatible ? "border-rose-300 bg-rose-50/60" : "border-[var(--border)] bg-gray-50/60"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[10px] font-black border border-[var(--border)]">
                                      {itemIdx + 1}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase border ${
                                          incompatible ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-white text-[var(--primary)] border-emerald-200"
                                        }`}>
                                          {item.itemType}
                                        </span>
                                        {incompatible && (
                                          <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-800 border border-rose-300">
                                            ⚠️ Incompatible
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-bold mt-0.5">
                                        {getItemLabel(item)}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleRemoveItem(itemIdx)}
                                    className="rounded p-1 text-rose-600 hover:bg-rose-50"
                                    title="Remove Item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                              {item.itemType === "category" &&
                                ["best_sellers", "best_seller_grid"].includes(currentSection.type) && (
                                  <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">
                                        Manual Product Overrides ({item.displayProductIds?.length || 0}/4)
                                      </label>
                                      {(!item.displayProductIds || item.displayProductIds.length < 4) && (
                                        <select
                                          onChange={(e) => {
                                            if (!e.target.value) return;
                                            const updatedSections = [...draftConfig.sections];
                                            const currentItem = updatedSections[selectedSectionIdx].items[itemIdx];
                                            if (!currentItem.displayProductIds) {
                                              currentItem.displayProductIds = [];
                                            }
                                            if (!currentItem.displayProductIds.includes(e.target.value)) {
                                              currentItem.displayProductIds.push(e.target.value);
                                            }
                                            setDraftConfig({ ...draftConfig, sections: updatedSections });
                                            e.target.value = "";
                                          }}
                                          className="h-7 rounded-lg border border-[var(--border)] px-2 text-[10px] font-bold bg-white focus:outline-none"
                                        >
                                          <option value="">+ Add Product</option>
                                          {getEligibleProductsForCategory(item.referenceId)
                                            .filter((p) => !(item.displayProductIds || []).includes(p._id))
                                            .map((p) => (
                                              <option key={p._id} value={p._id}>
                                                {p.name}
                                              </option>
                                            ))}
                                        </select>
                                      )}
                                    </div>

                                    {item.displayProductIds && item.displayProductIds.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {item.displayProductIds.map((pId) => {
                                          const prod = availableProducts.find((p) => p._id === pId);
                                          return (
                                            <div
                                              key={pId}
                                              className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-2 py-1 text-[10px] font-bold"
                                            >
                                              <span className="truncate max-w-[120px]">
                                                {prod ? prod.name : pId}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedSections = [...draftConfig.sections];
                                                  const currentItem = updatedSections[selectedSectionIdx].items[itemIdx];
                                                  currentItem.displayProductIds = (currentItem.displayProductIds || []).filter(
                                                    (id) => id !== pId
                                                  );
                                                  setDraftConfig({ ...draftConfig, sections: updatedSections });
                                                }}
                                                className="text-rose-600 hover:text-rose-800 ml-1"
                                              >
                                                <X size={10} />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] font-bold text-amber-600">
                                        No manual overrides. Resolving automatically by sales-priority.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--text-muted)]">
                Select a section from the left column or click &quot;Add Section&quot; to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN PREVIEW */}
      {activeTab === "preview" && (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-base font-black">Live Config Preview (Admin Engine)</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Inspect resolved entities without executing client components.
            </p>
          </div>

          {previewData ? (
            <div className="space-y-6">
              {previewData.sections?.map((sec: any) => (
                <div key={sec.sectionId} className="rounded-2xl border border-[var(--border)] p-4 bg-gray-50/40">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[var(--primary)]">{sec.type}</span>
                      <h3 className="text-sm font-black">{sec.title || sec.sectionId}</h3>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{sec.items?.length || 0} items resolved</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {sec.items?.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-[var(--border)] bg-white p-2.5 text-center shadow-xs">
                        <span className="block text-[9px] font-black uppercase text-gray-500">{item.itemType}</span>
                        <p className="truncate text-xs font-black mt-1">
                          {item.resolvedEntity?.name || item.resolvedEntity?.title || item.referenceId}
                        </p>
                        {item.resolvedEntity?.sellingPrice && (
                          <p className="text-[10px] font-bold text-emerald-700">₹{item.resolvedEntity.sellingPrice}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              Loading preview data...
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERSION HISTORY & AUDIT LOGS */}
      {activeTab === "history" && (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-base font-black">Publish History & Audit Trail</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Track version increments and merchandising actions.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
              Recent Merchandising Action Logs
            </h3>
            <div className="divide-y divide-[var(--border)]">
              {historyData?.auditLogs?.map((log: any) => (
                <div key={log._id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-800">
                      {log.action}
                    </span>
                    <p className="text-xs font-bold mt-1">
                      By {log.actor?.email || log.actorRole} • Version v{log.version}
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD SECTION MODAL */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-black">Add Approved Section Type</h3>
              <button onClick={() => setShowAddSectionModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {ALLOWED_ADD_SECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddSection(type)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] p-3 text-left hover:border-[var(--primary)] hover:bg-emerald-50/40 transition"
                >
                  <div>
                    <p className="text-xs font-black">{SECTION_TYPE_LABELS[type]}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{type}</p>
                  </div>
                  <Plus size={16} className="text-[var(--primary)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddItemModal && currentSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-black">Add Curated Item to Section</h3>
              <button onClick={() => setShowAddItemModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Search items by name..."
                value={addItemSearch}
                onChange={(e) => setAddItemSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-bold focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Category Picker */}
              {ALLOWED_ITEM_TYPES_FOR_SECTION[currentSection.type]?.includes("category") && (
                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--text-muted)] mb-2">Categories</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      const cats = (currentSection.type === "category_grid"
                        ? getManuallySelectableCategories()
                        : availableCategories
                      ).filter((cat) =>
                        !addItemSearch || (cat.name && cat.name.toLowerCase().includes(addItemSearch.toLowerCase()))
                      );

                      if (cats.length === 0) {
                        return (
                          <div className="col-span-2 rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                            {availableCategories.length === 0
                              ? "No categories available."
                              : "No categories matched your search."}
                          </div>
                        );
                      }

                      return cats.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => handleAddItemToSection("category", cat._id, cat.name)}
                          className="rounded-xl border border-[var(--border)] p-2 text-left text-xs font-bold hover:border-[var(--primary)] hover:bg-emerald-50 transition"
                        >
                          {cat.name}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Product Picker */}
              {ALLOWED_ITEM_TYPES_FOR_SECTION[currentSection.type]?.includes("product") && (
                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--text-muted)] mb-2">Products</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      const prods = (currentSection.type === "product_grid"
                        ? getManuallySelectableProducts()
                        : availableProducts
                      ).filter((prod) =>
                        !addItemSearch || (prod.name && prod.name.toLowerCase().includes(addItemSearch.toLowerCase()))
                      );

                      if (prods.length === 0) {
                        return (
                          <div className="col-span-2 rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                            {availableProducts.length === 0
                              ? "No products available in the catalog."
                              : "No products matched your search."}
                          </div>
                        );
                      }

                      return prods.map((prod) => (
                        <button
                          key={prod._id}
                          onClick={() => handleAddItemToSection("product", prod._id, prod.name)}
                          className="rounded-xl border border-[var(--border)] p-2 text-left text-xs font-bold hover:border-[var(--primary)] hover:bg-emerald-50 transition"
                        >
                          <p className="truncate">{prod.name}</p>
                          <span className="text-[10px] text-emerald-700 font-bold">₹{prod.sellingPrice}</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Banner Picker */}
              {ALLOWED_ITEM_TYPES_FOR_SECTION[currentSection.type]?.includes("banner") && (
                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--text-muted)] mb-2">Banners</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      const banners = (availableBanners || []).filter((b) =>
                        !addItemSearch || (b.title && b.title.toLowerCase().includes(addItemSearch.toLowerCase()))
                      );

                      if (banners.length === 0) {
                        return (
                          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                            {availableBanners.length === 0
                              ? "No banners available in database."
                              : "No banners matched your search."}
                          </div>
                        );
                      }

                      return banners.slice(0, 20).map((banner) => (
                        <button
                          key={banner._id}
                          onClick={() => handleAddItemToSection("banner", banner._id, banner.title)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] p-2 text-left text-xs font-bold hover:border-[var(--primary)] hover:bg-emerald-50 transition"
                        >
                          <span>{banner.title}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{banner.placement || "banner"}</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Store Picker */}
              {ALLOWED_ITEM_TYPES_FOR_SECTION[currentSection.type]?.includes("store") && (
                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--text-muted)] mb-2">Stores</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      const stores = (Array.isArray(availableStores) ? availableStores : []).filter((s) =>
                        !addItemSearch ||
                        (s.name && s.name.toLowerCase().includes(addItemSearch.toLowerCase())) ||
                        (s.city && s.city.toLowerCase().includes(addItemSearch.toLowerCase()))
                      );

                      if (stores.length === 0) {
                        return (
                          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                            {availableStores.length === 0
                              ? "No active stores found in database."
                              : "No stores matched your search."}
                          </div>
                        );
                      }

                      return stores.slice(0, 20).map((store) => (
                        <button
                          key={store._id}
                          onClick={() => handleAddItemToSection("store", store._id, store.name)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] p-2.5 text-left text-xs font-bold hover:border-[var(--primary)] hover:bg-emerald-50 transition"
                        >
                          <div>
                            <p className="font-bold text-xs">{store.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {store.city ? `City: ${store.city}` : "Fast local fulfillment"}
                            </p>
                          </div>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                            + Select Store
                          </span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH CONFIRMATION MODAL */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Send size={20} />
              </span>
              <div>
                <h3 className="text-base font-black">Publish Configuration?</h3>
                <p className="text-xs text-[var(--text-muted)]">This will push your draft live to all customer devices.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-900 space-y-1">
              <p>• Scope: {draftConfig?.scopeType || "GLOBAL"}</p>
              <p>• Sections: {draftConfig?.sections.length || 0} active/curated sections</p>
              <p>• Previous published version will be safely archived.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPublishModalOpen(false)}
                className="h-10 rounded-xl border border-[var(--border)] px-4 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="h-10 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white hover:opacity-90"
              >
                {publishing ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
