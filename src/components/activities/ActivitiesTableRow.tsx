
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableRow, TableCell } from "@/components/ui/table";
import {
  MoreHorizontal,
  Download,
  FileText,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ActivityWithRelations } from "@/hooks/useActivities";
import {
  getActivityDisplayStatus,
  formatActivityDueDate,
} from "@/hooks/useActivities";

interface ActivitiesTableRowProps {
  activity: ActivityWithRelations;
  isAdmin: boolean;
  onViewFile: (fileUrl: string) => void;
  onDownload: (fileUrl: string, fileName: string) => void;
  onEdit: (activity: ActivityWithRelations) => void;
  onDelete: (activity: ActivityWithRelations) => void;
  onViewDetail: (activity: ActivityWithRelations, correctionMode?: boolean) => void;
  onUpdateCorrection: (activity: ActivityWithRelations) => void;
}

export const COL = {
  ALUNO: 240,
  ATIVIDADE: 260,
  ARQUIVO: 140,
  PRAZO: 120,
  STATUS: 120,
  ENTREGUE_EM: 140,
  AVALIAR: 120,
  ACOES: 72,
} as const;

export const TABLE_MIN_W =
  COL.ALUNO + COL.ATIVIDADE + COL.ARQUIVO + COL.PRAZO + COL.STATUS + COL.ENTREGUE_EM + COL.AVALIAR + COL.ACOES;

const CELL_BASE = "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 align-middle text-left text-xs whitespace-nowrap";
const STICKY_CELL = "sticky left-0 z-20 bg-card group-hover:bg-muted transition-colors";
const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

export function ActivitiesTableRow({
  activity,
  isAdmin,
  onViewFile,
  onDownload,
  onEdit,
  onDelete,
  onViewDetail,
  onUpdateCorrection,
}: ActivitiesTableRowProps) {
  const lastUpdatedAt = activity.updated_at || activity.created_at;
  const displayStatus = getActivityDisplayStatus(activity);

  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      {/* Aluno sticky */}
      <TableCell className={`${CELL_BASE} ${STICKY_CELL}`} style={{ ...STICKY_SHADOW, width: COL.ALUNO, minWidth: COL.ALUNO }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {activity.students?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" title={activity.students?.name || "—"}>{activity.students?.name || "—"}</p>
            {isAdmin ? (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5">
                {activity.teachers?.name ?? "—"}
              </p>
            ) : lastUpdatedAt ? (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5">
                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}`}
              </p>
            ) : null}
          </div>
        </div>
      </TableCell>

      {/* Atividade */}
      <TableCell className={CELL_BASE} style={{ width: COL.ATIVIDADE, minWidth: COL.ATIVIDADE }}>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate" title={activity.title}>{activity.title}</p>
          {activity.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {activity.description}
            </p>
          )}
        </div>
      </TableCell>

      {/* Arquivo */}
      <TableCell className={cn(CELL_BASE, "hidden sm:table-cell")} style={{ width: COL.ARQUIVO, minWidth: COL.ARQUIVO }}>
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs truncate" title={activity.file_name}>
            {activity.file_name}
          </span>
        </div>
      </TableCell>

      {/* Prazo */}
      <TableCell className={cn(CELL_BASE, "hidden sm:table-cell")} style={{ width: COL.PRAZO, minWidth: COL.PRAZO }}>
        <span className="text-muted-foreground">{formatActivityDueDate(activity.due_date)}</span>
      </TableCell>

      {/* Status */}
      <TableCell className={CELL_BASE} style={{ width: COL.STATUS, minWidth: COL.STATUS }}>
        <StatusBadge variant={displayStatus.variant} className="whitespace-nowrap">
          {displayStatus.label}
        </StatusBadge>
      </TableCell>

      {/* Entregue em (data de entrega) */}
      <TableCell className={cn(CELL_BASE, "hidden sm:table-cell")} style={{ width: COL.ENTREGUE_EM, minWidth: COL.ENTREGUE_EM }}>
        <span className="text-muted-foreground">
          {activity.delivered_at ? format(new Date(activity.delivered_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
        </span>
      </TableCell>

      {/* Avaliar (Corrigir/Atualizar) */}
      <TableCell className={CELL_BASE} style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}>
        <div className="flex items-center justify-end">
          {activity.status === "enviada" ? (
            <Button size="sm" variant="outline" disabled className="h-8 w-[7rem] shrink-0 opacity-50 cursor-not-allowed">
              Aguardando
            </Button>
          ) : activity.status === "entregue" ? (
            <Button size="sm" className="h-8 w-[7rem] shrink-0 border-none bg-[#25D366] text-white hover:bg-[#1ebe57]" onClick={() => onViewDetail(activity, true)}>
              Corrigir
            </Button>
          ) : (
            <Button size="sm" className="h-8 w-[7rem] shrink-0 border-none bg-warning text-white font-semibold hover:bg-warning/90 shadow" onClick={() => onUpdateCorrection(activity)}>
              Atualizar
            </Button>
          )}
        </div>
      </TableCell>

      {/* Ações */}
      <TableCell className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetail(activity, false)} title="Ver detalhes">
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewFile(activity.file_url)} aria-label="Visualizar arquivo">
                <Eye className="h-4 w-4 mr-2" />
                Ver anexo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(activity.file_url, activity.file_name)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(activity)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar atividade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(activity)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
      <TableCell style={{ width: 'auto' }}></TableCell>
    </TableRow>
  );
}

