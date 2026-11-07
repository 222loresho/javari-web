const HERO_BASE = `${import.meta.env.BASE_URL}menu/`;

const strip = s =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const HERO_SLUGS = new Set([
  "bbq-bacon-burger", "butter-chicken", "chicken-and-rice", "chicken-tikka",
  "chicken-wings", "dawa-cocktail", "fish-and-ugali", "goat-choma",
  "grilled-chicken", "margarita", "masala-fries", "mushroom-soup",
  "passion-mojito", "pina-colada", "samosas",
  "gold-rush", "tequila-sunrise", "ranch-water", "screwdriver", "blue-lagoon",
  "long-island", "whiskey-sour", "cuba-libre", "daiquiri", "cosmopolitan",
  "old-fashioned", "gin-and-tonic", "bramble", "mint-julep", "gin-mule",
  "negroni", "pink-lady", "brain-damage", "jagerbomb", "slippery-nipple",
  "beef-sausages", "plain-chips", "poussin-chips", "chapati", "teriyaki",
  "whitecap", "pork-dry-fry",
]);

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
  "long island iced tea": "long-island",
  "whiskey sours": "whiskey-sour",
  "whiskey sour": "whiskey-sour",
  diaquiri: "daiquiri",
  daiquiri: "daiquiri",
  "jager bomb": "jagerbomb",
  "pork dry fry 500gms": "pork-dry-fry",
  "pork dry fry": "pork-dry-fry",
  "white cap": "whitecap",
  "whitecap lager": "whitecap",
  "gin and tonic": "gin-and-tonic",
  "screw driver": "screwdriver",
};

export function heroImage(name) {
  const norm = strip(name);
  const slug = HERO_ALIASES[norm] || (HERO_SLUGS.has(norm.replace(/ /g, "-")) ? norm.replace(/ /g, "-") : null);
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
