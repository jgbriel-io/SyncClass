/**
 * Cópia síncrona com textarea + execCommand.
 * Funciona dentro de modais/dialogs onde navigator.clipboard pode não gravar.
 */
function copyWithExecCommand(text: string): boolean {
  if (!text || typeof document === "undefined") return false;
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.top = "0";
    el.setAttribute("readonly", "");
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copia texto para a área de transferência.
 * Tenta primeiro o caminho síncrono (execCommand) para funcionar em dialogs;
 * depois navigator.clipboard.writeText como reforço.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  const syncOk = copyWithExecCommand(text);
  if (syncOk) return true;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
