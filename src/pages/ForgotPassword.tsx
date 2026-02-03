import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      setSent(true);
      toast.success("Link enviado! Verifique seu email.");
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-4xl font-bold tracking-tight">Esqueceu a senha?</h1>
            <p className="text-lg text-primary-foreground/80">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">© 2025 EduCore</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center">
            <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <GraduationCap className="h-8 w-8" />
              <span className="text-xl font-semibold">EduCore</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Redefinir senha</h2>
            <p className="text-muted-foreground text-sm">
              Digite o email da sua conta. Enviaremos um link para criar uma nova senha.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Se existir uma conta com esse email, você receberá um link em instantes. Verifique a caixa de entrada e o
                spam.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link"
                )}
              </Button>
            </form>
          )}

          <p className="text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
