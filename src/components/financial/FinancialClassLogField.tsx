import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { financial } from "@/content";

interface ClassLogOption {
  id: string;
  class_date: string;
  attendance?: boolean | null;
  grade?: number | null;
  title?: string | null;
}

interface PackageClass {
  title?: string | null;
  class_date: string;
}

interface FinancialClassLogFieldProps {
  isEditMode: boolean;
  isPackage: boolean;
  selectedClassLogId: string;
  classLogOptions: ClassLogOption[];
  currentClassLog: ClassLogOption | null;
  packageClasses: PackageClass[] | null;
  selectedStudentId: string;
  loadingClassLogs: boolean;
  requireClassLog: boolean;
  onClassLogChange: (value: string) => void;
  errorMessage?: string;
}

function formatClassLogDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", {
    locale: ptBR,
  });
}

export function FinancialClassLogField({
  isEditMode,
  isPackage,
  selectedClassLogId,
  classLogOptions,
  currentClassLog,
  packageClasses,
  selectedStudentId,
  loadingClassLogs,
  requireClassLog,
  onClassLogChange,
  errorMessage,
}: FinancialClassLogFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{financial.formDialog.classLabel}</Label>
      {isEditMode ? (
        // Ao editar: mostrar input travado com o título da aula
        <Input
          value={
            isPackage && packageClasses
              ? (() => {
                  const firstClass = packageClasses[0];
                  const rawTitle = firstClass.title?.trim();
                  const displayTitle =
                    rawTitle ||
                    `${financial.formDialog.classDatePrefix}${formatClassLogDate(firstClass.class_date)}`;
                  return `${displayTitle} ${financial.formDialog.packageLabel}`;
                })()
              : currentClassLog
                ? (() => {
                    const rawTitle = currentClassLog.title?.trim();
                    return (
                      rawTitle ||
                      `${financial.formDialog.classDatePrefix}${formatClassLogDate(currentClassLog.class_date)}`
                    );
                  })()
                : financial.formDialog.noClassLinked
          }
          disabled
          className="bg-muted"
        />
      ) : (
        // Ao criar: mostrar select normal
        <Select
          value={selectedClassLogId || undefined}
          onValueChange={onClassLogChange}
          disabled={
            !selectedStudentId ||
            loadingClassLogs ||
            (requireClassLog && classLogOptions.length === 0)
          }
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !selectedStudentId
                  ? financial.formDialog.classSelectStudentFirst
                  : loadingClassLogs
                    ? financial.formDialog.classLoading
                    : requireClassLog && classLogOptions.length === 0
                      ? financial.formDialog.classNone
                      : financial.formDialog.classSelect
              }
            />
          </SelectTrigger>
          <SelectContent>
            {classLogOptions.map((log) => (
              <SelectItem key={log.id} value={log.id}>
                {formatClassLogDate(log.class_date)}
                {log.attendance === false && ` (${financial.tableRow.absence})`}
                {log.grade && ` - ${financial.tableRow.grade} ${log.grade}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {selectedStudentId &&
        classLogOptions.length === 0 &&
        !loadingClassLogs &&
        !isEditMode && (
          <p className="text-xs text-muted-foreground">
            {financial.formDialog.classNoneWithCharge}
          </p>
        )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
