import { createFileRoute } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { TutorialModal } from "@/components/tutorial-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/gold")({
  head: () => ({ meta: [{ title: "Oro & Cartera · Albion M&C" }] }),
  component: GoldPage,
});

function GoldPage() {
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
            <strong>Próximamente (Fase 2).</strong> Incluirá tabla persistente en Lovable Cloud
            con tus compras/ventas de oro, tarjetas con precio medio, valor actual y P/L,
            gráfica Recharts con filtros 24h / 1 semana / 1 mes, marcadores de máximo y mínimo,
            y un banner que recomienda comprar o vender oro según tu historial.
          </p>
        </TutorialModal>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Llegando en la siguiente fase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Construyo esta herramienta a continuación con base de datos persistente vinculada a tu
          usuario.
        </CardContent>
      </Card>
    </div>
  );
}
