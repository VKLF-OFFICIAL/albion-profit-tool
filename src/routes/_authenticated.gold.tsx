import { createFileRoute } from "@tanstack/react-router";
import { Coins, Plus, Sparkles, TrendingUp } from "lucide-react";
import { TutorialModal } from "@/components/tutorial-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/gold")({
  head: () => ({ meta: [{ title: "Oro & Cartera · Albion M&C" }] }),
  component: GoldPage,
});

function GoldPage() {
  // Fase 2: aquí se cargarán las transacciones desde Lovable Cloud.
  const transactions: Array<{ id: string; price: number; ts: string }> = [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" /> Inversión &amp; Gráfica de Oro
          </h1>
          <p className="text-sm text-muted-foreground">
            Historial de transacciones, P/L y recomendación dinámica.
          </p>
        </div>
        <TutorialModal title="Cómo usar Oro & Cartera">
          <p>
            Registra cada compra/venta de oro con su precio en plata. El sistema calcula tu
            precio medio histórico y lo compara con el precio actual del oro para recomendarte
            si conviene comprar o vender.
          </p>
        </TutorialModal>
      </header>

      {transactions.length === 0 ? <EmptyState /> : null}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative grid place-items-center px-6 py-16 text-center">
        {/* Línea de tendencia difuminada de fondo */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="goldFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.16 75)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="oklch(0.78 0.16 75)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,160 C60,130 110,150 160,110 C220,60 280,140 340,100 C400,70 460,90 520,50 L600,30 L600,200 L0,200 Z"
            fill="url(#goldFade)"
          />
          <path
            d="M0,160 C60,130 110,150 160,110 C220,60 280,140 340,100 C400,70 460,90 520,50 L600,30"
            fill="none"
            stroke="oklch(0.78 0.16 75)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
        </svg>

        <div className="relative z-10 flex max-w-md flex-col items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Aún no hay transacciones registradas
            </h2>
            <p className="text-sm text-muted-foreground">
              Añade tu primera compra o venta de oro para ver aquí tu precio medio, P/L y la
              recomendación dinámica del mercado.
            </p>
          </div>
          <Button size="sm" className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            Añadir transacción
          </Button>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Disponible al activar la base de datos en la siguiente fase.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
