import { ALL_LOCATIONS } from "./albion-items";

export interface PriceRow {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

const BASE = "https://west.albion-online-data.com/api/v2/stats";

/** Precios actuales (Americas) para un ítem en todas las ciudades + Mercado Negro. */
export async function fetchPrices(itemId: string, quality: number): Promise<PriceRow[]> {
  const locations = ALL_LOCATIONS.map(encodeURIComponent).join(",");
  const url = `${BASE}/prices/${encodeURIComponent(itemId)}?locations=${locations}&qualities=${quality}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Albion: ${res.status}`);
  return (await res.json()) as PriceRow[];
}

/** Historial del precio de oro en Plata. */
export interface GoldPricePoint {
  price: number;
  timestamp: string;
}
export async function fetchGoldPrices(count = 30): Promise<GoldPricePoint[]> {
  const url = `${BASE}/gold?count=${count}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Albion (oro): ${res.status}`);
  return (await res.json()) as GoldPricePoint[];
}

/** Devuelve true si el timestamp de la API es un placeholder (0001-01-01...). */
export function isValidApiDate(iso: string | undefined): iso is string {
  if (!iso) return false;
  const t = new Date(iso + "Z").getTime();
  if (!isFinite(t)) return false;
  // Anything before 2010 is API "no data" sentinel (0001-01-01T00:00:00)
  return t > 1262304000000;
}

/** Edad legible "hace Xm". */
export function timeAgo(iso: string | undefined): string {
  if (!isValidApiDate(iso)) return "—";
  const ms = Date.now() - new Date(iso + "Z").getTime();
  if (!isFinite(ms) || ms < 0) return "—";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function formatSilver(n: number): string {
  if (!isFinite(n)) return "—";
  return Math.round(n).toLocaleString("es-ES");
}
