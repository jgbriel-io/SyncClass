import { GraduationCap } from "lucide-react";
import { typography } from "@/lib/design-tokens/typography";
import { stack } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { brandPanel } from "@/content/auth";

interface AuthBrandPanelProps {
  variant: "login" | "forgotPassword" | "resetPassword";
}

export function AuthBrandPanel({ variant }: AuthBrandPanelProps) {
  const content = brandPanel[variant];

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
            <GraduationCap className={iconSize("LG")} />
          </div>
          <span className={`${typography("H2")} font-semibold`}>{brandPanel.appName}</span>
        </div>

        <div className={`${stack("RELAXED")} max-w-md`}>
          <h1 className={`${typography("DISPLAY")} leading-tight`}>{content.title}</h1>
          <p className={`${typography("H3")} text-primary-foreground/80 leading-relaxed`}>
            {content.subtitle}
          </p>
        </div>

        <p className={typography("SMALL")}>{brandPanel.copyright}</p>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-foreground/5" />
      <div className="absolute -right-10 top-20 w-40 h-40 rounded-full bg-primary-foreground/5" />
    </div>
  );
}
