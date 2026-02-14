/**
 * Skeleton Loaders para Tabelas
 * 
 * Respeita tokens de tamanho de coluna (XL, L, M, S, XS)
 * Evita layout shift durante carregamento
 */

import { Skeleton } from "@/components/ui/skeleton";
import { CELL_BASE, STICKY_CELL, STICKY_SHADOW, getXLColumnClasses } from "@/lib/design-tokens/table-columns";

interface TableSkeletonProps {
  rows?: number;
  columns: Array<{
    width: string;
    minWidth?: string;
    sticky?: boolean;
    hasAvatar?: boolean;
  }>;
}

export function TableSkeleton({ rows = 5, columns }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b">
          {columns.map((col, colIndex) => (
            <td
              key={colIndex}
              className={`${CELL_BASE} ${col.sticky ? `${STICKY_CELL} ${getXLColumnClasses()}` : ''}`}
              style={{
                width: col.width,
                minWidth: col.minWidth || col.width,
                ...(col.sticky ? STICKY_SHADOW : {}),
              }}
            >
              {col.hasAvatar ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-[60%]" />
                    <Skeleton className="h-2 w-[40%]" />
                  </div>
                </div>
              ) : (
                <Skeleton className="h-3 w-[80%]" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Skeleton específico para StudentsTable
 */
export function StudentsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '1%', minWidth: '80px' }, // Status
        { width: '25%', minWidth: '200px', sticky: true, hasAvatar: true }, // Aluno
        { width: '15%', minWidth: '120px' }, // Professor
        { width: '10%', minWidth: '100px' }, // Valor/Hora
        { width: '10%', minWidth: '100px' }, // Aulas/Semana
        { width: '10%', minWidth: '100px' }, // Total Mensal
        { width: '8%', minWidth: '80px' }, // Dia Pagto
        { width: '10%', minWidth: '100px' }, // Financeiro
        { width: '12%', minWidth: '120px' }, // Última Aula
        { width: '10%', minWidth: '100px' }, // Ações
      ]}
    />
  );
}

/**
 * Skeleton específico para FinancialTable
 */
export function FinancialTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '25%', minWidth: '200px', sticky: true, hasAvatar: true }, // Aluno
        { width: '30%', minWidth: '250px' }, // Aula Vinculada
        { width: '10%', minWidth: '100px' }, // Valor
        { width: '10%', minWidth: '100px' }, // Método
        { width: '10%', minWidth: '100px' }, // Vencimento
        { width: '10%', minWidth: '100px' }, // Status
        { width: '10%', minWidth: '100px' }, // Avaliar
        { width: '5%', minWidth: '80px' }, // Ações
      ]}
    />
  );
}

/**
 * Skeleton específico para ClassesTable
 */
export function ClassesTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '1%', minWidth: '80px' }, // Status
        { width: '25%', minWidth: '200px', sticky: true, hasAvatar: true }, // Aluno
        { width: '20%', minWidth: '180px' }, // Informações
        { width: '12%', minWidth: '120px' }, // Data
        { width: '10%', minWidth: '100px' }, // Duração
        { width: '10%', minWidth: '100px' }, // Nota
        { width: '10%', minWidth: '100px' }, // Financeiro
        { width: '10%', minWidth: '100px' }, // Avaliar
        { width: '5%', minWidth: '80px' }, // Ações
      ]}
    />
  );
}

/**
 * Skeleton específico para ActivitiesTable
 */
export function ActivitiesTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '1%', minWidth: '80px' }, // Status
        { width: '25%', minWidth: '200px', sticky: true, hasAvatar: true }, // Aluno
        { width: '20%', minWidth: '180px' }, // Título
        { width: '15%', minWidth: '150px' }, // Arquivo
        { width: '10%', minWidth: '100px' }, // Prazo
        { width: '10%', minWidth: '100px' }, // Entregue em
        { width: '10%', minWidth: '100px' }, // Avaliar
        { width: '5%', minWidth: '80px' }, // Ações
      ]}
    />
  );
}

/**
 * Skeleton específico para UsersTable
 */
export function UsersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '1%', minWidth: '80px' }, // Status
        { width: '30%', minWidth: '250px', sticky: true, hasAvatar: true }, // Usuário
        { width: '15%', minWidth: '120px' }, // Tipo
        { width: '20%', minWidth: '180px' }, // Email
        { width: '15%', minWidth: '120px' }, // Criado em
        { width: '10%', minWidth: '100px' }, // Ações
      ]}
    />
  );
}

/**
 * Skeleton específico para TeachersTable
 */
export function TeachersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '1%', minWidth: '80px' }, // Status
        { width: '30%', minWidth: '250px', sticky: true, hasAvatar: true }, // Professor
        { width: '20%', minWidth: '180px' }, // Email
        { width: '15%', minWidth: '120px' }, // Telefone
        { width: '15%', minWidth: '120px' }, // Alunos
        { width: '10%', minWidth: '100px' }, // Ações
      ]}
    />
  );
}

/**
 * Skeleton específico para OverviewTable
 */
export function OverviewTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableSkeleton
      rows={rows}
      columns={[
        { width: '1%', minWidth: '80px' }, // Status
        { width: '25%', minWidth: '200px', sticky: true, hasAvatar: true }, // Aluno
        { width: '15%', minWidth: '120px' }, // Professor
        { width: '12%', minWidth: '120px' }, // Próxima Aula
        { width: '10%', minWidth: '100px' }, // Aulas Mês
        { width: '10%', minWidth: '100px' }, // Presença
        { width: '10%', minWidth: '100px' }, // Financeiro
        { width: '10%', minWidth: '100px' }, // Última Aula
        { width: '7%', minWidth: '80px' }, // Ações
      ]}
    />
  );
}
