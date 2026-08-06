"use client";

import { useState } from "react";

import HomeHeader from "./HomeHeader";
import HomeSearch from "./HomeSearch";
import HomeCategories from "./HomeCategories";
import GroceryKitchen from "./sections/GroceryKitchen";
import HeroCarousel from "./hero/HeroCarousel";
import OfferSection from "./offers/OfferSection";
import SnacksDrinks from "./sections/SnacksDrinks";
import SweetTooth from "./sections/SweetTooth";
import FeaturedThisWeek from "./sections/FeaturedThisWeek";

import BottomNavigation from "./navigation/BottomNavigation";
import BeautyPersonalCare from "./sections/BeautyPersonalCare";
import BestSellerGrid from "./BestSellerGrid";
import HouseholdEssentials from "./sections/HouseholdEssentials";
import StoreSpotlight from "./sections/StoreSpotlight";



export default function AppHome() {
  const [drawerOpen, setDrawerOpen] = useState(false);
const [selectedSection, setSelectedSection] = useState("Categories");
const [selectedSlug, setSelectedSlug] =
  useState("");
  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <main className="mx-auto max-w-md px-4 pb-32">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-[#F8FAF8]">
          <HomeHeader />
          <HomeSearch />
          <HomeCategories />
        </div>

        {/* Divider */}
        <div className="my-5 h-[1px] bg-[#E5ECE6]" />

        {/* Offers */}
        <OfferSection />

    

        {/* Hero */}
         <HeroCarousel />
         <BestSellerGrid />
         <GroceryKitchen />
         <HouseholdEssentials />
         <SweetTooth />
         <FeaturedThisWeek />
         <SnacksDrinks />
         <BeautyPersonalCare />
         <StoreSpotlight />


      </main>


      <BottomNavigation />
    </div>
  );
}
