# Análise Completa dos Modais (Sheets e Dialogs)

## 📊 RESUMO EXECUTIVO

**Total de Modais**: 17 componentes
- **Sheets (laterais)**: 6 componentes - Deslizam do lado direito
- **Dialogs (centrais)**: 11 componentes - Aparecem no centro da tela

**Acionamento**: 
- Sheets: Botão "Eye" (👁️) nas tabelas ou menu lateral (Sidebar)
- Dialogs: Botões de ação (Adicionar, Editar, Enviar, etc)

---

## 🗂️ CATEGORIZAÇÃO

### 🔵 SHEETS (Modais Laterais - 6)
Usam `Sheet` do shadcn/ui - Deslizam da direita

### 🟢 DIALOGS (Modais Centrais - 11)
Usam `Dialog` do shadcn/ui - Aparecem no centro

---

## 🔵 SHEETS (MODAIS LATERAIS)

### Características dos Sheets:
- Deslizam da direita para esquerda
- Ocupam parte ou toda a largura da tela
- Usam `ScrollArea` para conteúdo longo
- Geralmente para **visualização** de informações
- Fecham com overlay ou botão X

---

## 🗂️ INVENTÁRIO COMPLETO - SHEETS

### 1. **StudentDetailSheet** ⭐ (MAIS COMPLETO)
**Arquivo**: `src/components/admin/StudentDetailSheet.tsx`  
**Usado em**: 
- `src/components/students/StudentsListView.tsx` (Alunos)
- `src/components/overview/OverviewView.tsx` (Visão Geral)

**Estrutura**: 4 Tabs
- 📋 **Dados**: Informações pessoais completas
  - Stats cards (Frequência, Média)
  - Dados pessoais (CPF, Email, Telefone, Data nascimento)
  - Localização (Cidade/UF)
  - Plano de aulas (Valor/hora, Aulas/semana, Total mensal, Dia pagamento)
  - Origem (Indicação, Google, Instagram, etc)
  
- 📚 **Aulas**: Histórico de aulas
  - Summary cards (Total, Presenças, Faltas)
  - Lista de aulas com `ClassHistoryList`
  - Agrupamento por mês
  
- 📝 **Atividades**: Lista de atividades do aluno
  - Cards expansivos (Collapsible)
  - Material da atividade
  - Resposta do aluno
  - Feedback/correção (se corrigida)
  - **Formulário inline de correção** (se entregue)
  
- 💰 **Financeiro**: Extrato financeiro
  - Usa `StudentStatementTab`
  - Histórico de pagamentos

**Funcionalidades Especiais**:
- ✅ Correção de atividades inline (formulário dentro do sheet)
- ✅ Download de arquivos (atividades, respostas, correções)
- ✅ Visualização de arquivos na web (botão Eye)
- ✅ Upload de arquivo de correção
- ✅ Validação de nota (0-10)

**Props**:
```typescript
{
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId?: string | null; // Filtra atividades por professor
}
```

---

### 2. **TeacherDetailSheet**
**Arquivo**: `src/components/admin/TeacherDetailSheet.tsx`  
**Usado em**: `src/pages/admin/Teachers.tsx`

**Estrutura**: 3 Tabs
- 📋 **Informações**: Dados pessoais
  - Email, Telefone, CPF
  - Data de cadastro
  
- 👥 **Alunos**: Lista de alunos ativos (N)
  - Nome, contato
  - Valor/hora, Aulas/semana
  
- 📊 **Estatísticas**: Métricas do professor
  - Total de Alunos
  - Total de Aulas
  - Valor Recebido (total)
  - Média por Aula

**Props**:
```typescript
{
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### 3. **UserDetailSheet**
**Arquivo**: `src/components/admin/UserDetailSheet.tsx`  
**Usado em**: `src/pages/admin/Users.tsx`

**Estrutura**: 2 Tabs
- 📋 **Informações**: Dados da conta
  - Email
  - Privilégio (Admin/Professor/Aluno) - Badge colorido
  - Status (Ativo/Inativo)
  - Data de criação
  - Data de atualização
  
- 🔗 **Vínculos**: Perfis vinculados
  - Aluno vinculado (se houver)
  - Professor vinculado (se houver)
  - Mostra nome, contato, status de cada vínculo

**Lógica de Role**:
- Prioriza role armazenado (admin/teacher/student)
- Fallback para vínculo (se tem linkedTeacher → teacher)
- Badge com cores diferentes por role

**Props**:
```typescript
{
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### 4. **ClassDetailSheet**
**Arquivo**: `src/components/classes/ClassDetailSheet.tsx`  
**Usado em**: `src/components/classes/ClassesView.tsx`

**Estrutura**: Single page (sem tabs)
- 📅 **Data e horário**: Data + range de horário (HH:mm às HH:mm)
- ⏱️ **Duração**: Formatado (ex: 1h 30min)
- 📖 **Nota / Presença**: Nota ou "Não compareceu"
- 💳 **Financeiro**: Status de pagamento + valor + vencimento
- 💬 **Feedback**: Texto do feedback (se houver)
- 👨‍🏫 **Professor**: Nome (se `showTeacherColumn=true`)

**Funcionalidades**:
- Status badge dinâmico (Agendada, Avaliação Pendente, Concluída)
- Status financeiro (Pago, Pendente, Atrasado)
- Formatação de duração inteligente

**Props**:
```typescript
{
  classLog: ClassLogWithStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTeacherColumn?: boolean; // Visão admin
  teacherName?: string;
}
```

---

### 5. **ActivityDetailSheet**
**Arquivo**: `src/components/activities/ActivityDetailSheet.tsx`  
**Usado em**: `src/components/activities/ActivitiesView.tsx`

**Estrutura**: Single page (sem tabs)
- 📅 **Data de envio**: Timestamp completo
- ⏰ **Prazo de entrega**: Data limite (se houver)
- 📝 **Descrição**: Texto da atividade
- 📎 **Arquivo da atividade**: Download + Visualizar
- 📤 **Resposta do aluno**: Texto + arquivo (se entregue)
- ✅ **Feedback/Correção**: Nota + feedback + arquivo (se corrigida)

**Funcionalidades Especiais**:
- ✅ **Formulário de correção inline** (se status = "entregue")
- ✅ Modo inicial de correção (`initialCorrectionMode`)
- ✅ Upload de arquivo de correção
- ✅ Validação de nota (0-10)
- ✅ Botões Eye + Download para todos os arquivos
- ✅ Callback `onCorrectionSuccess` para refetch

**Props**:
```typescript
{
  activity: ActivityWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (filePath: string, fileName: string) => void;
  getStatusLabel: (activity) => string;
  getStatusVariant: (activity) => BadgeVariant;
  initialCorrectionMode?: boolean; // Abre já no modo correção
  onCorrectionSuccess?: () => void; // Callback após correção
}
```

---

### 6. **Sidebar** (Mobile)
**Arquivo**: `src/components/ui/sidebar.tsx`  
**Usado em**: Todos os layouts (Admin, Teacher, Student)

**Estrutura**: Sheet usado para navegação mobile
- Menu lateral completo
- Navegação entre páginas
- Só aparece em mobile (responsivo)

**Funcionalidades**:
- ✅ Navegação completa do sistema
- ✅ Fecha automaticamente ao navegar
- ✅ Overlay escuro

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // + props do Sidebar
}
```

---

## 🟢 DIALOGS (MODAIS CENTRAIS)

### Características dos Dialogs:
- Aparecem no centro da tela
- Tamanho fixo (sm, md, lg)
- Geralmente para **ações** (criar, editar, enviar)
- Formulários com validação
- Botões de ação (Salvar, Cancelar)

---

## 🗂️ INVENTÁRIO COMPLETO - DIALOGS

### 1. **SettingsModal**
**Arquivo**: `src/components/layout/SettingsModal.tsx`  
**Usado em**: Todos os layouts (botão de configurações)

**Estrutura**: 3 Tabs
- 👤 **Perfil**: Avatar, nome, email
  - Upload de foto (max 5MB, 512x512px)
  - Remover foto
  - Dados read-only
  
- 🔒 **Senha**: Alteração de senha
  - Senha atual
  - Nova senha (min 6 caracteres)
  - Confirmar senha
  - Validação inline
  - Logout automático após alteração
  
- 🎨 **Preferências**: Em breve
  - Tema, idioma, notificações

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### 2. **StudentFormDialog**
**Arquivo**: `src/components/students/StudentFormDialog.tsx`  
**Usado em**: Página de Alunos

**Funcionalidade**: Criar/Editar aluno
- Dados pessoais (nome, CPF, email, telefone, nascimento)
- Localização (cidade, estado)
- Plano de aulas (valor/hora, aulas/semana, dia pagamento)
- Professor vinculado
- Origem (indicação, google, instagram, etc)
- Status (ativo/arquivado)

**Tamanho**: `sm:max-w-lg` (512px)

---

### 3. **TeacherFormDialog**
**Arquivo**: `src/components/teachers/TeacherFormDialog.tsx`  
**Usado em**: Página de Professores

**Funcionalidade**: Criar/Editar professor
- Dados pessoais (nome, CPF, email, telefone)
- Status (ativo/arquivado)

**Tamanho**: `sm:max-w-lg` (512px)

---

### 4. **UserFormDialog**
**Arquivo**: `src/components/users/UserFormDialog.tsx`  
**Usado em**: Página de Usuários

**Funcionalidade**: Criar/Editar usuário
- Email
- Senha (apenas criação)
- Privilégio (admin/professor/aluno)
- Vínculo com aluno/professor (se aplicável)
- Status (ativo/arquivado)

**Tamanho**: `sm:max-w-md` (448px) para admin, `sm:max-w-lg` (512px) para outros

---

### 5. **FinancialFormDialog**
**Arquivo**: `src/components/financial/FinancialFormDialog.tsx`  
**Usado em**: Página Financeiro

**Funcionalidade**: Criar/Editar cobrança
- Aluno
- Valor
- Vencimento
- Status (pendente/pago/atrasado)
- Método de pagamento
- Descrição

**Tamanho**: `sm:max-w-md` (448px)

---

### 6. **ClassLogFormDialog**
**Arquivo**: `src/components/classes/ClassLogFormDialog.tsx`  
**Usado em**: Página de Aulas

**Funcionalidade**: Criar/Editar aula individual
- Aluno
- Data da aula
- Horário (início e fim)
- Duração (calculada automaticamente)
- Título
- Presença (sim/não)
- Nota (0-10)
- Feedback
- Valor cobrado
- Vencimento

**Tamanho**: `sm:max-w-md` (448px)

---

### 7. **PackageClassesDialog**
**Arquivo**: `src/components/classes/PackageClassesDialog.tsx`  
**Usado em**: Página de Aulas

**Funcionalidade**: Criar pacote de aulas
- Aluno
- Tipo de pacote (fixo/dinâmico)
- **Fixo**: Dias da semana + horários fixos
- **Dinâmico**: Quantidade de aulas + período
- Valor total
- Vencimento
- Gera múltiplas aulas automaticamente

**Tamanho**: `sm:max-w-lg` (512px)

---

### 8. **PostClassDialog**
**Arquivo**: `src/components/classes/PostClassDialog.tsx`  
**Usado em**: Página de Aulas

**Funcionalidade**: Lançar aula (marcar presença/nota)
- Presença (sim/não)
- Nota (0-10)
- Feedback
- Confirmação de cobrança

**Tamanho**: `sm:max-w-md` (448px)

---

### 9. **SendActivityDialog**
**Arquivo**: `src/components/activities/SendActivityDialog.tsx`  
**Usado em**: Página de Atividades

**Funcionalidade**: Enviar nova atividade
- Aluno
- Título
- Descrição
- Arquivo (upload)
- Prazo de entrega

**Tamanho**: `sm:max-w-md` (448px)

---

### 10. **EditActivityDialog**
**Arquivo**: `src/components/activities/EditActivityDialog.tsx`  
**Usado em**: Página de Atividades

**Funcionalidade**: Editar atividade existente
- Título
- Descrição
- Prazo de entrega
- Substituir arquivo (opcional)

**Tamanho**: `sm:max-w-md` (448px)

---

### 11. **AddCorrectionDialog**
**Arquivo**: `src/components/activities/AddCorrectionDialog.tsx`  
**Usado em**: Página de Atividades

**Funcionalidade**: Adicionar correção a atividade
- Feedback (texto)
- Nota (0-10)
- Arquivo de correção (opcional)

**Tamanho**: `sm:max-w-md` (448px)

---

### 12. **DeliverActivityDialog** (Aluno)
**Arquivo**: `src/components/activities/DeliverActivityDialog.tsx`  
**Usado em**: Página de Atividades do Aluno

**Funcionalidade**: Entregar atividade
- Resposta (texto)
- Arquivo de resposta (upload)

**Tamanho**: `max-w-2xl` (672px)

---

## 📐 PADRÕES IDENTIFICADOS

### Sheets vs Dialogs

| Tipo | Uso | Tamanho | Posição | Scroll |
|------|-----|---------|---------|--------|
| **Sheet** | Visualização | Variável (lg-2xl) | Lateral direita | ScrollArea |
| **Dialog** | Ação/Formulário | Fixo (md-lg) | Centro | Overflow-y-auto |

### Estrutura Comum
```typescript
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="w-full sm:max-w-[tamanho] p-0 flex flex-col">
    <SheetHeader className="p-6 pb-4 border-b">
      <SheetTitle>...</SheetTitle>
    </SheetHeader>
    
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Conteúdo */}
      </div>
    </ScrollArea>
  </SheetContent>
</Sheet>
```

### Tamanhos Padrão
- **StudentDetailSheet**: `sm:max-w-xl` (640px)
- **TeacherDetailSheet**: `sm:max-w-2xl` (672px)
- **UserDetailSheet**: `sm:max-w-2xl` (672px)
- **ClassDetailSheet**: `sm:max-w-lg` (512px)
- **ActivityDetailSheet**: `sm:max-w-lg` (512px)

### Componentes Reutilizados
- ✅ `StatusBadge` - Todos usam
- ✅ `ScrollArea` - Todos usam
- ✅ `Skeleton` - Loading states (Student, Teacher, User)
- ✅ `Tabs` - Navegação (Student, Teacher, User)
- ✅ `Card` - Agrupamento de informações
- ✅ `Collapsible` - Expansão de conteúdo (Student - atividades)

---

## 🎨 DESIGN PATTERNS

### 1. **Tabs vs Single Page**
- **Com Tabs** (3): Student (4 tabs), Teacher (3 tabs), User (2 tabs)
- **Single Page** (2): Class, Activity

**Critério**: Quantidade de informação
- Muita informação → Tabs
- Informação focada → Single page

### 2. **Loading States**
- Student, Teacher, User: Skeleton components
- Class, Activity: Não mostram loading (assumem dados já carregados)

### 3. **Status Badges**
- Todos têm badge de status no header
- Cores consistentes:
  - `success` → Verde (Ativo, Pago, Corrigida)
  - `warning` → Amarelo (Pendente)
  - `destructive` → Vermelho (Atrasado, Inativo)
  - `info` → Azul (Professor)
  - `default` → Cinza (Outros)

### 4. **Ícones Semânticos**
- 👤 User → Dados pessoais
- 📧 Mail → Email
- 📞 Phone → Telefone
- 📅 Calendar → Datas
- 💳 CreditCard → Financeiro
- 📚 BookOpen → Aulas
- 📊 TrendingUp → Estatísticas
- 🔗 Link2 → Vínculos

---

## 🔄 FLUXOS DE INTERAÇÃO

### Fluxo 1: Visualizar Detalhes
```
Tabela → Botão Eye → Sheet abre → Visualiza informações → Fecha
```

### Fluxo 2: Corrigir Atividade (Student/Activity Sheet)
```
Tabela → Botão "Corrigir" → Sheet abre em modo correção
→ Preenche formulário → Envia → Refetch → Sheet atualiza
```

### Fluxo 3: Download de Arquivos
```
Sheet aberto → Botão Download → Abre arquivo em nova aba
```

---

## 📊 COMPARAÇÃO DE COMPLEXIDADE

### Sheets (Visualização)
| Sheet | Tabs | Formulários | Downloads | Complexidade |
|-------|------|-------------|-----------|--------------|
| **Student** | 4 | ✅ (Correção) | ✅ (3 tipos) | ⭐⭐⭐⭐⭐ |
| **Activity** | 0 | ✅ (Correção) | ✅ (3 tipos) | ⭐⭐⭐⭐ |
| **Teacher** | 3 | ❌ | ❌ | ⭐⭐⭐ |
| **User** | 2 | ❌ | ❌ | ⭐⭐ |
| **Class** | 0 | ❌ | ❌ | ⭐⭐ |
| **Sidebar** | 0 | ❌ | ❌ | ⭐ |

### Dialogs (Ação/Formulário)
| Dialog | Campos | Upload | Validação | Complexidade |
|--------|--------|--------|-----------|--------------|
| **Settings** | 3 tabs | ✅ (Avatar) | ✅ (Senha) | ⭐⭐⭐⭐ |
| **PackageClasses** | 10+ | ❌ | ✅ (Complexa) | ⭐⭐⭐⭐⭐ |
| **Student** | 12 | ❌ | ✅ | ⭐⭐⭐⭐ |
| **ClassLog** | 10 | ❌ | ✅ | ⭐⭐⭐ |
| **SendActivity** | 5 | ✅ | ✅ | ⭐⭐⭐ |
| **DeliverActivity** | 2 | ✅ | ✅ | ⭐⭐ |
| **Teacher** | 4 | ❌ | ✅ | ⭐⭐ |
| **User** | 4-5 | ❌ | ✅ | ⭐⭐ |
| **Financial** | 6 | ❌ | ✅ | ⭐⭐ |
| **PostClass** | 3 | ❌ | ✅ | ⭐⭐ |
| **EditActivity** | 4 | ✅ | ✅ | ⭐⭐ |
| **AddCorrection** | 3 | ✅ | ✅ | ⭐⭐ |

---

## 🎯 OPORTUNIDADES DE MELHORIA

### 1. **Padronização de Tamanhos**
- Considerar usar tamanhos consistentes (ex: todos `sm:max-w-2xl`)
- Ou criar sistema de tamanhos (S, M, L, XL)

### 2. **Loading States Consistentes**
- Class e Activity poderiam ter Skeleton também
- Ou remover Skeleton dos outros (se dados sempre vêm rápido)

### 3. **Componentes Reutilizáveis**
- Criar `DetailSheetHeader` comum
- Criar `DetailSheetSection` para seções com ícone + título
- Criar `FileDownloadCard` para arquivos (usado em 2 sheets)

### 4. **Formulários**
- Extrair formulário de correção para componente separado
- Reutilizar entre Student e Activity sheets

### 5. **Testes**
- Nenhum sheet tem testes ainda
- Criar testes para cada um (renderização, tabs, formulários)

---

## 🚀 PRÓXIMOS PASSOS SUGERIDOS

1. ✅ **Documentação completa** (este arquivo)
2. 🔄 **Padronizar tamanhos** dos sheets
3. 🔄 **Criar componentes reutilizáveis** (Header, Section, FileCard)
4. 🔄 **Adicionar testes unitários** para cada sheet
5. 🔄 **Melhorar acessibilidade** (ARIA labels, keyboard navigation)
6. 🔄 **Otimizar performance** (lazy loading de tabs pesadas)

---

## 📝 NOTAS TÉCNICAS

### Dependências Principais
- `@/components/ui/sheet` (shadcn/ui)
- `@/components/ui/tabs` (shadcn/ui)
- `@/components/ui/scroll-area` (shadcn/ui)
- `react-hook-form` + `zod` (formulários)
- `date-fns` (formatação de datas)
- `lucide-react` (ícones)

### Hooks Customizados Usados
- `useStudentDetails` (Student)
- `useTeachers` (Teacher)
- `useUsersPaginated` (User)
- `useClassLogs` (Class)
- `useActivities` (Student, Activity)
- `useAddActivityCorrection` (Student, Activity)

### Performance
- Todos usam `useMemo` para cálculos pesados
- ScrollArea evita re-renders desnecessários
- Lazy loading de arquivos (download on-demand)

---

## 📈 ESTATÍSTICAS GERAIS

### Por Tipo
- **Sheets**: 6 componentes (35%)
- **Dialogs**: 11 componentes (65%)

### Por Funcionalidade
- **Visualização**: 6 (Sheets)
- **Criação**: 7 (Dialogs)
- **Edição**: 4 (Dialogs)
- **Configuração**: 1 (Dialog)

### Por Complexidade
- ⭐⭐⭐⭐⭐ (Muito Alta): 2 componentes
- ⭐⭐⭐⭐ (Alta): 4 componentes
- ⭐⭐⭐ (Média): 4 componentes
- ⭐⭐ (Baixa): 6 componentes
- ⭐ (Muito Baixa): 1 componente

### Recursos Especiais
- **Upload de arquivos**: 6 componentes
- **Tabs**: 4 componentes
- **Validação complexa**: 8 componentes
- **Download de arquivos**: 2 componentes
- **Formulários inline**: 2 componentes

---

**Última atualização**: 13/02/2026  
**Total de componentes**: 17 modais  
**Total de linhas analisadas**: ~6.000 linhas de código


---

## 📊 STATUS DA REFATORAÇÃO (Atualizado em 13/02/2026)

### ✅ Componentes Base Criados
- `src/components/ui/custom/BaseDetailSheet.tsx` - Wrapper reutilizável para todos os Sheets
- `src/components/ui/custom/DetailSection.tsx` - Helper para seções de detalhes

### ✅ Sheets Refatorados (5/5 Detail Sheets)
1. **ClassDetailSheet** ✅ - size: default (512px) - Refatorado
2. **UserDetailSheet** ✅ - size: xl (672px) - Refatorado
3. **TeacherDetailSheet** ✅ - size: xl (672px) - Refatorado
4. **ActivityDetailSheet** ✅ - size: default (512px) - Refatorado
5. **StudentDetailSheet** ✅ - size: lg (640px) - Refatorado

### ⏸️ Não Refatorado (1/6)
6. **Sidebar** - Componente de navegação mobile (shadcn/ui), não é um Detail Sheet

### 🎯 Resultados da Refatoração
- **32 testes passando** (100% sucesso)
- **0 erros de TypeScript** (npm run type-check)
- **0 warnings de ESLint** (npm run lint)
- **Código limpo e padronizado**
- **Lógica de negócio preservada** (Tabs, formulários, downloads)

### 📝 Padrão Implementado
Todos os Sheets agora seguem o padrão:
```tsx
<BaseDetailSheet
  open={open}
  onOpenChange={onOpenChange}
  title="Título"
  subtitle={<StatusBadge>Status</StatusBadge>}
  size="default" | "lg" | "xl"
  noScroll={true | false}
>
  {/* Conteúdo */}
</BaseDetailSheet>
```

### 🔧 Benefícios
- **Consistência visual**: Todos os Sheets têm a mesma estrutura
- **Manutenibilidade**: Mudanças no layout afetam todos os Sheets
- **Redução de código**: Menos duplicação de estrutura
- **Facilidade de uso**: Props simples e intuitivas
