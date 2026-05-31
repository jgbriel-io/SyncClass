export const teachers = {
  view: {
    title: "Professores",
    subtitle: "Gerencie os professores da escola",
    newButton: "Novo Professor",
    statTotal: "Total",
    statActive: "Ativos",
    statInactive: "Inativos",
    statGrowth: "Crescimento",
  },

  table: {
    colName: "Nome",
    colEmail: "Email",
    colPhone: "Telefone",
    colStatus: "Status",
    colStudents: "Alunos",
    colActions: "Ações",
    statusActive: "Ativo",
    statusInactive: "Inativo",
    editedAt: "Editado em",
    viewDetails: "Ver detalhes",
  },

  formDialog: {
    titleNew: "Cadastrar Novo Professor",
    titleEdit: "Editar Professor",
    nameLabel: "Nome completo *",
    namePlaceholder: "Nome do professor",
    emailLabel: "Email *",
    emailPlaceholder: "email@exemplo.com",
    phoneLabel: "Telefone",
    phonePlaceholder: "(00) 00000-0000",
    submitButton: "Salvar alterações",
    createButton: "Cadastrar",
    submitting: "Salvando...",
    toasts: {
      success: "Professor cadastrado com sucesso!",
      successEdit: "Professor atualizado com sucesso!",
      error: "Erro ao salvar professor.",
    },
  },

  statusDialog: {
    titleArchive: "Confirmar arquivamento",
    titleReactivate: "Confirmar reativação",
    descriptionArchive: (name: string) =>
      `Tem certeza que deseja arquivar o professor ${name}? Ele será removido da lista de ativos, mas poderá ser visualizado em "Inativos".`,
    descriptionReactivate: (name: string) =>
      `Tem certeza que deseja reativar o professor ${name}? Ele voltará para a lista de ativos e terá o acesso reativado.`,
    confirmArchive: "Arquivar",
    confirmReactivate: "Reativar",
    archiving: "Arquivando...",
    reactivating: "Reativando...",
    toasts: {
      archiveSuccess: "Professor arquivado com sucesso!",
      archiveError: "Erro ao arquivar professor.",
      reactivateSuccess: "Professor reativado com sucesso!",
      reactivateError: "Erro ao reativar professor.",
    },
  },

  deleteDialog: {
    title: "Excluir definitivamente?",
    description: (name: string) =>
      `Os dados pessoais do professor ${name} serão anonimizados (nome, e-mail, telefone). O histórico de aulas será preservado. Esta ação não pode ser desfeita.`,
    warning:
      "A conta de acesso vinculada será removida do sistema. O e-mail ficará disponível para reutilização.",
    warningLabel: "Atenção:",
    confirmButton: "Excluir definitivamente",
    deleting: "Excluindo...",
    scheduledTitle: "Confirmar exclusão com aulas agendadas",
    scheduledDescription: (count: string) =>
      `Este professor possui ${count} aula(s) agendada(s). Ao confirmar, todas serão removidas permanentemente. Esta ação não pode ser desfeita.`,
    forceConfirmButton: "Excluir tudo permanentemente",
    toasts: {
      forceSuccess:
        "Professor e todas as aulas foram excluídos permanentemente.",
      noAccount: "Este professor não possui conta de acesso vinculada.",
      success: "Professor excluído com sucesso!",
      error: "Erro ao excluir professor.",
    },
  },

  resetPasswordDialog: {
    title: "Redefinir senha do professor",
    description: (name: string) =>
      `Nova senha para ${name}. Mínimo 6 caracteres.`,
    newPasswordLabel: "Nova senha",
    confirmPasswordLabel: "Confirmar senha",
    generateButton: "Gerar senha",
    submitButton: "Redefinir senha",
    submitting: "Redefinindo...",
    toasts: {
      minLength: "A senha deve ter no mínimo 6 caracteres.",
      mismatch: "As senhas não coincidem.",
      noAccount: "Este professor não possui conta de acesso vinculada.",
      success: "Senha redefinida com sucesso!",
      error: "Erro ao redefinir senha.",
    },
  },

  detailSheet: {
    title: "Detalhes do Professor",
    tabInfo: "Informações",
    tabStudents: "Alunos",
    tabClasses: "Aulas",
    personalDataSection: "Dados Pessoais",
    activeStudentsLabel: "Alunos Ativos",
    noActiveStudentsMessage: "Nenhum aluno ativo vinculado",
    totalStudentsLabel: "Total de Alunos",
    totalClassesLabel: "Total de Aulas",
    totalReceivedLabel: "Valor Recebido",
    averagePerClassLabel: "Média por Aula",
  },

  emptyState: {
    title: "Nenhum professor encontrado",
    description: "Cadastre o primeiro professor para começar.",
    actionLabel: "Novo professor",
  },

  validation: {
    nameMin: "Nome deve ter pelo menos 2 caracteres",
    emailInvalid: "Email inválido",
    phoneFormat:
      "Telefone deve ter 10 ou 11 dígitos no formato (00) 00000-0000",
  },
} as const;
