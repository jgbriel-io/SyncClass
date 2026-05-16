export const filters = {
  // Generic filter labels
  labels: {
    search: "Busca",
    status: "Status",
    period: "Período",
    sort: "Ordenar",
    privilege: "Privilégio",
    specialization: "Especialidade",
  },

  // Placeholders
  placeholders: {
    search: "Buscar...",
    searchByName: "Buscar por nome...",
    searchByNameOrEmail: "Buscar por nome ou email...",
    searchStudent: "Buscar aluno...",
    status: "Status",
    period: "Período",
    sorting: "Ordenação",
    student: "Aluno",
    teacher: "Professor",
    specialty: "Especialidade",
    privilege: "Privilégio",
  },

  // Button texts
  buttons: {
    moreFilters: "Mais Filtros",
    clear: "Limpar",
  },

  // Financial filters
  financial: {
    labels: {
      search: "Busca",
      searchLabel: "Busca",
      searchPlaceholder: "Buscar por aluno...",
      status: "Status",
      statusLabel: "Status",
      period: "Período",
      periodLabel: "Período",
      student: "Aluno",
      studentLabel: "Aluno",
      sort: "Ordenar",
      sortLabel: "Ordenar",
    },
    status: {
      all: "Todos",
      pending: "Pendente",
      paid: "Pago",
      overdue: "Atrasado",
      validating: "Validando",
    },
    period: {
      all: "Todos",
      today: "Hoje",
      thisWeek: "Esta semana",
      thisMonth: "Este mês",
    },
    sort: {
      dueAsc: "Vencimento (mais próximo)",
      dueDesc: "Vencimento (mais distante)",
      amountDesc: "Valor (maior)",
      amountAsc: "Valor (menor)",
      createdDesc: "Criação (mais recente)",
      createdAsc: "Criação (mais antiga)",
    },
  },

  // Activities filters
  activities: {
    labels: {
      search: "Busca",
      status: "Status",
      student: "Aluno",
      teacher: "Professor",
      period: "Período",
      sort: "Ordenar",
    },
    status: {
      all: "Todos",
      sent: "Enviada",
      overdue: "Vencida",
      delivered: "Entregue",
      corrected: "Corrigida",
    },
    period: {
      all: "Todos",
      week: "Esta semana",
      month: "Este mês",
      threeMonths: "Últimos 3 meses",
    },
    sort: {
      dueAsc: "Prazo (mais próximo)",
      dueDesc: "Prazo (mais distante)",
      createdDesc: "Enviada (mais recente)",
      createdAsc: "Enviada (mais antiga)",
      studentAsc: "Aluno (A-Z)",
      studentDesc: "Aluno (Z-A)",
    },
    options: {
      allStudents: "Todos os alunos",
      allTeachers: "Todos os professores",
    },
  },

  // Overview filters
  overview: {
    labels: {
      search: "Busca",
      status: "Status",
      period: "Período",
      teacher: "Professor",
      student: "Aluno",
      sort: "Ordenar",
    },
    status: {
      all: "Todos",
      active: "Ativos",
      inactive: "Inativos",
    },
    period: {
      all: "Todos",
      last7Days: "Últimos 7 dias",
      last30Days: "Últimos 30 dias",
      last90Days: "Últimos 90 dias",
    },
    sort: {
      recent: "Crescimento (mais recentes)",
      oldest: "Antigos primeiro",
      nameAsc: "Nome (A-Z)",
      nameDesc: "Nome (Z-A)",
    },
    options: {
      allTeachers: "Todos os professores",
      allStudents: "Todos os alunos",
    },
  },

  // Users filters
  users: {
    labels: {
      search: "Busca",
      privilege: "Privilégio",
      status: "Status",
      sort: "Ordenar",
    },
    privilege: {
      all: "Todos",
      admin: "Admin",
      teacher: "Professor",
      student: "Aluno",
    },
    status: {
      all: "Todos",
      active: "Ativos",
      inactive: "Arquivados",
    },
    sort: {
      createdDesc: "Cadastro (mais recente)",
      createdAsc: "Cadastro (mais antigo)",
      nameAsc: "Nome (A-Z)",
      nameDesc: "Nome (Z-A)",
    },
  },

  // Students filters
  students: {
    labels: {
      search: "Busca",
      status: "Status",
      additionalFilters: "Filtros adicionais",
      teacher: "Professor",
      sort: "Ordenar",
    },
    status: {
      all: "Todos",
      active: "Ativos",
      inactive: "Arquivados",
    },
    additionalFilters: {
      all: "Todos",
      birthdays: "Aniversariantes do mês",
    },
    sort: {
      nameAsc: "Nome (A-Z)",
      nameDesc: "Nome (Z-A)",
      lastPaymentDesc: "Último pagamento (mais recente)",
      lastPaymentAsc: "Último pagamento (mais antigo)",
    },
    options: {
      allTeachers: "Todos os professores",
    },
  },

  // Teachers filters
  teachers: {
    labels: {
      search: "Busca",
      status: "Status",
      sort: "Ordenar",
      specialization: "Especialidade",
    },
    status: {
      all: "Todos",
      active: "Ativos",
      inactive: "Arquivados",
    },
    sort: {
      nameAsc: "Nome (A-Z)",
      nameDesc: "Nome (Z-A)",
    },
    options: {
      allSpecializations: "Todas",
    },
  },

  // Classes filters (reference - already centralized)
  classes: {
    labels: {
      search: "Busca",
      searchLabel: "Busca",
      searchPlaceholder: "Buscar por título ou aluno...",
      status: "Status",
      statusLabel: "Status",
      student: "Aluno",
      studentLabel: "Aluno",
      sort: "Ordenar",
      sortLabel: "Ordenar",
      teacher: "Professor",
      teacherLabel: "Professor",
      type: "Tipo",
      typeLabel: "Tipo",
      period: "Período",
      periodLabel: "Período",
    },
    status: {
      open: "Em aberto",
      all: "Todos",
      scheduled: "Agendada",
      pending: "Pendente",
      done: "Concluída",
    },
    sort: {
      recent: "Mais recente",
      oldest: "Mais antigo",
    },
    type: {
      all: "Todos",
      package: "Pacote",
      individual: "Individual",
    },
    period: {
      all: "Todos",
      week: "Esta semana",
      month: "Este mês",
      threeMonths: "Últimos 3 meses",
    },
    options: {
      allStudents: "Todos os alunos",
      allTeachers: "Todos os professores",
    },
  },
} as const;
