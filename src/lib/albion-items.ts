// Catálogo extendido de ítems de Albion Online.
// `base` es el ID interno sin Tier ni encantamiento.
// ID final = `T{tier}_{base}`  +  (`@{enchant}` si enchant > 0).

export type AlbionCategory =
  | "Bag"
  | "Cape"
  | "Armor"
  | "Weapon"
  | "OffHand"
  | "Mount"
  | "Tool"
  | "Consumable"
  | "Resource";

export const CATEGORY_LABEL: Record<AlbionCategory, string> = {
  Bag: "Bolsas",
  Cape: "Capas",
  Armor: "Armaduras",
  Weapon: "Armas",
  OffHand: "Mano sec.",
  Mount: "Monturas",
  Tool: "Herramientas",
  Consumable: "Consumibles",
  Resource: "Recursos",
};

export interface AlbionItemBase {
  base: string;
  name: string;
  category: AlbionCategory;
  /** Tiers disponibles. Por defecto T4-T8. */
  tiers?: number[];
}

/** PNG transparente desde el render oficial de Albion Online. */
export function itemImageUrl(itemId: string, quality = 1, size = 96): string {
  return `https://render.albiononline.com/v1/item/${encodeURIComponent(itemId)}.png?quality=${quality}&size=${size}`;
}

const T1_8 = [1, 2, 3, 4, 5, 6, 7, 8];
const T2_8 = [2, 3, 4, 5, 6, 7, 8];
const T3_8 = [3, 4, 5, 6, 7, 8];

export const ITEM_BASES: AlbionItemBase[] = [
  // ───── Bolsas y capas ─────
  { base: "BAG", name: "Bolsa", category: "Bag" },
  { base: "BAG_INSIGHT", name: "Bolsa del erudito", category: "Bag", tiers: [4, 5, 6, 7, 8] },
  { base: "CAPE", name: "Capa", category: "Cape" },
  { base: "CAPEITEM_FW_LYMHURST", name: "Capa de Lymhurst", category: "Cape" },
  { base: "CAPEITEM_FW_BRIDGEWATCH", name: "Capa de Bridgewatch", category: "Cape" },
  { base: "CAPEITEM_FW_MARTLOCK", name: "Capa de Martlock", category: "Cape" },
  { base: "CAPEITEM_FW_THETFORD", name: "Capa de Thetford", category: "Cape" },
  { base: "CAPEITEM_FW_FORTSTERLING", name: "Capa de Fort Sterling", category: "Cape" },
  { base: "CAPEITEM_FW_CAERLEON", name: "Capa de Caerleon", category: "Cape" },
  { base: "CAPEITEM_KEEPER", name: "Capa de los Guardianes", category: "Cape" },
  { base: "CAPEITEM_HERETIC", name: "Capa de los Herejes", category: "Cape" },
  { base: "CAPEITEM_MORGANA", name: "Capa de Morgana", category: "Cape" },
  { base: "CAPEITEM_UNDEAD", name: "Capa de los No-Muertos", category: "Cape" },
  { base: "CAPEITEM_DEMON", name: "Capa de los Demonios", category: "Cape" },
  { base: "CAPEITEM_AVALON", name: "Capa de Avalon", category: "Cape" },

  // ───── Armaduras: Placa ─────
  { base: "HEAD_PLATE_SET1", name: "Casco de soldado", category: "Armor" },
  { base: "ARMOR_PLATE_SET1", name: "Armadura de soldado", category: "Armor" },
  { base: "SHOES_PLATE_SET1", name: "Botas de soldado", category: "Armor" },
  { base: "HEAD_PLATE_SET2", name: "Yelmo de caballero", category: "Armor" },
  { base: "ARMOR_PLATE_SET2", name: "Armadura de caballero", category: "Armor" },
  { base: "SHOES_PLATE_SET2", name: "Sabatones de caballero", category: "Armor" },
  { base: "HEAD_PLATE_SET3", name: "Casco de guardia", category: "Armor" },
  { base: "ARMOR_PLATE_SET3", name: "Armadura de guardia", category: "Armor" },
  { base: "SHOES_PLATE_SET3", name: "Botas de guardia", category: "Armor" },
  { base: "HEAD_PLATE_KEEPER", name: "Casco de los Guardianes", category: "Armor" },
  { base: "ARMOR_PLATE_KEEPER", name: "Armadura de los Guardianes", category: "Armor" },
  { base: "SHOES_PLATE_KEEPER", name: "Botas de los Guardianes", category: "Armor" },
  { base: "HEAD_PLATE_MORGANA", name: "Casco de Morgana", category: "Armor" },
  { base: "ARMOR_PLATE_MORGANA", name: "Armadura de Morgana", category: "Armor" },
  { base: "SHOES_PLATE_MORGANA", name: "Botas de Morgana", category: "Armor" },
  { base: "HEAD_PLATE_UNDEAD", name: "Casco de los No-Muertos", category: "Armor" },
  { base: "ARMOR_PLATE_UNDEAD", name: "Armadura de los No-Muertos", category: "Armor" },
  { base: "SHOES_PLATE_UNDEAD", name: "Botas de los No-Muertos", category: "Armor" },
  { base: "HEAD_PLATE_HELL", name: "Casco demoníaco", category: "Armor" },
  { base: "ARMOR_PLATE_HELL", name: "Armadura demoníaca", category: "Armor" },
  { base: "SHOES_PLATE_HELL", name: "Botas demoníacas", category: "Armor" },
  { base: "HEAD_PLATE_AVALON", name: "Casco de Avalon", category: "Armor" },
  { base: "ARMOR_PLATE_AVALON", name: "Armadura de Avalon", category: "Armor" },
  { base: "SHOES_PLATE_AVALON", name: "Botas de Avalon", category: "Armor" },

  // ───── Armaduras: Cuero ─────
  { base: "HEAD_LEATHER_SET1", name: "Capucha de mercenario", category: "Armor" },
  { base: "ARMOR_LEATHER_SET1", name: "Chaqueta de mercenario", category: "Armor" },
  { base: "SHOES_LEATHER_SET1", name: "Botas de mercenario", category: "Armor" },
  { base: "HEAD_LEATHER_SET2", name: "Capucha de cazador", category: "Armor" },
  { base: "ARMOR_LEATHER_SET2", name: "Chaqueta de cazador", category: "Armor" },
  { base: "SHOES_LEATHER_SET2", name: "Botas de cazador", category: "Armor" },
  { base: "HEAD_LEATHER_SET3", name: "Capucha de asesino", category: "Armor" },
  { base: "ARMOR_LEATHER_SET3", name: "Chaqueta de asesino", category: "Armor" },
  { base: "SHOES_LEATHER_SET3", name: "Botas de asesino", category: "Armor" },
  { base: "HEAD_LEATHER_KEEPER", name: "Capucha de los Guardianes", category: "Armor" },
  { base: "ARMOR_LEATHER_KEEPER", name: "Chaqueta de los Guardianes", category: "Armor" },
  { base: "SHOES_LEATHER_KEEPER", name: "Botas de los Guardianes", category: "Armor" },
  { base: "HEAD_LEATHER_HELL", name: "Capucha de los Demonios", category: "Armor" },
  { base: "ARMOR_LEATHER_HELL", name: "Chaqueta de los Demonios", category: "Armor" },
  { base: "SHOES_LEATHER_HELL", name: "Botas de los Demonios", category: "Armor" },
  { base: "HEAD_LEATHER_MORGANA", name: "Capucha de Morgana", category: "Armor" },
  { base: "ARMOR_LEATHER_MORGANA", name: "Chaqueta de Morgana", category: "Armor" },
  { base: "SHOES_LEATHER_MORGANA", name: "Botas de Morgana", category: "Armor" },
  { base: "HEAD_LEATHER_UNDEAD", name: "Capucha de los No-Muertos", category: "Armor" },
  { base: "ARMOR_LEATHER_UNDEAD", name: "Chaqueta de los No-Muertos", category: "Armor" },
  { base: "SHOES_LEATHER_UNDEAD", name: "Botas de los No-Muertos", category: "Armor" },
  { base: "HEAD_LEATHER_AVALON", name: "Capucha de Avalon", category: "Armor" },
  { base: "ARMOR_LEATHER_AVALON", name: "Chaqueta de Avalon", category: "Armor" },
  { base: "SHOES_LEATHER_AVALON", name: "Botas de Avalon", category: "Armor" },

  // ───── Armaduras: Tela ─────
  { base: "HEAD_CLOTH_SET1", name: "Capucha de erudito", category: "Armor" },
  { base: "ARMOR_CLOTH_SET1", name: "Túnica de erudito", category: "Armor" },
  { base: "SHOES_CLOTH_SET1", name: "Sandalias de erudito", category: "Armor" },
  { base: "HEAD_CLOTH_SET2", name: "Capucha de clérigo", category: "Armor" },
  { base: "ARMOR_CLOTH_SET2", name: "Vestidura de clérigo", category: "Armor" },
  { base: "SHOES_CLOTH_SET2", name: "Sandalias de clérigo", category: "Armor" },
  { base: "HEAD_CLOTH_SET3", name: "Capucha de mago", category: "Armor" },
  { base: "ARMOR_CLOTH_SET3", name: "Vestidura de mago", category: "Armor" },
  { base: "SHOES_CLOTH_SET3", name: "Sandalias de mago", category: "Armor" },
  { base: "HEAD_CLOTH_KEEPER", name: "Capucha de los Guardianes", category: "Armor" },
  { base: "ARMOR_CLOTH_KEEPER", name: "Vestidura de los Guardianes", category: "Armor" },
  { base: "SHOES_CLOTH_KEEPER", name: "Sandalias de los Guardianes", category: "Armor" },
  { base: "HEAD_CLOTH_HELL", name: "Capucha demoníaca", category: "Armor" },
  { base: "ARMOR_CLOTH_HELL", name: "Vestidura demoníaca", category: "Armor" },
  { base: "SHOES_CLOTH_HELL", name: "Sandalias demoníacas", category: "Armor" },
  { base: "HEAD_CLOTH_MORGANA", name: "Capucha de Morgana", category: "Armor" },
  { base: "ARMOR_CLOTH_MORGANA", name: "Vestidura de Morgana", category: "Armor" },
  { base: "SHOES_CLOTH_MORGANA", name: "Sandalias de Morgana", category: "Armor" },
  { base: "HEAD_CLOTH_UNDEAD", name: "Capucha de los No-Muertos", category: "Armor" },
  { base: "ARMOR_CLOTH_UNDEAD", name: "Vestidura de los No-Muertos", category: "Armor" },
  { base: "SHOES_CLOTH_UNDEAD", name: "Sandalias de los No-Muertos", category: "Armor" },
  { base: "HEAD_CLOTH_AVALON", name: "Capucha de Avalon", category: "Armor" },
  { base: "ARMOR_CLOTH_AVALON", name: "Vestidura de Avalon", category: "Armor" },
  { base: "SHOES_CLOTH_AVALON", name: "Sandalias de Avalon", category: "Armor" },

  // ───── Armas: Espadas ─────
  { base: "MAIN_SWORD", name: "Espada de pomo", category: "Weapon" },
  { base: "2H_CLAYMORE", name: "Mandoble", category: "Weapon" },
  { base: "2H_DUALSWORD", name: "Espadas duales", category: "Weapon" },
  { base: "2H_CLEAVER_MORGANA", name: "Carnifex (Morgana)", category: "Weapon" },
  { base: "MAIN_SCIMITAR_MORGANA", name: "Cimitarra de Morgana", category: "Weapon" },
  { base: "2H_CLAYMORE_AVALON", name: "Espada del Rey (Avalon)", category: "Weapon" },

  // ───── Armas: Hachas ─────
  { base: "MAIN_AXE", name: "Hacha de batalla", category: "Weapon" },
  { base: "2H_AXE", name: "Gran hacha", category: "Weapon" },
  { base: "2H_HALBERD", name: "Alabarda", category: "Weapon" },
  { base: "2H_HALBERD_MORGANA", name: "Alabarda del verdugo (Morgana)", category: "Weapon" },
  { base: "2H_DUALAXE_KEEPER", name: "Hachas infernales (Guardianes)", category: "Weapon" },
  { base: "2H_AXE_AVALON", name: "Hacha real (Avalon)", category: "Weapon" },

  // ───── Armas: Mazas ─────
  { base: "MAIN_MACE", name: "Maza", category: "Weapon" },
  { base: "2H_MACE", name: "Maza pesada", category: "Weapon" },
  { base: "2H_MACE_MORGANA", name: "Maza de horror (Morgana)", category: "Weapon" },
  { base: "2H_FLAIL", name: "Mayal", category: "Weapon" },
  { base: "2H_MACE_HEAVY_AVALON", name: "Maza camorrera (Avalon)", category: "Weapon" },
  { base: "2H_INCUBUSMACE_HELL", name: "Maza del íncubo", category: "Weapon" },

  // ───── Armas: Martillos ─────
  { base: "MAIN_HAMMER", name: "Martillo", category: "Weapon" },
  { base: "2H_HAMMER", name: "Gran martillo", category: "Weapon" },
  { base: "2H_POLEHAMMER", name: "Martillo polar", category: "Weapon" },
  { base: "2H_HAMMER_UNDEAD", name: "Aniquilador (No-Muertos)", category: "Weapon" },
  { base: "2H_DUALHAMMER_HELL", name: "Yunque forjafuegos (Demonios)", category: "Weapon" },
  { base: "2H_HAMMER_AVALON", name: "Forjamundos (Avalon)", category: "Weapon" },

  // ───── Armas: Garrotes ─────
  { base: "MAIN_ROCKMACE_KEEPER", name: "Maza de piedra (Guardianes)", category: "Weapon" },
  { base: "2H_DUALMACE_KEEPER", name: "Garrotes morningstar (Guardianes)", category: "Weapon" },
  { base: "2H_RAM_KEEPER", name: "Cabezadelmazo (Guardianes)", category: "Weapon" },

  // ───── Armas: Lanzas ─────
  { base: "MAIN_SPEAR", name: "Lanza", category: "Weapon" },
  { base: "2H_SPEAR", name: "Pica", category: "Weapon" },
  { base: "2H_HARPOON_HELL", name: "Arpón demoníaco", category: "Weapon" },
  { base: "2H_GLAIVE", name: "Glaive", category: "Weapon" },
  { base: "2H_GLAIVE_MORGANA", name: "Glaive del verdugo (Morgana)", category: "Weapon" },
  { base: "2H_SPEAR_AVALON", name: "Lanza prudente (Avalon)", category: "Weapon" },
  { base: "2H_TRIDENT_UNDEAD", name: "Tridente del rencor (No-Muertos)", category: "Weapon" },

  // ───── Armas: Garras ─────
  { base: "2H_KNUCKLES_SET1", name: "Manoplas de bronce", category: "Weapon" },
  { base: "2H_KNUCKLES_SET2", name: "Manoplas espinadas", category: "Weapon" },
  { base: "2H_KNUCKLES_SET3", name: "Garras de caballero", category: "Weapon" },
  { base: "2H_KNUCKLES_HELL", name: "Puños envueltos (Demonios)", category: "Weapon" },
  { base: "2H_KNUCKLES_KEEPER", name: "Garras de Hrungnir (Guardianes)", category: "Weapon" },
  { base: "2H_KNUCKLES_AVALON", name: "Manoplas ravenstrike (Avalon)", category: "Weapon" },

  // ───── Armas: Arcos ─────
  { base: "2H_BOW", name: "Arco", category: "Weapon" },
  { base: "2H_WARBOW", name: "Arco de guerra", category: "Weapon" },
  { base: "2H_LONGBOW", name: "Arco largo", category: "Weapon" },
  { base: "2H_LONGBOW_HELL", name: "Aullador de almas", category: "Weapon" },
  { base: "2H_BOW_KEEPER", name: "Arco de tejón (Guardianes)", category: "Weapon" },
  { base: "2H_BOW_AVALON", name: "Arco del cazador (Avalon)", category: "Weapon" },
  { base: "2H_BOW_UNDEAD", name: "Arco maldito (No-Muertos)", category: "Weapon" },

  // ───── Armas: Ballestas ─────
  { base: "MAIN_1HCROSSBOW", name: "Ballesta", category: "Weapon" },
  { base: "2H_CROSSBOW", name: "Ballesta a dos manos", category: "Weapon" },
  { base: "2H_CROSSBOWLARGE", name: "Ballesta pesada", category: "Weapon" },
  { base: "2H_REPEATINGCROSSBOW_UNDEAD", name: "Ballesta repetidora", category: "Weapon" },
  { base: "2H_CROSSBOW_CANNON", name: "Cañón ladrido", category: "Weapon" },
  { base: "2H_CROSSBOW_HELL", name: "Hierropunto del cazador", category: "Weapon" },
  { base: "2H_CROSSBOW_AVALON", name: "Ballesta de Bridgewatch", category: "Weapon" },

  // ───── Armas: Bastones fuego ─────
  { base: "MAIN_FIRESTAFF", name: "Bastón de fuego", category: "Weapon" },
  { base: "2H_FIRESTAFF", name: "Gran bastón de fuego", category: "Weapon" },
  { base: "2H_INFERNOSTAFF", name: "Bastón infernal", category: "Weapon" },
  { base: "2H_FIRE_RINGPAIR_AVALON", name: "Anillos abrasados (Avalon)", category: "Weapon" },
  { base: "2H_FIRESTAFF_HELL", name: "Hoguera del cráneo (Demonios)", category: "Weapon" },
  { base: "2H_INFERNOSTAFF_MORGANA", name: "Bastón del castigo (Morgana)", category: "Weapon" },

  // ───── Armas: Bastones hielo ─────
  { base: "MAIN_FROSTSTAFF", name: "Bastón de hielo", category: "Weapon" },
  { base: "2H_FROSTSTAFF", name: "Gran bastón de hielo", category: "Weapon" },
  { base: "2H_GLACIALSTAFF", name: "Bastón glacial", category: "Weapon" },
  { base: "2H_ICEGAUNTLETS_HELL", name: "Manoplas de hielo (Demonios)", category: "Weapon" },
  { base: "2H_ICECRYSTAL_UNDEAD", name: "Carámbano helado (No-Muertos)", category: "Weapon" },
  { base: "2H_FROSTSTAFF_AVALON", name: "Bastón polar (Avalon)", category: "Weapon" },

  // ───── Armas: Bastones arcano ─────
  { base: "MAIN_ARCANESTAFF", name: "Bastón arcano", category: "Weapon" },
  { base: "2H_ARCANESTAFF", name: "Gran bastón arcano", category: "Weapon" },
  { base: "2H_ENIGMATICSTAFF", name: "Bastón enigmático", category: "Weapon" },
  { base: "2H_ARCANE_RINGPAIR_AVALON", name: "Anillos del oráculo (Avalon)", category: "Weapon" },
  { base: "2H_ARCANESTAFF_HELL", name: "Aniquilador del juicio final", category: "Weapon" },

  // ───── Armas: Bastones naturaleza ─────
  { base: "MAIN_NATURESTAFF", name: "Bastón de la naturaleza", category: "Weapon" },
  { base: "2H_NATURESTAFF", name: "Gran bastón de la naturaleza", category: "Weapon" },
  { base: "2H_WILDSTAFF", name: "Bastón salvaje", category: "Weapon" },
  { base: "2H_NATURESTAFF_KEEPER", name: "Bastón del druida (Guardianes)", category: "Weapon" },
  { base: "2H_NATURESTAFF_HELL", name: "Bastón coral (Demonios)", category: "Weapon" },
  { base: "2H_IRONROOTSTAFF_HELL", name: "Bastón raízhierro", category: "Weapon" },
  { base: "2H_NATURESTAFF_AVALON", name: "Sabiduría de Avalon", category: "Weapon" },

  // ───── Armas: Bastones sagrado ─────
  { base: "MAIN_HOLYSTAFF", name: "Bastón sagrado", category: "Weapon" },
  { base: "2H_HOLYSTAFF", name: "Gran bastón sagrado", category: "Weapon" },
  { base: "2H_DIVINESTAFF", name: "Bastón divino", category: "Weapon" },
  { base: "2H_HOLYSTAFF_MORGANA", name: "Bastón de luz prohibida (Morgana)", category: "Weapon" },
  { base: "2H_HOLYSTAFF_HELL", name: "Bastón de redención (Demonios)", category: "Weapon" },
  { base: "2H_HOLYSTAFF_UNDEAD", name: "Querubín celestial (No-Muertos)", category: "Weapon" },
  { base: "2H_HOLYSTAFF_AVALON", name: "Báculo de Avalon", category: "Weapon" },

  // ───── Armas: Bastones malditos ─────
  { base: "MAIN_CURSEDSTAFF", name: "Bastón maldito", category: "Weapon" },
  { base: "2H_CURSEDSTAFF", name: "Gran bastón maldito", category: "Weapon" },
  { base: "2H_DEMONICSTAFF", name: "Bastón demoníaco", category: "Weapon" },
  { base: "2H_CURSEDSTAFF_MORGANA", name: "Cráneo del bruto (Morgana)", category: "Weapon" },
  { base: "2H_CURSED_HELL", name: "Manopla del Lych (Demonios)", category: "Weapon" },
  { base: "2H_CURSEDSTAFF_UNDEAD", name: "Cetro chillón (No-Muertos)", category: "Weapon" },
  { base: "2H_CURSEDSTAFF_AVALON", name: "Bastón profanado (Avalon)", category: "Weapon" },

  // ───── Armas: Dagas ─────
  { base: "MAIN_DAGGER", name: "Daga", category: "Weapon" },
  { base: "2H_DAGGER_KATAR", name: "Katares duales", category: "Weapon" },
  { base: "2H_DAGGERPAIR", name: "Dagas duales", category: "Weapon" },
  { base: "2H_CLAWPAIR", name: "Pares de garras", category: "Weapon" },
  { base: "2H_DAGGER_HELL", name: "Asesino del recuerdo (Demonios)", category: "Weapon" },
  { base: "2H_DUALSICKLE_MORGANA", name: "Hoces duales (Morgana)", category: "Weapon" },
  { base: "2H_DAGGER_AVALON", name: "Cuchilla bridgewatch (Avalon)", category: "Weapon" },

  // ───── Armas: Quarterstaves / báculos ─────
  { base: "MAIN_QUARTERSTAFF", name: "Báculo de combate", category: "Weapon" },
  { base: "2H_IRONCLADEDSTAFF", name: "Báculo herrado", category: "Weapon" },
  { base: "2H_DOUBLEBLADEDSTAFF", name: "Báculo de doble filo", category: "Weapon" },
  { base: "2H_DOUBLEBLADEDSTAFF_HELL", name: "Báculo de la muerte (Demonios)", category: "Weapon" },
  { base: "2H_DOUBLEBLADEDSTAFF_AVALON", name: "Báculo del soulscythe (Avalon)", category: "Weapon" },
  { base: "2H_BLACKHANDS_MORGANA", name: "Manos negras (Morgana)", category: "Weapon" },

  // ───── Mano secundaria ─────
  { base: "OFF_SHIELD", name: "Escudo", category: "OffHand" },
  { base: "OFF_TOWERSHIELD_UNDEAD", name: "Escudo torre", category: "OffHand" },
  { base: "OFF_SHIELD_HELL", name: "Escudo caído (Demonios)", category: "OffHand" },
  { base: "OFF_SHIELD_AVALON", name: "Escudo cabal (Avalon)", category: "OffHand" },
  { base: "OFF_BOOK", name: "Tomo de hechizos", category: "OffHand" },
  { base: "OFF_BOOK_MORGANA", name: "Tomo profano (Morgana)", category: "OffHand" },
  { base: "OFF_BOOK_AVALON", name: "Manuscrito muse (Avalon)", category: "OffHand" },
  { base: "OFF_ORB_MORGANA", name: "Orbe de gélidos pensamientos (Morgana)", category: "OffHand" },
  { base: "OFF_TORCH", name: "Antorcha", category: "OffHand" },
  { base: "OFF_HORN_KEEPER", name: "Cuerno de hellion (Guardianes)", category: "OffHand" },
  { base: "OFF_TAPROOT_KEEPER", name: "Estoperol (Guardianes)", category: "OffHand" },
  { base: "OFF_CENSER_AVALON", name: "Cáliz (Avalon)", category: "OffHand" },
  { base: "OFF_JESTERCANE_HELL", name: "Bastón del bufón (Demonios)", category: "OffHand" },
  { base: "OFF_DEMONSKULL_HELL", name: "Cráneo de demonio (Demonios)", category: "OffHand" },
  { base: "OFF_LAMP_UNDEAD", name: "Lámpara muxida (No-Muertos)", category: "OffHand" },

  // ───── Monturas ─────
  { base: "MOUNT_HORSE", name: "Caballo", category: "Mount", tiers: T3_8 },
  { base: "MOUNT_OX", name: "Buey", category: "Mount", tiers: T3_8 },
  { base: "MOUNT_ARMORED_HORSE", name: "Caballo blindado", category: "Mount", tiers: [5, 6, 7, 8] },
  { base: "MOUNT_DIREWOLF", name: "Lobo gigante", category: "Mount", tiers: [5, 6, 7, 8] },
  { base: "MOUNT_DIREBOAR", name: "Jabalí gigante", category: "Mount", tiers: [5, 6, 7, 8] },
  { base: "MOUNT_DIREBEAR", name: "Oso gigante", category: "Mount", tiers: [5, 6, 7, 8] },
  { base: "MOUNT_GIANTSTAG", name: "Ciervo gigante", category: "Mount", tiers: [5, 6, 7, 8] },
  { base: "MOUNT_SWAMPDRAGON", name: "Dragón del pantano", category: "Mount", tiers: [6, 7, 8] },
  { base: "MOUNT_MAMMOTH_TRANSPORT", name: "Mamut de transporte", category: "Mount", tiers: [8] },

  // ───── Herramientas ─────
  { base: "TOOL_PICK", name: "Pico", category: "Tool", tiers: T2_8 },
  { base: "TOOL_AXE", name: "Hacha de leñador", category: "Tool", tiers: T2_8 },
  { base: "TOOL_SICKLE", name: "Hoz", category: "Tool", tiers: T2_8 },
  { base: "TOOL_HAMMER", name: "Mazo de cantero", category: "Tool", tiers: T2_8 },
  { base: "TOOL_SKINNINGKNIFE", name: "Cuchillo de desollar", category: "Tool", tiers: T2_8 },
  { base: "TOOL_FISHINGROD", name: "Caña de pescar", category: "Tool", tiers: T3_8 },

  // ───── Consumibles: Comida ─────
  { base: "MEAL_OMELETTE", name: "Tortilla", category: "Consumable" },
  { base: "MEAL_SOUP", name: "Sopa", category: "Consumable" },
  { base: "MEAL_STEW", name: "Estofado", category: "Consumable" },
  { base: "MEAL_SALAD", name: "Ensalada", category: "Consumable" },
  { base: "MEAL_SANDWICH", name: "Sándwich", category: "Consumable" },
  { base: "MEAL_PIE_FISH", name: "Pastel de pescado", category: "Consumable" },
  { base: "MEAL_PIE_BEEF", name: "Pastel de carne", category: "Consumable" },
  { base: "MEAL_PIE_GOAT", name: "Pastel de cabra", category: "Consumable" },
  { base: "MEAL_ROAST", name: "Asado", category: "Consumable" },
  { base: "MEAL_CHICKEN", name: "Pollo asado", category: "Consumable" },

  // ───── Consumibles: Pociones ─────
  { base: "POTION_HEAL", name: "Poción curativa", category: "Consumable" },
  { base: "POTION_ENERGY", name: "Poción de energía", category: "Consumable" },
  { base: "POTION_STONESKIN", name: "Poción piel de piedra", category: "Consumable" },
  { base: "POTION_INVISIBILITY", name: "Poción de invisibilidad", category: "Consumable" },
  { base: "POTION_GIGANTIFY", name: "Poción gigante", category: "Consumable" },
  { base: "POTION_POISON", name: "Poción de veneno", category: "Consumable" },
  { base: "POTION_GENERICBUFF", name: "Poción de resistencia", category: "Consumable" },
  { base: "POTION_COOLDOWN", name: "Poción de tiempo de reutilización", category: "Consumable" },

  // ───── Recursos en bruto (T2-T8) ─────
  { base: "WOOD", name: "Madera", category: "Resource", tiers: T2_8 },
  { base: "ORE", name: "Mineral", category: "Resource", tiers: T2_8 },
  { base: "HIDE", name: "Piel", category: "Resource", tiers: T2_8 },
  { base: "FIBER", name: "Fibra", category: "Resource", tiers: T2_8 },
  { base: "ROCK", name: "Piedra", category: "Resource", tiers: T2_8 },

  // ───── Recursos refinados ─────
  { base: "PLANKS", name: "Tablones", category: "Resource", tiers: T2_8 },
  { base: "METALBAR", name: "Lingotes", category: "Resource", tiers: T2_8 },
  { base: "LEATHER", name: "Cuero", category: "Resource", tiers: T2_8 },
  { base: "CLOTH", name: "Tela", category: "Resource", tiers: T2_8 },
  { base: "STONEBLOCK", name: "Bloques de piedra", category: "Resource", tiers: T2_8 },

  // ───── Productos animales / pesca / agricultura ─────
  { base: "FISHSAUCE_LEVEL1", name: "Salsa de pescado", category: "Resource", tiers: [3, 4, 5, 6, 7, 8] },
  { base: "ALCHEMY_EXTRACT_LEVEL1", name: "Extracto alquímico", category: "Resource", tiers: [3, 4, 5, 6, 7, 8] },
  { base: "FARM_CARROT_SEED", name: "Semilla de zanahoria", category: "Resource", tiers: [1] },
  { base: "FARM_BEAN_SEED", name: "Semilla de frijol", category: "Resource", tiers: [2] },
  { base: "FARM_WHEAT_SEED", name: "Semilla de trigo", category: "Resource", tiers: [3] },
  { base: "FARM_TURNIP_SEED", name: "Semilla de nabo", category: "Resource", tiers: [4] },
  { base: "FARM_CABBAGE_SEED", name: "Semilla de col", category: "Resource", tiers: [5] },
  { base: "FARM_POTATO_SEED", name: "Semilla de patata", category: "Resource", tiers: [6] },
  { base: "FARM_CORN_SEED", name: "Semilla de maíz", category: "Resource", tiers: [7] },
  { base: "FARM_PUMPKIN_SEED", name: "Semilla de calabaza", category: "Resource", tiers: [8] },
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

export { T1_8, T2_8, T3_8 };
