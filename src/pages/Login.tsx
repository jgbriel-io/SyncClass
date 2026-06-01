import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { typography } from "@/lib/design-tokens/typography";
import { stack } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { auth, common } from "@/content";

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
          toast.error(auth.login.toasts.invalidCredentials);
        } else if (error.message.includes("Email not confirmed")) {
          toast.error(auth.login.toasts.emailNotConfirmed);
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }
      toast.success(auth.login.toasts.success);
      setIsLoading(false);
      // O useEffect vai redirecionar quando o role for carregado
    } catch (error) {
      toast.error(auth.login.toasts.generic);
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
              <GraduationCap className={iconSize("LG")} />
            </div>
            <span className={`${typography("H2")} font-semibold`}>
              {common.app.name}
            </span>
          </div>

          <div className={`${stack("RELAXED")} max-w-md`}>
            <h1 className={`${typography("DISPLAY")} leading-tight`}>
              Your English learning platform
            </h1>
            <p
              className={`${typography("H3")} text-primary-foreground/80 leading-relaxed`}
            >
              {common.app.tagline}
            </p>
          </div>

          <p className={typography("SMALL")}>{common.app.copyright(2026)}</p>
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
            <span className="text-lg font-semibold">{common.app.name}</span>
          </div>

          <div className={`${stack("RELAXED")} text-center lg:text-left`}>
            <h2 className={typography("H2")}>{auth.login.title}</h2>
            <p className={typography("BODY")}>{auth.login.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className={stack("RELAXED")}>
            <div className={stack("LOOSE")}>
              <div className={stack("TIGHT")}>
                <Label htmlFor="email">{auth.login.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={auth.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className={stack("TIGHT")}>
                <Label htmlFor="password">{auth.login.passwordLabel}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={auth.login.passwordPlaceholder}
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
                      <EyeOff className={iconSize("SM")} />
                    ) : (
                      <Eye className={iconSize("SM")} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={`mr-2 ${iconSize("SM")} animate-spin`} />
                  {auth.login.submitting}
                </>
              ) : (
                auth.login.submitButton
              )}
            </Button>
            <p className={`text-center ${typography("BODY")}`}>
              <Link
                to="/esqueci-senha"
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                {auth.login.forgotPassword}
              </Link>
            </p>
          </form>

          {/* Sem cadastro público: contas são criadas pelo administrador. */}
        </div>
      </div>
    </div>
  );
}
