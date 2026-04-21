# Testes E2E - Playwright

## Status atual

116 testes criados, login funcionando para os 3 roles. Testes falham por seletores incompatíveis com a UI real.

## Infraestrutura

- Playwright v1.59.1
- Configuração: `playwright.config.ts` (porta 8080)
- Helpers: `tests/e2e/helpers/auth.ts`, `tests/e2e/helpers/selectors.ts`
- Dados de teste: `supabase/migrations/fixes/seed_test_data.sql`

## Usuários de teste

| Email | Senha | Role |
|---|---|---|
| admin@test.com | admin123 | admin |
| professor1@test.com | prof123 | teacher |
| professor2@test.com | prof123 | teacher |
| aluno1@test.com | aluno123 | student |
| aluno2@test.com | aluno123 | student |

## Arquivos de teste

| Arquivo | Testes | Cobertura |
|---|---|---|
| complete-all-features.spec.ts | 31 | Activities, ClassLogs, Teachers, Auth, Dashboard, Nav |
| complete-edge-cases.spec.ts | 25 | Limites, datas, concorrência, performance, bypass |
| complete-financial.spec.ts | 22 | CRUD financeiro, filtros, comprovantes, RLS |
| complete-students.spec.ts | 20 | CRUD alunos, validações, RLS, integração |
| security-audit-sprint1.spec.ts | 12 | RLS policies por role |
| security-audit-sprint3-4.spec.ts | 8 | Validações de negócio, XSS, inputs |

## Problema: seletores incompatíveis

Os testes usam seletores que não existem na aplicação:

| Seletor nos testes | Realidade |
|---|---|
| `[data-testid="students-list"]` | Não existe `data-testid` |
| `input[name="name"]` | Inputs usam `id`, não `name` |
| `select[name="student_id"]` | shadcn/ui não usa `<select>` nativo |
| `/students` | Rota real: `/teacher/students` |
| `/students/new` | Formulário é Dialog/Modal, não rota |

## Para corrigir os testes

Usar seletores baseados em texto e role:

```ts
// Em vez de data-testid
page.getByRole('button', { name: 'Novo Aluno' })
page.getByLabel('Nome')
page.getByText('Aluno 1 Professor 1')

// Rotas corretas
/teacher/students   (não /students)
/teacher/financial  (não /financial)
/admin/teachers     (não /teachers)

// Aguardar conteúdo (não networkidle — app tem polling)
await page.waitForTimeout(3000)
await page.locator('text=Alunos').waitFor()
```

## Como rodar

```bash
# Iniciar app primeiro
npm run dev

# Rodar todos os testes
npx playwright test

# Com UI
npx playwright test --ui

# Arquivo específico
npx playwright test complete-students.spec.ts --headed
```
