/**
 * Utilitários para monitoramento e gerenciamento de LocalStorage
 * Sprint 4 - Task 4.1: Monitoramento de LocalStorage
 */

const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (margem de segurança de 1MB)
const WARNING_THRESHOLD = 3 * 1024 * 1024; // 3MB (aviso preventivo)

/**
 * Calcula o tamanho total usado no LocalStorage
 * @returns Tamanho em bytes
 */
export function calculateStorageSize(): number {
  let total = 0;

  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const value = localStorage[key];
      // Conta key + value (ambos são strings)
      total += key.length + value.length;
    }
  }

  return total;
}

/**
 * Formata bytes para MB legível
 */
export function formatStorageSize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2);
}

/**
 * Verifica quota do LocalStorage e limpa se necessário
 * Chamado automaticamente a cada 1 minuto
 */
export function checkStorageQuota(): {
  used: number;
  usedMB: string;
  percentage: number;
  shouldClear: boolean;
  shouldWarn: boolean;
} {
  const used = calculateStorageSize();
  const usedMB = formatStorageSize(used);
  const percentage = (used / (5 * 1024 * 1024)) * 100; // % de 5MB
  const shouldClear = used > MAX_STORAGE_SIZE;
  const shouldWarn = used > WARNING_THRESHOLD && !shouldClear;

  return {
    used,
    usedMB,
    percentage,
    shouldClear,
    shouldWarn,
  };
}

/**
 * Limpa o LocalStorage mantendo apenas dados essenciais
 * @param keepKeys - Array de keys para manter (ex: auth session)
 */
export function clearStorageExcept(keepKeys: string[] = []): void {
  // Salvar valores das keys que devem ser mantidas
  const savedValues: Record<string, string> = {};

  keepKeys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      savedValues[key] = value;
    }
  });

  // Limpar tudo
  localStorage.clear();

  // Restaurar valores salvos
  Object.entries(savedValues).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}

/**
 * Lista as keys do LocalStorage ordenadas por tamanho
 * Útil para debug e identificar o que está ocupando espaço
 */
export function getStorageStats(): Array<{
  key: string;
  size: number;
  sizeMB: string;
}> {
  const stats: Array<{ key: string; size: number; sizeMB: string }> = [];

  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const value = localStorage[key];
      const size = key.length + value.length;
      stats.push({
        key,
        size,
        sizeMB: formatStorageSize(size),
      });
    }
  }

  // Ordenar por tamanho (maior primeiro)
  return stats.sort((a, b) => b.size - a.size);
}
