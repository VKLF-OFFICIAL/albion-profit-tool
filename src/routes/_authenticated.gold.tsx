import { createFileRoute } from "@tanstack/react-router";
import { Coins, LineChart as LineChartIcon, Plus, Sparkles, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TutorialModal } from "@/components/tutorial-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/gold")({
  head: () => ({ meta: [{ title: "Oro & Cartera · Albion M&C" }] }),
  component: GoldPage,
});

function GoldPage() {
  // En Fase 2 se sustituye por las transacciones reales del usuario.
  const hasTransactions = false;

  // Línea de ejemplo (difuminada) para que el panel no se vea roto.
  const sampleData = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        t: i,
        v: 4200 + Math.sin(i / 2.2) * 180 + i * 12,
      })),
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" /> Inversión & Gráfica de Oro
          </h1>
          <p className="text-sm text-muted-foreground">
            Historial de transacciones, P/L y recomendación dinámica.
          </p>
        </div>
        <TutorialModal title="Cómo usar Oro & Cartera">
          <p>
            Añade tus compras y ventas de oro para ver tu precio medio, valor actual y
            P/L. La gráfica muestra la evolución de los últimos días y un banner te
            recomienda si conviene comprar o vender según tu coste medio.
          </p>
        </TutorialModal>
      </header>

      {hasTransactions ? null : (
        <Card className="overflow-hidden">
          <div className="relative">
            {/* Gráfica de ejemplo difuminada */}
            <div className="h-56 w-full opacity-30 blur-[2px] pointer-events-none select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.16 80)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="oklch(0.78 0.16 80)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
                  <Tooltip content={() => null} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="oklch(0.78 0.16 80)"
                    strokeWidth={2}
                    fill="url(#goldFade)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Empty state superpuesto */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/40 via-background/70 to-background px-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary shadow-inner">
                <LineChartIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Aún no tienes transacciones de oro</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Registra tu primera compra o venta para empezar a calcular tu precio
                  medio, P/L y recibir recomendaciones dinámicas.
                </p>
              </div>
              <Button size="sm" className="gap-2" disabled>
                <Plus className="h-4 w-4" />
                Añadir transacción (próximamente)
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Precio medio"
          value="—"
          hint="Calculado con tus transacciones"
        />
        <InfoCard
          icon={<Coins className="h-4 w-4" />}
          label="Valor actual"
          value="—"
          hint="Última lectura API Albion (oro)"
        />
        <InfoCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Recomendación"
          value="Sin datos"
          hint="Aparecerá tras la primera transacción"
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
