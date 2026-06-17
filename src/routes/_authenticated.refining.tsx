import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Hammer, Loader2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/refining")({
  validateSearch: (search: Record<string, unknown>) => ({
    base: typeof search.base === "string" ? search.base : undefined,
    tier: search.tier != null ? Number(search.tier) : undefined,
    enchant: search.enchant != null ? Number(search.enchant) : undefined,
    quality: search.quality != null ? Number(search.quality) : undefined,
  }),
  head: () => ({ meta: [{ title: "Refino · Albion M&C" }] }),
  component: RefiningPage,
});

// ───────────────────────────────────────────────
// Modelo de refino
// ───────────────────────────────────────────────
interface ResourceDef {
  /** Base ID del recurso bruto (sin tier). */
  raw: string;
  /** Base ID del recurso refinado (sin tier). */
  refined: string;
  /** Nombre legible. */
  name: string;
  /** Ciudad especializada en ese refino. */
  city: string;
}

const RESOURCES: ResourceDef[] = [
  { raw: "WOOD", refined: "PLANKS", name: "Madera → Tablones", city: "Lymhurst" },
  { raw: "ORE", refined: "METALBAR", name: "Mineral → Lingotes", city: "Fort Sterling" },
  { raw: "ROCK", refined: "STONEBLOCK", name: "Piedra → Bloques", city: "Bridgewatch" },
  { raw: "FIBER", refined: "CLOTH", name: "Fibra → Tela", city: "Thetford" },
  { raw: "HIDE", refined: "LEATHER", name: "Pieles → Cuero", city: "Martlock" },
];

const CITIES = ["Lymhurst", "Fort Sterling", "Bridgewatch", "Thetford", "Martlock", "Caerleon"];

const TIERS = [4, 5, 6, 7, 8];
const ENCHANTS = [0, 1, 2, 3, 4];

/** Tasas de retorno (aproximación oficial). */
const BASE_RETURN_NO_FOCUS = 0.152;
const BASE_RETURN_WITH_FOCUS = 0.367;
const CITY_BONUS_NO_FOCUS = 0.20; // ciudad especializada sin foco → ~36.7%
const CITY_BONUS_WITH_FOCUS = 0.18; // ciudad especializada con foco → ~53.9%

/** Albion: refinar T(N) requiere 1 raw T(N) + 1 refined T(N-1). */
function buildRawId(base: string, tier: number, enchant: number) {
  const root = `T${tier}_${base}`;
  // Recursos brutos enchant: T4_WOOD_LEVEL1@1
  return enchant > 0 ? `${root}_LEVEL${enchant}@${enchant}` : root;
}
function buildRefinedId(base: string, tier: number, enchant: number) {
  const root = `T${tier}_${base}`;
  return enchant > 0 ? `${root}_LEVEL${enchant}@${enchant}` : root;
}

interface PriceLookup {
  buyMin: number; // mejor precio para comprar (orden de venta más barato)
  sellMax: number; // mejor precio para vender (orden de compra más alto)
}

async function fetchBest(itemId: string, quality: number, city: string): Promise<PriceLookup> {
  try {
    const rows = await fetchPrices(itemId, quality);
    const row = rows.find((r) => r.city.toLowerCase() === city.toLowerCase());
    if (!row) return { buyMin: 0, sellMax: 0 };
    const buy = row.sell_price_min > 0 && row.sell_price_min < 999_999_999 ? row.sell_price_min : 0;
    const sell = row.buy_price_max > 0 ? row.buy_price_max : 0;
    return { buyMin: buy, sellMax: sell };
  } catch {
    return { buyMin: 0, sellMax: 0 };
  }
}

function RefiningPage() {
  const search = Route.useSearch();

  const [resourceIdx, setResourceIdx] = useState(0);
  const [tier, setTier] = useState(search.tier ?? 4);
  const [enchant, setEnchant] = useState(search.enchant ?? 0);
  const [city, setCity] = useState("Lymhurst");
  const [focus, setFocus] = useState(false);
  const [premium, setPremium] = useState(true);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const resource = RESOURCES[resourceIdx];

  // Sync resource from URL `base` if it matches one of the refined IDs
  useEffect(() => {
    if (!search.base) return;
    const idx = RESOURCES.findIndex((r) => r.refined === search.base || r.raw === search.base);
    if (idx >= 0) setResourceIdx(idx);
    if (search.tier !== undefined) setTier(search.tier);
    if (search.enchant !== undefined) setEnchant(search.enchant);
  }, [search.base, search.tier, search.enchant]);

  useEffect(() => {
    const t = setTimeout(() => {
      void recordRecentSearch({
        tool: "refining",
        base_id: resource.refined,
        tier,
        enchant,
        quality: 1,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [resource.refined, tier, enchant]);

  // Cargas: raw price, lower-refined price, refined market price (en city seleccionada)
  const [rawPrice, setRawPrice] = useState(0);
  const [lowerRefPrice, setLowerRefPrice] = useState(0);
  const [refinedSell, setRefinedSell] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const rawId = buildRawId(resource.raw, tier, enchant);
    const refinedId = buildRefinedId(resource.refined, tier, enchant);

    const tasks: Promise<unknown>[] = [
      fetchBest(rawId, 1, city).then((p) => !cancelled && setRawPrice(p.buyMin)),
      fetchBest(refinedId, 1, city).then((p) => !cancelled && setRefinedSell(p.sellMax)),
    ];
    if (tier > 4) {
      const lowerId = buildRefinedId(resource.refined, tier - 1, enchant);
      tasks.push(fetchBest(lowerId, 1, city).then((p) => !cancelled && setLowerRefPrice(p.buyMin)));
    } else {
      setLowerRefPrice(0);
    }

    Promise.all(tasks).finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [resource.raw, resource.refined, tier, enchant, city, refreshTick]);

  // ─── cálculo ───
  const calc = useMemo(() => {
    const isSpecialized = city === resource.city;
    let returnRate = focus ? BASE_RETURN_WITH_FOCUS : BASE_RETURN_NO_FOCUS;
    if (isSpecialized) {
      returnRate += focus ? CITY_BONUS_WITH_FOCUS : CITY_BONUS_NO_FOCUS;
    }

    // Efectivamente, por cada refinado producido necesitamos
    //   1 raw   +   1 lower-refined        (T4: solo raw)
    // multiplicado por (1 - returnRate) por la devolución de la estación.
    const effectiveFactor = 1 - returnRate;
    const rawCostPerUnit = rawPrice * effectiveFactor;
    const lowerCostPerUnit = tier > 4 ? lowerRefPrice * effectiveFactor : 0;

    // Tasa de la estación pública: ~2.5% del valor del item
    const stationFeePerUnit = refinedSell * 0.025;

    const costPerUnit = rawCostPerUnit + lowerCostPerUnit + stationFeePerUnit;

    // Tasa de mercado al vender: 4% premium, 8% sin premium + 2.5% setup
    const marketSellRate = (premium ? 0.04 : 0.08) + 0.025;
    const revenuePerUnit = refinedSell * (1 - marketSellRate);

    const profitPerUnit = revenuePerUnit - costPerUnit;
    const totalCost = costPerUnit * quantity;
    const totalRevenue = revenuePerUnit * quantity;
    const totalProfit = profitPerUnit * quantity;
    const roi = costPerUnit > 0 ? (profitPerUnit / costPerUnit) * 100 : 0;

    // Foco usado por refinado (aprox 33 puntos T4, escala suave)
    const focusPerUnit = focus ? 35 + (tier - 4) * 8 : 0;
    const silverPerFocus = focus && focusPerUnit > 0 ? profitPerUnit / focusPerUnit : 0;

    const dataMissing = rawPrice === 0 || refinedSell === 0 || (tier > 4 && lowerRefPrice === 0);

    return {
      returnRate,
      isSpecialized,
      costPerUnit,
      revenuePerUnit,
      profitPerUnit,
      totalCost,
      totalRevenue,
      totalProfit,
      roi,
      silverPerFocus,
      dataMissing,
    };
  }, [
    focus,
    premium,
    quantity,
    rawPrice,
    lowerRefPrice,
    refinedSell,
    tier,
    city,
    resource.city,
  ]);

  // Tabla comparativa por ciudad (usa solo precios actuales del refinado y raw en cada ciudad)
  // Para simplificar, mostramos el bonus + tasa de retorno por ciudad sin recalcular precios remotos.
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-6 w-6 text-primary" /> Asistente de Refino
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcula coste efectivo, ingresos y beneficio neto por lote refinado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshTick((x) => x + 1)}
            className="gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refrescar
          </Button>
          <TutorialModal title="Cómo usar el Asistente de Refino">
            <p>
              Selecciona el <strong>recurso</strong>, <strong>tier</strong>,{" "}
              <strong>encantamiento</strong> y <strong>ciudad</strong> donde refinarás.
              Activa <strong>Foco</strong> si vas a usarlo (mejora la devolución a 36.7% y
              hasta 53.9% en ciudad especializada). <strong>Premium</strong> reduce la tasa
              del mercado al vender. Los precios se obtienen en vivo desde la API
              <em> Albion Online Data </em>.
            </p>
            <p className="mt-2 text-xs">
              <strong>Fórmula:</strong> coste = (precio_bruto + precio_refinado_inferior) ×
              (1 − tasa_retorno) + 2.5% tasa estación. Ingreso = precio_venta_refinado × (1 −
              tasa_mercado).
            </p>
          </TutorialModal>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Recurso</Label>
              <Select value={String(resourceIdx)} onValueChange={(v) => setResourceIdx(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCES.map((r, i) => (
                    <SelectItem key={r.refined} value={String(i)}>
                      {r.name} <span className="text-xs text-muted-foreground">({r.city})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={String(tier)} onValueChange={(v) => setTier(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={String(t)}>T{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Encantamiento</Label>
              <Select value={String(enchant)} onValueChange={(v) => setEnchant(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENCHANTS.map((e) => (
                    <SelectItem key={e} value={String(e)}>.{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Ciudad de refino</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}{" "}
                      {c === resource.city ? (
                        <span className="text-xs text-success">★ especializada</span>
                      ) : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad a refinar</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
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
      </Card>

      {/* Resultados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Tasa retorno"
          value={`${(calc.returnRate * 100).toFixed(1)}%`}
          hint={calc.isSpecialized ? "Ciudad especializada" : "Sin bonus de ciudad"}
        />
        <Metric
          label="Coste por unidad"
          value={`${formatSilver(calc.costPerUnit)} 🪙`}
          hint="Materia + tasa estación"
        />
        <Metric
          label="Ingreso neto por unidad"
          value={`${formatSilver(calc.revenuePerUnit)} 🪙`}
          hint={premium ? "Mercado 6.5% (premium)" : "Mercado 10.5%"}
        />
        <Metric
          label="Beneficio por unidad"
          value={`${formatSilver(calc.profitPerUnit)} 🪙`}
          tone={calc.profitPerUnit >= 0 ? "success" : "destructive"}
        />
        <Metric
          label={`Total ${quantity} ud`}
          value={`${formatSilver(calc.totalProfit)} 🪙`}
          hint={`Coste ${formatSilver(calc.totalCost)} · Ingreso ${formatSilver(calc.totalRevenue)}`}
          tone={calc.totalProfit >= 0 ? "success" : "destructive"}
        />
        <Metric
          label="ROI"
          value={`${calc.roi.toFixed(1)}%`}
          tone={calc.roi >= 0 ? "success" : "destructive"}
        />
        {focus ? (
          <Metric
            label="Plata por foco"
            value={`${formatSilver(calc.silverPerFocus)} 🪙`}
            hint="Beneficio / foco usado"
          />
        ) : null}
        <Metric
          label="Estado precios"
          value={calc.dataMissing ? "Datos incompletos" : "OK"}
          tone={calc.dataMissing ? "warning" : "success"}
          hint={calc.dataMissing ? "Falta precio de algún material" : "Todos los precios cargados"}
        />
      </div>

      {/* Tabla de tasas por ciudad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Tasa de retorno por ciudad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ciudad</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead className="text-right">Retorno sin foco</TableHead>
                <TableHead className="text-right">Retorno con foco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CITIES.map((c) => {
                const spec = c === resource.city;
                const noFocus = BASE_RETURN_NO_FOCUS + (spec ? CITY_BONUS_NO_FOCUS : 0);
                const withFocus = BASE_RETURN_WITH_FOCUS + (spec ? CITY_BONUS_WITH_FOCUS : 0);
                return (
                  <TableRow key={c} className={cn(c === city && "bg-accent/30")}>
                    <TableCell className="font-medium">{c}</TableCell>
                    <TableCell>
                      {spec ? (
                        <Badge variant="default" className="gap-1">
                          <TrendingUp className="h-3 w-3" /> Especializada
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{(noFocus * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{(withFocus * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
