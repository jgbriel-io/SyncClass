import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { typography } from "@/lib/design-tokens/typography";

export default function StudentPanel() {
  const { user, role } = useAuth();

  if (!user || role !== "student") {
    return <Navigate to="/login" replace />;
  }

  // Exemplo de painel simples
  return (
    <div className="p-8">
      <h1
        className={`${typography("DISPLAY")} mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl mb-4`}
      >
        Painel do Aluno
      </h1>
      <p>Bem-vindo, {user.user_metadata?.full_name || user.email}!</p>
      {/* Adicione funcionalidades específicas para alunos aqui */}
      <Button onClick={() => window.location.reload()}>Atualizar</Button>
    </div>
  );
}
