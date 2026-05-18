export const users = {
  view: {
    title: "Usuários",
    subtitle: "Gerencie os usuários do sistema",
    newButton: "Novo Usuário",
    statTotal: "Total",
    statActive: "Ativos",
    statInactive: "Inativos",
    statAdmins: "Admins",
  },

  table: {
    colName: "Nome",
    colEmail: "Email",
    colRole: "Perfil",
    colStatus: "Status",
    colActions: "Ações",
    statusActive: "Ativo",
    statusInactive: "Inativo",
    statusArchived: "Conta arquivada",
    statusArchivedShort: "Arquivado",
    roleAdmin: "Admin",
    roleTeacher: "Professor",
    roleStudent: "Aluno",
    linkedStudent: (name: string) => `Aluno: ${name}`,
    linkedTeacher: (name: string) => `Professor: ${name}`,
    linkedAdmin: (name: string) => `Admin: ${name}`,
    createdAt: "Criado em",
    viewDetails: "Ver detalhes",
  },

  formDialog: {
    titleNew: "Novo Usuário",
    titleEdit: "Editar Usuário",
    roleLabel: "Perfil *",
    rolePlaceholder: "Selecione o perfil",
    nameLabel: "Nome completo *",
    namePlaceholder: "Nome do usuário",
    emailLabel: "Email *",
    emailPlaceholder: "email@exemplo.com",
    submitButton: "Salvar",
    createButton: "Criar usuário",
    submitting: "Salvando...",
    toasts: {
      success: "Usuário criado com sucesso!",
      successEdit: "Usuário atualizado com sucesso!",
      error: "Erro ao salvar usuário.",
    },
  },

  deleteDialog: {
    titleSoft: "Desativar usuário",
    titleHard: "Excluir definitivamente",
    titleArchive: "Confirmar arquivamento",
    titleArchived: "Excluir arquivo morto?",
    titleReactivate: "Confirmar reativação",
    descriptionSoft: (name: string) =>
      `Tem certeza que deseja desativar o usuário ${name}? O acesso será bloqueado, mas os dados serão preservados.`,
    descriptionHard: (name: string) =>
      `Tem certeza que deseja excluir definitivamente o usuário ${name}? Esta ação não pode ser desfeita.`,
    descriptionArchived: (name: string) =>
      `Tem certeza que deseja excluir o arquivo morto do usuário ${name}? A conta será removida do sistema (Supabase Auth e perfil). O email ficará disponível para reutilização. Esta ação não pode ser desfeita.`,
    descriptionHardDelete: (name: string) =>
      `A conta do usuário ${name} será removida do sistema (Supabase Auth, perfil e vínculos). Esta ação não pode ser desfeita.`,
    descriptionReactivate: (name: string) =>
      `Tem certeza que deseja reativar o usuário ${name}? Ele voltará a aparecer na lista de usuários ativos.`,
    descriptionArchiveStudent: (name: string) =>
      `Tem certeza que deseja arquivar o usuário ${name}? Ele será removido da lista de ativos e aparecerá como aluno inativo.`,
    descriptionArchiveTeacher: (name: string) =>
      `Tem certeza que deseja arquivar o usuário ${name}? Ele será removido da lista de ativos e aparecerá como professor inativo.`,
    descriptionArchiveGeneric: (name: string) =>
      `Tem certeza que deseja arquivar o usuário ${name}? Esta ação não remove a conta do Supabase Auth, apenas arquiva o usuário no painel.`,
    confirmSoft: "Desativar",
    confirmHard: "Excluir definitivamente",
    confirmArchive: "Arquivar",
    confirmArchived: "Excluir arquivo morto",
    confirmReactivate: "Reativar",
    deactivating: "Desativando...",
    deleting: "Excluindo...",
    archiving: "Arquivando...",
    reactivating: "Reativando...",
    toastReactivated: "Usuário reativado com sucesso!",
    toastArchived: "Usuário arquivado com sucesso!",
    toastDeleted: "Usuário excluído definitivamente!",
    toastArchiveError: "Erro ao arquivar usuário",
    toastDeleteError: "Erro ao excluir usuário: ",
    toastNoLink: "Este usuário não possui vínculo com aluno ou professor. Use o painel específico para reativar.",
  },

  passwordDialog: {
    title: "Senha gerada",
    description: "Anote a senha antes de fechar. Ela não será exibida novamente.",
    passwordLabel: "Senha",
    copyButton: "Copiar",
    copied: "Copiado!",
    closeButton: "Fechar",
    copyError: "Não foi possível copiar. Copie a senha manualmente.",
  },

  resetPasswordDialog: {
    title: "Redefinir senha",
    description: (name: string) => `Nova senha para ${name}. Mínimo 6 caracteres.`,
    newPasswordLabel: "Nova senha",
    confirmPasswordLabel: "Confirmar senha",
    generateButton: "Gerar senha",
    submitButton: "Redefinir senha",
    submitting: "Redefinindo...",
    toasts: {
      minLength: "A senha deve ter no mínimo 6 caracteres.",
      mismatch: "As senhas não coincidem.",
      noAccount: "Este usuário não possui conta de acesso vinculada.",
      success: "Senha redefinida com sucesso!",
      error: "Erro ao redefinir senha.",
    },
  },

  emptyState: {
    title: "Nenhum usuário encontrado",
    description: "Crie o primeiro usuário para começar.",
    actionLabel: "Novo usuário",
  },

  validation: {
    roleRequired: "Selecione o perfil",
    nameMin: "Nome deve ter pelo menos 2 caracteres",
    emailInvalid: "Email inválido",
  },

  detailSheet: {
    title: "Detalhes do Usuário",
    tabInfo: "Informações",
    tabLinks: "Vínculos",
    accountDataSection: "Dados da Conta",
    privilegeLabel: "Privilégio",
    statusLabel: "Status",
    createdAtLabel: "Criado em",
    updatedAtLabel: "Atualizado em",
    accountActive: "Conta ativa",
    accountArchived: "Conta arquivada",
    linksSection: "Vínculos com Perfis",
    noLinksMessage: "Nenhum vínculo com aluno ou professor",
    linkedStudentLabel: "Aluno Vinculado",
    linkedTeacherLabel: "Professor Vinculado",
  },
} as const;
