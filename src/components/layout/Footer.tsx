import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { layout } from "@/content";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  // Detectar a rota base para os links de políticas
  const getPoliciesPath = () => {
    if (location.pathname.startsWith("/admin")) return "/admin/policies";
    if (location.pathname.startsWith("/teacher")) return "/teacher/policies";
    if (location.pathname.startsWith("/student")) return "/student/policies";
    return "/policies"; // Fallback para página pública
  };

  const policiesPath = getPoliciesPath();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          {/* Links */}
          <div className="flex items-center gap-3">
            <Link
              to={policiesPath}
              className="hover:text-primary transition-colors"
            >
              {layout.footer.privacyPolicy}
            </Link>
            <span>•</span>
            <Link
              to={policiesPath}
              className="hover:text-primary transition-colors"
            >
              {layout.footer.termsOfUse}
            </Link>
          </div>

          {/* Créditos */}
          <div className="flex flex-col tablet:flex-row items-center gap-1 tablet:gap-1.5">
            <div className="flex items-center gap-1.5">
              <span>{layout.footer.developedWith}</span>
              <Heart className="h-3 w-3 text-destructive fill-destructive" />
              <span>{layout.footer.by}</span>
              <a
                href={layout.footer.developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-primary transition-colors"
              >
                {layout.footer.developer}
              </a>
            </div>
            <span className="hidden tablet:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span>English School © {currentYear}</span>
              <span>•</span>
              <span>{layout.footer.lgpd}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
