import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CheckCircle2, XCircle, Star, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface StudentClassCardProps {
  classLog: {
    id: string;
    class_date: string;
    attendance: boolean;
    grade?: number | null;
    title?: string | null;
    teacher_name?: string;
  };
  onClick?: () => void;
}

export function StudentClassCard({ classLog, onClick }: StudentClassCardProps) {
  const formattedDate = formatDate(classLog.class_date);

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Data */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm">{formattedDate}</span>
          </div>

          {/* Título da aula (se houver) */}
          {classLog.title && (
            <p className="text-sm font-semibold text-foreground">{classLog.title}</p>
          )}

          {/* Professor */}
          {classLog.teacher_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{classLog.teacher_name}</span>
            </div>
          )}

          {/* Status de presença e nota */}
          <div className="flex items-center gap-3">
            {/* Presença */}
            <div className="flex items-center gap-1.5">
              {classLog.attendance ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Presente</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Faltou</span>
                </>
              )}
            </div>

            {/* Nota */}
            {classLog.grade != null ? (
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Nota: {classLog.grade}</span>
              </div>
            ) : !classLog.attendance ? (
              <span className="text-sm font-medium text-destructive">Não compareceu</span>
            ) : null}
          </div>
        </div>

        {/* Ícone de expansão (se tiver onClick) */}
        {onClick && (
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </Card>
  );
}
