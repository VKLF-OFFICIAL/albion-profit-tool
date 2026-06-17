import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Check,
  ChevronsUpDown,
  ImageOff,
  Loader2,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/use-favorites";

import { TutorialModal } from "@/components/tutorial-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import {
  ITEM_BASES,
  QUALITIES,
  ALL_LOCATIONS,
  CATEGORY_LABEL,
  buildItemId,
  itemImageUrl,
  type AlbionCategory,
} from "@/lib/albion-items";
import {
  fetchPrices,
  formatSilver,
  timeAgo,
  type PriceRow,
} from "@/lib/albion-api";

export const Route = createFileRoute("/_authenticated/prices")({
  validateSearch: (search: Record<string, unknown>) => ({
    base: typeof search.base === "string" ? search.base : undefined,
    tier: search.tier != null ? Number(search.tier) : undefined,
    enchant: search.enchant != null ? Number(search.enchant) : undefined,
    quality: search.quality != null ? Number(search.quality) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Comparador de Precios · Albion M&C" },
      {
        name: "description",
        content:
          "Compara precios de compra y venta entre todas las ciudades y el Mercado Negro de Albion Online.",
      },
    ],
  }),
  component: PricesPage,
});
const TIERS = [4, 5, 6, 7, 8];
const ENCHANTS = [0, 1, 2, 3, 4];
const CATEGORIES: ("all" | AlbionCategory)[] = [
  "all",
  "Bag",
  "Cape",
  "Armor",
  "Weapon",
  "OffHand",
  "Mount",
  "Tool",
  "Consumable",
  "Resource",
];

type SortKey = "city" | "sell" | "buy" | "spread" | "updated";
type SortDir = "asc" | "desc";

function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function freshness(iso?: string): { label: string; tone: string } {
  if (!iso) return { label: "Sin datos", tone: "text-muted-foreground" };
  const ms = Date.now() - new Date(iso + "Z").getTime();
  const h = ms / 3_600_000;
  if (h < 2) return { label: timeAgo(iso), tone: "text-success" };
  if (h < 12) return { label: timeAgo(iso), tone: "text-warning" };
  return { label: timeAgo(iso), tone: "text-danger" };
}

function PricesPage() {
  const [baseId, setBaseId] = useState("BAG");
  const [tier, setTier] = useState(4);
  const [enchant, setEnchant] = useState(0);
  const [quality, setQuality] = useState(1);

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openPicker, setOpenPicker] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | AlbionCategory>("all");
  const [pickerQuery, setPickerQuery] = useState("");
  const debouncedQuery = useDebounced(pickerQuery, 500);

  const [sortKey, setSortKey] = useState<SortKey>("sell");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const itemId = useMemo(
    () => buildItemId(baseId, tier, enchant),
    [baseId, tier, enchant],
  );
  const currentItem = ITEM_BASES.find((i) => i.base === baseId);
  const heroImg = itemImageUrl(itemId, quality, 217);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      fetchPrices(itemId, quality)
        .then((data) => !cancelled && setRows(data))
        .catch((e: Error) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [itemId, quality]);

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
    }).slice(0, 200);
  }, [debouncedQuery, categoryFilter]);

  // Normaliza filas por ubicación
  const byLocation = useMemo(() => {
    return ALL_LOCATIONS.map((loc) => {
      const r = rows.find((x) => x.city === loc);
      return {
        city: loc,
        sell: r?.sell_price_min ?? 0,
        sellDate: r?.sell_price_min_date,
        buy: r?.buy_price_max ?? 0,
        buyDate: r?.buy_price_max_date,
      };
    });
  }, [rows]);

  // Mejor sitio para COMPRAR = sell_price_min más bajo (> 0)
  const bestBuy = useMemo(() => {
    const candidates = byLocation.filter((r) => r.sell > 0);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.sell < b.sell ? a : b));
  }, [byLocation]);

  // Mejor sitio para VENDER = buy_price_max más alto
  const bestSell = useMemo(() => {
    const candidates = byLocation.filter((r) => r.buy > 0);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.buy > b.buy ? a : b));
  }, [byLocation]);

  const spread =
    bestBuy && bestSell && bestSell.buy > bestBuy.sell
      ? bestSell.buy - bestBuy.sell
      : 0;
  const spreadPct =
    bestBuy && bestBuy.sell > 0 ? (spread / bestBuy.sell) * 100 : 0;

  const sortedRows = useMemo(() => {
    const arr = [...byLocation];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortKey === "city") {
        av = a.city;
        bv = b.city;
        return av.localeCompare(bv as string) * dir;
      }
      if (sortKey === "sell") {
        av = a.sell || -1;
        bv = b.sell || -1;
      } else if (sortKey === "buy") {
        av = a.buy || -1;
        bv = b.buy || -1;
      } else if (sortKey === "spread") {
        av = a.buy && a.sell ? a.buy - a.sell : -Infinity;
        bv = b.buy && b.sell ? b.buy - b.sell : -Infinity;
      } else if (sortKey === "updated") {
        av = a.sellDate ? new Date(a.sellDate + "Z").getTime() : 0;
        bv = b.sellDate ? new Date(b.sellDate + "Z").getTime() : 0;
      }
      return ((av as number) - (bv as number)) * dir;
    });
    return arr;
  }, [byLocation, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "city" ? "asc" : "desc");
    }
  }

  const refresh = () => {
    setLoading(true);
    fetchPrices(itemId, quality)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Comparador de Precios
          </h1>
          <p className="text-sm text-muted-foreground">
            Precios en vivo (Americas) en todas las ciudades y el Mercado Negro.
          </p>
        </div>
        <TutorialModal title="Cómo usar el Comparador de Precios">
          <p>
            <strong>1. Elige un ítem</strong> usando el buscador (por nombre, ID o categoría).
          </p>
          <p>
            <strong>2. Ajusta Tier, Encantamiento y Calidad.</strong> La tabla se actualiza al instante.
          </p>
          <p>
            <strong>3. Lee la tabla:</strong>
          </p>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            <li><strong>Compra mínima</strong>: precio al que puedes <em>comprar</em> (sell order más bajo).</li>
            <li><strong>Venta máxima</strong>: precio al que puedes <em>vender al instante</em> (buy order más alto).</li>
            <li><strong>Spread</strong>: diferencia entre ambos en la misma ciudad.</li>
          </ul>
          <p>
            La banda superior muestra la <strong>mejor arbitraje</strong>: dónde comprar barato y dónde vender caro.
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-success mr-1" />
            verde = datos frescos (&lt;2h),{" "}
            <span className="inline-block h-2 w-2 rounded-full bg-warning mx-1" />
            amarillo = 2-12h,{" "}
            <span className="inline-block h-2 w-2 rounded-full bg-danger mx-1" />
            rojo = +12h.
          </p>
        </TutorialModal>
      </header>

      {/* Item picker + filtros */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-0 md:flex-row">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2 lg:col-span-2">
                <Label>Ítem</Label>
                <Popover open={openPicker} onOpenChange={setOpenPicker}>
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
                                  setOpenPicker(false);
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
            </div>

            <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
              <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Actualizar
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Resumen arbitraje */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<ArrowDownCircle className="h-5 w-5 text-success" />}
          title="Compra más barata"
          city={bestBuy?.city}
          price={bestBuy?.sell}
          date={bestBuy?.sellDate}
          tone="success"
        />
        <SummaryCard
          icon={<ArrowUpCircle className="h-5 w-5 text-primary" />}
          title="Venta más alta"
          city={bestSell?.city}
          price={bestSell?.buy}
          date={bestSell?.buyDate}
          tone="primary"
        />
        <Card className={cn("border-2", spread > 0 ? "border-success/50" : "border-border")}>
          <CardContent className="flex h-full flex-col justify-center gap-1 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Arbitraje
            </div>
            {spread > 0 ? (
              <>
                <div className="text-xl font-bold text-success">
                  +{formatSilver(spread)} <span className="text-xs font-medium text-muted-foreground">silver</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Comprar en <strong>{bestBuy?.city}</strong> · Vender en{" "}
                  <strong>{bestSell?.city}</strong> · <span className="text-success font-semibold">{spreadPct.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Sin spread positivo entre mercados.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="border-b border-border bg-danger/10 px-4 py-2 text-sm text-danger">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <Th sorted={sortKey === "city"} dir={sortDir} onClick={() => toggleSort("city")}>
                  Ubicación
                </Th>
                <Th
                  align="right"
                  sorted={sortKey === "sell"}
                  dir={sortDir}
                  onClick={() => toggleSort("sell")}
                >
                  Compra mínima
                </Th>
                <Th
                  align="right"
                  sorted={sortKey === "buy"}
                  dir={sortDir}
                  onClick={() => toggleSort("buy")}
                >
                  Venta máxima
                </Th>
                <Th
                  align="right"
                  sorted={sortKey === "spread"}
                  dir={sortDir}
                  onClick={() => toggleSort("spread")}
                >
                  Spread local
                </Th>
                <Th
                  align="right"
                  sorted={sortKey === "updated"}
                  dir={sortDir}
                  onClick={() => toggleSort("updated")}
                >
                  Actualizado
                </Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !rows.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Cargando precios…
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((r) => {
                  const spreadLocal = r.buy && r.sell ? r.buy - r.sell : 0;
                  const fresh = freshness(r.sellDate ?? r.buyDate);
                  const isBestBuy = bestBuy?.city === r.city && r.sell === bestBuy.sell;
                  const isBestSell = bestSell?.city === r.city && r.buy === bestSell.buy;
                  return (
                    <TableRow key={r.city}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{r.city}</span>
                          {r.city === "Black Market" && (
                            <Badge variant="outline" className="border-warning/50 text-warning text-[10px]">
                              BM
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          isBestBuy && "text-success font-semibold",
                        )}
                      >
                        {r.sell > 0 ? formatSilver(r.sell) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          isBestSell && "text-primary font-semibold",
                        )}
                      >
                        {r.buy > 0 ? formatSilver(r.buy) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          spreadLocal > 0 ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {spreadLocal > 0 ? `+${formatSilver(spreadLocal)}` : "—"}
                      </TableCell>
                      <TableCell className={cn("text-right text-xs", fresh.tone)}>
                        {fresh.label}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        Datos cortesía de la API comunitaria <code>albion-online-data.com</code>.
        Los precios dependen de los datos enviados por jugadores con el cliente
        de datos abierto.
      </p>
    </div>
  );
}

function Th({
  children,
  align = "left",
  sorted,
  dir,
  onClick,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  sorted?: boolean;
  dir?: SortDir;
  onClick?: () => void;
}) {
  return (
    <TableHead
      onClick={onClick}
      className={cn(
        "cursor-pointer select-none text-xs uppercase tracking-wide",
        align === "right" && "text-right",
        sorted && "text-foreground",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted && <span className="text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </TableHead>
  );
}

function SummaryCard({
  icon,
  title,
  city,
  price,
  date,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  city?: string;
  price?: number;
  date?: string;
  tone: "success" | "primary";
}) {
  const fresh = freshness(date);
  return (
    <Card
      className={cn(
        "border-2",
        tone === "success" ? "border-success/30" : "border-primary/30",
      )}
    >
      <CardContent className="flex h-full flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon} {title}
        </div>
        {price && price > 0 ? (
          <>
            <div className="text-xl font-bold tabular-nums">
              {formatSilver(price)}{" "}
              <span className="text-xs font-medium text-muted-foreground">silver</span>
            </div>
            <div className="text-xs text-muted-foreground">
              en <strong>{city}</strong> ·{" "}
              <span className={fresh.tone}>{fresh.label}</span>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Sin datos disponibles.</div>
        )}
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
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-md bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  );
}
