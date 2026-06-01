export const overview = {
  view: {
    title: "Visão Geral dos Alunos",
    subtitle: "Estatísticas completas de todos os alunos",
  },

  table: {
    colName: "Nome",
    colTeacher: "Professor",
    colStatus: "Status",
    colTotalClasses: "Total Aulas",
    colMonthClasses: "Aulas Mês",
    colMonthValue: "Valor Mês",
    colBalance: "Saldo",
    colActions: "Ações",
    // Table headers
    student: "Aluno",
    entry: "Entrada",
    classes: "Aulas",
    frequency: "Frequência",
    average: "Média",
    paid: "Pago",
    pending: "Pendente",
    overdue: "Atrasado",
    actions: "Ações",
  },

  emptyState: {
    title: "Nenhum aluno encontrado",
    description: "Nenhum aluno corresponde aos filtros aplicados.",
  },

  errors: {
    loadingError: "Erro ao carregar dados. Tente novamente.",
  },

  messages: {
    adjustFilters: "Ajuste os filtros acima ou limpe a busca",
  },

  timeFormat: {
    zeroDay: "há 0 dias",
    days: (count: number) => `há ${count} dia${count === 1 ? "" : "s"}`,
    months: (months: number, days: number) => {
      const monthLabel = `mês${months === 1 ? "" : "es"}`;
      const dayLabel =
        days === 0 ? "" : ` e ${days} dia${days === 1 ? "" : "s"}`;
      return `há ${months} ${monthLabel}${dayLabel}`;
    },
  },

  symbols: {
    emDash: "—",
  },
} as const;
