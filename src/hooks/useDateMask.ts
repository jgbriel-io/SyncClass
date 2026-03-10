import { ChangeEvent, KeyboardEvent } from "react";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";

/**
 * Hook para máscara de data com preservação de posição do cursor
 * 
 * Características:
 * - Formata automaticamente para dd/mm/aaaa
 * - Preserva a posição do cursor durante edição
 * - Permite edição no meio da string
 * - Trata backspace em barras automaticamente
 * 
 * @example
 * const { handleChange, handleKeyDown } = useDateMask(setValue);
 * 
 * <Input
 *   value={birthDate || ""}
 *   onChange={handleChange}
 *   onKeyDown={handleKeyDown}
 *   maxLength={10}
 *   placeholder="dd/mm/aaaa"
 * />
 */
export function useDateMask(
  setValue: (value: string, options?: { shouldValidate?: boolean }) => void
) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const value = e.target.value;
    
    // Remove tudo que não é número
    const numbersOnly = value.replace(REGEX_PATTERNS.dateDigits, "");
    
    // Aplica a máscara
    let masked = "";
    if (numbersOnly.length > 0) {
      masked = numbersOnly.slice(0, 2);
      if (numbersOnly.length >= 3) {
        masked += "/" + numbersOnly.slice(2, 4);
      }
      if (numbersOnly.length >= 5) {
        masked += "/" + numbersOnly.slice(4, 8);
      }
    }
    
    // Calcula nova posição do cursor
    let newCursorPosition = cursorPosition;
    if (value.length < masked.length) {
      // Adicionou caractere
      newCursorPosition = cursorPosition;
      // Se adicionou uma barra, pula ela
      if (masked[cursorPosition - 1] === "/") {
        newCursorPosition = cursorPosition + 1;
      }
    } else if (value.length > masked.length) {
      // Removeu caractere
      newCursorPosition = cursorPosition;
    }
    
    setValue(masked, { shouldValidate: true });
    
    // Restaura posição do cursor após o React re-renderizar
    setTimeout(() => {
      if (input) {
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const value = input.value;
    
    // Se tentar deletar uma barra, deleta o número antes dela
    if (e.key === "Backspace" && cursorPosition > 0 && value[cursorPosition - 1] === "/") {
      e.preventDefault();
      const newValue = value.slice(0, cursorPosition - 2) + value.slice(cursorPosition);
      const numbersOnly = newValue.replace(REGEX_PATTERNS.dateDigits, "");
      let masked = "";
      if (numbersOnly.length > 0) {
        masked = numbersOnly.slice(0, 2);
        if (numbersOnly.length >= 3) {
          masked += "/" + numbersOnly.slice(2, 4);
        }
        if (numbersOnly.length >= 5) {
          masked += "/" + numbersOnly.slice(4, 8);
        }
      }
      setValue(masked, { shouldValidate: true });
      setTimeout(() => {
        input.setSelectionRange(cursorPosition - 2, cursorPosition - 2);
      }, 0);
    }
  };

  return { handleChange, handleKeyDown };
}
