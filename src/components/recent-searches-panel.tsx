import { Link } from "@tanstack/react-router";
import { Clock, X } from "lucide-react";
import { useRecentSearches, type Tool } from "@/hooks/use-recent-searches";
import { ITEM_BASES, itemImageUrl } from "@/lib/albion-items";

const toolMeta: Record<Tool, { to: string; label: string; color: string }> = {
  prices: { to: "/prices", label: "Precios", color: "text-primary" },
  transport: { to: "/transport", label: "Transporte", color: "text-accent" },
  refining: { to: "/refining", label: "Refino", color: "text-warning" },
  crafting: { to: "/crafting", label: "Crafteo", color: "text-success" },
};

function buildItemId(base: string, tier: number, enchant: number): string {
  const id = `T${tier}_${base}`;
  return enchant > 0 ? `${id}@${enchant}` : id;
}

export function RecentSearchesPanel() {
  const { items, loading, remove } = useRecentSearches(12);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Últimas búsquedas
        </h2>
      </div>
      <div
        className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]"
        role="list"
      >
        {items.map((it) => {
          const meta = toolMeta[it.tool];
          const itemId = buildItemId(it.base_id, it.tier, it.enchant);
          const base = ITEM_BASES.find((b) => b.base === it.base_id);
          const name = base?.name ?? it.base_id;
          return (
            <div
              key={it.id}
              role="listitem"
              className="group relative snap-start shrink-0 w-[140px] sm:w-[160px]"
            >
              <Link
                to={meta.to}
                search={{
                  base: it.base_id,
                  tier: it.tier,
                  enchant: it.enchant,
                  quality: it.quality,
                }}
                className="flex h-full flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-muted/30">
                  <img
                    src={itemImageUrl(itemId, it.quality, 96)}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <p className="truncate text-[11px] font-medium leading-tight">
                    {name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    T{it.tier}
                    {it.enchant > 0 ? `.${it.enchant}` : ""} · Q{it.quality}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-semibold ${meta.color}`}>
                    {meta.label}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void remove(it.id)}
                aria-label="Eliminar búsqueda"
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
