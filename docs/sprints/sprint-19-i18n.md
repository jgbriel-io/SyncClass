 Implementation Plan - Centralização de Textos em src/content/
 
  Problem Statement:
 
  Textos hardcoded em ~170 componentes .tsx. Dificulta manutenção, cria duplicação, inviabiliza i18n.
 
  Requirements:
 
  - Centralizar todos textos em src/content/ por domínio
  - PT-BR only agora; estrutura de chaves semânticas pronta pra adicionar EN depois
  - Componentes importam de src/content/ em vez de strings literais
  - Cobrir: labels, placeholders, títulos, toasts, confirmações, erros de validação Zod, empty states, navegação
  - Remover src/lib/duplicate-messages.ts ao final
 
  Background:
 
  Projeto React + TypeScript + Vite. ~170 arquivos .tsx em src/components/ organizados por domínio: activities, classes, financial, students, teachers, users, dashboard, overview, student (portal), auth, layout. Já    
  existe src/lib/utils/errorMessages.ts e src/lib/duplicate-messages.ts com alguns textos — serão migrados para src/content/.
 
  Proposed Solution:
 
  src/content/ com um arquivo por domínio exportando objetos tipados { section: { key: "texto" } }. Um src/content/index.ts re-exporta tudo. Componentes substituem strings literais por import { domain } from
  '@/content'.
 
  src/content/
    common.ts          ← ações, erros genéricos, status, paginação
    auth.ts            ← login, forgotPassword, resetPassword, changePassword
    layout.ts          ← adminNav, teacherNav, studentNav, footer, settings
    dashboard.ts       ← metrics, charts, todayClasses, birthdays
    activities.ts      ← view, dialogs, tableRow, filters, validação Zod
    classes.ts         ← view, dialogs, tableRow, filters, validação Zod
    financial.ts       ← view, dialogs, tableRow, filters, validação Zod
    students.ts        ← view, dialogs, tableRow, filters, validação Zod
    teachers.ts        ← view, dialogs, tableRow, filters, validação Zod
    users.ts           ← view, dialogs, tableRow, filters, validação Zod
    overview.ts        ← view, tableRow, filters
    student-portal.ts  ← home, financial, history, activities, checkout
    index.ts           ← re-exporta todos
 
  Task Breakdown:
 
  Task 1: Criar src/content/common.ts
 
  - Objetivo: Centralizar textos compartilhados entre múltiplos domínios
  - Implementação: Exportar objeto common com seções actions (Salvar, Cancelar, Confirmar, Excluir, Editar, Fechar, Voltar, Carregando...), errors (mensagens genéricas + duplicidade de email/telefone, migrando de      
  duplicate-messages.ts), table (paginação, empty state genérico), status (Ativo, Inativo, Pendente, Pago, etc.)
  - Teste: arquivo compila sem erros TS
  - Demo: import { common } from '@/content/common' funciona, objeto tipado acessível
 
  Task 2: Criar src/content/auth.ts e src/content/layout.ts
 
  - Objetivo: Cobrir textos de autenticação e navegação
  - auth.ts: seções login, forgotPassword, resetPassword, changePassword — títulos, labels, placeholders, toasts, erros, validação Zod
  - layout.ts: seções adminNav, teacherNav, studentNav, footer, settings
  - Teste: arquivos compilam sem erros TS
  - Demo: objetos exportados acessíveis e tipados
 
  Task 3: Criar src/content/activities.ts, src/content/classes.ts, src/content/financial.ts
 
  - Objetivo: Cobrir domínios principais
  - activities.ts: seções view, sendDialog, editDialog, deliverDialog, correctionDialog, detailSheet, filters, tableRow, emptyState, validation
  - classes.ts: seções view, logFormDialog, detailSheet, historyList, packageDialog, postClassDialog, deleteDialog, filters, tableRow, emptyState, validation
  - financial.ts: seções view, formDialog, confirmPaymentDialog, deleteDialog, undoDialog, paymentHistoryDialog, tableRow, filters, emptyState, validation
  - Teste: arquivos compilam sem erros TS
  - Demo: objetos exportados acessíveis e tipados
 
  Task 4: Criar src/content/students.ts, src/content/teachers.ts, src/content/users.ts, src/content/overview.ts
 
  - Objetivo: Cobrir domínios de usuários
  - students.ts: seções view, formDialog, deleteDialog, passwordDialog, resetPasswordDialog, detailSheet, filters, tableRow, emptyState, validation
  - teachers.ts: seções view, formDialog, detailSheet, statusDialog, deleteDialog, resetPasswordDialog, filters, tableRow, validation
  - users.ts: seções view, formDialog, deleteDialog, passwordDialog, resetPasswordDialog, filters, tableRow, validation
  - overview.ts: seções view, tableRow, filters
  - Teste: arquivos compilam sem erros TS
  - Demo: objetos exportados acessíveis e tipados
 
  Task 5: Criar src/content/dashboard.ts, src/content/student-portal.ts e src/content/index.ts
 
  - Objetivo: Cobrir dashboard e portal do aluno; criar ponto de entrada único
  - dashboard.ts: seções metrics, charts, todayClasses, birthdays, upcomingPayments
  - student-portal.ts: seções home, financial, history, activities, checkout, classCard, financialCard, pixPayment
  - index.ts: export * from './common' etc. para todos os arquivos
  - Teste: import { common, auth, activities } from '@/content' compila sem erros
  - Demo: barrel import funciona, todos os objetos acessíveis via @/content
 
  Task 6: Substituir textos hardcoded em auth e layout
 
  - Objetivo: Primeiro domínio migrado ponta a ponta
  - Arquivos: Login.tsx, ForgotPassword.tsx, ResetPassword.tsx, ChangePasswordDialog.tsx, AdminLayout.tsx, TeacherLayout.tsx, StudentLayout.tsx, Footer.tsx, SettingsModal.tsx, SettingsPerfilTab.tsx,
  SettingsSenhaTab.tsx, SettingsPreferenciasTab.tsx
  - Padrão: import { auth } from '@/content' → {auth.login.title}
  - Migrar validação Zod: z.string().min(1, auth.login.validation.required)
  - Teste: build sem erros; textos renderizam corretamente
  - Demo: Login e navegação funcionam identicamente, zero strings hardcoded nos arquivos migrados
 
  Task 7: Substituir textos hardcoded em activities
 
  - Objetivo: Domínio de atividades migrado
  - Arquivos: todos em src/components/activities/ + src/components/filters/ActivitiesFilters.tsx
  - Migrar validação Zod dos schemas de atividades
  - Teste: build sem erros; tela de atividades renderiza corretamente
  - Demo: tela de atividades funciona identicamente, zero strings hardcoded
 
  Task 8: Substituir textos hardcoded em classes e financial
 
  - Objetivo: Domínios de aulas e financeiro migrados
  - Arquivos: todos em src/components/classes/ + ClassesFilters.tsx; todos em src/components/financial/ + FinancialFilters.tsx
  - Migrar validação Zod dos schemas
  - Teste: build sem erros; telas renderizam corretamente
  - Demo: telas de aulas e financeiro funcionam identicamente
 
  Task 9: Substituir textos hardcoded em students, teachers, users e overview
 
  - Objetivo: Domínios de usuários migrados
  - Arquivos: todos em src/components/students/, teachers/, users/, overview/, admin/ + filtros correspondentes
  - Migrar validação Zod dos schemas de formulários
  - Teste: build sem erros; telas renderizam corretamente
  - Demo: telas de alunos, professores, usuários e visão geral funcionam identicamente
 
  Task 10: Substituir textos hardcoded em dashboard e student-portal; cleanup final
 
  - Objetivo: 100% sem textos hardcoded nos componentes
  - Arquivos: todos em src/components/dashboard/, src/pages/student/, src/components/student/, src/pages/teacher/
  - Remover src/lib/duplicate-messages.ts; migrar referências para src/content/common.ts
  - Migrar src/lib/utils/errorMessages.ts → src/content/common.ts
  - Teste: build sem erros; todas as telas renderizam corretamente; grep por strings hardcoded retorna zero ocorrências de UI text
  - Demo: aplicação completa funciona identicamente; src/lib/duplicate-messages.ts deletado; todos textos de UI em src/content/