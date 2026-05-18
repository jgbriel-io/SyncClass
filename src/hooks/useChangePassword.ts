import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/content";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, auth.changePassword.toasts.currentPasswordWrong),
  newPassword: z.string().min(6, auth.changePassword.toasts.newPasswordMinLength),
  confirmPassword: z.string().min(1, auth.changePassword.toasts.confirmPasswordRequired),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: auth.changePassword.toasts.passwordMismatch,
  path: ["confirmPassword"],
});

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const useChangePassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutate = async (data: ChangePasswordForm) => {
    setIsSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (authError) throw authError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("user_id", user.id);

        if (profileError) {
          // Não falhar se profile não atualizar
        }
      }

      toast.success(auth.changePassword.toasts.success);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : auth.changePassword.toasts.generic;
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { mutate, isSubmitting, schema: changePasswordSchema };
};
