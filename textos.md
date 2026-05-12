  Implementation Plan - Centralização de Textos em `src/content/`
 
  Problem Statement:
 
  Todos os textos da aplicação (labels, placeholders, títulos, toasts, mensagens de erro, confirmações) estão hardcoded diretamente nos componentes. Isso  dificulta manutenção, cria duplicação e inviabiliza i18n no futuro.
 
  Requirements:
 
  - Centralizar todos os textos em src/content/ organizado por domínio
  - Estrutura compatível com i18n futuro (objetos exportados com chaves semânticas)
  - Componentes passam a importar textos do arquivo de conteúdo correspondente
  - Cobrir: labels, placeholders, títulos, toasts, confirmações, erros de validação, empty states, navegação
 
  Background:
 
  O projeto tem ~170 arquivos .tsx organizados por domínio em src/components/. Os domínios identificados são: activities, classes, financial, students,  
  teachers, users, dashboard, overview, student (portal do aluno), auth, layout. Já existe src/lib/duplicate-messages.ts e src/lib/utils/errorMessages.ts   com alguns textos centralizados — esses serão migrados para src/content/.
 
  Proposed Solution:
 
  Criar src/content/ com um arquivo por domínio exportando objetos de texto tipados. Cada arquivo segue a estrutura { section: { key: "texto" } }. Um    
  src/content/index.ts re-exporta tudo. Os componentes substituem strings literais por referências ao objeto de conteúdo.
 
  src/content/
    common.ts       ← Salvar, Cancelar, Confirmar, Excluir, erros genéricos
    auth.ts         ← Login, ForgotPassword, ResetPassword
    layout.ts       ← navegação, footer, shell (admin/teacher/student)
    dashboard.ts    ← DashboardView, métricas, gráficos
    activities.ts   ← todos os componentes de activities + filters
    classes.ts      ← todos os componentes de classes + filters
    financial.ts    ← FinancialView, FinancialFormDialog + filters
    students.ts     ← StudentFormDialog, StudentDeleteDialog, etc + filters
    teachers.ts     ← TeacherFormDialog, TeachersTableRow + filters
    users.ts        ← UserFormDialog, DeleteUserDialog, PasswordDisplayDialog + filters
    overview.ts     ← OverviewView, OverviewTableRow + filters
    student-portal.ts ← páginas student/* (StudentHome, StudentFinancial, etc.)
    index.ts        ← re-exporta todos
 
  Task Breakdown:
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 1: Criar `src/content/common.ts`
 
  - Objetivo: Centralizar textos compartilhados entre múltiplos domínios
  - Implementação: Exportar objeto common com seções actions (Salvar, Cancelar, Confirmar, Excluir, Editar, Fechar, Voltar, Carregando...), errors       
  (mensagens genéricas de erro, duplicidade de email/telefone — migrando de duplicate-messages.ts), table (textos de paginação, empty state genérico),   
  status (Ativo, Inativo, Pendente, Pago, etc.)
  - Sem substituição nos componentes ainda — apenas criar o arquivo
  - Demo: arquivo exporta objeto tipado sem erros de TypeScript
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 2: Criar `src/content/auth.ts` e `src/content/layout.ts`
 
  - Objetivo: Cobrir textos de autenticação e navegação
  - auth.ts: seções login (títulos, labels, placeholders, toasts, erros), forgotPassword, resetPassword, changePassword
  - layout.ts: seções adminNav (itens de menu), teacherNav, studentNav, footer (links, créditos), settings
  - Demo: arquivos exportam objetos tipados sem erros
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 3: Criar arquivos de conteúdo dos domínios principais
 
  - Objetivo: Cobrir activities, classes, financial
  - activities.ts: seções view (títulos, stat cards, botões), sendDialog, editDialog, deliverDialog, correctionDialog, detailSheet, filters, tableRow,   
  emptyState
  - classes.ts: seções view, logFormDialog, detailSheet, historyList, packageDialog, postClassDialog, filters, tableRow, emptyState
  - financial.ts: seções view, formDialog, tableRow, filters, emptyState
  - Demo: arquivos exportam objetos tipados sem erros
 
  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 
  Task 4: Criar arquivos de conteúdo dos domínios de usuários
 
  - Objetivo: Cobrir students, teachers, users, overview
  - students.ts: seções view, formDialog, deleteDialog, passwordDialog, resetPasswordDialog, detailSheet, filters, tableRow, emptyState
  - teachers.ts: seções view, formDialog, detailSheet, filters, tableRow
  - users.ts: seções view, formDialog, deleteDialog, passwordDialog, resetPasswordDialog, filters, tableRow
  - overview.ts: seções view, tableRow, filters
  - Demo: arquivos exportam objetos tipados sem erros
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 5: Criar `src/content/dashboard.ts`, `src/content/student-portal.ts` e `src/content/index.ts`
 
  - Objetivo: Cobrir dashboard, portal do aluno e criar ponto de entrada único
  - dashboard.ts: seções metrics (títulos dos cards), charts, todayClasses, birthdays, notifications
  - student-portal.ts: seções home, financial, history, activities, checkout, classCard, financialCard, pixPayment
  - index.ts: re-exporta todos os arquivos com export * from './common' etc.
  - Demo: import { common, auth, activities } from '@/content' funciona sem erros
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 6: Substituir textos hardcoded em `auth` e `layout`
 
  - Objetivo: Primeiro domínio migrado de ponta a ponta
  - Substituir strings em Login.tsx, ForgotPassword.tsx, ResetPassword.tsx, ChangePasswordDialog.tsx, AdminLayout.tsx, TeacherLayout.tsx,
  StudentLayout.tsx, Footer.tsx, SettingsModal.tsx
  - Padrão: import { auth } from '@/content' → {auth.login.title}
  - Demo: Login e navegação funcionam identicamente, sem texto hardcoded nos arquivos migrados
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 7: Substituir textos hardcoded em `activities`
 
  - Objetivo: Domínio de atividades migrado
  - Substituir em todos os 7 arquivos de src/components/activities/ + ActivitiesFilters.tsx
  - Migrar também mensagens de validação do Zod schema que são textos de UI
  - Demo: Tela de atividades funciona identicamente, sem texto hardcoded
 
  ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 
  Task 8: Substituir textos hardcoded em `classes` e `financial`
 
  - Objetivo: Domínios de aulas e financeiro migrados
  - Substituir em todos os arquivos de src/components/classes/ + ClassesFilters.tsx
  - Substituir em todos os arquivos de src/components/financial/ + FinancialFilters.tsx
  - Demo: Telas de aulas e financeiro funcionam identicamente
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 9: Substituir textos hardcoded em `students`, `teachers`, `users` e `overview`
 
  - Objetivo: Domínios de usuários migrados
  - Substituir em src/components/students/, src/components/teachers/, src/components/users/, src/components/overview/ + seus respectivos filtros
  - Demo: Telas de alunos, professores, usuários e visão geral funcionam identicamente
 
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Task 10: Substituir textos hardcoded em `dashboard` e `student-portal`
 
  - Objetivo: Dashboard e portal do aluno migrados — projeto 100% sem textos hardcoded
  - Substituir em src/components/dashboard/DashboardView.tsx
  - Substituir em src/pages/student/*, src/components/student/*
  - Remover src/lib/duplicate-messages.ts e migrar referências para src/content/common.ts
  - Demo: Todas as telas funcionam identicamente; nenhum texto de UI hardcoded permanece nos componentes
 