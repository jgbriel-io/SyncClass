/**
 * Padrão de colunas para tabelas (Aulas, Atividades, Financeiro).
 * Use estes nomes para manter consistência entre as abas.
 *
 * - Grande: nome, título da aula, informações (textos longos)
 * - Média: textos curtos, badges, descrição
 * - Pequena: valor, nota, data numérica, ações (compacto)
 */

const baseTh =
  "text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2";
const baseTd =
  "px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2";

/** Cabeçalho: coluna grande (ex.: Aluno, Título da aula, Informações) */
export const tableThLarge = `${baseTh} text-left min-w-[200px]`;

/** Cabeçalho: coluna média (ex.: Data, Duração, Status, Descrição) */
export const tableThMedium = `${baseTh} text-left`;

/** Cabeçalho: coluna pequena (ex.: Nota, Valor, Data) */
export const tableThSmall = `${baseTh} text-left whitespace-nowrap`;

/** Cabeçalho: coluna pequena alinhada à direita (ex.: Ações) */
export const tableThSmallRight = `${baseTh} text-right whitespace-nowrap`;

/** Célula: coluna grande */
export const tableTdLarge = `${baseTd} min-w-0`;

/** Célula: coluna média */
export const tableTdMedium = baseTd;

/** Célula: coluna pequena */
export const tableTdSmall = `${baseTd} whitespace-nowrap`;

/** Célula: coluna de ações (container dos botões) */
export const tableTdActions = `${baseTd} text-right`;
