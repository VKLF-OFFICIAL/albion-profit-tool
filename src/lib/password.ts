export interface PasswordCheck {
  label: string;
  ok: boolean;
}

export function checkPassword(pwd: string): PasswordCheck[] {
  return [
    { label: "Al menos 8 caracteres", ok: pwd.length >= 8 },
    { label: "Una letra minúscula (a-z)", ok: /[a-z]/.test(pwd) },
    { label: "Una letra mayúscula (A-Z)", ok: /[A-Z]/.test(pwd) },
    { label: "Un número (0-9)", ok: /\d/.test(pwd) },
    {
      label: "Un carácter especial (!@#$…)",
      ok: /[^A-Za-z0-9]/.test(pwd),
    },
  ];
}

export function isPasswordStrong(pwd: string): boolean {
  return checkPassword(pwd).every((c) => c.ok);
}

export const PASSWORD_REQUIREMENT_TEXT =
  "Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.";
