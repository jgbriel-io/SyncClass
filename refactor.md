  Implementation Plan — Refatoração de Arquivos Gigantes
 
  Problem Statement:
 
  7 arquivos com 695–1043 linhas cada. Mistura de lógica de negócio, UI, estado e helpers em um único arquivo. Difícil de manter, testar e revisar.
 
  Requirements:
 
  - Sem alterar comportamento externo
  - Sem over-engineering (sem abstrações desnecessárias)
  - Cada arquivo resultante ≤ ~300 linhas
  - Padrão consistente em todo o projeto
 
  Proposed Solution:
 
  Três estratégias aplicadas conforme o tipo de arquivo:
 
  1. Service extraction — funções puras extraídas para arquivo de serviço (hooks)
  2. Dialog extraction — dialogs inline viram componentes próprios (pages)
  3. Section extraction — seções grandes de form/view viram subcomponentes (components)
 
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task Breakdown:
 
  Task 1: Extrair `inviteUserService.ts` de `useUserMutations.ts`
 
  - Objetivo: Separar lógica pura de negócio dos hooks React
  - Criar src/hooks/inviteUserService.ts com: generateRandomPassword, validateEmailForInvite, invokeInviteUser, createUserLegacy, e todos os tipos/helpers relacionados (InviteUserBody,
  InviteUserResult, isEdgeFunctionNetworkError, getFunctionResponseBody, isClientError, inviteResultFromBody)
  - useUserMutations.ts passa a importar do service — deve cair de 1043 para ~500 linhas
  - Demo: build sem erros, todos os hooks exportados funcionando
 
  Task 2: Extrair dialogs de `Users.tsx`
 
  - Objetivo: Remover os 3 dialogs inline que somam ~400 linhas
  - Criar src/components/users/PasswordDisplayDialog.tsx — dialog que exibe senha gerada/resetada
  - Criar src/components/users/ResetPasswordDialog.tsx — dialog de redefinição de senha pelo admin
  - Criar src/components/users/DeleteUserDialog.tsx — AlertDialog de arquivar/excluir/reativar com toda a lógica deleteDialogInfo
  - Users.tsx passa a importar os 3 componentes — deve cair de 1001 para ~300 linhas
  - Demo: fluxo de criar usuário, resetar senha e excluir funcionando sem regressão
 
  Task 3: Extrair helpers duplicados para `src/lib/utils/classFormHelpers.ts`
 
  - Objetivo: ClassLogFormDialog.tsx e PackageClassesDialog.tsx duplicam brDateToIso, getDefaultDueDateForClassMonth, buildTimestamptzFromDateAndTime
  - Criar src/lib/utils/classFormHelpers.ts com essas funções
  - Ambos os dialogs passam a importar do helper
  - Demo: build sem erros, sem duplicação
 
  Task 4: Extrair seções de `ClassLogFormDialog.tsx`
 
  - Objetivo: Reduzir de 806 para ~300 linhas
  - Criar src/components/classes/ClassLogStudentSection.tsx — campos de aluno, professor, data, horário
  - Criar src/components/classes/ClassLogFinancialSection.tsx — campos de valor, vencimento, status de pagamento
  - ClassLogFormDialog.tsx orquestra os dois sections + schema + submit
  - Demo: criação e edição de aula funcionando
 
  Task 5: Extrair seções de `PackageClassesDialog.tsx`
 
  - Objetivo: Reduzir de 695 para ~300 linhas
  - Criar src/components/classes/PackageSlotList.tsx — lista de slots (modo dinâmico e fixo)
  - Criar src/components/classes/PackageFinancialSection.tsx — campos financeiros do pacote
  - PackageClassesDialog.tsx orquestra os sections + lógica de geração de slots
  - Demo: criação de pacote de aulas funcionando
 
  Task 6: Extrair seções de `StudentFormDialog.tsx`
 
  - Objetivo: Reduzir de 739 para ~300 linhas
  - Criar src/components/students/StudentLocationSection.tsx — país, estado, cidade (com lógica de IBGE)
  - Criar src/components/students/StudentContactSection.tsx — telefone, email, CPF
  - StudentFormDialog.tsx orquestra sections + schema + submit
  - Demo: criação e edição de aluno funcionando
 
  Task 7: Extrair dialogs e lógica de `StudentsListView.tsx`
 
  - Objetivo: Reduzir de 908 para ~300 linhas
  - Criar src/components/students/StudentPasswordDialog.tsx — dialog de senha gerada (reutiliza padrão do Task 2)
  - Criar src/components/students/StudentDeleteDialog.tsx — AlertDialog de arquivar/excluir aluno
  - Extrair getStudentRowData e originLabels para src/components/students/StudentsListView.helpers.ts
  - Demo: listagem, criação, exclusão de aluno funcionando