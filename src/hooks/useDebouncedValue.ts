import { useEffect, useState } from "react";

/**
 * Hook para debounce de valores
 * Útil para inputs de busca que disparam queries no banco
 *
 * @param value - Valor a ser debounced
 * @param delay - Delay em ms (padrão: 300ms)
 * @returns Valor debounced
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * // Usar debouncedSearch na query
 * const { data } = useQuery({
 *   queryKey: ["students", debouncedSearch],
 *   queryFn: () => fetchStudents(debouncedSearch)
 * });
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Criar timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar timer se o valor mudar antes do delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
