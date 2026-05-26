import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COL as TEACH_COL } from "@/components/teachers/TeachersTableRow.constants";

export function TeachersTableHeader() {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/50">
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{ width: "1%" }}
        >
          Status
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted"
          style={{
            width: TEACH_COL.NOME,
            minWidth: TEACH_COL.NOME,
            boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
          }}
        >
          Nome
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{ width: TEACH_COL.EMAIL, minWidth: TEACH_COL.EMAIL }}
        >
          Email
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{ width: TEACH_COL.TELEFONE, minWidth: TEACH_COL.TELEFONE }}
        >
          Telefone
        </TableHead>
        <TableHead
          className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{
            width: TEACH_COL.TOTAL_ALUNOS,
            minWidth: TEACH_COL.TOTAL_ALUNOS,
          }}
        >
          Total Alunos
        </TableHead>
        <TableHead
          className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{
            width: TEACH_COL.TOTAL_AULAS,
            minWidth: TEACH_COL.TOTAL_AULAS,
          }}
        >
          Total Aulas
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{
            width: TEACH_COL.VALOR_RECEBIDO,
            minWidth: TEACH_COL.VALOR_RECEBIDO,
          }}
        >
          Valor Recebido
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{
            width: TEACH_COL.PLACEHOLDER,
            minWidth: TEACH_COL.PLACEHOLDER,
          }}
          aria-label="Placeholder"
        />
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{ width: TEACH_COL.ACOES, minWidth: TEACH_COL.ACOES }}
        >
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
