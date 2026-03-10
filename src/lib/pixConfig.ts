/**
 * Chave PIX para exibição ao aluno (copia e cola / QR).
 * Configure VITE_PIX_KEY nas variáveis de ambiente do build para ativar.
 * Fluxo atual: aluno paga, envia comprovante ao professor, que altera o status na plataforma.
 */
export function getPixKey(): string | null {
  const key = import.meta.env.VITE_PIX_KEY as string | undefined;
  if (typeof key !== "string" || !key.trim()) return null;
  return key.trim();
}
