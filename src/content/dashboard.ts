export const dashboard = {
  mobileTabs: {
    resumo: "Resumo",
    agenda: "Agenda",
    grafico: "Gráfico",
  },

  view: {
    title: "Dashboard",
    quickActionsTitle: "Ações Rápidas",
    quickActions: {
      registerStudent: "Cadastrar Aluno",
      registerClass: "Registrar Aula",
      viewCharges: "Visualizar cobranças",
      overview: "Visão Geral",
      registerTeacher: "Cadastrar professor",
      registerUser: "Cadastrar usuário",
    },
  },

  metrics: {
    activeStudents: "Alunos Ativos",
    activeStudentsChange: "este mês",
    overdue: "Inadimplentes",
    overdueChange: (pct: string) => `${pct}% do total`,
    newThisMonth: "Novos este Mês",
    classesThisMonth: "Aulas este Mês",
    totalStudents: "Total de Alunos",
    cancellations: "Cancelamentos",
    revenue: "Receita",
  },

  financial: {
    totalPaid: "Recebido",
    totalPending: "A receber",
    totalOverdue: "Vencido",
    totalReceivable: "Total a receber",
    forecasted: "Previsto",
    forecastedMonthly: "Previsão Mensal",
    receivedPercentage: (pct: number) => `${pct}% recebido`,
    totalReceived: "Total recebido",
    totalReceivableLabel: "Total a receber",
    pendingPlusOverdue: "Pendentes + Em atraso",
    pending: "Pendente",
    overdue: "Em atraso",
  },

  todayClasses: {
    title: "Aulas de Hoje",
    noClasses: "Nenhuma aula hoje",
    nextClassTeacher: "Sua próxima aula",
    nextClassAdmin: "Próxima aula do dia",
    nextClassWith: "é com o(a) aluno(a)",
    timeUndefined: "Horário não definido",
    viewAll: "Ver todas",
  },

  upcomingPayments: {
    title: "Próximos Vencimentos",
    subtitle: "Pagamentos pendentes desta semana",
    noPayments: "Nenhum vencimento próximo",
    dueIn: (date: string) => `Vence em ${date}`,
    viewAll: "Ver todos",
  },

  birthdays: {
    title: "Aniversariantes do Mês",
    subtitle: "Este mês",
    noBirthdays: "Nenhum aniversariante este mês",
    viewAll: "Ver alunos",
  },

  chart: {
    title: "Crescimento",
    titleAdmin: "Crescimento da plataforma",
    titleTeacher: "Evolução de Alunos e Aulas",
    noData: "Nenhum dado disponível ainda",
    currentMonth: "Mês atual (por dia)",
    lastMonths: (n: number) => `Últimos ${n} meses`,
    students: "Alunos",
    teachers: "Professores",
    classes: "Aulas",
    users: "Usuários",
    revenue: "Receita",
    months1: "1 mês",
    months3: "3 meses",
    months6: "6 meses",
    months12: "1 ano",
  },

  pendingFeedback: {
    singular: "aula pendente de feedback",
    plural: "aulas pendentes de feedback",
    viewLink: "Ver e avaliar",
  },

  nextClass: {
    teacher: "Sua próxima aula",
    admin: "Próxima aula do dia",
    withStudent: "é com o(a) aluno(a)",
    timeUndefined: "Horário não definido",
  },
} as const;
