export const students = {
  view: {
    title: "Alunos",
    subtitle: "Gerencie seus alunos",
    newButton: "Novo Aluno",
    statTotal: "Total",
    statActive: "Ativos",
    statInactive: "Inativos",
    statNew: "Novos este mês",
  },

  table: {
    colName: "Nome",
    colEmail: "Email",
    colPhone: "Telefone",
    colStatus: "Status",
    colTeacher: "Professor",
    colActions: "Ações",
    noCharges: "Sem cobranças",
    daysWithoutClass: (days: number) => `${days} dia(s) sem aula`,
    editedAt: "Editado em",
  },

  formDialog: {
    titleNew: "Novo Aluno",
    titleEdit: "Editar Aluno",
    nameLabel: "Nome completo *",
    namePlaceholder: "Nome do aluno",
    emailLabel: "Email *",
    emailPlaceholder: "email@exemplo.com",
    phoneLabel: "Telefone *",
    phonePlaceholder: "(00) 00000-0000",
    hourlyRateLabel: "Valor por hora",
    hourlyRatePlaceholder: "Ex: 120,00",
    payDayLabel: "Dia de pagamento",
    payDayPlaceholder: "1 a 31",
    originLabel: "Origem *",
    originPlaceholder: "Como nos encontrou?",
    statusLabel: "Status",
    birthDateLabel: "Data de nascimento",
    birthDatePlaceholder: "dd/mm/aaaa",
    yearLabel: "Ano",
    yearPlaceholder: "Ano",
    countryLabel: "País *",
    stateLabel: "Estado/Região *",
    cityLabel: "Cidade *",
    teacherLabel: "Professor",
    teacherPlaceholder: "Selecione um professor",
    paymentMethodLabel: "Método de pagamento",
    paymentMethodPlaceholder: "Selecione...",
    submitButton: "Salvar",
    submitting: "Salvando...",
    createButton: "Cadastrar",
    toasts: {
      success: "Aluno cadastrado com sucesso!",
      successEdit: "Aluno atualizado com sucesso!",
      error: "Erro ao salvar aluno.",
    },
  },

  archiveDialog: {
    titleArchive: "Confirmar arquivamento",
    titleReactivate: "Confirmar reativação",
    descriptionArchive: (name: string) =>
      `Tem certeza que deseja arquivar o aluno ${name}?`,
    archiveNote:
      "O histórico de aulas e cobranças será preservado. O aluno apenas não aparecerá mais nas listagens ativas.",
    descriptionReactivate: (name: string) =>
      `Tem certeza que deseja reativar o aluno ${name}? Ele voltará para a lista de ativos e terá o acesso reativado.`,
    confirmArchive: "Arquivar",
    confirmReactivate: "Reativar",
    archiving: "Arquivando...",
    reactivating: "Reativando...",
    toasts: {
      archiveSuccess: "Aluno arquivado com sucesso!",
      archiveError: "Erro ao arquivar aluno.",
      reactivateSuccess: "Aluno reativado com sucesso!",
      reactivateError: "Erro ao reativar aluno.",
    },
  },

  deleteDialog: {
    title: "Excluir definitivamente?",
    description: (name: string) =>
      `Tem certeza que deseja excluir definitivamente o aluno ${name}?`,
    warning:
      "Todo o histórico de aulas e cobranças deste aluno será permanentemente removido. Esta ação não pode ser desfeita.",
    confirmButton: "Excluir definitivamente",
    deleting: "Excluindo...",
    toasts: {
      success: "Aluno excluído com sucesso!",
      error: "Erro ao excluir aluno.",
    },
  },

  resetPasswordDialog: {
    title: "Redefinir senha do aluno",
    description: (name: string) => `Nova senha para ${name}. Mínimo 6 caracteres.`,
    newPasswordLabel: "Nova senha",
    confirmPasswordLabel: "Confirmar senha",
    generateButton: "Gerar senha",
    submitButton: "Redefinir senha",
    submitting: "Redefinindo...",
    toasts: {
      minLength: "A senha deve ter no mínimo 6 caracteres.",
      mismatch: "As senhas não coincidem.",
      noAccount: "Este aluno não possui conta de acesso vinculada.",
      success: "Senha redefinida com sucesso!",
      error: "Erro ao redefinir senha.",
    },
  },

  detailSheet: {
    title: "Detalhes do Aluno",
    tabInfo: "Informações",
    tabClasses: "Aulas",
    tabFinancial: "Financeiro",
    tabActivities: "Atividades",
  },

  emptyState: {
    title: "Nenhum aluno encontrado",
    description: "Cadastre o primeiro aluno para começar.",
    actionLabel: "Novo aluno",
    toastCreated: "Aluno cadastrado! Um email com a senha foi enviado para o aluno.",
  },

  validation: {
    nameMin: "Nome deve ter pelo menos 2 caracteres",
    emailInvalid: "Email inválido",
    phoneRequired: "Telefone é obrigatório",
    phoneDigits: "Telefone deve ter entre 7 e 15 dígitos",
    payDayRange: "Dia de pagamento deve estar entre 1 e 31",
    birthDateInvalid: "Data inválida",
    countryRequired: "País é obrigatório",
    stateRequired: "Estado/Região é obrigatório",
    cityRequired: "Cidade é obrigatória",
  },
} as const;
