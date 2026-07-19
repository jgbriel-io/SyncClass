import { Lock } from "@phosphor-icons/react";
import { dataRetention } from "@/content/policies";

export function DataRetentionSection() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-warning" />
        </div>
        <h2 className="text-xl font-semibold">{dataRetention.title}</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>{dataRetention.intro}</p>

        {dataRetention.sections.map((section) => (
          <div key={section.heading} className="space-y-2">
            <h3 className="font-medium text-foreground">{section.heading}</h3>
            <p>{section.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
