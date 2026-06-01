export const activities = {
  view: {
    title: "Atividades",
    subtitle: "Envie materiais e correções para seus alunos",
    newButton: "Enviar Atividade",
    newButtonAdmin: "Nova Atividade",
    statTotal: "Total",
    statAwaiting: "Aguardando",
    statOverdue: "Vencidas",
    statDelivered: "Entregues",
    statCorrected: "Corrigidas",
    toasts: {
      fileOpenError: "Não foi possível abrir o arquivo.",
      downloadPreparing: "Preparando download...",
      downloadSuccess: "Download concluído",
      downloadError: "Erro ao baixar arquivo",
    },
  },

  table: {
    colStudent: "Aluno",
    colActivity: "Atividade",
    colFile: "Arquivo",
    colDueDate: "Prazo",
    colStatus: "Status",
    colDeliveredAt: "Entregue em",
    colActions: "Ações",
    actionViewAttachment: "Ver anexo",
    actionDownloadFile: "Baixar arquivo",
    actionEditActivity: "Editar atividade",
    actionDelete: "Excluir",
    statusAwaiting: "Aguardando",
    actionCorrect: "Corrigir",
    actionUpdate: "Atualizar",
  },

  sendDialog: {
    title: "Enviar atividade",
    description:
      "Selecione o aluno, preencha o título e anexe o arquivo da atividade.",
    teacherLabel: "Professor *",
    teacherPlaceholder: "Selecione um professor",
    teacherRequired: "Selecione um professor",
    studentLabel: "Aluno *",
    studentPlaceholder: "Selecione um aluno",
    titleLabel: "Título *",
    titlePlaceholder: "Ex: Reading Comprehension - Unit 5",
    descriptionLabel: "Descrição (opcional)",
    descriptionPlaceholder: "Instruções e observações...",
    dueDateLabel: "Prazo de entrega *",
    dueDateHint: "Data e hora limite para o aluno entregar.",
    dueDatePlaceholder: "Data",
    fileLabel: "Arquivo *",
    fileSourceNew: "Enviar novo arquivo",
    fileSourceExisting: "Usar arquivo já na plataforma",
    fileSourceNone: "(nenhum ainda)",
    fileSelectPlaceholder: "Selecione um arquivo",
    submitButton: "Enviar atividade",
    submitting: "Enviando...",
    toasts: {
      fileNotFound: "Arquivo não encontrado.",
      fileRequired: "Selecione ou envie um arquivo.",
      rateLimitExceeded: (seconds: number) =>
        `Muitos uploads. Aguarde ${seconds} segundos.`,
      error: (msg: string) => `Erro ao enviar atividade: ${msg}`,
      success: "Atividade enviada com sucesso!",
    },
  },

  editDialog: {
    title: "Editar atividade",
    description: (studentName: string) =>
      `Altere título, descrição, prazo ou arquivo. Aluno: ${studentName}`,
    titleLabel: "Título *",
    titlePlaceholder: "Ex: Reading Comprehension - Unit 5",
    descriptionLabel: "Descrição (opcional)",
    descriptionPlaceholder: "Instruções e observações...",
    dueDateLabel: "Prazo de entrega *",
    dueDateHint: "Data e hora limite para o aluno entregar.",
    fileLabel: "Arquivo",
    fileSourceCurrent: (fileName: string) =>
      `Manter arquivo atual (${fileName})`,
    fileSourceNew: "Enviar novo arquivo",
    fileSourceExisting: "Usar arquivo já na plataforma",
    fileSourceNone: "(nenhum ainda)",
    fileSelectPlaceholder: "Selecione um arquivo",
    fileHint: "PDF, DOC, DOCX, JPG, PNG ou TXT (máx. 10 MB)",
    submitButton: "Salvar alterações",
    submitting: "Salvando...",
    toasts: {
      fileNotFound: "Arquivo não encontrado.",
      error: (msg: string) => `Erro ao atualizar atividade: ${msg}`,
      success: "Atividade atualizada com sucesso!",
    },
  },

  correctionDialog: {
    title: "Correção e feedback",
    activityLabel: "Atividade:",
    studentLabel: "Aluno:",
    feedbackLabel: "Feedback *",
    feedbackPlaceholder: "Escreva sua correção, observações, elogios...",
    gradeLabel: "Nota (0–100) *",
    gradePlaceholder: "Ex: 85",
    correctionFileLabel: "Arquivo de Correção (opcional)",
    correctionFileHint: "Arquivo com a correção detalhada (opcional)",
    submitButton: "Enviar correção",
    submitting: "Enviando...",
    toasts: {
      error: (msg: string) => `Erro ao enviar correção: ${msg}`,
      success: "Correção enviada com sucesso!",
    },
  },

  deliverDialog: {
    title: "Entregar atividade",
    activityLabel: "Atividade:",
    responseTextLabel: "Resposta (texto)",
    fileLabel: "Arquivo *",
    fileHint:
      "Envie sua resposta (PDF, DOC, DOCX, JPG, PNG ou TXT - máx. 10 MB)",
    fileSelectLabel: "Clique para selecionar um arquivo",
    orDivider: "Ou",
    submitButton: "Entregar",
    submitting: "Enviando...",
    toasts: {
      success: "Atividade entregue com sucesso!",
      error: (msg: string) => `Erro ao entregar atividade: ${msg}`,
    },
  },

  deleteDialog: {
    title: "Confirmar exclusão",
    description: (title: string) =>
      `Tem certeza que deseja excluir a atividade "${title}"?`,
    irreversible: "Esta ação não pode ser desfeita.",
    confirmButton: "Excluir",
    deleting: "Excluindo...",
    toasts: {
      success: "Atividade excluída com sucesso!",
      error: "Erro ao excluir atividade.",
    },
  },

  emptyState: {
    title: "Nenhuma atividade encontrada",
    description: "Envie a primeira atividade para um aluno.",
    actionLabel: "Enviar primeira atividade",
  },

  detailSheet: {
    downloadButton: "Baixar",
    correctActivityButton: "Corrigir atividade",
  },

  validation: {
    studentRequired: "Selecione um aluno",
    titleRequired: "Informe o título da atividade",
    dueDateRequired: "Defina o prazo de entrega",
    dueDateFormat: "Data no formato dd/mm/aaaa",
    dueTimeFormat: "Hora no formato HH:mm",
    fileRequired: "Selecione ou envie um arquivo",
    feedbackRequired: "Informe o feedback",
    gradeRequired: "Informe a nota (0–100)",
    gradeRange: "Informe a nota (0–100)",
  },
} as const;
