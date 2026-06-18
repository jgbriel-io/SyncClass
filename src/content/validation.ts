/**
 * Mensagens de validação centralizadas para schemas Zod
 * Usado em src/lib/validation/schemas.ts e formulários
 */
export const validation = {
  // Campos obrigatórios
  required: "Campo obrigatório",

  // Telefone
  phoneRequired: "Telefone é obrigatório",
  phoneInvalid: "Telefone inválido (formato: (00) 00000-0000)",
  phoneDigits: "Telefone deve ter entre 7 e 15 dígitos",

  // Email
  emailRequired: "Email é obrigatório",
  emailInvalid: "Email inválido",

  // Data
  dateRequired: "Data é obrigatória",
  dateInvalid: "Data inválida (formato: dd/mm/aaaa)",
  dateFormat: "Formato deve ser dd/mm/aaaa",

  // Valor monetário
  amountRequired: "Valor é obrigatório",
  amountInvalid: "Valor inválido (formato: 0,00)",

  // Nome
  nameMin: "Nome deve ter pelo menos 2 caracteres",
  nameMax: "Nome deve ter no máximo 100 caracteres",

  // Observações/Descrição
  observationsMax: "Máximo 1000 caracteres",
  descriptionMax: "Máximo 500 caracteres",

  // Horário
  timeRequired: "Horário é obrigatório",
  timeInvalid: "Formato inválido (HH:mm)",

  // Nota
  gradeInvalid: "Informe a nota",
  gradeMin: "Nota mínima é 0",
  gradeMax: "Nota máxima é 10",
  gradeRange: "Nota deve estar entre 0 e 10",
  gradeRange100: "Nota deve estar entre 0 e 100",

  // URL
  urlInvalid: "URL inválida",

  // Senha
  passwordMin: "Senha deve ter pelo menos 6 caracteres",
  passwordMismatch: "As senhas não coincidem",

  // Específicos de domínio
  studentRequired: "Selecione um aluno",
  teacherRequired: "Selecione um professor",
  classLogRequired: "Selecione uma aula para vincular",
  dueDateRequired: "Informe a data de vencimento",
  dueDateInvalid: "Data de vencimento inválida",

  // Origem
  originRequired: "Informe como nos encontrou",

  // Localização
  countryRequired: "País é obrigatório",
  stateRequired: "Estado/Região é obrigatório",
  cityRequired: "Cidade é obrigatória",

  // Dia de pagamento
  payDayRange: "Dia de pagamento deve estar entre 1 e 31",

  // Valor por hora
  hourlyRateRequired: "Valor por hora é obrigatório",

  // Data de nascimento
  birthDateRequired: "Data de nascimento é obrigatória",
  birthDateInvalid: "Data de nascimento inválida",

  // Atividades
  titleRequired: "Informe o título da atividade",
  fileRequired: "Selecione ou envie um arquivo",
  feedbackRequired: "Informe o feedback",

  // Aulas
  dateMinYear: "Informe uma data de 2026 em diante",
  endTimeAfterStart: "Horário de término deve ser posterior ao início",
} as const;
