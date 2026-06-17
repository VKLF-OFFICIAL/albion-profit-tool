import { Link } from "@tanstack/react-router";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/use-favorites";
import { ITEM_BASES, QUALITIES, buildItemId, itemImageUrl } from "@/lib/albion-items";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FavoritesPanel() {
  const { items, loading, toggle } = useFavorites();

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Star className="h-4 w-4 fill-warning text-warning" /> Ítems Favoritos
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-40 shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Star className="h-4 w-4 fill-warning text-warning" /> Ítems Favoritos
        </h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((f) => {
          const base = ITEM_BASES.find((i) => i.base === f.base_id);
          const itemId = buildItemId(f.base_id, f.tier, f.enchant);
          const qLabel = QUALITIES.find((q) => q.value === f.quality)?.label ?? "";
          return (
            <div
              key={f.id}
              className={cn(
                "group relative shrink-0 snap-start",
                "w-40 rounded-xl border border-border bg-card transition-all",
                "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
              )}
            >
              <Link
                to="/prices"
                search={{
                  base: f.base_id,
                  tier: f.tier,
                  enchant: f.enchant,
                  quality: f.quality,
                }}
                className="flex flex-col items-center gap-1 p-3"
              >
                <div className="grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-muted/60 to-muted/20">
                  <img
                    src={itemImageUrl(itemId, f.quality, 64)}
                    alt={base?.name ?? itemId}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div className="w-full truncate text-center text-xs font-semibold leading-tight">
                  {base?.name ?? f.base_id}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="rounded bg-primary/10 px-1.5 font-mono text-primary">
                    T{f.tier}.{f.enchant}
                  </span>
                  <span className="truncate">{qLabel}</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await toggle({
                      base_id: f.base_id,
                      tier: f.tier,
                      enchant: f.enchant,
                      quality: f.quality,
                    });
                    toast.success("Eliminado de favoritos");
                  } catch {
                    toast.error("No se pudo eliminar");
                  }
                }}
                aria-label="Quitar de favoritos"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
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
