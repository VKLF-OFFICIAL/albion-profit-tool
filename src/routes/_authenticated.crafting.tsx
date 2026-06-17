import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Hammer, Loader2, RefreshCw } from "lucide-react";

import { TutorialModal } from "@/components/tutorial-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPrices, formatSilver } from "@/lib/albion-api";
import { recordRecentSearch } from "@/hooks/use-recent-searches";
import { itemImageUrl } from "@/lib/albion-items";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crafting")({
  validateSearch: (search: Record<string, unknown>) => ({
    base: typeof search.base === "string" ? search.base : undefined,
    tier: search.tier != null ? Number(search.tier) : undefined,
    enchant: search.enchant != null ? Number(search.enchant) : undefined,
    quality: search.quality != null ? Number(search.quality) : undefined,
  }),
  head: () => ({ meta: [{ title: "Crafteo · Albion M&C" }] }),
  component: CraftingPage,
});

// ───── Catálogo de recetas (subset realista de Albion) ─────
// Cada receta declara los materiales refinados necesarios (base, cantidad).
// Las materias se refinan al mismo tier que el ítem resultante.
type RefinedKind = "PLANKS" | "METALBAR" | "STONEBLOCK" | "CLOTH" | "LEATHER";

interface Recipe {
  base: string;       // ID base del ítem resultante
  name: string;
  category: "Bag" | "Cape" | "ArmorPlate" | "ArmorLeather" | "ArmorCloth" | "Weapon";
  /** Materiales: refined kind y cantidad por unidad. */
  mats: Array<{ kind: RefinedKind; qty: number }>;
}

const RECIPES: Recipe[] = [
  // Bolsas y capas
  { base: "BAG", name: "Bolsa", category: "Bag", mats: [{ kind: "CLOTH", qty: 8 }, { kind: "LEATHER", qty: 8 }] },
  { base: "CAPE", name: "Capa", category: "Cape", mats: [{ kind: "CLOTH", qty: 8 }, { kind: "LEATHER", qty: 8 }] },
  // Armaduras placa
  { base: "HEAD_PLATE_SET1", name: "Casco de soldado", category: "ArmorPlate", mats: [{ kind: "METALBAR", qty: 16 }] },
  { base: "ARMOR_PLATE_SET1", name: "Armadura de soldado", category: "ArmorPlate", mats: [{ kind: "METALBAR", qty: 24 }] },
  { base: "SHOES_PLATE_SET1", name: "Botas de soldado", category: "ArmorPlate", mats: [{ kind: "METALBAR", qty: 16 }] },
  { base: "HEAD_PLATE_SET2", name: "Yelmo de caballero", category: "ArmorPlate", mats: [{ kind: "METALBAR", qty: 16 }] },
  { base: "ARMOR_PLATE_SET2", name: "Armadura de caballero", category: "ArmorPlate", mats: [{ kind: "METALBAR", qty: 24 }] },
  { base: "SHOES_PLATE_SET2", name: "Sabatones de caballero", category: "ArmorPlate", mats: [{ kind: "METALBAR", qty: 16 }] },
  // Armaduras cuero
  { base: "HEAD_LEATHER_SET1", name: "Capucha de explorador", category: "ArmorLeather", mats: [{ kind: "LEATHER", qty: 16 }] },
  { base: "ARMOR_LEATHER_SET1", name: "Casaca de explorador", category: "ArmorLeather", mats: [{ kind: "LEATHER", qty: 24 }] },
  { base: "SHOES_LEATHER_SET1", name: "Botas de explorador", category: "ArmorLeather", mats: [{ kind: "LEATHER", qty: 16 }] },
  // Armaduras tela
  { base: "HEAD_CLOTH_SET1", name: "Capucha de erudito", category: "ArmorCloth", mats: [{ kind: "CLOTH", qty: 16 }] },
  { base: "ARMOR_CLOTH_SET1", name: "Túnica de erudito", category: "ArmorCloth", mats: [{ kind: "CLOTH", qty: 24 }] },
  { base: "SHOES_CLOTH_SET1", name: "Sandalias de erudito", category: "ArmorCloth", mats: [{ kind: "CLOTH", qty: 16 }] },
  // Armas (aprox. madera + metal)
  { base: "MAIN_SWORD", name: "Espada de combate", category: "Weapon", mats: [{ kind: "METALBAR", qty: 16 }, { kind: "PLANKS", qty: 8 }] },
  { base: "2H_CLAYMORE", name: "Mandoble", category: "Weapon", mats: [{ kind: "METALBAR", qty: 24 }, { kind: "PLANKS", qty: 8 }] },
  { base: "MAIN_AXE", name: "Hacha de batalla", category: "Weapon", mats: [{ kind: "METALBAR", qty: 16 }, { kind: "PLANKS", qty: 8 }] },
  { base: "2H_AXE", name: "Hacha grande", category: "Weapon", mats: [{ kind: "METALBAR", qty: 24 }, { kind: "PLANKS", qty: 8 }] },
  { base: "MAIN_MACE", name: "Maza", category: "Weapon", mats: [{ kind: "METALBAR", qty: 16 }, { kind: "PLANKS", qty: 8 }] },
  { base: "MAIN_DAGGER", name: "Daga", category: "Weapon", mats: [{ kind: "METALBAR", qty: 12 }, { kind: "PLANKS", qty: 4 }] },
  { base: "2H_BOW", name: "Arco", category: "Weapon", mats: [{ kind: "PLANKS", qty: 20 }, { kind: "LEATHER", qty: 4 }] },
  { base: "2H_CROSSBOW", name: "Ballesta", category: "Weapon", mats: [{ kind: "PLANKS", qty: 16 }, { kind: "METALBAR", qty: 8 }] },
  { base: "MAIN_FIRESTAFF", name: "Bastón de fuego", category: "Weapon", mats: [{ kind: "PLANKS", qty: 20 }, { kind: "CLOTH", qty: 4 }] },
  { base: "MAIN_HOLYSTAFF", name: "Bastón sagrado", category: "Weapon", mats: [{ kind: "PLANKS", qty: 20 }, { kind: "CLOTH", qty: 4 }] },
  { base: "MAIN_NATURESTAFF", name: "Bastón de la naturaleza", category: "Weapon", mats: [{ kind: "PLANKS", qty: 20 }, { kind: "CLOTH", qty: 4 }] },
];

const REFINED_BASE: Record<RefinedKind, string> = {
  PLANKS: "PLANKS",
  METALBAR: "METALBAR",
  STONEBLOCK: "STONEBLOCK",
  CLOTH: "CLOTH",
  LEATHER: "LEATHER",
};

const REFINED_LABEL: Record<RefinedKind, string> = {
  PLANKS: "Tablones",
  METALBAR: "Lingotes",
  STONEBLOCK: "Bloques",
  CLOTH: "Tela",
  LEATHER: "Cuero",
};

const TIERS = [4, 5, 6, 7, 8];
const ENCHANTS = [0, 1, 2, 3, 4];
const QUALITIES = [
  { v: 1, l: "Normal" },
  { v: 2, l: "Bueno" },
  { v: 3, l: "Excelente" },
  { v: 4, l: "Maestral" },
];

const CITIES = ["Lymhurst", "Fort Sterling", "Bridgewatch", "Thetford", "Martlock", "Caerleon"];

function buildItemId(base: string, tier: number, enchant: number) {
  const root = `T${tier}_${base}`;
  return enchant > 0 ? `${root}@${enchant}` : root;
}
function buildRefinedId(kind: RefinedKind, tier: number, enchant: number) {
  const root = `T${tier}_${REFINED_BASE[kind]}`;
  return enchant > 0 ? `${root}_LEVEL${enchant}@${enchant}` : root;
}

async function fetchCityPrice(itemId: string, quality: number, city: string) {
  try {
    const rows = await fetchPrices(itemId, quality);
    const row = rows.find((r) => r.city.toLowerCase() === city.toLowerCase());
    if (!row) return { buy: 0, sell: 0 };
    return {
      buy: row.sell_price_min > 0 && row.sell_price_min < 999_999_999 ? row.sell_price_min : 0,
      sell: row.buy_price_max > 0 ? row.buy_price_max : 0,
    };
  } catch {
    return { buy: 0, sell: 0 };
  }
}

function CraftingPage() {
  const search = Route.useSearch();

  const initialRecipeIdx = useMemo(() => {
    const idx = RECIPES.findIndex((r) => r.base === search.base);
    return idx >= 0 ? idx : 0;
  }, [search.base]);
  const [recipeIdx, setRecipeIdx] = useState(initialRecipeIdx);
  const [tier, setTier] = useState(search.tier ?? 4);
  const [enchant, setEnchant] = useState(search.enchant ?? 0);
  const [quality, setQuality] = useState(search.quality ?? 1);
  const [city, setCity] = useState("Caerleon");
  const [focus, setFocus] = useState(false);
  const [premium, setPremium] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRecipeIdx !== recipeIdx) setRecipeIdx(initialRecipeIdx);
    if (search.tier !== undefined) setTier(search.tier);
    if (search.enchant !== undefined) setEnchant(search.enchant);
    if (search.quality !== undefined) setQuality(search.quality);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.base, search.tier, search.enchant, search.quality]);

  const recipe = RECIPES[recipeIdx];
  const itemId = buildItemId(recipe.base, tier, enchant);

  useEffect(() => {
    const t = setTimeout(() => {
      void recordRecentSearch({
        tool: "crafting",
        base_id: recipe.base,
        tier,
        enchant,
        quality,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [recipe.base, tier, enchant, quality]);

  const [matPrices, setMatPrices] = useState<Record<string, number>>({});
  const [itemPrice, setItemPrice] = useState<{ buy: number; sell: number }>({ buy: 0, sell: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const tasks: Promise<void>[] = [];
    const next: Record<string, number> = {};
    for (const m of recipe.mats) {
      const id = buildRefinedId(m.kind, tier, enchant);
      tasks.push(
        fetchCityPrice(id, 1, city).then((p) => {
          next[m.kind] = p.buy;
        }),
      );
    }
    tasks.push(
      fetchCityPrice(itemId, quality, city).then((p) => {
        if (!cancelled) setItemPrice(p);
      }),
    );
    Promise.all(tasks).then(() => {
      if (!cancelled) {
        setMatPrices(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [recipe, itemId, tier, enchant, quality, city, refreshTick]);

  const calc = useMemo(() => {
    // Tasa de retorno por crafteo (aprox)
    let returnRate = focus ? 0.467 : 0.152;
    if (city !== "Caerleon") returnRate += 0.10; // pequeña aprox de ciudad
    const effectiveFactor = 1 - returnRate;

    let costPerItem = 0;
    let allLoaded = true;
    for (const m of recipe.mats) {
      const p = matPrices[m.kind] ?? 0;
      if (p === 0) allLoaded = false;
      costPerItem += p * m.qty * effectiveFactor;
    }
    // tasa estación 2.5% del precio del ítem
    const stationFee = itemPrice.sell * 0.025;
    costPerItem += stationFee;

    const marketRate = (premium ? 0.04 : 0.08) + 0.025;
    const revenuePerItem = itemPrice.sell * (1 - marketRate);
    const profitPerItem = revenuePerItem - costPerItem;
    const totalProfit = profitPerItem * quantity;
    const totalCost = costPerItem * quantity;
    const totalRevenue = revenuePerItem * quantity;
    const roi = costPerItem > 0 ? (profitPerItem / costPerItem) * 100 : 0;

    return {
      returnRate,
      costPerItem,
      revenuePerItem,
      profitPerItem,
      totalProfit,
      totalCost,
      totalRevenue,
      roi,
      dataMissing: !allLoaded || itemPrice.sell === 0,
    };
  }, [matPrices, itemPrice, recipe, focus, premium, city, quantity]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-6 w-6 text-primary" /> Crafteo
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcula coste de materiales y beneficio neto por ítem fabricado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refrescar
          </Button>
          <TutorialModal title="Cómo usar el Crafteo">
            <p>
              Las recetas son una aproximación realista (subset de Albion). Los precios de
              materiales y del ítem terminado se consultan en vivo en la ciudad seleccionada.
              <strong> Foco</strong> aumenta la devolución de materiales y <strong>Premium</strong> reduce la tasa de mercado.
            </p>
          </TutorialModal>
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-0 md:flex-row">
          <div className="relative flex shrink-0 items-center justify-center bg-gradient-to-br from-primary/10 via-accent/20 to-background p-6 md:w-56 md:border-r md:border-border">
            <img
              src={itemImageUrl(itemId, quality, 217)}
              alt={recipe.name}
              className="h-32 w-32 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:h-40 md:w-40"
            />
          </div>
          <CardContent className="flex-1 pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 lg:col-span-2">
                <Label>Ítem</Label>
                <Select value={String(recipeIdx)} onValueChange={(v) => setRecipeIdx(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    {RECIPES.map((r, i) => (
                      <SelectItem key={r.base} value={String(i)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={String(tier)} onValueChange={(v) => setTier(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => <SelectItem key={t} value={String(t)}>T{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Encantamiento</Label>
                <Select value={String(enchant)} onValueChange={(v) => setEnchant(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENCHANTS.map((e) => <SelectItem key={e} value={String(e)}>.{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calidad</Label>
                <Select value={String(quality)} onValueChange={(v) => setQuality(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUALITIES.map((q) => <SelectItem key={q.v} value={String(q.v)}>{q.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Opciones</Label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={focus} onCheckedChange={setFocus} /> Foco
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={premium} onCheckedChange={setPremium} /> Premium
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Materiales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiales por ítem</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio compra</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.mats.map((m) => {
                const p = matPrices[m.kind] ?? 0;
                return (
                  <TableRow key={m.kind}>
                    <TableCell className="font-medium">
                      {REFINED_LABEL[m.kind]} T{tier}{enchant > 0 ? `.${enchant}` : ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p > 0 ? formatSilver(p) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p > 0 ? formatSilver(p * m.qty) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resultado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Coste por ítem" value={`${formatSilver(calc.costPerItem)} 🪙`} hint="Materiales + tasa estación + devolución" />
        <Metric label="Precio venta" value={`${formatSilver(itemPrice.sell)} 🪙`} hint={`Compra máx en ${city}`} />
        <Metric
          label="Beneficio / ítem"
          value={`${formatSilver(calc.profitPerItem)} 🪙`}
          tone={calc.profitPerItem >= 0 ? "success" : "destructive"}
        />
        <Metric
          label="ROI"
          value={`${calc.roi.toFixed(1)}%`}
          tone={calc.roi >= 0 ? "success" : "destructive"}
        />
        <Metric
          label={`Total ${quantity} ud`}
          value={`${formatSilver(calc.totalProfit)} 🪙`}
          hint={`Coste ${formatSilver(calc.totalCost)} · Ingreso ${formatSilver(calc.totalRevenue)}`}
          tone={calc.totalProfit >= 0 ? "success" : "destructive"}
        />
        <Metric label="Tasa retorno" value={`${(calc.returnRate * 100).toFixed(1)}%`} hint={focus ? "Con foco" : "Sin foco"} />
        <Metric
          label="Estado precios"
          value={calc.dataMissing ? "Datos incompletos" : "OK"}
          tone={calc.dataMissing ? "warning" : "success"}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "destructive" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-xl font-bold tabular-nums", toneClass)}>{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
