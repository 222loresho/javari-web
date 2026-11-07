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
  "garlic-fries", "pepper-fries", "mashed-potatoes", "potato-wedges",
  "saute-potatoes", "maru-bhajia", "roast-potatoes", "ugali", "vegetable-rice",
  "plain-rice", "matoke", "fish-fingers", "chicken-nuggets", "choma-sausages",
  "chilli-beef-strips", "paneer-butter-masala", "sweet-and-sour-chicken",
  "grilled-beef-1kg", "kienyeji-chicken", "beef-dry-fry",
  "chicken-dry-fry-full", "carrot-juice", "pineapple-juice", "berry-blast",
  "detoxifying-green-juice", "green-elixir", "espresso", "coffee-with-milk",
  "black-tea", "purple-tea", "white-tea", "mojito", "strawberry-daiquiri",
  "aperol-spritz", "chicken-soup", "beef-soup", "goat-soup", "vegetable-soup",
]);

const HERO_ALIASES = {
  "masala fries": "masala-fries",
  "masala chips": "masala-fries",
  "bbq bacon burger": "bbq-bacon-burger",
  "bbq and bacon burger": "bbq-bacon-burger",
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
  "grilled beef 1 2kg": "grilled-beef-half",
  "grilled beef half": "grilled-beef-half",
  "goat choma 1 2kg": "goat-choma-half",
  "goat choma half": "goat-choma-half",
  "goat choma 1kg": "goat-choma",
  "grilled chicken full": "grilled-chicken",
  "beef and rice": "beef-rice",
  "beef rice": "beef-rice",
  "1 2 bbq chicken": "half-bbq-chicken",
  "half bbq chicken": "half-bbq-chicken",
  "half bbq": "half-bbq-chicken",
  "kienyeji chicken choma full": "kienyeji-chicken",
  "kienyeji chicken": "kienyeji-chicken",
  "beef dry fry 1kg": "beef-dry-fry",
  "beef dry fry": "beef-dry-fry",
  "dry fried chicken half": "chicken-dry-fry-half",
  "chicken dry fry half": "chicken-dry-fry-half",
  "2 choma sausages and fries": "choma-sausages",
  "choma sausages and fries": "choma-sausages",
  "berry blast antioxidant": "berry-blast",
  "berry blast": "berry-blast",
  "cleansing green elixir with sugarcane juice": "green-elixir",
  "green elixir": "green-elixir",
  "sugarcane juice": "green-elixir",
  "coffee with milk": "coffee-with-milk",
  "white coffee": "coffee-with-milk",
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
