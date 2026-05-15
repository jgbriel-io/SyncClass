/**
 * Textos relacionados a PWA (Progressive Web App)
 */
export const pwa = {
  installBanner: {
    title: "Instalar App",
    description: "Instale o app na sua tela inicial para acesso mais rápido e funcionamento offline.",
    installButton: "Instalar",
    laterButton: "Agora não",
    toasts: {
      success: "App instalado com sucesso!",
      cancelled: "Instalação cancelada",
      error: "Erro ao instalar o app",
    },
  },

  pixPayment: {
    title: "Pagamento via PIX",
    description: "Escaneie o QR Code ou copie a chave PIX",
    pixKeyLabel: "Chave PIX",
    copyButton: "Copiar chave",
    toasts: {
      copied: "Chave PIX copiada!",
      copyError: "Não foi possível copiar.",
    },
  },
} as const;
