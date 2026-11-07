const HERO_BASE = `${import.meta.env.BASE_URL}menu/`;

const strip = s =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const HERO_ALIASES = {
  "masala fries": "masala-fries",
  "masala chips": "masala-fries",
  "bbq bacon burger": "bbq-bacon-burger",
  "bacon burger": "bbq-bacon-burger",
  "grilled chicken": "grilled-chicken",
  "chicken wings": "chicken-wings",
  "butter chicken": "butter-chicken",
  "chicken tikka": "chicken-tikka",
  "chicken tikka masala": "chicken-tikka",
  samosa: "samosas",
  samosas: "samosas",
  "goat choma": "goat-choma",
  choma: "goat-choma",
  "fish and ugali": "fish-and-ugali",
  "fish ugali": "fish-and-ugali",
  "chicken and rice": "chicken-and-rice",
  "chicken rice": "chicken-and-rice",
  "mushroom soup": "mushroom-soup",
  "passion mojito": "passion-mojito",
  "pina colada": "pina-colada",
  margarita: "margarita",
  "dawa cocktail": "dawa-cocktail",
  dawa: "dawa-cocktail",
};

export function heroImage(name) {
  const slug = HERO_ALIASES[strip(name)];
  return slug ? `${HERO_BASE}${slug}.webp` : null;
}

export function productImage(product) {
  const custom = product?.image_url?.trim();
  return custom || heroImage(product?.name) || null;
}

export function monogram(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}
