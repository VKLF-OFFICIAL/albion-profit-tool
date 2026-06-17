import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { TutorialModal } from "@/components/tutorial-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/prices")({
  head: () => ({ meta: [{ title: "Comparador de Precios · Albion M&C" }] }),
  component: PricesPage,
});

function PricesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Comparador de Precios
          </h1>
          <p className="text-sm text-muted-foreground">
            Compara precios entre mercados de distintas ciudades.
          </p>
        </div>
        <TutorialModal title="Cómo usar el Comparador de Precios">
          <p>
            <strong>Próximamente (Fase 2).</strong> Esta sección incluirá comparación directa de precios entre ciudades sin necesidad de calcular transporte al Mercado Negro.
          </p>
        </TutorialModal>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Llegando en la siguiente fase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Estamos construyendo esta herramienta con soporte para filtrado avanzado por tier, calidad y encantamiento.
        </CardContent>
      </Card>
    </div>
  );
}
