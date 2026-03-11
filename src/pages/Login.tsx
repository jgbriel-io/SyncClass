import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TYPOGRAPHY } from "@/lib/design-tokens/typography";
import { STACK } from "@/lib/design-tokens/spacing";
import { ICON_SIZES } from "@/lib/design-tokens/icon-sizes";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, role } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error(
            "Email não confirmado. Verifique sua caixa de entrada e clique no link 'Confirm Email & Login' que enviamos para você.",
            { duration: 6000 }
          );
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }
      toast.success("Login realizado com sucesso!");
      // Role-based redirect will happen via AuthContext
      setIsLoading(false);
    } catch (error) {
      toast.error("Ocorreu um erro. Tente novamente.");
      setIsLoading(false);
    }
  };

  // Effect to handle redirect after login
  useEffect(() => {
    if (role && !isLoading) {
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "student") {
        navigate("/student");
      } else if (role === "teacher") {
        navigate("/teacher");
      }
    }
  }, [role, isLoading, navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className={ICON_SIZES.LG} />
            </div>
            <span className={`${TYPOGRAPHY.H2} font-semibold`}>JLAC English School</span>
          </div>

          <div className={`${STACK.RELAXED} max-w-md`}>
            <h1 className={`${TYPOGRAPHY.DISPLAY} leading-tight`}>
              Your English learning platform
            </h1>
            <p className={`${TYPOGRAPHY.H3} text-primary-foreground/80 leading-relaxed`}>
              Manage your classes, track progress, and handle payments all in one place.
            </p>
          </div>

          <p className={TYPOGRAPHY.SMALL}>
            © 2026 JLAC English School. All rights reserved.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -right-10 top-20 w-40 h-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right side - Login/Signup form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">JLAC English School</span>
          </div>

          <div className={`${STACK.RELAXED} text-center lg:text-left`}>
                <h2 className={TYPOGRAPHY.H2}>
                  Bem-vindo de volta
                </h2>
                <p className={TYPOGRAPHY.BODY}>
                  Entre com suas credenciais para acessar
                </p>
          </div>

          <form onSubmit={handleSubmit} className={STACK.RELAXED}>
            <div className={STACK.LOOSE}>
              <div className={STACK.TIGHT}>
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

              <div className={STACK.TIGHT}>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className={ICON_SIZES.SM} />
                    ) : (
                      <Eye className={ICON_SIZES.SM} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={`mr-2 ${ICON_SIZES.SM} animate-spin`} />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <p className={`text-center ${TYPOGRAPHY.BODY}`}>
              <Link
                to="/esqueci-senha"
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Esqueci minha senha
              </Link>
            </p>
          </form>

          {/* Sem cadastro público: contas são criadas pelo administrador. */}
        </div>
      </div>
    </div>
  );
}
