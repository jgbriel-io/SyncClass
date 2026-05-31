export const layout = {
  adminNav: [
    { name: "Dashboard", href: "/admin" },
    { name: "Visão Geral", href: "/admin/overview" },
    { name: "Alunos", href: "/admin/students" },
    { name: "Aulas", href: "/admin/classes" },
    { name: "Atividades", href: "/admin/activities" },
    { name: "Financeiro", href: "/admin/financial" },
    { name: "Professores", href: "/admin/teachers" },
    { name: "Usuários", href: "/admin/users" },
  ],

  teacherNav: [
    { name: "Dashboard", href: "/teacher" },
    { name: "Visão Geral", href: "/teacher/overview" },
    { name: "Alunos", href: "/teacher/students" },
    { name: "Aulas", href: "/teacher/classes" },
    { name: "Atividades", href: "/teacher/activities" },
    { name: "Financeiro", href: "/teacher/financial" },
  ],

  studentNav: [
    { name: "Início", href: "/student" },
    { name: "Histórico", href: "/student/history" },
    { name: "Atividades", href: "/student/activities" },
    { name: "Financeiro", href: "/student/financial" },
  ],

  sidebar: {
    collapse: "Recolher",
    logout: "Sair",
    loggingOut: "Saindo...",
    openMenu: "Abrir menu",
    toggleSidebar: "Alternar barra lateral",
  },

  topbar: {
    searchPlaceholder: "Buscar aluno (nome, e-mail...)",
    searchAriaLabel: "Buscar aluno por nome ou e-mail",
    notifications: "Notificações",
    noNotifications: "Nenhuma notificação no momento",
    notificationPending: "Pendente",
    myAccount: "Minha Conta",
    settings: "Configurações",
  },

  settings: {
    title: "Configurações",
    tabs: {
      profile: "Perfil",
      password: "Senha",
      preferences: "Preferências",
    },
    profile: {
      avatarLabel: "Foto de perfil",
      uploadButton: "Enviar foto",
      uploading: "Enviando...",
      removeButton: "Remover foto",
      nameLabel: "Nome",
      emailLabel: "Email",
      pixKeyLabel: "Chave PIX",
      pixKeyPlaceholder: "CPF, email, telefone ou chave aleatória",
      pixKeyHint:
        "Esta chave será exibida para seus alunos na tela de pagamento.",
      emailConfirmHint:
        "Você receberá um email de confirmação no novo endereço.",
      editButton: "Editar",
      cancelButton: "Cancelar",
      saveButton: "Salvar",
      exportLabel: "Exportar meus dados",
      exportHint:
        "Baixe uma cópia dos seus dados em formato JSON (LGPD, art. 18, inc. V). Limite: 3 exportações por hora.",
      exportButton: "Exportar meus dados",
      exportingButton: "Exportando...",
      toasts: {
        nameSuccess: "Nome atualizado com sucesso!",
        nameError: "Erro ao atualizar nome. Tente novamente.",
        emailSuccess: "Email atualizado com sucesso!",
        emailError: "Erro ao atualizar email. Tente novamente.",
        pixSuccess: "Chave PIX atualizada com sucesso!",
        pixError: "Erro ao atualizar chave PIX. Tente novamente.",
        exportSuccess: "Dados exportados com sucesso!",
        exportRateLimit: "Limite atingido. Tente novamente em 1 hora.",
        exportError: "Erro ao exportar dados. Tente novamente.",
        sessionExpired: "Sessão expirada. Faça login novamente.",
      },
    },
    password: {
      sessionWarning:
        "Ao alterar sua senha, sua sessão será encerrada e você precisará fazer login novamente com a nova senha.",
      currentPasswordLabel: "Senha atual",
      currentPasswordPlaceholder: "Digite sua senha atual",
      newPasswordLabel: "Nova senha",
      newPasswordPlaceholder: "Mínimo 6 caracteres",
      confirmPasswordLabel: "Confirmar nova senha",
      confirmPasswordPlaceholder: "Repita a nova senha",
      passwordMismatch: "As senhas não coincidem.",
      submitButton: "Alterar senha",
      submitting: "Alterando...",
      showPassword: "Mostrar senha",
      hidePassword: "Ocultar senha",
    },
    preferences: {
      comingSoon: "Opções de tema, idioma e notificações em breve.",
      installAppLabel: "Instalar App",
      installAppDescription:
        "Instale o app na sua tela inicial para acesso mais rápido e funcionamento offline.",
      installAppButton: "Instalar App",
      installAppSuccess: "App instalado com sucesso!",
      installAppBrowserHint: "Use o menu do navegador para instalar o app",
      pwaInstalled: "App instalado!",
    },
  },

  footer: {
    privacyPolicy: "Políticas de Privacidade",
    termsOfUse: "Termos de Uso",
    developedWith: "Desenvolvido com",
    by: "por",
    developer: "Virtual Arrow",
    developerUrl: "https://virtualarrow.com.br",
    lgpd: "Conforme LGPD",
  },

  accessibility: {
    skipToContent: "Pular para conteúdo principal",
    logoutAriaLabel: "Sair da conta",
    settingsAriaLabel: "Configurações",
    mainNavAriaLabel: "Navegação principal",
  },

  logo: {
    initial: "E",
  },
} as const;
