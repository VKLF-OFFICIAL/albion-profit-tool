import { createFileRoute } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { TutorialModal } from "@/components/tutorial-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/refining")({
  head: () => ({ meta: [{ title: "Refino · Albion M&C" }] }),
  component: RefiningPage,
});

function RefiningPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-6 w-6 text-primary" /> Asistente de Refino
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcula coste efectivo y beneficio neto por lote.
          </p>
        </div>
        <TutorialModal title="Cómo usar el Asistente de Refino">
          <p>
            <strong>Próximamente (Fase 2).</strong> Esta sección incluirá soporte para los 5
            recursos (Madera, Piedra, Mineral, Cuero, Tela) en todos los Tiers (T4–T8) y
            encantamientos (.0–.4), con toggles para Foco y Premium, tasa de devolución
            configurable y métricas como "Plata por punto de Foco".
          </p>
        </TutorialModal>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Llegando en la siguiente fase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Construyo esta herramienta a continuación con la fórmula del factor de retorno y los
          parámetros que pediste.
        </CardContent>
      </Card>
    </div>
  );
}
