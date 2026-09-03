export function getProductImage(name: string) {
  const product = name.toLowerCase();

  if (product.includes("banana"))
    return "/images/products/banana.png";

  if (product.includes("apple"))
    return "/images/products/apple.jpg";

  if (product.includes("tomato"))
    return "/images/products/tomato.png";

  if (product.includes("onion"))
    return "/images/products/onion.png";

  if (product.includes("potato"))
    return "/images/products/potato.png";

  if (product.includes("orange"))
    return "/images/products/orange.png";

  if (product.includes("butter"))
    return "/images/products/Butter.webp";

  if (product.includes("milk"))
    return "/images/products/cream milk.jpg";

  if (product.includes("cheese"))
    return "/images/products/cheese.png";

  if (product.includes("biscuit"))
    return "/images/products/Biscuit.png";

  if (product.includes("cola"))
    return "/images/products/coca-cola.png";

  if (product.includes("limca"))
    return "/images/products/limca.png";

  if (product.includes("thums"))
    return "/images/products/thums up.png";

  return "/images/products/default.png";
}