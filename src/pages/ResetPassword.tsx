import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { auth, common } from "@/content";

export default function ResetPassword() {
  const { user, isLoading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error(auth.resetPassword.toasts.expiredLink);
    }
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de requisitos de senha
    if (password.length < 8) {
      toast.error(auth.resetPassword.toasts.minLength);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error(auth.resetPassword.toasts.uppercase);
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error(auth.resetPassword.toasts.lowercase);
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error(auth.resetPassword.toasts.number);
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      toast.error(auth.resetPassword.toasts.special);
      return;
    }
    if (password !== confirm) {
      toast.error(auth.resetPassword.toasts.passwordMismatch);
      return;
    }
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        setIsSubmitting(false);
        return;
      }
      toast.success(auth.resetPassword.toasts.success);
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error(auth.resetPassword.toasts.generic);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{common.actions.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack('RELAXED')} text-center`}>
          <h2 className={typography('H1')}>{auth.resetPassword.expiredTitle}</h2>
          <p className={typography('SMALL')}>
            {auth.resetPassword.expiredMessage}
          </p>
          <Button asChild className="w-full">
            <Link to="/esqueci-senha">{auth.resetPassword.requestNewLink}</Link>
          </Button>
          <p>
            <Link to="/login" className={`${typography('SMALL')} hover:text-foreground inline-flex items-center ${gap('TIGHT')}`}>
              <ArrowLeft className={iconSize('SM')} />
              {auth.resetPassword.backToLogin}
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
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-base font-semibold">{common.app.name}</span>
          </div>
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold tracking-tight">{auth.resetPassword.pageTitle}</h1>
            <p className="text-lg text-primary-foreground/80">
              {auth.resetPassword.pageSubtitle}
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">{common.app.copyright(2026)}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack('RELAXED')}`}>
          <div className="lg:hidden flex justify-center">
            <Link to="/login" className={`flex items-center ${gap('TIGHT')} text-muted-foreground hover:text-foreground`}>
              <GraduationCap className={iconSize('XL')} />
              <span className={`${typography('H2')} font-semibold`}>{common.app.name}</span>
            </Link>
          </div>

          <div className={stack('TIGHT')}>
            <h2 className={typography('H2')}>{auth.resetPassword.title}</h2>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{auth.resetPassword.requirements.title}</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{auth.resetPassword.requirements.minLength}</li>
                <li>{auth.resetPassword.requirements.uppercase}</li>
                <li>{auth.resetPassword.requirements.lowercase}</li>
                <li>{auth.resetPassword.requirements.number}</li>
                <li>{auth.resetPassword.requirements.special}</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={stack('RELAXED')}>
            <div className={stack('TIGHT')}>
              <Label htmlFor="password">{auth.resetPassword.passwordLabel}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={auth.resetPassword.passwordPlaceholder}
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
              <Label htmlFor="confirm">{auth.resetPassword.confirmLabel}</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder={auth.resetPassword.passwordPlaceholder}
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
                  {auth.resetPassword.submitting}
                </>
              ) : (
                auth.resetPassword.submitButton
              )}
            </Button>
          </form>

          <p className="text-center">
            <Link to="/login" className={`${typography('SMALL')} hover:text-foreground inline-flex items-center ${gap('TIGHT')}`}>
              <ArrowLeft className={iconSize('SM')} />
              {auth.resetPassword.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
