import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  CircleNotch as Loader2,
  ArrowLeft,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { auth, common } from "@/content";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      setSent(true);
      toast.success(auth.forgotPassword.toasts.success);
    } catch {
      toast.error(auth.forgotPassword.toasts.generic);
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-4xl font-bold tracking-tight">
              {auth.forgotPassword.pageTitle}
            </h1>
            <p className="text-lg text-primary-foreground/80">
              {auth.forgotPassword.pageSubtitle}
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">
            {common.app.copyright(2026)}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-sm ${stack("RELAXED")}`}>
          <div className="lg:hidden flex justify-center">
            <Link
              to="/login"
              className={`flex items-center ${gap("TIGHT")} text-muted-foreground hover:text-foreground`}
            >
              <GraduationCap className={iconSize("XL")} />
              <span className={`${typography("H2")} font-semibold`}>
                {common.app.name}
              </span>
            </Link>
          </div>

          <div className={stack("TIGHT")}>
            <h2 className={typography("H2")}>{auth.forgotPassword.title}</h2>
            <p className={typography("SMALL")}>
              {auth.forgotPassword.subtitle}
            </p>
          </div>

          {sent ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className={typography("SMALL")}>
                {auth.forgotPassword.sentMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={stack("RELAXED")}>
              <div className={stack("TIGHT")}>
                <Label htmlFor="email">{auth.forgotPassword.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={auth.forgotPassword.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className={`mr-2 ${iconSize("SM")} animate-spin`}
                    />
                    {auth.forgotPassword.submitting}
                  </>
                ) : (
                  auth.forgotPassword.submitButton
                )}
              </Button>
            </form>
          )}

          <p className="text-center">
            <Link
              to="/login"
              className={`${typography("SMALL")} hover:text-foreground inline-flex items-center ${gap("TIGHT")}`}
            >
              <ArrowLeft className={iconSize("SM")} />
              {auth.forgotPassword.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
