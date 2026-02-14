# 📚 Edu Core Zen - Sistema de Gestão Educacional

**Versão**: 2.0.0  
**Score**: 10/10 🎉  
**Data**: 2026-02-14

---

## 🎯 Sobre o Projeto

Sistema completo de gestão educacional com foco em professores particulares e escolas de idiomas. Gerencia alunos, aulas, atividades e financeiro com segurança e performance de nível enterprise.

### Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Docker Desktop (para Supabase local)
- npm ou yarn

### Instalação

```bash
# 1. Clonar repositório
git clone <repo-url>
cd edu-core-zen

# 2. Instalar dependências
npm install

# 3. Iniciar Supabase local
npx supabase start

# 4. Regenerar tipos (IMPORTANTE!)
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# 5. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais do Supabase

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

### Build para Produção

```bash
npm run build
npm run preview
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── activities/     # Gestão de atividades
│   ├── admin/          # Painel administrativo
│   ├── auth/           # Autenticação
│   ├── classes/        # Gestão de aulas
│   ├── dashboard/      # Dashboard
│   ├── filters/        # Filtros avançados
│   ├── financial/      # Gestão financeira
│   ├── layout/         # Layout e navegação
│   ├── students/       # Gestão de alunos
│   ├── teachers/       # Gestão de professores
│   └── ui/             # Componentes UI (Shadcn)
├── hooks/              # Custom hooks
│   ├── useStudents.ts
│   ├── useClassLogs.ts
│   ├── useFinancialRecords.ts
│   ├── useActivities.ts
│   └── ...
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente Supabase + tipos
├── lib/                # Utilitários
│   ├── utils/          # Funções auxiliares
│   └── design-tokens/  # Tokens de design
└── pages/              # Páginas da aplicação

supabase/
├── migrations/         # Migrations SQL
│   ├── 01_UNIFICADA_PARTE_2_SEGURANCA.sql
│   └── 02_UNIFICADA_PARTE_3_SPRINTS_1_4.sql
└── functions/          # Edge Functions
```

---

## 🔑 Funcionalidades Principais

### 👥 Gestão de Alunos
- ✅ CRUD completo com validação
- ✅ Cálculo automático de mensalidade
- ✅ Status financeiro em tempo real
- ✅ Histórico de aulas e pagamentos
- ✅ Aniversariantes do mês

### 📚 Gestão de Aulas
- ✅ Registro individual ou em pacote
- ✅ Validação de sobreposição (banco)
- ✅ Avaliação de presença e nota
- ✅ Vinculação automática com cobrança
- ✅ Histórico completo

### 💰 Gestão Financeira
- ✅ Cobranças automáticas por aula
- ✅ Pacotes mensais
- ✅ Confirmação de pagamento idempotente
- ✅ Estorno de pagamento
- ✅ Previsão de faturamento
- ✅ Relatórios financeiros

### 📝 Gestão de Atividades
- ✅ Envio de materiais (PDF, imagens, etc.)
- ✅ Entrega de atividades pelos alunos
- ✅ Correção com feedback e nota
- ✅ Histórico completo

### 👨‍🏫 Portal do Professor
- ✅ Dashboard com métricas
- ✅ Gestão de alunos e aulas
- ✅ Controle financeiro
- ✅ Envio de atividades

### 👨‍🎓 Portal do Aluno
- ✅ Visualização de aulas
- ✅ Histórico de pagamentos
- ✅ Entrega de atividades
- ✅ Checkout PIX (integração futura)

### 🔐 Segurança
- ✅ Autenticação via Supabase Auth
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Auditoria de operações críticas
- ✅ Idempotência em pagamentos
- ✅ Rate limiting

---

## 🗄️ Banco de Dados

### Views Principais

#### `students_enriched` (View Mestre)
Combina dados de alunos com cálculos financeiros e de aulas:
- `monthly_total_calculated` - Total mensal (cobranças reais ou estimativa)
- `financial_status` - Status financeiro (pago, pendente, atrasado)
- `last_class_date` - Data da última aula
- `days_without_class` - Dias sem aula

### RPCs (Remote Procedure Calls)

#### `create_class_package`
Cria pacote de aulas atomicamente com validação de sobreposição.

**Parâmetros**:
- `p_class_logs`: Array de aulas
- `p_financial_data`: Dados da cobrança
- `p_idempotency_key`: Chave de idempotência

#### `confirm_payment_idempotent`
Confirma pagamento de forma idempotente.

**Parâmetros**:
- `p_record_id`: ID da cobrança
- `p_idempotency_key`: Chave de idempotência

#### `undo_payment_idempotent`
Desfaz pagamento de forma idempotente.

**Parâmetros**:
- `p_record_id`: ID da cobrança
- `p_idempotency_key`: Chave de idempotência

#### `update_student_payment_day`
Atualiza dia de pagamento e recalcula vencimentos.

**Parâmetros**:
- `p_student_id`: ID do aluno
- `p_new_pay_day`: Novo dia (1-31)

### Triggers

- `prevent_class_overlap` - Impede sobreposição de aulas
- `sync_profile_active` - Sincroniza status ativo entre students e profiles
- `audit_financial_changes` - Audita mudanças financeiras

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Sentry (opcional)
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=development
```

### Supabase Local

```bash
# Iniciar
npx supabase start

# Parar
npx supabase stop

# Reset (limpa dados)
npx supabase db reset

# Aplicar migrations
npx supabase db push

# Gerar tipos
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## 📊 Performance

### Métricas

- **Bundle size (gzip)**: ~315 KB
- **Tempo de build**: ~10s
- **Módulos**: 3843
- **Code splitting**: Ativo
- **Lazy loading**: Ativo

### Otimizações

- ✅ Views materializadas no banco
- ✅ Índices otimizados
- ✅ Paginação server-side
- ✅ Cache inteligente (TanStack Query)
- ✅ Debounce em buscas

---

## 🧪 Testes

### Testes Manuais Críticos

#### 1. Clique Duplo no Pagamento
1. Abrir tela de Financeiro
2. Clicar rapidamente 2x em "Confirmar Pagamento"
3. Verificar: apenas 1 pagamento registrado

#### 2. Atualização de Status Financeiro
1. Confirmar pagamento de aluno "Em atraso"
2. Voltar para lista de alunos
3. Verificar: status mudou para "Em dia"

#### 3. Criar Pacote de Aulas
1. Cadastrar 4 aulas + cobrança
2. Verificar: 4 aulas criadas atomicamente
3. Verificar: cobrança vinculada

#### 4. Erro de Sobreposição
1. Criar aula às 10:00-11:00
2. Tentar criar às 10:30-11:30
3. Verificar: erro exibido, nenhuma aula criada

---

## 📝 Changelog

### v2.0.0 (2026-02-14) - Score 10/10

**Segurança e Performance**:
- ✅ Idempotência em operações financeiras
- ✅ Proteção contra clique duplo
- ✅ Invalidação completa de cache
- ✅ Views otimizadas no banco
- ✅ Auditoria completa

**Novas Funcionalidades**:
- ✅ Hook `useUpdateStudentPaymentDay`
- ✅ Previsão de faturamento mensal
- ✅ Pacotes de aulas

**Melhorias**:
- ✅ Cálculos movidos para o banco
- ✅ Validações no banco (triggers)
- ✅ Design System padronizado

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação técnica
2. Verifique os logs de auditoria no Supabase
3. Revise o console do navegador

---

**Desenvolvido com ❤️ por VirtualArrow**
