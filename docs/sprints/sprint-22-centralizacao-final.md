# Sprint 22 - Centralização Final de Strings

## Status

🔄 **Em andamento** — Refatoração dos componentes restantes

## Objetivo

Centralizar 100% das strings hardcoded em `src/content/`, eliminando textos em componentes e páginas.

## Strings Encontradas

### 1. TOASTS (3 encontrados) — CRÍTICO
- `src/pages/teacher/TeacherFinancial.tsx:30` — `toast.error("Erro ao carregar seu perfil. Tente recarregar a página.")`
- `src/pages/teacher/TeacherStudents.tsx:34` — `toast.error("Erro ao carregar seu perfil. Tente recarregar a página.")`
- `src/pages/admin/Teachers.tsx:199` — `toast.error("Erro ao validar email. Tente novamente.")`

**Ação:** Usar `common.errors.loadProfile`, `common.errors.validateEmail`

### 2. PLACEHOLDERS (19 encontrados) — ALTO
- `src/components/activities/DeliverActivityDialog.tsx:148` — `placeholder="Digite sua resposta aqui..."`
- `src/components/activities/EditActivityDialog.tsx:266` — `placeholder="Instruções e observações..."`
- `src/components/activities/SendActivityDialog.tsx:356` — `placeholder="Instruções e observações..."`
- `src/components/classes/ClassLogStudentSection.tsx:139` — `placeholder="Ex: Present Perfect - Unit 8"`
- `src/components/classes/ClassLogStudentSection.tsx:215` — `placeholder="Notas pré-aula (opcional)..."`
- `src/components/classes/PostClassDialog.tsx:315` — `placeholder="Ex: 85"`
- `src/components/classes/PostClassDialog.tsx:394` — `placeholder="Observações sobre a aula..."`
- `src/components/filters/ActivitiesFilters.tsx:84` — `placeholder="Buscar por aluno, título ou descrição..."`
- `src/components/filters/FinancialFilters.tsx:64` — `placeholder="Buscar por aluno..."`
- `src/components/filters/OverviewFilters.tsx:80` — `placeholder="Buscar por nome..."`
- `src/components/filters/OverviewFilters.tsx:116` — `placeholder="Período"`
- `src/components/filters/StudentsFilters.tsx:92` — `placeholder="Buscar por nome ou CPF..."`
- `src/components/filters/TeachersFilters.tsx:62` — `placeholder="Buscar por nome ou email..."`
- `src/components/filters/UsersFilters.tsx:56` — `placeholder="Buscar por nome ou email..."`
- `src/components/students/StudentFormDialog.tsx:353` — `placeholder="Ex: 120,00"`
- `src/components/students/StudentLocationSection.tsx:207` — `"Carregando cidades..."`
- `src/components/students/StudentLocationSection.tsx:60` — `placeholder="Buscar país..."`
- `src/components/students/StudentLocationSection.tsx:97` — `placeholder="Buscar estado..."`
- `src/components/students/StudentLocationSection.tsx:140` — `placeholder="Buscar cidade..."`

**Ação:** Usar `common.placeholders.*`

### 3. TITLES/TOOLTIPS (49 encontrados) — ALTO
Exemplos:
- `src/components/activities/ActivitiesTableRow.tsx:130` — `title="Aguardando"`
- `src/components/activities/ActivitiesTableRow.tsx:134` — `title="Corrigir"`
- `src/components/activities/ActivitiesTableRow.tsx:138` — `title="Atualizar"`
- `src/components/activities/ActivitiesTableRow.tsx:148` — `title="Ver detalhes"`
- `src/components/activities/ActivityDetailSheet.tsx:104` — `title="Visualizar na web"`
- `src/components/activities/ActivityDetailSheet.tsx:127` — `title="Visualizar na web"`
- `src/components/financial/FinancialTableRow.tsx:213` — `aria-label="Ver histórico de pagamento"`
- `src/components/student/StudentPixPaymentBox.tsx:58` — `aria-label="Copiar chave PIX"`
- `src/components/students/StudentsTableRow.tsx:128` — `title="Ver detalhes"`
- `src/components/students/StudentsTableRow.tsx:133` — `aria-label="Mais opções"`
- E mais 39...

**Ação:** Usar `common.buttons.*` e `common.tooltips.*`

### 4. ARIA-LABELS (13 encontrados) — ALTO
- `src/components/activities/ActivitiesTableRow.tsx:158` — `aria-label="Visualizar arquivo"`
- `src/components/classes/ClassesTableView.tsx:71` — `aria-label="Avaliar"`
- `src/components/financial/FinancialTableRow.tsx:213` — `aria-label="Ver histórico de pagamento"`
- `src/components/financial/FinancialTableRow.tsx:219` — `aria-label="Mais opções"`
- `src/components/financial/FinancialView.tsx:345` — `aria-label="Avaliar"`
- `src/components/student/StudentPixPaymentBox.tsx:58` — `aria-label="Copiar chave PIX"`
- `src/components/students/StudentsTableRow.tsx:128` — `aria-label="Ver detalhes"`
- `src/components/students/StudentsTableRow.tsx:133` — `aria-label="Mais opções"`
- E mais 5...

**Ação:** Usar `common.aria.*` e `common.tooltips.*`

### 5. FALLBACK STRINGS (10 encontrados) — MÉDIO
- `src/components/activities/EditActivityDialog.tsx:232` — `{dueDate || "Data"}`
- `src/components/admin/TeacherDetailSheet.tsx:83` — `{teacher.email || "Sem email"}`
- `src/components/admin/UserDetailSheet.tsx:105` — `{user.email || "Sem email"}`
- `src/components/classes/ClassDetailSheet.tsx:115` — `{classLog.students?.name || "Aluno não encontrado"}`
- `src/components/classes/ClassesCardView.tsx:74` — `{log.students?.name || "Aluno não encontrado"}`
- `src/components/classes/ClassesTableRow.tsx:162` — `title={log.students?.name || "Aluno não encontrado"}`
- `src/components/classes/ClassesTableRow.tsx:164` — `{log.students?.name || "Aluno não encontrado"}`
- `src/components/classes/ClassHistoryList.tsx:93-94` — `log.title || "Aula"`
- `src/components/classes/ClassHistoryList.tsx:113` — `log.title || "Aula"`
- E mais...

**Ação:** Usar `common.errors.studentNotFound`, `common.errors.noEmail`, `common.labels.date`

### 6. STRINGS EM CONDIÇÕES (10 encontrados) — MÉDIO
- `src/components/admin/UserDetailSheet.tsx:31-33` — Role mapping ("Administrador", "Professor", "Aluno")
- `src/components/classes/PackageClassesDialog.tsx:125-126` — Validações ("Selecione um professor", "Selecione um aluno")
- `src/components/students/StudentLocationSection.tsx:207` — `"Carregando cidades..."`
- `src/components/users/UserFormDialog.tsx:135` — `"Selecione um professor"`

**Ação:** Usar `common.tooltips.administrator`, `common.tooltips.teacher`, `common.tooltips.student`, `common.errors.selectTeacher`, `common.errors.selectStudent`, `common.errors.loadingCities`

## Chaves Adicionadas ao `src/content/common.ts`

✅ `errors.loadProfile`
✅ `errors.validateEmail`
✅ `errors.studentNotFound`
✅ `errors.noEmail`
✅ `errors.selectTeacher`
✅ `errors.selectStudent`
✅ `errors.loadingCities`
✅ `placeholders.period`
✅ `placeholders.answerHint`
✅ `placeholders.instructionsHint`
✅ `placeholders.classTopicHint`
✅ `placeholders.preClassNotesHint`
✅ `placeholders.gradeHint`
✅ `placeholders.classNotesHint`
✅ `aria.viewFile`
✅ `aria.viewPaymentHistory`
✅ `aria.evaluate`
✅ `aria.copyPix`
✅ `buttons.*` (10 chaves)
✅ `tooltips.*` (13 chaves)

## Plano de Refatoração

### Fase 1: Toasts (3 arquivos)
- [ ] `src/pages/teacher/TeacherFinancial.tsx`
- [ ] `src/pages/teacher/TeacherStudents.tsx`
- [ ] `src/pages/admin/Teachers.tsx`

### Fase 2: Placeholders (9 arquivos)
- [ ] `src/components/activities/DeliverActivityDialog.tsx`
- [ ] `src/components/activities/EditActivityDialog.tsx`
- [ ] `src/components/activities/SendActivityDialog.tsx`
- [ ] `src/components/classes/ClassLogStudentSection.tsx`
- [ ] `src/components/classes/PostClassDialog.tsx`
- [ ] `src/components/filters/ActivitiesFilters.tsx`
- [ ] `src/components/filters/FinancialFilters.tsx`
- [ ] `src/components/filters/OverviewFilters.tsx`
- [ ] `src/components/filters/StudentsFilters.tsx`
- [ ] `src/components/filters/TeachersFilters.tsx`
- [ ] `src/components/filters/UsersFilters.tsx`
- [ ] `src/components/students/StudentFormDialog.tsx`
- [ ] `src/components/students/StudentLocationSection.tsx`

### Fase 3: Titles/Tooltips (15+ arquivos)
- [ ] `src/components/activities/ActivitiesTableRow.tsx`
- [ ] `src/components/activities/ActivityDetailSheet.tsx`
- [ ] `src/components/classes/ClassesTableView.tsx`
- [ ] `src/components/classes/ClassesTableRow.tsx`
- [ ] `src/components/classes/ClassDetailSheet.tsx`
- [ ] `src/components/classes/ClassesCardView.tsx`
- [ ] `src/components/classes/ClassHistoryList.tsx`
- [ ] `src/components/financial/FinancialTableRow.tsx`
- [ ] `src/components/financial/FinancialView.tsx`
- [ ] `src/components/student/StudentPixPaymentBox.tsx`
- [ ] `src/components/students/StudentsTableRow.tsx`
- [ ] E mais...

### Fase 4: Fallback Strings (5+ arquivos)
- [ ] `src/components/admin/TeacherDetailSheet.tsx`
- [ ] `src/components/admin/UserDetailSheet.tsx`
- [ ] `src/components/classes/ClassDetailSheet.tsx`
- [ ] `src/components/classes/ClassesCardView.tsx`
- [ ] `src/components/classes/ClassesTableRow.tsx`
- [ ] `src/components/classes/ClassHistoryList.tsx`

### Fase 5: Strings em Condições (4+ arquivos)
- [ ] `src/components/admin/UserDetailSheet.tsx` (role mapping)
- [ ] `src/components/classes/PackageClassesDialog.tsx` (validações)
- [ ] `src/components/students/StudentLocationSection.tsx` (loading)
- [ ] `src/components/users/UserFormDialog.tsx` (validações)

## Estimativa

- Fase 1: ~15 min
- Fase 2: ~45 min
- Fase 3: ~60 min
- Fase 4: ~30 min
- Fase 5: ~20 min

**Total:** ~2h 50min

## Próximos Passos

1. Executar refatoração por fase
2. Build após cada fase
3. Testar manualmente as telas afetadas
4. Grep final pra confirmar zero strings hardcoded
5. Atualizar `docs/sprints/sprint-21-refatoracao-componentes-TODO.md` com status final

