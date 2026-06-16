import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  RefreshCw,
  Search,
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
import { cn } from "@/lib/utils";

import {
  ITEM_BASES,
  QUALITIES,
  CITIES,
  BLACK_MARKET,
  buildItemId,
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

function TransportPage() {
  const [baseId, setBaseId] = useState<string>("BAG");
  const [tier, setTier] = useState<number>(4);
  const [enchant, setEnchant] = useState<number>(0);
  const [quality, setQuality] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(100);
  const [premium, setPremium] = useState<boolean>(true);

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openItemPicker, setOpenItemPicker] = useState(false);

  const itemId = useMemo(() => buildItemId(baseId, tier, enchant), [baseId, tier, enchant]);

  // Fetch automático
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPrices(itemId, quality)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [itemId, quality]);

  // Precio máximo de compra del Black Market para este ítem
  const blackMarket = rows.find((r) => r.city === BLACK_MARKET);
  const bmBuyPrice = blackMarket?.buy_price_max ?? 0;

  // Comisión de mercado: 2.5% siempre (orden de venta) + tasa de venta 4% no-prem / 8% prem
  // Para una venta por ORDEN DE VENTA: 2.5% (setup fee) + 4% (sales tax) si premium, 8% si no.
  // Nota: Sales tax sin premium = 8%, con premium = 4%.
  const salesTaxRate = premium ? 0.04 : 0.08;
  const setupFeeRate = 0.025;
  const totalTaxRate = salesTaxRate + setupFeeRate;

  const calcRow = (r: PriceRow) => {
    const buy = r.sell_price_min; // compramos al menor precio de venta de la ciudad
    if (!buy || !bmBuyPrice) {
      return { buy, totalCost: 0, gross: 0, taxes: 0, net: 0, roi: 0 };
    }
    const totalCost = buy * quantity;
    const gross = bmBuyPrice * quantity;
    const taxes = gross * totalTaxRate;
    const net = gross - taxes - totalCost;
    const roi = totalCost > 0 ? (net / totalCost) * 100 : 0;
    return { buy, totalCost, gross, taxes, net, roi };
  };

  // Filas ordenadas por las ciudades reales (excluyendo BM)
  const cityRows = CITIES.map((city) => {
    const r = rows.find((x) => x.city === city);
    return { city, row: r };
  });

  const currentItem = ITEM_BASES.find((i) => i.base === baseId);

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
            <strong>1. Selecciona un ítem.</strong> Usa el buscador con autocompletado, escribe
            el ID interno (ej. <code>T4_BAG</code>) o elige uno de los ítems comunes del listado.
          </p>
          <p>
            <strong>2. Ajusta filtros.</strong> Tier (T4–T8), Encantamiento (.0–.4) y Calidad
            (Normal a Obra Maestra). La app refresca los precios automáticamente al cambiar
            cualquier filtro.
          </p>
          <p>
            <strong>3. Introduce la cantidad</strong> que piensas mover y activa el toggle de{" "}
            <em>Premium</em> si tu cuenta lo tiene (afecta al impuesto de venta).
          </p>
          <p>
            <strong>4. Lee la tabla.</strong> Cada fila es una ciudad. Calculamos coste, ingreso
            bruto del BM, impuestos (2.5% setup + 4%/8% venta), beneficio neto y ROI.
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-success mr-1" />
            <strong>Verde</strong>: ROI &gt; 15%. {" "}
            <span className="inline-block h-2 w-2 rounded-full bg-warning mx-1" />
            <strong>Amarillo</strong>: ROI 0–15%. {" "}
            <span className="inline-block h-2 w-2 rounded-full bg-danger mx-1" />
            <strong>Rojo</strong>: pérdidas.
          </p>
          <p className="text-xs">
            Fuente de datos: <code>west.albion-online-data.com</code> (proyecto comunitario, los
            precios dependen de jugadores subiendo datos recientes).
          </p>
        </TutorialModal>
      </header>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
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
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {baseId}
                      </span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0" align="start">
                  <Command
                    filter={(value, search) =>
                      value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                    }
                  >
                    <CommandInput placeholder="Buscar por nombre o ID (ej. T4_BAG)..." />
                    <CommandList>
                      <CommandEmpty>Sin resultados.</CommandEmpty>
                      <CommandGroup>
                        {ITEM_BASES.map((it) => (
                          <CommandItem
                            key={it.base}
                            value={`${it.name} ${it.base}`}
                            onSelect={() => {
                              setBaseId(it.base);
                              setOpenItemPicker(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                baseId === it.base ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col leading-tight flex-1 min-w-0">
                              <span className="truncate">{it.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground truncate">
                                {it.base}
                              </span>
                            </div>
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              {it.category}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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

            <div className="space-y-2">
              <Label>Calidad</Label>
              <Select value={String(quality)} onValueChange={(v) => setQuality(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUALITIES.map((q) => (
                    <SelectItem key={q.value} value={String(q.value)}>
                      {q.value}. {q.label}
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
            <div className="flex items-center gap-2">
              <Switch id="premium" checked={premium} onCheckedChange={setPremium} />
              <Label htmlFor="premium" className="cursor-pointer">
                Premium activo (impuesto venta 4% vs 8%)
              </Label>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">{itemId}</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Black Market info */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Mercado Negro compra (máx)"
          value={formatSilver(bmBuyPrice)}
          hint={blackMarket ? `Actualizado ${timeAgo(blackMarket.buy_price_max_date)}` : "Sin datos"}
          highlight
        />
        <StatCard
          label="Impuesto efectivo de venta"
          value={`${(totalTaxRate * 100).toFixed(1)}%`}
          hint={`Setup 2.5% + Venta ${(salesTaxRate * 100).toFixed(0)}% (${premium ? "Premium" : "No Premium"})`}
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
                    <TableHead className="text-right">Compra min (ciudad)</TableHead>
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
                    const roi = c?.roi ?? 0;
                    const tone =
                      !c || !c.buy
                        ? "muted"
                        : roi > 15
                          ? "success"
                          : roi > 0
                            ? "warning"
                            : "danger";
                    return (
                      <TableRow
                        key={city}
                        className={cn(
                          tone === "success" && "bg-success/5 hover:bg-success/10",
                          tone === "warning" && "bg-warning/5 hover:bg-warning/10",
                          tone === "danger" && "bg-danger/5 hover:bg-danger/10",
                        )}
                      >
                        <TableCell className="font-medium">{city}</TableCell>
                        <TableCell className="text-right">
                          {c?.buy ? formatSilver(c.buy) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {timeAgo(row?.sell_price_min_date)}
                        </TableCell>
                        <TableCell className="text-right">{c?.buy ? formatSilver(c.totalCost) : "—"}</TableCell>
                        <TableCell className="text-right">{c?.buy ? formatSilver(c.gross) : "—"}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {c?.buy ? formatSilver(c.taxes) : "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            tone === "success" && "text-success",
                            tone === "danger" && "text-danger",
                          )}
                        >
                          {c?.buy ? formatSilver(c.net) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {c?.buy ? (
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
                            "—"
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
        Datos cortesía del proyecto comunitario Albion Online Data (servidor Americas). Los precios
        se basan en lo que los jugadores suben con el cliente de datos; ítems poco comerciados
        pueden tener información desactualizada.
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
    <Card className={cn(highlight && "border-primary/40 shadow-[0_0_0_1px] shadow-primary/10")}>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={cn("mt-1 text-2xl font-bold tabular", highlight && "text-primary")}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
