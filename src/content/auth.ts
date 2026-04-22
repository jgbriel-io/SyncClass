// Textos estáticos das páginas de autenticação

export const brandPanel = {
  appName: "English School",
  copyright: "© 2026 English School. All rights reserved.",
  login: {
    title: "Your English learning platform",
    subtitle: "Manage your classes, track progress, and handle payments all in one place.",
  },
  forgotPassword: {
    title: "Esqueceu a senha?",
    subtitle: "Informe seu email e enviaremos um link para redefinir sua senha.",
  },
  resetPassword: {
    title: "Nova senha",
    subtitle: "Defina uma nova senha para acessar sua conta.",
  },
} as const;

export const passwordRequirements = [
  "Mínimo de 8 caracteres",
  "Pelo menos uma letra maiúscula (A-Z)",
  "Pelo menos uma letra minúscula (a-z)",
  "Pelo menos um número (0-9)",
  "Pelo menos um caractere especial (!@#$%^&*)",
] as const;
