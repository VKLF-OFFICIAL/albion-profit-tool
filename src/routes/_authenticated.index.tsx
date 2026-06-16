import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Hammer, Coins, ArrowRight, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Dashboard · Albion M&C" }] }),
  component: DashboardPage,
});

const tools = [
  {
    title: "Calculadora de Transportes",
    desc: "Detecta flips rentables entre ciudades y el Mercado Negro con cálculo automático de impuestos y ROI.",
    url: "/transport",
    icon: TrendingUp,
    tag: "Operativo",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    title: "Asistente de Refino",
    desc: "Calcula coste efectivo y beneficio neto por lote con Foco, Premium y tasa de retorno.",
    url: "/refining",
    icon: Hammer,
    tag: "Fase 2",
    accent: "from-amber-500/20 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    title: "Oro & Cartera",
    desc: "Registra tus compras/ventas de oro, P/L histórico y recibe recomendaciones dinámicas.",
    url: "/gold",
    icon: Coins,
    tag: "Fase 2",
    accent: "from-yellow-500/20 via-yellow-500/5 to-transparent",
    iconBg: "bg-yellow-500/15 text-yellow-400",
  },
] as const;

function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Panel principal
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Albion Market &amp; Craft Companion</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Selecciona una herramienta para abrirla. Cada módulo está optimizado para el servidor
          Americas y consulta datos en tiempo real desde la API oficial.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.url} to={t.url} className="group focus:outline-none">
            <Card className="relative h-full overflow-hidden border-border/60 bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <CardHeader className="relative flex flex-row items-start justify-between gap-3 pb-3">
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${t.iconBg}`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {t.tag}
                </Badge>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {t.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{t.desc}</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                  Abrir herramienta
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
