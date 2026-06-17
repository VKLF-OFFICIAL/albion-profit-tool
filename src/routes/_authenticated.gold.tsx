import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoldPrices, formatSilver, type GoldPricePoint } from "@/lib/albion-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gold")({
  head: () => ({ meta: [{ title: "Oro & Cartera · Albion M&C" }] }),
  component: GoldPage,
});

interface GoldTx {
  id: string;
  tx_type: "buy" | "sell";
  amount_gold: number;
  price_silver: number;
  note: string | null;
  occurred_at: string;
}

function GoldPage() {
  const [txs, setTxs] = useState<GoldTx[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [goldHistory, setGoldHistory] = useState<GoldPricePoint[]>([]);
  const [loadingGold, setLoadingGold] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // Form
  const [txType, setTxType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<number>(100);
  const [price, setPrice] = useState<number>(4000);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Load txs
  useEffect(() => {
    let cancelled = false;
    setLoadingTxs(true);
    supabase
      .from("gold_transactions")
      .select("id, tx_type, amount_gold, price_silver, note, occurred_at")
      .order("occurred_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setTxs((data ?? []) as GoldTx[]);
        setLoadingTxs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  // Load gold price history
  useEffect(() => {
    let cancelled = false;
    setLoadingGold(true);
    fetchGoldPrices(96)
      .then((data) => !cancelled && setGoldHistory(data))
      .catch(() => !cancelled && setGoldHistory([]))
      .finally(() => !cancelled && setLoadingGold(false));
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const currentGoldPrice = useMemo(() => {
    if (goldHistory.length === 0) return 0;
    return goldHistory[goldHistory.length - 1]?.price ?? 0;
  }, [goldHistory]);

  const stats = useMemo(() => {
    let bought = 0,
      boughtCost = 0,
      sold = 0,
      soldRevenue = 0;
    for (const t of txs) {
      if (t.tx_type === "buy") {
        bought += t.amount_gold;
        boughtCost += t.amount_gold * t.price_silver;
      } else {
        sold += t.amount_gold;
        soldRevenue += t.amount_gold * t.price_silver;
      }
    }
    const netGold = bought - sold;
    const avgBuy = bought > 0 ? boughtCost / bought : 0;
    const portfolioValue = netGold * currentGoldPrice;
    // Coste base del oro que aún tienes
    const remainingCost = netGold * avgBuy;
    const realizedPL = soldRevenue - sold * avgBuy;
    const unrealizedPL = portfolioValue - remainingCost;
    const totalPL = realizedPL + unrealizedPL;
    const totalInvested = boughtCost;
    const plPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    return {
      bought,
      sold,
      netGold,
      avgBuy,
      portfolioValue,
      realizedPL,
      unrealizedPL,
      totalPL,
      plPct,
    };
  }, [txs, currentGoldPrice]);

  const recommendation = useMemo(() => {
    if (currentGoldPrice === 0 || stats.avgBuy === 0) {
      return { label: "Sin datos", tone: "default" as const, hint: "Registra alguna transacción" };
    }
    const diff = (currentGoldPrice - stats.avgBuy) / stats.avgBuy;
    if (diff <= -0.05) return { label: "Comprar", tone: "success" as const, hint: `${(diff * 100).toFixed(1)}% bajo tu precio medio` };
    if (diff >= 0.05) return { label: "Vender", tone: "warning" as const, hint: `${(diff * 100).toFixed(1)}% sobre tu precio medio` };
    return { label: "Esperar", tone: "default" as const, hint: `${(diff * 100).toFixed(1)}% vs tu precio medio` };
  }, [currentGoldPrice, stats.avgBuy]);

  const chartData = useMemo(
    () =>
      goldHistory.map((g) => ({
        t: new Date(g.timestamp + "Z").getTime(),
        v: g.price,
      })),
    [goldHistory],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0 || price <= 0) {
      toast.error("Cantidad y precio deben ser mayores que 0");
      return;
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      toast.error("Debes iniciar sesión");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("gold_transactions").insert({
      user_id: uid,
      tx_type: txType,
      amount_gold: amount,
      price_silver: price,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
      return;
    }
    toast.success(`${txType === "buy" ? "Compra" : "Venta"} registrada`);
    setNote("");
    setRefreshTick((x) => x + 1);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("gold_transactions").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Transacción eliminada");
    setRefreshTick((x) => x + 1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" /> Oro &amp; Cartera
          </h1>
          <p className="text-sm text-muted-foreground">
            Historial de transacciones, P/L y recomendación dinámica.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefreshTick((x) => x + 1)} disabled={loadingGold} className="gap-2">
            {loadingGold ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refrescar
          </Button>
          <TutorialModal title="Cómo usar Oro & Cartera">
            <p>
              Registra cada compra y venta de oro con su precio en plata. La app calcula tu
              precio medio ponderado, el valor actual de tu cartera y un P/L combinando
              ganancias realizadas y no realizadas. La gráfica muestra el precio real del oro
              en las últimas horas.
            </p>
          </TutorialModal>
        </div>
      </header>

      {/* Gráfica oro */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Precio del oro (últimas horas)
            <Badge variant="outline" className="ml-auto font-mono">
              {currentGoldPrice > 0 ? formatSilver(currentGoldPrice) : "—"} plata
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            {chartData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                {loadingGold ? "Cargando…" : "Sin datos"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.16 80)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.78 0.16 80)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="t"
                    tickFormatter={(v) => new Date(v).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted-foreground)"
                    minTickGap={40}
                  />
                  <YAxis domain={["dataMin - 50", "dataMax + 50"]} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" width={50} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                    labelFormatter={(v) => new Date(v).toLocaleString("es-ES")}
                    formatter={(v: number) => [formatSilver(v) + " 🪙", "Precio"]}
                  />
                  <Area type="monotone" dataKey="v" stroke="oklch(0.78 0.16 80)" strokeWidth={2} fill="url(#goldFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Coins className="h-4 w-4" />} label="Oro en cartera" value={stats.netGold.toLocaleString("es-ES")} hint={`Comprado ${stats.bought} · Vendido ${stats.sold}`} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Precio medio" value={stats.avgBuy > 0 ? formatSilver(stats.avgBuy) : "—"} hint="Plata por oro comprado" />
        <Stat icon={<Coins className="h-4 w-4" />} label="Valor actual" value={formatSilver(stats.portfolioValue)} hint={currentGoldPrice > 0 ? `Precio oro: ${formatSilver(currentGoldPrice)}` : "—"} />
        <Stat
          icon={stats.totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          label="P/L total"
          value={`${formatSilver(stats.totalPL)} (${stats.plPct.toFixed(1)}%)`}
          tone={stats.totalPL >= 0 ? "success" : "destructive"}
          hint={`Realizado ${formatSilver(stats.realizedPL)} · No real. ${formatSilver(stats.unrealizedPL)}`}
        />
      </div>

      {/* Recomendación */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <div className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            recommendation.tone === "success" && "bg-success/15 text-success",
            recommendation.tone === "warning" && "bg-warning/15 text-warning",
            recommendation.tone === "default" && "bg-muted text-muted-foreground",
          )}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Recomendación dinámica</div>
            <div className="text-xl font-bold">{recommendation.label}</div>
            <div className="text-xs text-muted-foreground">{recommendation.hint}</div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrar transacción</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={txType} onValueChange={(v) => setTxType(v as "buy" | "sell")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad de oro</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Precio (plata/oro)</Label>
              <Input type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Nota (opcional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ej. compra de evento" />
            </div>
            <div className="lg:col-span-5">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Añadir transacción
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTxs ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : txs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay transacciones. Añade tu primera compra para empezar a ver tu P/L.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Oro</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.occurred_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.tx_type === "buy" ? "default" : "secondary"}>
                        {t.tx_type === "buy" ? "Compra" : "Venta"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{t.amount_gold.toLocaleString("es-ES")}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatSilver(t.price_silver)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatSilver(t.amount_gold * t.price_silver)}</TableCell>
                    <TableCell className="text-xs">{t.note ?? ""}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "destructive";
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {icon}
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
