import { createFileRoute } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { TutorialModal } from "@/components/tutorial-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/crafting")({
  head: () => ({ meta: [{ title: "Crafteo · Albion M&C" }] }),
  component: CraftingPage,
});

function CraftingPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-6 w-6 text-primary" /> Crafteo
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcula recursos, artefactos y ganancia neta al craftear equipamiento.
          </p>
        </div>
        <TutorialModal title="Cómo usar el Crafteo">
          <p>
            <strong>Próximamente (Fase 2).</strong> Esta sección incluirá calculadora de materiales, coste de artefactos y profit neto por item fabricado.
          </p>
        </TutorialModal>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Llegando en la siguiente fase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Estamos construyendo esta herramienta con soporte para recetas de todas las categorías y tiers.
        </CardContent>
      </Card>
    </div>
  );
}
