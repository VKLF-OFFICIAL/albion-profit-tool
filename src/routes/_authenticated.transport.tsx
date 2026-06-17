import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  ImageOff,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import {
  ITEM_BASES,
  QUALITIES,
  CITIES,
  BLACK_MARKET,
  CATEGORY_LABEL,
  buildItemId,
  itemImageUrl,
  type AlbionCategory,
} from "@/lib/albion-items";
import { fetchPrices, formatSilver, timeAgo, type PriceRow } from "@/lib/albion-api";

export const Route = createFileRoute("/_authenticated/transport")({
  head: () => ({
    meta: [
      { title: "Calculadora de Transportes · Albion M&C" },
      {
        name: "description",
        content:
          "Compara precios de todas las ciudades contra el Mercado Negro de Albion Online (Americas) y calcula ROI en tiempo real.",
      },
    ],
  }),
  component: TransportPage,
});

const TIERS = [4, 5, 6, 7, 8];
const ENCHANTS = [0, 1, 2, 3, 4];
const CATEGORIES: ("all" | AlbionCategory)[] = [
  "all",
  "Bag",
  "Cape",
  "Armor",
  "Weapon",
  "Mount",
  "Tool",
  "Consumable",
  "Resource",
];

type SellMode = "instasell" | "sellorder";

function useDebounced<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function TransportPage() {
  const [baseId, setBaseId] = useState<string>("BAG");
  const [tier, setTier] = useState<number>(4);
  const [enchant, setEnchant] = useState<number>(0);
  const [quality, setQuality] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(100);
  const [premium, setPremium] = useState<boolean>(true);
  const [sellMode, setSellMode] = useState<SellMode>("instasell");

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openItemPicker, setOpenItemPicker] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | AlbionCategory>("all");
  const [pickerQuery, setPickerQuery] = useState("");
  // Debounce de 500ms para evitar rate-limiting en filtros y futuras búsquedas a la API.
  const debouncedQuery = useDebounced(pickerQuery, 500);

  const itemId = useMemo(() => buildItemId(baseId, tier, enchant), [baseId, tier, enchant]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Pequeño debounce también antes del fetch: si el usuario cambia tier/enchant
    // rápidamente, sólo se dispara la última petición tras 350ms.
    const t = setTimeout(() => {
      fetchPrices(itemId, quality)
        .then((data) => {
          if (!cancelled) setRows(data);
        })
        .catch((e: Error) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [itemId, quality]);

  const blackMarket = rows.find((r) => r.city === BLACK_MARKET);
  // Instasell  → rellenamos órdenes de COMPRA del BM (buy_price_max).
  // Sell Order → publicamos a precio competitivo, referencia sell_price_min.
  const bmInstasellPrice = blackMarket?.buy_price_max ?? 0;
  const bmSellOrderPrice = blackMarket?.sell_price_min ?? 0;
  const bmRefPrice = sellMode === "instasell" ? bmInstasellPrice : bmSellOrderPrice;

  // Impuestos:
  //  - Instasell: sólo impuesto de venta (4% premium / 8% sin premium).
  //  - Sell Order: setup fee 2.5% al publicar + impuesto de venta al vender.
  const salesTax = premium ? 0.04 : 0.08;
  const setupFee = sellMode === "sellorder" ? 0.025 : 0;
  const totalTaxRate = salesTax + setupFee;

  const calcRow = (r: PriceRow, originIsBM = false) => {
    const buy = r.sell_price_min;
    // Si el origen es el propio Mercado Negro, no hay setup fee porque sólo
    // se rellena una orden de compra (instasell). En sellorder mantenemos
    // únicamente el impuesto de venta (sin setup fee), ya que publicar y
    // vender en el mismo mercado no tiene sentido económico con doble fee.
    const taxRate = originIsBM ? salesTax : totalTaxRate;
    if (!buy || !bmRefPrice) {
      return { buy, totalCost: 0, gross: 0, taxes: 0, net: 0, roi: 0 };
    }
    const totalCost = buy * quantity;
    const gross = bmRefPrice * quantity;
    const taxes = gross * taxRate;
    const net = gross - taxes - totalCost;
    const roi = totalCost > 0 ? (net / totalCost) * 100 : 0;
    return { buy, totalCost, gross, taxes, net, roi };
  };


  // Orígenes: las 5 ciudades reales (excluyendo Caerleon) + el propio
  // Mercado Negro como "ciudad" extra, con su propia configuración fiscal
  // (sin setup fee, sólo impuesto de venta).
  const TRANSPORT_CITIES = [
    ...CITIES.filter((c) => c !== "Caerleon"),
    BLACK_MARKET,
  ];

  const cityRows = TRANSPORT_CITIES.map((city) => {
    const r = rows.find((x) => x.city === city);
    return { city, row: r, isBM: city === BLACK_MARKET };
  });

  // Mejor oportunidad: máximo ROI > 0 (excluye datos nulos de la API)
  const bestDeal = useMemo(() => {
    let best: { city: string; roi: number; net: number } | null = null;
    for (const { city, row } of cityRows) {
      if (!row) continue;
      const c = calcRow(row);
      if (c.invalid || !c.buy || c.roi <= 0) continue;
      if (!best || c.roi > best.roi) best = { city, roi: c.roi, net: c.net };
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityRows, rows, bmRefPrice, quantity, totalTaxRate]);

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return ITEM_BASES.filter((it) => {
      if (categoryFilter !== "all" && it.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.base.toLowerCase().includes(q) ||
        CATEGORY_LABEL[it.category].toLowerCase().includes(q)
      );
    });
  }, [debouncedQuery, categoryFilter]);


  const currentItem = ITEM_BASES.find((i) => i.base === baseId);
  const heroImg = itemImageUrl(itemId, quality, 217);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Calculadora de Transportes
          </h1>
          <p className="text-sm text-muted-foreground">
            Precios automáticos del servidor Americas. Origen ciudad → destino Mercado Negro.
          </p>
        </div>
        <TutorialModal
          title="Cómo usar la Calculadora de Transportes"
          description="Compara el precio de venta de cada ciudad con el precio que paga el Mercado Negro."
        >
          <p>
            <strong>1. Selecciona un ítem.</strong> Filtra por categoría, escribe el nombre o el
            ID interno (ej. <code>T4_BAG</code>) y elige de la lista visual.
          </p>
          <p>
            <strong>2. Ajusta filtros.</strong> Tier (T4–T8), Encantamiento (.0–.4) y Calidad
            (Normal a Obra Maestra). La app refresca precios automáticamente.
          </p>
          <p>
            <strong>3. Cantidad y Premium.</strong> En el Mercado Negro vendes rellenando órdenes
            (Sell Now), por lo que <strong>NO</strong> se paga setup fee. Sólo aplica el
            impuesto de venta: <strong>4 % con Premium</strong> y <strong>8 % sin Premium</strong>.
          </p>
          <p>
            <strong>4. La banda dorada</strong> de la parte superior te dice cuál es la mejor
            oportunidad de transporte ahora mismo (mayor ROI positivo).
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-success mr-1" />
            <strong>Verde</strong>: ROI &gt; 15%.
            <span className="inline-block h-2 w-2 rounded-full bg-warning mx-1" />
            <strong>Amarillo</strong>: ROI 0–15%.
            <span className="inline-block h-2 w-2 rounded-full bg-danger mx-1" />
            <strong>Rojo</strong>: pérdidas.
          </p>
        </TutorialModal>
      </header>

      {/* Item hero + Filtros */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-0 md:flex-row">
          {/* Hero del ítem */}
          <div className="relative flex shrink-0 items-center justify-center bg-gradient-to-br from-primary/10 via-accent/20 to-background p-6 md:w-56 md:border-r md:border-border">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_50%,oklch(0.72_0.17_158/_0.25),transparent_70%)]" />
            <ItemImage
              src={heroImg}
              alt={currentItem?.name ?? itemId}
              className="relative h-32 w-32 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:h-40 md:w-40"
            />
            <Badge
              variant="outline"
              className="absolute bottom-2 left-2 border-primary/40 bg-background/80 font-mono text-[10px] backdrop-blur"
            >
              {itemId}
            </Badge>
          </div>

          <CardContent className="flex-1 pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {/* Item picker */}
              <div className="space-y-2 lg:col-span-2">
                <Label>Ítem</Label>
                <Popover open={openItemPicker} onOpenChange={setOpenItemPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{currentItem?.name ?? baseId}</span>
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[min(420px,calc(100vw-2rem))] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nombre o ID (ej. BAG, BOW)…"
                        value={pickerQuery}
                        onValueChange={setPickerQuery}
                      />
                      <div className="flex flex-wrap gap-1 border-b border-border p-2">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCategoryFilter(c)}
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                              categoryFilter === c
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                          >
                            {c === "all" ? "Todos" : CATEGORY_LABEL[c]}
                          </button>
                        ))}
                      </div>
                      <CommandList className="max-h-[340px]">
                        <CommandEmpty>Sin resultados.</CommandEmpty>
                        <CommandGroup>
                          {filteredItems.map((it) => {
                            const previewId = buildItemId(it.base, tier, enchant);
                            return (
                              <CommandItem
                                key={it.base}
                                value={it.base}
                                onSelect={() => {
                                  setBaseId(it.base);
                                  setOpenItemPicker(false);
                                }}
                                className="gap-2"
                              >
                                <ItemImage
                                  src={itemImageUrl(previewId, quality, 64)}
                                  alt={it.name}
                                  className="h-9 w-9 shrink-0 rounded-md bg-accent/40"
                                />
                                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                                  <span className="truncate text-sm">{it.name}</span>
                                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                                    {it.base}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">
                                  {CATEGORY_LABEL[it.category]}
                                </Badge>
                                {baseId === it.base && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tier</Label>
                <ToggleGroup
                  type="single"
                  value={String(tier)}
                  onValueChange={(v) => v && setTier(Number(v))}
                  className="justify-start"
                  size="sm"
                >
                  {TIERS.map((t) => (
                    <ToggleGroupItem key={t} value={String(t)} className="px-2 text-xs">
                      T{t}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label>Encantamiento</Label>
                <ToggleGroup
                  type="single"
                  value={String(enchant)}
                  onValueChange={(v) => v !== "" && setEnchant(Number(v))}
                  className="justify-start"
                  size="sm"
                >
                  {ENCHANTS.map((e) => (
                    <ToggleGroupItem key={e} value={String(e)} className="px-2 text-xs">
                      .{e}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label>Calidad</Label>
                <Select value={String(quality)} onValueChange={(v) => setQuality(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITIES.map((q) => (
                      <SelectItem key={q.value} value={String(q.value)}>
                        {q.label}
                      </SelectItem>
                    ))}
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
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="premium" checked={premium} onCheckedChange={setPremium} />
                  <Label htmlFor="premium" className="cursor-pointer text-xs sm:text-sm">
                    Premium (4% vs 8%)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs sm:text-sm">Modo venta BM</Label>
                  <ToggleGroup
                    type="single"
                    value={sellMode}
                    onValueChange={(v) => v && setSellMode(v as SellMode)}
                    size="sm"
                  >
                    <ToggleGroupItem value="instasell" className="px-2 text-xs">
                      Instasell
                    </ToggleGroupItem>
                    <ToggleGroupItem value="sellorder" className="px-2 text-xs">
                      Orden venta
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  fetchPrices(itemId, quality)
                    .then(setRows)
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
                disabled={loading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1", loading && "animate-spin")} />
                Refrescar
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Banner mejor oportunidad */}
      {bestDeal ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-gradient-to-r from-success/15 via-success/5 to-transparent px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-success" />
          <div className="flex-1 text-sm">
            Mejor oportunidad ahora:{" "}
            <strong className="text-success">{bestDeal.city} → Mercado Negro</strong> con{" "}
            <strong>ROI +{bestDeal.roi.toFixed(1)}%</strong> y beneficio neto{" "}
            <strong>{formatSilver(bestDeal.net)}</strong> plata.
          </div>
        </div>
      ) : !loading && rows.length > 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
          Ninguna ciudad es rentable ahora mismo para este ítem en estas condiciones.
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={sellMode === "instasell" ? "BM compra (instasell)" : "BM venta (orden)"}
          value={formatSilver(bmRefPrice)}
          hint={
            blackMarket
              ? `Actualizado ${timeAgo(
                  sellMode === "instasell"
                    ? blackMarket.buy_price_max_date
                    : blackMarket.sell_price_min_date,
                )}`
              : "Sin datos"
          }
          highlight
        />
        <StatCard
          label="Impuestos totales"
          value={`${(totalTaxRate * 100).toFixed(1)}%`}
          hint={
            sellMode === "instasell"
              ? `Sólo venta · ${premium ? "Premium 4%" : "Sin Premium 8%"}`
              : `Setup 2.5% + venta ${premium ? "4%" : "8%"}`
          }
        />
        <StatCard
          label="Cantidad por viaje"
          value={quantity.toLocaleString("es-ES")}
          hint="Modifica el campo arriba"
        />
      </div>


      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Ciudades → Mercado Negro
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {error ? (
            <div className="p-6 text-sm text-danger">Error: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="tabular">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciudad</TableHead>
                    <TableHead className="text-right">Compra min</TableHead>
                    <TableHead className="text-right">Actualizado</TableHead>
                    <TableHead className="text-right">Coste total</TableHead>
                    <TableHead className="text-right">Ingresos BM</TableHead>
                    <TableHead className="text-right">Impuestos</TableHead>
                    <TableHead className="text-right">Beneficio neto</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cityRows.map(({ city, row }) => {
                    const c = row ? calcRow(row) : null;
                    const invalid = c?.invalid ?? false;
                    const roi = c?.roi ?? 0;
                    const tone =
                      !c || !c.buy || invalid
                        ? "muted"
                        : roi > 15
                          ? "success"
                          : roi > 0
                            ? "warning"
                            : "danger";
                    const isBest = bestDeal?.city === city;
                    return (
                      <TableRow
                        key={city}
                        className={cn(
                          invalid && "opacity-60",
                          tone === "success" && !invalid && "bg-success/5 hover:bg-success/10",
                          tone === "warning" && !invalid && "bg-warning/5 hover:bg-warning/10",
                          tone === "danger" && !invalid && "bg-danger/5 hover:bg-danger/10",
                          isBest && !invalid && "ring-1 ring-inset ring-success/50",
                        )}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            {city}
                            {isBest && !invalid && (
                              <Sparkles className="h-3.5 w-3.5 text-success" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {c?.buy ? (
                            formatSilver(c.buy)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {timeAgo(row?.sell_price_min_date)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {invalid ? (
                            <span className="italic">Sin stock/datos</span>
                          ) : c?.buy ? (
                            formatSilver(c.totalCost)
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!invalid && c?.buy ? formatSilver(c.gross) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {!invalid && c?.buy ? formatSilver(c.taxes) : "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            tone === "success" && !invalid && "text-success",
                            tone === "danger" && !invalid && "text-danger",
                          )}
                        >
                          {!invalid && c?.buy ? formatSilver(c.net) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!invalid && c?.buy ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono",
                                tone === "success" && "border-success/40 text-success",
                                tone === "warning" && "border-warning/40 text-warning",
                                tone === "danger" && "border-danger/40 text-danger",
                              )}
                            >
                              {roi > 0 ? "+" : ""}
                              {roi.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Datos cortesía del proyecto comunitario Albion Online Data e imágenes de
        render.albiononline.com (servidor Americas).
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        highlight && "border-primary/40 shadow-[0_0_0_1px] shadow-primary/10",
      )}
    >
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={cn("mt-1 text-2xl font-bold tabular", highlight && "text-primary")}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function ItemImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [src]);
  if (errored) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="h-1/2 w-1/2 opacity-50" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn("object-contain", className)}
    />
  );
}
