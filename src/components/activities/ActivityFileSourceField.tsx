import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FolderOpen, FileText } from "@phosphor-icons/react";
import { FILE_TYPES, formatFileSize } from "@/lib/utils/fileValidation";
import { activities as activitiesContent } from "@/content";

interface ActivityFileSourceFieldProps {
  fileSource: "new" | "existing" | "current";
  selectedFile: File | null;
  existingFileUrl?: string;
  existingFiles: Array<{
    file_url: string;
    file_name: string;
    file_size: number | null;
  }>;
  isPending: boolean;
  loadingFiles: boolean;
  currentFileName?: string; // For edit mode
  onFileSourceChange: (source: "new" | "existing" | "current") => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExistingFileChange: (url: string) => void;
  errorMessage?: string;
}

export function ActivityFileSourceField({
  fileSource,
  selectedFile,
  existingFileUrl,
  existingFiles,
  isPending,
  loadingFiles,
  currentFileName,
  onFileSourceChange,
  onFileChange,
  onExistingFileChange,
  errorMessage,
}: ActivityFileSourceFieldProps) {
  const isEditMode = !!currentFileName;

  return (
    <div className="space-y-3">
      <Label>
        {isEditMode
          ? activitiesContent.editDialog.fileLabel
          : activitiesContent.sendDialog.fileLabel}
      </Label>
      <RadioGroup
        value={fileSource}
        onValueChange={(v) =>
          onFileSourceChange(v as "new" | "existing" | "current")
        }
        className="flex flex-col gap-2"
      >
        {isEditMode && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="current"
              id="source-current"
              disabled={isPending}
            />
            <Label
              htmlFor="source-current"
              className="font-normal cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="h-4 w-4" />
              {activitiesContent.editDialog.fileSourceCurrent(currentFileName)}
            </Label>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="source-new" disabled={isPending} />
          <Label
            htmlFor="source-new"
            className="font-normal cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            {isEditMode
              ? activitiesContent.editDialog.fileSourceNew
              : activitiesContent.sendDialog.fileSourceNew}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="existing"
            id="source-existing"
            disabled={isPending || existingFiles.length === 0}
          />
          <Label
            htmlFor="source-existing"
            className="font-normal cursor-pointer flex items-center gap-1.5"
          >
            <FolderOpen className="h-4 w-4" />
            {isEditMode
              ? activitiesContent.editDialog.fileSourceExisting
              : activitiesContent.sendDialog.fileSourceExisting}
            {existingFiles.length === 0 && (
              <span className="text-xs text-muted-foreground">
                {isEditMode
                  ? activitiesContent.editDialog.fileSourceNone
                  : activitiesContent.sendDialog.fileSourceNone}
              </span>
            )}
          </Label>
        </div>
      </RadioGroup>

      {fileSource === "new" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              accept={FILE_TYPES.ACTIVITY_ALL.accept}
              onChange={onFileChange}
              disabled={isPending}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[150px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? activitiesContent.editDialog.fileHint
              : FILE_TYPES.ACTIVITY_ALL.description}
          </p>
        </div>
      )}

      {fileSource === "existing" && existingFiles.length > 0 && (
        <Select
          value={existingFileUrl ?? ""}
          onValueChange={onExistingFileChange}
          disabled={isPending || loadingFiles}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isEditMode
                  ? activitiesContent.editDialog.fileSelectPlaceholder
                  : activitiesContent.sendDialog.fileSelectPlaceholder
              }
            />
          </SelectTrigger>
          <SelectContent>
            {existingFiles.map((f) => (
              <SelectItem key={f.file_url} value={f.file_url}>
                <span className="truncate block max-w-[240px]">
                  {f.file_name}
                  {f.file_size != null
                    ? ` · ${(f.file_size / 1024).toFixed(1)} KB`
                    : ""}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
