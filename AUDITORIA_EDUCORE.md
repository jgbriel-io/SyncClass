# Auditoria Técnica e de UX — EduCore

**Data:** 01/02/2026  
**Escopo:** Código-fonte (Admin, Teacher, Student), Supabase (migrations, RLS), hooks (React Query), validações, testes, build e CI.

---

## 1. Sumário executivo (1 página)

### Principais riscos
- **CI não executa testes:** o workflow `.github/workflows/ci.yml` faz apenas lint, type-check e build. Nenhum `npm run test` — regressões não são detectadas automaticamente.
- **Resumo financeiro no contexto Professor:** em `FinancialView.tsx`, `useFinancialSummary()` é chamado sem `autoTeacherId`. Na rota do professor, a lista é filtrada por professor, mas os totais do resumo podem não estar escopados (depende do RLS; com RLS correto os dados já vêm filtrados, mas a API do hook aceita `teacherId` e faz filtro em cliente — então passar `autoTeacherId` garante consistência).
- **Condição de corrida na criação de aula:** existe checagem de sobreposição no front (`checkClassOverlap`) e constraint EXCLUDE no DB (`class_logs_no_overlap_teacher`). Em concorrência, dois requests podem passar na checagem e um falhar no DB com SQLSTATE 23P01. O tratamento atual usa apenas o texto da mensagem (`exclusion constraint`, `conflicting key`); não há tratamento explícito por `error.code === '23P01'`.
- **Cobrança criada com falha parcial:** em `useCreateClassLogWithFinancial`, se o insert da aula succeed e o da cobrança falhar, a função retorna a aula e mostra toast "Aula criada, mas erro ao criar cobrança." — correto, mas não há rollback da aula; o usuário fica com aula sem cobrança (aceitável pela regra de negócio, mas documentar).

### Ganhos rápidos
- Incluir **`npm run test`** no CI (1 linha no workflow).
- Passar **`autoTeacherId`** para `useFinancialSummary(autoTeacherId)` em `FinancialView.tsx` para alinhar resumo ao contexto professor.
- Tratar **23P01** explicitamente em `useClassLogs.ts` (create/update) para exibir mensagem amigável mesmo quando o backend retornar só código.
- Ordenar exports em `useFinancialRecords.ts`: `useUndoFinancialPayment` está no topo; mover para junto dos demais ou documentar.

### Recomendações prioritárias (top 5 para o próximo sprint)
1. **CI:** Rodar testes no workflow (`npm run test`).
2. **Resumo financeiro Professor:** Usar `useFinancialSummary(autoTeacherId)` em `FinancialView`.
3. **Erro 23P01:** Tratar `error.code === '23P01'` nos mutations de aula e exibir mensagem de sobreposição.
4. **Testes:** Adicionar testes para: (a) conflito de horário (mock do Supabase retornando 23P01), (b) criação de aula com e sem cobrança (validação do form).
5. **Paginação:** Avaliar limite/offset ou cursor nas listas grandes (class_logs, financial_records, students) para evitar carregar tudo de uma vez.

---

## 2. Checklist por tela (Admin / Teacher / Student)

### 2.1 Admin

| Área | O que está OK | Bugs / Inconsistências | UX | Performance | Segurança |
|------|----------------|------------------------|-----|-------------|-----------|
| **Dashboard** | Stats, gráfico, aniversariantes, aulas de hoje, próximos vencimentos; uso de `format` (date-fns) e ptBR. | — | Loading único agrupa várias queries; bom. | Várias queries em paralelo; `useBirthdaysThisMonth` e similares sem paginação. | Dados via RLS (admin vê tudo). |
| **Aulas (Classes)** | Filtros (ClassesFilters), criação/edição com ClassLogFormDialog, PostClassDialog para avaliar; checagem de sobreposição no front; badge de status (getClassStatusWithTime). | — | Botão "Avaliar" desabilitado via `isClassEvaluationBlocked` (classTime.ts). | Lista sem limite; carrega todas as aulas. | Admin usa `useClassLogs()` sem teacherId; RLS is_admin(). |
| **Financeiro** | Filtros (FinancialFilters), CRUD cobrança, marcar pago, desfazer pagamento; status derivado (getFinancialActualStatus). | Em contexto admin, `useFinancialSummary()` sem teacherId está correto. Em contexto teacher (quando FinancialView for reutilizada), falta passar teacherId — ver Teacher. | — | Lista sem paginação. | RLS financial_records (admin ou alunos do professor). |
| **Alunos** | Lista, filtros, StudentFormDialog, vínculo professor. | — | — | Sem paginação. | RLS students. |
| **Professores** | Lista, StatusBadge. | — | — | — | RLS teachers. |
| **Usuários** | UserFormDialog, roles, StatusBadge por role. | — | — | — | user_roles RLS. |

### 2.2 Teacher

| Área | O que está OK | Bugs / Inconsistências | UX | Performance | Segurança |
|------|----------------|------------------------|-----|-------------|-----------|
| **Dashboard** | Stats por professor, aniversariantes do professor, aulas de hoje, resumo financeiro; teacherId vindo de profiles. | — | — | Várias queries; teacherId pode ser null brevemente. | RLS escopo por get_my_teacher_id(). |
| **Aulas (Pedagógico)** | Mesma ClassesView com teacherId; avaliação bloqueada por horário. | — | — | Lista completa. | Apenas aulas do professor. |
| **Financeiro** | Mesma FinancialView com autoTeacherId. | **Bug:** `useFinancialSummary()` é chamado sem argumento em FinancialView (linha 94). Lista usa `useFinancialRecords(autoTeacherId)` e está correta; o resumo (totais) não recebe teacherId e pode mostrar totais globais se o hook fizer agregação antes do filtro. No código atual, useFinancialSummary(teacherId) filtra em cliente; então sem teacherId o professor vê totais de todos. **Steps:** entrar como professor, abrir Financeiro, conferir totais vs lista. | — | — | RLS já restringe por aluno do professor; o bug é de exibição (resumo incorreto). |

### 2.3 Student

| Área | O que está OK | Bugs / Inconsistências | UX | Performance | Segurança |
|------|----------------|------------------------|-----|-------------|-----------|
| **Home** | Métrica financeira, última aula, feedback, stats; uso de formatDate. | — | Mensagem "Perfil não vinculado" quando sem studentId. | Poucas queries. | useStudentPortal escopo por student_id do profile. |
| **Histórico / Financeiro** | Aulas e cobranças do aluno. | — | — | — | RLS por student. |

---

## 3. Backend (Supabase): migrations, constraints, RLS

### 3.1 Acertos
- **EXCLUDE de sobreposição:** `class_logs_no_overlap_teacher.sql` — constraint por (teacher_id, tstzrange(start_at, end_at)); evita duas aulas do mesmo professor no mesmo intervalo.
- **Cobrança obrigatoriamente vinculada à aula:** trigger `check_financial_requires_class_log` em `enforce_financial_class_log_link.sql` — INSERT em financial_records com class_log_id NULL falha.
- **Integridade temporal:** `class_logs_temporal_integrity.sql` — attendance=true só se class_date <= hoje; grade NULL quando attendance=false.
- **RLS financial_records:** `fix_financial_records_rls_security.sql` — professores só acessam registros de alunos com teacher_id = get_my_teacher_id(); admins is_admin().
- **LGPD / mascaramento:** views com CASE WHEN is_admin() THEN cpf/phone para não expor a não-admins.
- **get_my_teacher_id / is_admin:** SECURITY DEFINER, search_path = public, usados nas policies.

### 3.2 Pontos de atenção
- **Migration class_logs_no_overlap_teacher:** antes de criar a EXCLUDE, um bloco DO $$ deleta aulas sobrepostas (e financial_records vinculados). Isso altera dados históricos sem audit trail. **Recomendação:** em futuras migrations que removam dados, considerar tabela de auditoria ou backup; para esta, já aplicada, documentar no histórico.
- **SQLSTATE 23P01:** Em violação da EXCLUDE, o Postgres retorna código 23P01. O front hoje trata só por mensagem; adicionar tratamento por código torna o comportamento estável mesmo com mudança de texto do erro.

---

## 4. Hooks (React Query + Supabase)

### 4.1 Fluxo de criação/edição de aulas
- **Checagem de sobreposição (front):** `checkClassOverlap` em `useClassLogs.ts` — consulta class_logs por teacher_id e class_date, compara intervalos; usada em create e update.
- **Constraint DB:** EXCLUDE em class_logs (teacher_id, tstzrange(start_at, end_at)).
- **Condição de corrida:** Dois usuários (ou duas abas) criando aula no mesmo horário: ambos podem passar em checkClassOverlap; um INSERT falha com 23P01. **Tratamento atual:** onError verifica mensagem (exclusion constraint, conflicting key). **Recomendação:** também verificar `error?.code === '23P01'` e exibir: "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
- **Local sugerido:** `useClassLogs.ts` em useCreateClassLog, useCreateClassLogWithFinancial, useUpdateClassLog (onError). Ex.: além de `msg.includes(...)`, fazer `const isOverlap = error?.code === '23P01' || msg.includes(...)`.

### 4.2 Cobranças vinculadas a aulas
- **Regra no front:** ClassLogFormDialog — ao criar aula, o schema (createClassLogSchema) exige valor e vencimento **exceto** se "Sem cobrança" (semCobranca) ou edição. OK.
- **Cenário "criar sem cobrança":** Checkbox "Sem cobrança" e submit chama `onSubmit(classLogData)` (useCreateClassLog) em vez de useCreateClassLogWithFinancial. OK.
- **Backend:** Trigger impede financial_records sem class_log_id. Não há cobrança avulsa. OK.

### 4.3 useFinancialRecords
- **useCreateFinancialRecord:** Não usa .select() após insert; comentário no código explica que, por RLS, o returning pode não ser selecionável. Invalidação de queries atualiza a lista. OK.
- **useUndoFinancialPayment:** Exportado no topo do arquivo (linhas 1–27); resto do arquivo é o restante dos hooks. **Sugestão:** mover useUndoFinancialPayment para junto de useMarkAsPaid/useUpdateFinancialRecord ou deixar como está e documentar.

---

## 5. Validações, datas e i18n

- **Datas:** date-fns com `ptBR` onde há formatação (PostClassDialog, DashboardView, ClassesView). formatters.ts usa Intl (pt-BR) para moeda e data. classTime e financialStatus usam `dateStr + "T12:00:00"` para evitar deslocamento UTC em datas locais. OK.
- **ClassLogFormDialog:** Datas em dd/mm/aaaa com maskDate e brDateToIso; horário HH:mm com REGEX_TIME; refine para end > start. OK.
- **Duplicate errors:** getDuplicateErrorMessage (23505 e mensagens de trigger) usado em formulários (ex.: alunos/usuários); não usado para 23P01. Incluir 23P01 no fluxo de mensagens amigáveis (ou só em useClassLogs) conforme acima.

---

## 6. Badges e consistência visual
- StatusBadge (variant: success | warning | destructive | info) usado em dashboard, aulas, financeiro, usuários. getClassStatusWithTime e getFinancialActualStatus centralizam lógica. Cores alinhadas (success=verde, warning=amarelo, etc.). **Aniversariantes:** DashboardView usa StatusBadge variant="warning" para contagem; formato de data dd/MM com formatBirthday. Consistente.

---

## 7. Queries pesadas e paginação
- useClassLogs, useFinancialRecords, useStudents etc. não usam .range() nem cursor; carregam todos os registros. useDashboardStats usa .limit(5) para algo (ex.: próximos vencimentos). Para muitas aulas/cobranças/alunos, recomenda-se paginação (offset/limit ou cursor) e possivelmente índices (já existem idx por student_id, class_date, due_date, etc.). **Estimativa:** 4–8 h para paginação em uma lista (ex.: Classes).

---

## 8. Testes e CI
- **Testes:** Apenas `ErrorBoundary.test.tsx` (Vitest + Testing Library). Nenhum teste para: overlap de aulas, criação com/sem cobrança, validação de formulários, RLS.
- **CI:** `.github/workflows/ci.yml` — checkout, setup Node, npm ci, lint, tsc --noEmit, build. **Não roda testes.** **Recomendação:** adicionar step `run: npm run test`.
- **Vitest:** config em vitest.config.ts; setup em src/test/setup.ts; include em src/**/*.{test,spec}.{ts,tsx}. OK.

---

## 9. Build e ambiente
- **Vite:** vite.config.ts com alias @, manualChunks, PWA. Sem configuração específica para Windows/esbuild locking. Em ambientes com arquivos travados, pode ocorrer EPERM; não há evidência no código.
- **Scripts:** npm run ci = npm ci && check && build; check = lint + type-check. test e test:watch existem. OK.

---

## 10. Sentry e monitoramento
- **sentry.ts:** init com DSN, environment, sendDefaultPii, browserTracing, replay, beforeSend (remove auth headers, filtra ResizeObserver e erros de request cancelado). logger com info/warn/error/setUser/clearUser/addBreadcrumb. Inicializado em main.tsx antes do render. OK. Cobertura depende de VITE_SENTRY_DSN em produção.

---

## 11. Lista de issues priorizadas

| # | Descrição | Local | Severidade | Ação recomendada | Esforço (h) |
|---|------------|--------|------------|------------------|-------------|
| 1 | CI não executa testes | .github/workflows/ci.yml | Alta | Adicionar step: `run: npm run test` | 0,5 |
| 2 | Resumo financeiro no Professor sem teacherId | FinancialView.tsx ~94 | Alta | useFinancialSummary(autoTeacherId) | 0,25 |
| 3 | Tratamento explícito do erro 23P01 (sobreposição) | useClassLogs.ts onError (create/update) | Média | Verificar error?.code === '23P01' e mostrar mensagem amigável | 0,5 |
| 4 | Cobertura de testes crítica | — | Média | Testes: overlap (23P01), criação aula com/sem cobrança, validação form | 4–8 |
| 5 | Paginação em listas grandes | useClassLogs, useFinancialRecords, useStudents | Média | Implementar .range() ou cursor e UI de paginação | 4–8 |
| 6 | Migration que deleta dados sem audit trail | class_logs_no_overlap_teacher.sql | Baixa | Documentar; em novas migrations, considerar auditoria/backup | 0 |
| 7 | Ordem dos exports em useFinancialRecords | useFinancialRecords.ts | Baixa | Mover useUndoFinancialPayment ou documentar | 0,25 |

---

## 12. Patches sugeridos

### 12.1 CI — rodar testes (frontend)
**Arquivo:** `.github/workflows/ci.yml`  
**Após** o step "Type check", adicionar:
```yaml
      - name: Run tests
        run: npm run test
```

### 12.2 Resumo financeiro por professor (frontend)
**Arquivo:** `src/components/financial/FinancialView.tsx`  
**Linha ~94:**  
De: `const { data: summary } = useFinancialSummary();`  
Para: `const { data: summary } = useFinancialSummary(autoTeacherId);`

### 12.3 Tratamento 23P01 em useClassLogs (frontend)
**Arquivo:** `src/hooks/useClassLogs.ts`  
Nos onError de useCreateClassLog, useCreateClassLogWithFinancial e useUpdateClassLog, definir isOverlap também por código. Exemplo (um dos três):
```ts
onError: (error) => {
  console.error("Error creating class log:", error);
  const msg = (error as Error)?.message || "";
  const code = (error as { code?: string })?.code;
  const isOverlap =
    code === "23P01" ||
    msg.includes("neste horário") ||
    msg.includes("sobreposição") ||
    msg.includes("overlap") ||
    msg.includes("class_logs_no_overlap") ||
    msg.includes("exclusion constraint") ||
    msg.includes("conflicting key");
  toast.error(
    isOverlap
      ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
      : "Erro ao registrar aula. Tente novamente."
  );
},
```
Repetir a mesma lógica de isOverlap (com code === '23P01') nos outros dois onError.

---

## 13. Gaps em testes e sugestões de cases

- **Conflito de aulas (23P01):** Mock do Supabase no mutation de criação de aula retornando error com code '23P01'; afirmar que o toast exibido é o de sobreposição.
- **Criação com/sem cobrança:** ClassLogFormDialog — com semCobranca=true o submit não deve exigir valor/vencimento; com semCobranca=false deve exigir; afirmar que onSubmit vs onSubmitWithFinancial é chamado conforme o caso.
- **checkClassOverlap:** Teste unitário: mesmo professor, mesma data, intervalos que se sobrepõem retornam overlap: true; com excludeId o registro com esse id é ignorado.
- **getFinancialActualStatus / isOverdue:** due_date no passado => atrasado; no futuro => pendente; status pago => pago.
- **ErrorBoundary:** Já coberto.

---

## 14. 5 ações prioritárias para o próximo sprint

1. **Incluir `npm run test` no CI** — risco de regressão sem testes automatizados.
2. **Corrigir resumo financeiro no Professor** — useFinancialSummary(autoTeacherId) em FinancialView.
3. **Tratar erro 23P01** nos mutations de aula para mensagem estável de sobreposição.
4. **Adicionar testes** para overlap (23P01), criação de aula com/sem cobrança e validação do form de aula.
5. **Avaliar paginação** nas listas de aulas e financeiro e implementar em pelo menos uma delas.

---

*Fim do relatório de auditoria.*
