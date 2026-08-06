"use client";

import SectionBlock from "./SectionBlock";

const householdItems = [
  {
    name: "Cleaning Supplies",
    slug: "cleaning-supplies",
    image: "/images/categories/cleaning.png",
  },
  {
    name: "Laundry Care",
    slug: "laundry-care",
    image: "/images/categories/laundry.png",
  },
  {
    name: "Home Essentials",
    slug: "home-essentials",
    image: "/images/categories/home.png",
  },
  {
    name: "Storage & Organizers",
    slug: "storage-organizers",
    image: "/images/categories/storage.png",
  },
  {
    name: "Paper Products",
    slug: "paper-products",
    image: "/images/categories/paper.png",
  },
  {
    name: "Kitchen Cleaning",
    slug: "kitchen-cleaning",
    image: "/images/categories/kitchen-cleaning.png",
  },
  {
    name: "Bathroom Care",
    slug: "bathroom-care",
    image: "/images/categories/bathroom.png",
  },
  {
    name: "Pooja Essentials",
    slug: "pooja-essentials",
    image: "/images/categories/pooja.png",
  },
];

export default function HouseholdEssentials() {
  return (
    <SectionBlock
      title="Household Essentials"
      items={householdItems}
    />
  );
}
