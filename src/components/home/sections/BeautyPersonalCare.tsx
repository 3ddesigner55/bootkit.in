"use client";

import SectionBlock from "./SectionBlock";

const beautyItems = [
  {
    name: "Skin Care",
    slug: "skin-care",
    image: "/images/categories/skin-care.png",
  },
  {
    name: "Hair Care",
    slug: "hair-care",
    image: "/images/categories/hair-care.png",
  },
  {
    name: "Bath & Body",
    slug: "bath-body",
    image: "/images/categories/bath-body.png",
  },
  {
    name: "Makeup",
    slug: "makeup",
    image: "/images/categories/makeup.png",
  },
  {
    name: "Oral Care",
    slug: "oral-care",
    image: "/images/categories/oral-care.png",
  },
  {
    name: "Feminine Care",
    slug: "feminine-care",
    image: "/images/categories/feminine-care.png",
  },
  {
    name: "Baby Care",
    slug: "baby-care",
    image: "/images/categories/baby-care.png",
  },
  {
    name: "Health Care",
    slug: "health-care",
    image: "/images/categories/health-care.png",
  },
];

export default function BeautyPersonalCare() {
  return (
    <SectionBlock
      title="Beauty & Personal Care"
      items={beautyItems}
    />
  );
}
