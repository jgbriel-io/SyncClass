import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, role } = useAuth();

  // Show message if user was logged out due to session expiry
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'session_expired') {
      toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
        duration: 5000,
      });
      // Clear the error from URL
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Email não confirmado. Verifique sua caixa de entrada.");
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold">EduCore</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Gestão educacional simplificada
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Controle de alunos, aulas e financeiro em um único lugar. 
              Saia das planilhas, ganhe tempo e clareza.
            </p>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © 2025 EduCore. Todos os direitos reservados.
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
          <div className="lg:hidden flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold">EduCore</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Bem-vindo de volta
                </h2>
                <p className="text-muted-foreground">
                  Entre com suas credenciais para acessar
                </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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

              <div className="space-y-2">
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
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Sem cadastro público: contas são criadas pelo administrador. */}
        </div>
      </div>
    </div>
  );
}
