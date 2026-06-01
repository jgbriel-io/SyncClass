// Conteúdo estático das seções de políticas da plataforma

export const privacyPolicy = {
  title: "Política de Privacidade",
  intro:
    "A English School Platform está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).",
  sections: [
    {
      heading: "Dados Coletados",
      items: [
        "Nome completo, email e telefone para cadastro",
        "Histórico de aulas e pagamentos",
        "Atividades e avaliações acadêmicas",
      ],
    },
    {
      heading: "Uso dos Dados",
      items: [
        "Gestão de aulas e agendamentos",
        "Controle financeiro e emissão de cobranças",
        "Comunicação sobre aulas e atividades",
        "Melhoria dos serviços educacionais",
      ],
    },
    {
      heading: "Segurança",
      text: "Seus dados são protegidos por criptografia e armazenados em servidores seguros. Implementamos controles de acesso rigorosos (RLS) para garantir que cada usuário veja apenas seus próprios dados.",
    },
    {
      heading: "Compartilhamento",
      text: "Seus dados pessoais NÃO são compartilhados com terceiros. Apenas professores vinculados têm acesso aos dados de seus alunos, e vice-versa, exclusivamente para fins educacionais.",
    },
  ],
} as const;

export const userRights = {
  title: "Seus Direitos (LGPD)",
  intro: "Conforme a LGPD, você tem direito a:",
  rights: [
    {
      label: "Acesso",
      description: "Consultar seus dados pessoais armazenados",
    },
    {
      label: "Correção",
      description: "Atualizar dados incompletos ou incorretos",
    },
    {
      label: "Exclusão",
      description: "Solicitar a remoção de seus dados pessoais",
    },
    {
      label: "Portabilidade",
      description: "Receber seus dados em formato estruturado",
    },
    {
      label: "Revogação",
      description: "Retirar consentimento a qualquer momento",
    },
  ],
  notice:
    "Entre em contato com o administrador da plataforma através do email cadastrado ou solicite diretamente ao seu professor.",
  noticeLabel: "Como exercer seus direitos:",
} as const;

export const dataRetention = {
  title: "Retenção de Dados",
  intro:
    "Em caso de solicitação de exclusão de dados, seguimos o seguinte procedimento:",
  sections: [
    {
      heading: "Exclusão Imediata",
      text: "Seus dados pessoais identificáveis (nome, telefone, email) são anonimizados imediatamente após a solicitação.",
      highlight: "anonimizados imediatamente",
    },
    {
      heading: "Retenção Fiscal (5 anos)",
      text: "Conforme legislação fiscal brasileira, mantemos dados anonimizados de transações financeiras por 5 anos para fins de auditoria contábil. Estes dados não permitem sua identificação pessoal.",
    },
    {
      heading: "Exclusão Definitiva",
      text: "Após 5 anos, todos os dados são excluídos definitivamente do sistema, incluindo histórico de aulas e cobranças.",
    },
  ],
} as const;

export const termsOfUse = {
  title: "Termos de Uso",
  sections: [
    {
      heading: "Responsabilidades do Usuário",
      items: [
        "Manter suas credenciais de acesso em sigilo",
        "Fornecer informações verdadeiras e atualizadas",
        "Utilizar a plataforma apenas para fins educacionais",
        "Respeitar direitos autorais de materiais didáticos",
      ],
    },
    {
      heading: "Uso Proibido",
      items: [
        "Compartilhar conta com terceiros",
        "Tentar acessar dados de outros usuários",
        "Realizar atividades ilegais ou fraudulentas",
        "Sobrecarregar ou prejudicar o funcionamento da plataforma",
      ],
    },
    {
      heading: "Modificações",
      text: "Reservamo-nos o direito de modificar estas políticas a qualquer momento. Usuários serão notificados sobre mudanças significativas.",
    },
  ],
  contactTitle: "Dúvidas ou Solicitações?",
  contactText:
    "Para exercer seus direitos, esclarecer dúvidas ou fazer solicitações relacionadas aos seus dados pessoais, entre em contato com o administrador da plataforma.",
  lastUpdated: "Última atualização: 16 de fevereiro de 2026",
} as const;
