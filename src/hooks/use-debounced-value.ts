import { useEffect, useState } from "react";

/** Devuelve `value` retardado `delay` ms. Útil para evitar peticiones en cada tecla. */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
