import { Check, X } from "lucide-react";
import { checkPassword } from "@/lib/password";
import { cn } from "@/lib/utils";

export function PasswordStrength({ value }: { value: string }) {
  const checks = checkPassword(value);
  const passed = checks.filter((c) => c.ok).length;
  const pct = (passed / checks.length) * 100;
  const color =
    passed <= 2 ? "bg-danger" : passed <= 4 ? "bg-warning" : "bg-success";

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-1 text-[11px]">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "flex items-center gap-1.5",
              c.ok ? "text-success" : "text-muted-foreground",
            )}
          >
            {c.ok ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3 opacity-60" />
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
