import { FileText } from "lucide-react";
import { userRights } from "@/content/policies";

export function UserRightsSection() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-success" />
        </div>
        <h2 className="text-xl font-semibold">{userRights.title}</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>{userRights.intro}</p>

        <ul className="list-disc list-inside space-y-2 ml-2">
          {userRights.rights.map((right) => (
            <li key={right.label}>
              <span className="font-medium text-foreground">
                {right.label}:
              </span>{" "}
              {right.description}
            </li>
          ))}
        </ul>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
          <p className="text-foreground text-sm">
            <span className="font-medium">{userRights.noticeLabel} </span>
            {userRights.notice}
          </p>
        </div>
      </div>
    </div>
  );
}
