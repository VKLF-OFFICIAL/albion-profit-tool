import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { FavoritesPanel } from "@/components/favorites-panel";
import heroAdventurer from "@/assets/hero-adventurer.png";
import iconPrices from "@/assets/icon-prices.png";
import iconRefining from "@/assets/icon-refining.png";
import iconCrafting from "@/assets/icon-crafting.png";
import iconTransport from "@/assets/icon-transport.png";
import iconGold from "@/assets/icon-gold.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Inicio · Albion M&C" }] }),
  component: DashboardPage,
});

interface Section {
  to: string;
  title: string;
  description: string;
  icon: string;
}

const sections: Section[] = [
  {
    to: "/prices",
    title: "Comparador de Precios",
    description:
      "Compara precios entre mercados, optimiza ganancias y consigue plata extra.",
    icon: iconPrices,
  },
  {
    to: "/refining",
    title: "Asistente de Refino",
    description: "Calcula el profit de refinar recursos con o sin foco.",
    icon: iconRefining,
  },
  {
    to: "/crafting",
    title: "Crafteo",
    description:
      "Calcula recursos, artefactos y ganancia neta al craftear armas, armaduras y armas secundarias.",
    icon: iconCrafting,
  },
  {
    to: "/transport",
    title: "Calculadora de Transportes",
    description:
      "Encuentra las mejores rutas ciudad → Mercado Negro y maximiza tu ROI.",
    icon: iconTransport,
  },
  {
    to: "/gold",
    title: "Oro & Cartera",
    description:
      "Registra tus compras y ventas, visualiza el historial y descubre cuándo es rentable operar.",
    icon: iconGold,
  },
];

function DashboardPage() {
  const { username } = useProfile();
  const name = username || "Aventurero";


  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      {/* Welcome banner */}
      <div className="relative mx-auto w-fit max-w-full">
        <div className="rounded-full border border-primary/40 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 px-6 py-3 shadow-lg shadow-primary/10 backdrop-blur">
          <p className="text-center text-sm sm:text-base">
            Bienvenido de vuelta,{" "}
            <span className="font-bold text-primary">{name}!</span>
          </p>
        </div>
      </div>

      {/* Hero character */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <img
              src={heroAdventurer}
              alt="Aventurero de Albion"
              width={320}
              height={320}
              className="h-64 w-64 sm:h-80 sm:w-80 object-contain drop-shadow-2xl"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* Sections */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">
            Secciones de la app
          </h2>
        </div>

        <div className="grid gap-4">
          {sections.map((s) => (
            <Link
              key={s.title}
              to={s.to}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 sm:p-5"
            >
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-muted/60 to-muted/20 sm:h-24 sm:w-24">
                <img
                  src={s.icon}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  className="h-full w-full object-contain p-1 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold leading-tight text-primary sm:text-xl">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
