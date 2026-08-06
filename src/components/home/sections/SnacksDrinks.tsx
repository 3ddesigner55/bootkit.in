"use client";

import SectionBlock from "./SectionBlock";

const snackItems = [
  {
    name: "Cold Drinks",
    slug: "cold-drinks",
    image: "/images/categories/cold-drinks.png",
  },
  {
    name: "Tea & Coffee",
    slug: "tea-coffee",
    image: "/images/categories/tea-coffee.png",
  },
  {
    name: "Juices",
    slug: "juices",
    image: "/images/categories/juices.png",
  },
  {
    name: "Energy Drinks",
    slug: "energy-drinks",
    image: "/images/categories/energy-drinks.png",
  },
  {
    name: "Chips & Namkeen",
    slug: "chips-namkeen",
    image: "/images/categories/chips.png",
  },
  {
    name: "Biscuits",
    slug: "biscuits",
    image: "/images/categories/biscuits.png",
  },
  {
    name: "Chocolates",
    slug: "chocolates",
    image: "/images/categories/chocolates.png",
  },
  {
    name: "Ice Cream",
    slug: "ice-cream",
    image: "/images/categories/ice-cream.png",
  },
];

export default function SnacksDrinks() {
  return (
    <SectionBlock
      title="Snacks & Drinks"
      items={snackItems}
    />
  );
}