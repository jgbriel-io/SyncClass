import { common } from "@/content";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DotsThree as MoreHorizontal,
  Download,
  FileText,
  Trash as Trash2,
  Eye,
  Pencil,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ActivityWithRelations } from "@/hooks/useActivities";
import { escapeHtml } from "@/lib/utils/sanitize";
import {
  getActivityDisplayStatus,
  formatActivityDueDate,
} from "@/hooks/useActivities";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL, TABLE_MIN_W } from "./ActivitiesTableRow.constants";
import { activities as activitiesContent } from "@/content";

interface ActivitiesTableRowProps {
  activity: ActivityWithRelations;
  isAdmin: boolean;
  onViewFile: (fileUrl: string) => void;
  onDownload: (fileUrl: string, fileName: string) => void;
  onEdit: (activity: ActivityWithRelations) => void;
  onDelete: (activity: ActivityWithRelations) => void;
  onViewDetail: (
    activity: ActivityWithRelations,
    correctionMode?: boolean
  ) => void;
  onUpdateCorrection: (activity: ActivityWithRelations) => void;
}

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
    <tr className="group hover:bg-muted/30 transition-colors">
      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {activity.students?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate"
              title={activity.students?.name || "—"}
            >
              {activity.students?.name || "—"}
            </p>
            {isAdmin ? (
              <p
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate"
                title={activity.teachers?.name ?? "—"}
              >
                {activity.teachers?.name ?? "—"}
              </p>
            ) : lastUpdatedAt ? (
              <p
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate"
                title={`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              >
                {`Editado em ${format(
                  new Date(lastUpdatedAt),
                  "dd/MM/yyyy HH:mm",
                  {
                    locale: ptBR,
                  }
                )}`}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.ATIVIDADE, minWidth: COL.ATIVIDADE }}
      >
        <div className="min-w-0">
          <p
            className="text-xs font-medium text-foreground truncate"
            title={activity.title}
          >
            {escapeHtml(activity.title)}
          </p>
          {activity.description && (
            <p
              className="text-xs text-muted-foreground line-clamp-2 mt-0.5"
              title={activity.description}
            >
              {escapeHtml(activity.description)}
            </p>
          )}
        </div>
      </td>

      <td
        className={cn(CELL_BASE, "hidden sm:table-cell")}
        style={{ width: COL.ARQUIVO, minWidth: COL.ARQUIVO }}
      >
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs truncate" title={activity.file_name}>
            {activity.file_name}
          </span>
        </div>
      </td>

      <td
        className={cn(CELL_BASE, "hidden sm:table-cell tabular-nums")}
        style={{ width: COL.PRAZO, minWidth: COL.PRAZO }}
      >
        <span
          className="text-muted-foreground truncate block"
          title={formatActivityDueDate(activity.due_date)}
        >
          {formatActivityDueDate(activity.due_date)}
        </span>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.STATUS, minWidth: COL.STATUS }}
      >
        <StatusBadge
          variant={displayStatus.variant}
          className="whitespace-nowrap"
        >
          {displayStatus.label}
        </StatusBadge>
      </td>

      <td
        className={cn(CELL_BASE, "hidden sm:table-cell tabular-nums")}
        style={{ width: COL.ENTREGUE_EM, minWidth: COL.ENTREGUE_EM }}
      >
        <span
          className="text-muted-foreground truncate block"
          title={
            activity.delivered_at
              ? format(new Date(activity.delivered_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })
              : "—"
          }
        >
          {activity.delivered_at
            ? format(new Date(activity.delivered_at), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })
            : "—"}
        </span>
      </td>

      {!isAdmin && (
        <td
          className={CELL_BASE}
          style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}
        >
          <div className="flex items-center justify-end">
            {activity.status === "enviada" ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="h-8 w-[7rem] shrink-0 opacity-50 cursor-not-allowed text-xs"
                title={common.buttons.waiting}
              >
                {activitiesContent.table.statusAwaiting}
              </Button>
            ) : activity.status === "entregue" ? (
              <Button
                size="sm"
                className="h-8 w-[7rem] shrink-0 border-none bg-success-action text-white hover:bg-success-action/90 text-xs"
                onClick={() => onViewDetail(activity, true)}
                title={common.buttons.correct}
              >
                {activitiesContent.table.actionCorrect}
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 w-[7rem] shrink-0 border-none bg-warning text-white font-semibold hover:bg-warning/90 shadow text-xs"
                onClick={() => onUpdateCorrection(activity)}
                title={common.buttons.update}
              >
                {activitiesContent.table.actionUpdate}
              </Button>
            )}
          </div>
        </td>
      )}

      <td
        className={CELL_BASE}
        style={{ width: COL.ACOES, minWidth: COL.ACOES }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(activity, false)}
            title={common.buttons.viewDetails}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onViewFile(activity.file_url)}
                aria-label={common.aria.viewFile}
              >
                <Eye className="h-4 w-4 mr-2" />
                {activitiesContent.table.actionViewAttachment}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onDownload(activity.file_url, activity.file_name)
                }
              >
                <Download className="h-4 w-4 mr-2" />
                {activitiesContent.table.actionDownloadFile}
              </DropdownMenuItem>
              {!isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(activity)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    {activitiesContent.table.actionEditActivity}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(activity)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {activitiesContent.table.actionDelete}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
