import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

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
      <AuthBrandPanel variant="forgotPassword" />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack('RELAXED')}`}>
          <div className="lg:hidden flex justify-center">
            <Link to="/login" className={`flex items-center ${gap('TIGHT')} text-muted-foreground hover:text-foreground`}>
              <GraduationCap className={iconSize('XL')} />
              <span className={`${typography('H2')} font-semibold`}>English School</span>
            </Link>
          </div>

          <div className={stack('TIGHT')}>
            <h2 className={typography('H2')}>Redefinir senha</h2>
            <p className={typography('SMALL')}>
              Digite o email da sua conta. Enviaremos um link para criar uma nova senha.
            </p>
          </div>

          {sent ? (
            <div className={`${stack('LOOSE')} rounded-lg border bg-muted/30 p-4`}>
              <p className={typography('SMALL')}>
                Se existir uma conta com esse email, você receberá um link em instantes. Verifique a caixa de entrada e o
                spam.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className={`mr-2 ${iconSize('SM')}`} />
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={stack('RELAXED')}>
              <div className={stack('TIGHT')}>
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
                    <Loader2 className={`mr-2 ${iconSize('SM')} animate-spin`} />
                    Enviando...
                  </>
                ) : (
                  "Enviar link"
                )}
              </Button>
            </form>
          )}

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
