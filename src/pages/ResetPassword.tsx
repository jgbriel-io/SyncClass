import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { passwordRequirements } from "@/content/auth";

export default function ResetPassword() {
  const { user, isLoading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Link expirado ou inválido. Solicite um novo link.");
    }
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de requisitos de senha
    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("A senha deve conter pelo menos uma letra maiúscula.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("A senha deve conter pelo menos uma letra minúscula.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("A senha deve conter pelo menos um número.");
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      toast.error("A senha deve conter pelo menos um caractere especial (!@#$%^&*).");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        setIsSubmitting(false);
        return;
      }
      toast.success("Senha alterada. Faça login com a nova senha.");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack('RELAXED')} text-center`}>
          <h2 className={typography('H1')}>Link expirado ou inválido</h2>
          <p className={typography('SMALL')}>
            Solicite um novo link de redefinição de senha na página de login.
          </p>
          <Button asChild className="w-full">
            <Link to="/esqueci-senha">Solicitar novo link</Link>
          </Button>
          <p>
            <Link to="/login" className={`${typography('SMALL')} hover:text-foreground inline-flex items-center ${gap('TIGHT')}`}>
              <ArrowLeft className={iconSize('SM')} />
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel variant="resetPassword" />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack('RELAXED')}`}>
          <div className="lg:hidden flex justify-center">
            <Link to="/login" className={`flex items-center ${gap('TIGHT')} text-muted-foreground hover:text-foreground`}>
              <GraduationCap className={iconSize('XL')} />
              <span className={`${typography('H2')} font-semibold`}>English School</span>
            </Link>
          </div>

          <div className={stack('TIGHT')}>
            <h2 className={typography('H2')}>Definir nova senha</h2>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                {passwordRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={stack('RELAXED')}>
            <div className={stack('TIGHT')}>
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className={iconSize('SM')} /> : <Eye className={iconSize('SM')} />}
                </button>
              </div>
            </div>
            <div className={stack('TIGHT')}>
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="h-11"
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className={`mr-2 ${iconSize('SM')} animate-spin`} />
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>

          <p className="text-center">
            <Link to="/login" className={`${typography('SMALL')} hover:text-foreground inline-flex items-center ${gap('TIGHT')}`}>
              <ArrowLeft className={iconSize('SM')} />
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
