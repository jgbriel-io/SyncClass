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
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
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
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold">EduCore</span>
          </div>
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold tracking-tight">Nova senha</h1>
            <p className="text-lg text-primary-foreground/80">
              Defina uma nova senha para acessar sua conta.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">© 2025 EduCore</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack('RELAXED')}`}>
          <div className="lg:hidden flex justify-center">
            <Link to="/login" className={`flex items-center ${gap('TIGHT')} text-muted-foreground hover:text-foreground`}>
              <GraduationCap className={iconSize('XL')} />
              <span className={typography('H1')}>EduCore</span>
            </Link>
          </div>

          <div className={stack('TIGHT')}>
            <h2 className={typography('H2')}>Definir nova senha</h2>
            <p className={typography('SMALL')}>Mínimo de 6 caracteres.</p>
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
                  minLength={6}
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
                minLength={6}
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
