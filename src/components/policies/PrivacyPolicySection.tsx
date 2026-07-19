import { Shield } from "@phosphor-icons/react";
import { privacyPolicy } from "@/content/policies";

export function PrivacyPolicySection() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{privacyPolicy.title}</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>{privacyPolicy.intro}</p>

        {privacyPolicy.sections.map((section) => (
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
      </div>
    </div>
  );
}
