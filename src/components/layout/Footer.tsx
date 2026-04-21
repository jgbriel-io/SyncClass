import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";

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
              Políticas de Privacidade
            </Link>
            <span>•</span>
            <Link
              to={policiesPath}
              className="hover:text-primary transition-colors"
            >
              Termos de Uso
            </Link>
          </div>
          
          {/* Créditos */}
          <div className="flex items-center gap-1.5">
            <span>Desenvolvido com</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>por</span>
            <a
              href="https://virtualarrow.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-primary transition-colors"
            >
              Virtual Arrow
            </a>
            <span>•</span>
            <span>English School © {currentYear}</span>
            <span>•</span>
            <span>Conforme LGPD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
