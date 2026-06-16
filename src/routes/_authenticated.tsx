import { createFileRoute, Outlet, redirect, useRouterState, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isDashboard = pathname === "/dashboard";

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    window.location.href = "/auth";
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
        {isDashboard ? (
          <div className="w-9" />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/dashboard" })}
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            A
          </div>
          <span className="text-sm font-semibold tracking-tight">Albion M&amp;C</span>
        </Link>
        <div className="flex-1" />
        {!isDashboard && (
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })} aria-label="Inicio">
            <Home className="h-5 w-5" />
          </Button>
        )}
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
