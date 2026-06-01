/**
 * Textos de componentes UI genéricos e empty states
 */
export const ui = {
  emptyStates: {
    students: {
      title: "Nenhum aluno cadastrado",
      description:
        "Comece adicionando seu primeiro aluno para começar a acompanhar aulas e pagamentos.",
      actionLabel: "Adicionar primeiro aluno",
    },
    classes: {
      title: "Nenhuma aula registrada",
      description:
        "Registre as aulas ministradas para acompanhar o progresso e gerar cobranças automaticamente.",
      actionLabel: "Registrar primeira aula",
    },
    financial: {
      title: "Nenhuma cobrança registrada",
      description:
        "As cobranças são criadas ao registrar aulas. Registre uma aula na aba Aulas para gerar cobranças.",
      actionLabel: "Criar primeira cobrança",
    },
    history: {
      title: "Nenhum histórico disponível",
      description:
        "As aulas realizadas aparecerão aqui com suas notas e feedback.",
    },
    search: {
      title: "Nenhum resultado encontrado",
      description: (query: string) =>
        `Não encontramos resultados para "${query}". Tente ajustar os filtros ou termos de busca.`,
      descriptionNoQuery: "Ajuste os filtros para ver os resultados.",
    },
    activities: {
      title: "Nenhuma atividade enviada",
      description:
        "Envie materiais e tarefas para seus alunos. Eles poderão entregar as respostas e você poderá corrigir aqui.",
      actionLabel: "Enviar primeira atividade",
    },
    activitiesStudent: {
      title: "Nenhuma atividade recebida",
      description:
        "Quando seu professor enviar atividades, elas aparecerão aqui para você visualizar e entregar.",
    },
    birthdays: {
      title: "Nenhum aniversariante hoje",
      description: "Não há aniversariantes para hoje.",
    },
    payments: {
      title: "Nenhum pagamento pendente",
      description: "Você está em dia com todos os seus pagamentos.",
    },
  },

  pagination: {
    ariaLabel: "Paginação da tabela",
    previous: "Página anterior",
    next: "Próxima página",
  },

  filters: {
    search: "Busca",
    searchPlaceholder: "Buscar...",
    status: "Status",
    all: "Todos",
    moreFilters: "Mais Filtros",
    clear: "Limpar",
    sort: "Ordenar",
  },

  location: {
    countryPlaceholder: "Buscar país...",
    countryEmpty: "Nenhum país encontrado.",
    statePlaceholder: "Buscar estado...",
    stateEmpty: "Nenhum estado encontrado.",
    stateManualPlaceholder: "Ex: California, Ontario",
    cityPlaceholder: "Buscar cidade...",
    cityEmpty: "Nenhuma cidade encontrada.",
    cityManualPlaceholder: "Ex: Londres, Paris, Nova York",
  },

  // sr-only labels for accessibility
  srOnly: {
    more: "Mais",
    previousSlide: "Slide anterior",
    nextSlide: "Próximo slide",
    close: "Fechar",
  },

  // Comparison text
  comparison: {
    vsPreviousMonth: "vs mês anterior",
  },
} as const;
