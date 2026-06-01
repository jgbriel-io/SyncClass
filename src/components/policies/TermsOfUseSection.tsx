import { AlertCircle } from "lucide-react";
import { termsOfUse } from "@/content/policies";

export function TermsOfUseSection() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">{termsOfUse.title}</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        {termsOfUse.sections.map((section) => (
          <div key={section.heading} className="space-y-2">
            <h3 className="font-medium text-foreground">{section.heading}</h3>
            {"items" in section ? (
              <ul className="list-disc list-inside space-y-1 ml-2">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{section.text}</p>
            )}
          </div>
        ))}

        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {termsOfUse.contactTitle}
          </h3>
          <p className="text-sm">{termsOfUse.contactText}</p>
          <p className="text-xs mt-2">{termsOfUse.lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}
