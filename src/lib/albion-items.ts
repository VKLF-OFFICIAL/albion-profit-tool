// Lista curada de ítems comunes de Albion Online.
// `base` es el ID interno sin Tier ni encantamiento.
// Para construir el ID final: `T{tier}_{base}` y, si enchant > 0, añadir `@{enchant}`.

export type AlbionCategory =
  | "Bag"
  | "Cape"
  | "Armor"
  | "Weapon"
  | "Mount"
  | "Tool"
  | "Consumable"
  | "Resource";

export const CATEGORY_LABEL: Record<AlbionCategory, string> = {
  Bag: "Bolsas",
  Cape: "Capas",
  Armor: "Armaduras",
  Weapon: "Armas",
  Mount: "Monturas",
  Tool: "Herramientas",
  Consumable: "Consumibles",
  Resource: "Recursos",
};

export interface AlbionItemBase {
  base: string;
  name: string;
  category: AlbionCategory;
  /** Tiers disponibles para este base (la mayoría son T4-T8). */
  tiers?: number[];
}

/** Imagen del ítem (PNG transparente) desde el render oficial de Albion Online. */
export function itemImageUrl(itemId: string, quality = 1, size = 96): string {
  return `https://render.albiononline.com/v1/item/${encodeURIComponent(itemId)}.png?quality=${quality}&size=${size}`;
}

export const ITEM_BASES: AlbionItemBase[] = [
  // Bolsas y capas
  { base: "BAG", name: "Bolsa", category: "Bag" },
  { base: "CAPEITEM_FW_LYMHURST", name: "Capa de Lymhurst", category: "Cape" },
  { base: "CAPEITEM_FW_BRIDGEWATCH", name: "Capa de Bridgewatch", category: "Cape" },
  { base: "CAPEITEM_FW_MARTLOCK", name: "Capa de Martlock", category: "Cape" },
  { base: "CAPEITEM_FW_THETFORD", name: "Capa de Thetford", category: "Cape" },
  { base: "CAPEITEM_FW_FORTSTERLING", name: "Capa de Fort Sterling", category: "Cape" },
  { base: "CAPEITEM_FW_CAERLEON", name: "Capa de Caerleon", category: "Cape" },

  // Armadura placa
  { base: "HEAD_PLATE_SET1", name: "Casco de soldado", category: "Armor" },
  { base: "ARMOR_PLATE_SET1", name: "Armadura de soldado", category: "Armor" },
  { base: "SHOES_PLATE_SET1", name: "Botas de soldado", category: "Armor" },
  // Armadura cuero
  { base: "HEAD_LEATHER_SET1", name: "Capucha de mercenario", category: "Armor" },
  { base: "ARMOR_LEATHER_SET1", name: "Chaqueta de mercenario", category: "Armor" },
  { base: "SHOES_LEATHER_SET1", name: "Botas de mercenario", category: "Armor" },
  // Armadura tela
  { base: "HEAD_CLOTH_SET1", name: "Capucha de erudito", category: "Armor" },
  { base: "ARMOR_CLOTH_SET1", name: "Túnica de erudito", category: "Armor" },
  { base: "SHOES_CLOTH_SET1", name: "Sandalias de erudito", category: "Armor" },

  // Armas — selección popular
  { base: "MAIN_SWORD", name: "Espada", category: "Weapon" },
  { base: "2H_CLAYMORE", name: "Mandoble", category: "Weapon" },
  { base: "2H_AXE", name: "Hacha a dos manos", category: "Weapon" },
  { base: "2H_HAMMER", name: "Martillo a dos manos", category: "Weapon" },
  { base: "MAIN_SPEAR", name: "Lanza", category: "Weapon" },
  { base: "2H_BOW", name: "Arco", category: "Weapon" },
  { base: "2H_CROSSBOW", name: "Ballesta", category: "Weapon" },
  { base: "MAIN_FIRESTAFF", name: "Bastón de fuego", category: "Weapon" },
  { base: "MAIN_FROSTSTAFF", name: "Bastón de hielo", category: "Weapon" },
  { base: "MAIN_HOLYSTAFF", name: "Bastón sagrado", category: "Weapon" },
  { base: "MAIN_NATURESTAFF", name: "Bastón de la naturaleza", category: "Weapon" },
  { base: "MAIN_CURSEDSTAFF", name: "Bastón maldito", category: "Weapon" },
  { base: "MAIN_ARCANESTAFF", name: "Bastón arcano", category: "Weapon" },
  { base: "2H_DAGGER_KATAR", name: "Katares duales", category: "Weapon" },

  // Monturas
  { base: "MOUNT_HORSE", name: "Caballo", category: "Mount" },
  { base: "MOUNT_OX", name: "Buey", category: "Mount" },
  { base: "MOUNT_ARMORED_HORSE", name: "Caballo blindado", category: "Mount" },
  { base: "MOUNT_DIREWOLF", name: "Lobo gigante", category: "Mount" },

  // Herramientas (T3+)
  { base: "TOOL_PICK", name: "Pico", category: "Tool" },
  { base: "TOOL_AXE", name: "Hacha de leñador", category: "Tool" },
  { base: "TOOL_SICKLE", name: "Hoz", category: "Tool" },
  { base: "TOOL_HAMMER", name: "Mazo de cantero", category: "Tool" },
  { base: "TOOL_SKINNINGKNIFE", name: "Cuchillo de desollar", category: "Tool" },

  // Consumibles
  { base: "MEAL_OMELETTE", name: "Tortilla", category: "Consumable" },
  { base: "MEAL_SOUP", name: "Sopa", category: "Consumable" },
  { base: "MEAL_STEW", name: "Estofado", category: "Consumable" },
  { base: "POTION_HEAL", name: "Poción curativa", category: "Consumable" },
  { base: "POTION_ENERGY", name: "Poción de energía", category: "Consumable" },
];

export const CITIES = [
  "Lymhurst",
  "Bridgewatch",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Caerleon",
] as const;
export type City = (typeof CITIES)[number];
export const BLACK_MARKET = "Black Market" as const;

export const ALL_LOCATIONS = [...CITIES, BLACK_MARKET] as const;

export const QUALITIES: { value: number; label: string }[] = [
  { value: 1, label: "Normal" },
  { value: 2, label: "Buena" },
  { value: 3, label: "Notable" },
  { value: 4, label: "Excelente" },
  { value: 5, label: "Obra Maestra" },
];

export function buildItemId(base: string, tier: number, enchant: number): string {
  const id = `T${tier}_${base}`;
  return enchant > 0 ? `${id}@${enchant}` : id;
}
