import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COL as USER_COL } from "@/components/users/UsersTableRow.constants";

export function UsersTableHeader() {
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
            width: USER_COL.USUARIO,
            minWidth: USER_COL.USUARIO,
            boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
          }}
        >
          Usuário
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{ width: USER_COL.PRIVILEGIO, minWidth: USER_COL.PRIVILEGIO }}
        >
          Privilégio
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell"
          style={{ width: USER_COL.VINCULO, minWidth: USER_COL.VINCULO }}
        >
          Vínculo
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden md:table-cell"
          style={{ width: USER_COL.CADASTRO, minWidth: USER_COL.CADASTRO }}
        >
          Cadastro
        </TableHead>
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{
            width: USER_COL.PLACEHOLDER,
            minWidth: USER_COL.PLACEHOLDER,
          }}
          aria-label="Placeholder"
        />
        <TableHead
          className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
          style={{ width: USER_COL.ACOES, minWidth: USER_COL.ACOES }}
        >
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
