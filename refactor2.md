  Plano de Implementação — Refatoração Sprint 2
 
  Problema: 15 arquivos (5 Alta + 10 Média prioridade) com 450–1013 linhas cada, dificultando manutenção. Objetivo: reduzir complexidade cognitiva e     
  melhorar manutenibilidade, seguindo padrões já estabelecidos no projeto.
 
  Requisitos:
 
  - Manutenibilidade como prioridade, performance como bônus
  - Ordem: Alta → Média
  - Hooks grandes: extrair service files (padrão inviteUserService.ts)
  - Sem testes automatizados — validação manual
  - 12 arquivos de Baixa prioridade excluídos deste sprint
 
  Background:
 
  - Padrão de extração de dialogs já estabelecido: TeacherFormDialog, DeleteUserDialog, ResetPasswordDialog, PasswordDisplayDialog
  - Padrão de extração de seções já estabelecido: ClassLogFinancialSection, ClassLogStudentSection, PackageFinancialSection, PackageSlotList
  - Padrão de service file já estabelecido: inviteUserService.ts
  - Teachers.tsx tem 3 dialogs inline: senha gerada, confirmação de status, redefinir senha
  - FinancialView.tsx tem dialogs inline: confirmar pagamento, histórico de pagamento
  - UserFormDialog.tsx tem 3 schemas distintos (admin/student/teacher) e seções de localização BR/estrangeiro
  - DashboardView.tsx tem MetricCard já extraível + seções de gráfico, aniversariantes, aulas do dia
  - ClassesView.tsx segue padrão similar ao Teachers.tsx
 
  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 
  Task Breakdown
 
  Task 1: Extrair dialogs inline de `Teachers.tsx` (845 linhas)
 
  - Objetivo: Mover os 3 dialogs inline para componentes próprios em src/components/teachers/
  - Guia: Criar TeacherPasswordDialog.tsx (exibe senha gerada), TeacherStatusDialog.tsx (confirmar arquivar/reativar), TeacherResetPasswordDialog.tsx    
   (redefinir senha). Cada um recebe via props o estado open/onOpenChange + dados necessários. Teachers.tsx passa a importar e usar esses
  - Demo: Teachers.tsx com ~550 linhas, 3 novos arquivos focados, comportamento idêntico ao atual.
 
  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 
  Task 2: Extrair dialogs inline de `ClassesView.tsx` (827 linhas)
 
  - Objetivo: Mover dialogs inline para src/components/classes/
  - Guia: Identificar todos os <AlertDialog> e <Dialog> inline no JSX de ClassesView.tsx e extrair para componentes próprios (ex: ClassDeleteDialog.tsx, 
  ClassStatusDialog.tsx). Seguir o mesmo padrão da Task 1.
  - Demo: ClassesView.tsx com ~550 linhas, novos componentes em classes/, comportamento idêntico.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 3: Extrair dialogs inline de `FinancialView.tsx` (848 linhas)
 
  - Objetivo: Mover dialogs inline para src/components/financial/
  - Guia: Extrair FinancialConfirmPaymentDialog.tsx (AlertDialog de confirmar pagamento) e FinancialPaymentHistoryDialog.tsx (mini modal de histórico).  
  Props: estado open + record + handlers.
  - Demo: FinancialView.tsx com ~650 linhas, 2 novos componentes, comportamento idêntico.
 
  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 
  Task 4: Extrair seções de `DashboardView.tsx` (856 linhas)
 
  - Objetivo: Quebrar o componente monolítico em subcomponentes reutilizáveis
  - Guia: MetricCard já está definido inline — mover para src/components/dashboard/MetricCard.tsx. Extrair DashboardGrowthChart.tsx (seção do gráfico    
  Recharts + filtros), DashboardBirthdayList.tsx (lista de aniversariantes), DashboardTodayClasses.tsx (seção de aulas do dia). DashboardView.tsx passa a  compor esses subcomponentes.
  - Demo: DashboardView.tsx com ~300 linhas, 4 novos subcomponentes, dashboard visualmente idêntico.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 5: Extrair seções de `UserFormDialog.tsx` (1013 linhas)
 
  - Objetivo: Quebrar o formulário multi-role em seções extraídas
  - Guia: Extrair os schemas Zod para src/components/users/userFormSchemas.ts. Extrair UserFormStudentFields.tsx (campos específicos de aluno:
  localização BR/estrangeiro, origem, data nascimento), UserFormTeacherFields.tsx (campos de professor), UserFormAdminFields.tsx (campos de admin).      
  UserFormDialog.tsx orquestra os schemas e renderiza o subcomponente correto por role.
  - Demo: UserFormDialog.tsx com ~300 linhas, schemas isolados, formulário funcionando para todos os 3 roles.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 6: Extrair service functions de `useClassLogs.ts` (865 linhas)
 
  - Objetivo: Separar as funções Supabase puras do React Query
  - Guia: Criar src/hooks/classLogsService.ts com as funções async que chamam o Supabase diretamente (fetch, create, update, delete, summary).
  useClassLogs.ts passa a importar essas funções e usá-las nos queryFn/mutationFn. Seguir o padrão de inviteUserService.ts.
  - Demo: useClassLogs.ts com ~400 linhas, classLogsService.ts com as queries puras, comportamento idêntico.
 
  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 
  Task 7: Extrair service functions de `useFinancialRecords.ts` (631 linhas)
 
  - Objetivo: Separar funções Supabase do React Query
  - Guia: Criar src/hooks/financialRecordsService.ts com as funções de fetch/mutação Supabase. useFinancialRecords.ts fica só com os hooks React Query   
  consumindo o service.
  - Demo: useFinancialRecords.ts com ~300 linhas, financialRecordsService.ts isolado.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 8: Extrair service functions de `useStudents.ts` (604 linhas)
 
  - Objetivo: Separar funções Supabase do React Query
  - Guia: Criar src/hooks/studentsService.ts. Mesmo padrão das Tasks 6 e 7.
  - Demo: useStudents.ts com ~250 linhas, studentsService.ts isolado.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 9: Extrair seções de `StudentDetailSheet.tsx` (690 linhas)
 
  - Objetivo: Quebrar o sheet de detalhes em subcomponentes
  - Guia: Identificar seções distintas (info pessoal, histórico de aulas, financeiro, etc.) e extrair para componentes em src/components/admin/. Seguir  
  padrão de ClassLogFinancialSection e ClassLogStudentSection.
  - Demo: StudentDetailSheet.tsx com ~250 linhas, seções extraídas, sheet funcionando idêntico.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 10: Extrair seções dos dialogs médios restantes
 
  - Objetivo: Reduzir SettingsModal.tsx (526), PostClassDialog.tsx (474), SendActivityDialog.tsx (473), ActivityDetailSheet.tsx (463),
  FinancialFormDialog.tsx (456)
  - Guia: Para cada arquivo, identificar seções lógicas distintas e extrair para subcomponentes no mesmo diretório. SettingsModal → seções de
  perfil/senha/preferências. PostClassDialog → seção de avaliação + seção de feedback. FinancialFormDialog → seção de valores + seção de datas.
  - Demo: Todos os 5 arquivos abaixo de 250 linhas, subcomponentes extraídos, comportamento idêntico.
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 11: Refatorar `useUserMutations.ts` (751 linhas)
 
  - Objetivo: Hooks ainda grandes apesar de já ter service — quebrar em hooks menores por responsabilidade
  - Guia: Analisar as mutations existentes e agrupar por domínio: useStudentMutations.ts, useTeacherMutations.ts, useAdminMutations.ts (ou similar).     
  useUserMutations.ts pode re-exportar tudo para manter compatibilidade com imports existentes.
  - Demo: useUserMutations.ts vira um barrel de re-exports, hooks menores focados por responsabilidade.
 