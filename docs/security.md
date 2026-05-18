# Segurança

Documentação de autenticação, autorização (RLS), validações e proteções.

## Autenticação

Supabase Auth com JWT. Roles definidos em `user_roles` e `profiles`.

- Roles: `admin`, `teacher`, `student`
- Role buscado em `user_roles` → fallback para `profiles.role`
- Sessões invalidadas automaticamente ao desativar conta (`profiles.active = false`)
- Verificação periódica de status da conta no frontend a cada 30s

## Autorização (RLS)

Todas as tabelas têm Row Level Security habilitado. Acesso negado por padrão para usuários não autenticados.

### Funções helper

Todas com `SECURITY DEFINER` para bypassar o RLS das próprias tabelas que consultam. Sem isso, ocorre recursão infinita e HTTP 500.

```sql
is_admin()   -- verifica profiles.role = 'admin'
is_teacher() -- verifica profiles.role = 'teacher'
is_student() -- verifica profiles.role = 'student'
```

### Políticas por tabela

#### profiles / user_roles
- SELECT: próprio registro (`user_id = auth.uid()`) OU `is_admin()`
- INSERT: qualquer autenticado
- UPDATE: próprio registro OU `is_admin()`
- DELETE: `is_admin()`

#### teachers
- SELECT: `is_admin()` OU `is_teacher()`
- INSERT/UPDATE/DELETE: `is_admin()`

#### students
- SELECT: professor dono (`profiles.teacher_id = students.teacher_id`) OU aluno dono OU `is_admin()`
- INSERT/UPDATE/DELETE: professor dono OU `is_admin()`

#### financial_records
- SELECT: professor do aluno OU aluno dono OU `is_admin()`
- INSERT/UPDATE: professor do aluno OU `is_admin()`
- DELETE: `is_admin()`

#### activities
- SELECT: professor do aluno OU aluno dono OU `is_admin()`
- INSERT/UPDATE: professor do aluno OU `is_admin()`
- DELETE: professor do aluno OU `is_admin()`

#### class_logs
- SELECT/INSERT/UPDATE/DELETE: professor do aluno OU `is_admin()`

## Validações no banco

### financial_records
Trigger `trigger_validate_financial_logic` (BEFORE INSERT/UPDATE):
- `amount > 0` obrigatório para todos os status
- `pago`: amount ≤ 10.000, description obrigatória, paid_at preenchido automaticamente
- `extornado`: amount ≤ 1.000, description obrigatória
- `abonado` / `cancelado`: description obrigatória
- `pendente`: apenas validação de valor positivo

### teachers
- `pix_key` validada pela função `is_valid_pix_key()` (CPF 11 dígitos, email, telefone, UUID ou chave aleatória 32 chars)

### students / teachers
- `pay_day` CHECK (1-31)
- `grade` CHECK (0-100) em class_logs e activities

## Rate limiting

- Tabela `rate_limit_tracker` controla requisições por usuário
- Função `check_rate_limit()` bloqueia após 10 req/min
- Aplicado nas RPCs críticas: `create_class_package`, `mark_as_paid_idempotent`, `confirm_payment_idempotent`

## Idempotência

- Tabela `idempotency_keys` previne operações duplicadas
- RPCs financeiras verificam chave antes de executar

## Frontend

- Inputs sanitizados antes de enviar ao banco
- Mensagens de erro amigáveis via `src/lib/security/errorHandler.ts` (sem expor detalhes técnicos)
- Sem `data-testid` nos componentes (shadcn/ui padrão)

## Proteções adicionais

- Views com `SECURITY INVOKER` (herdam permissões do usuário, não do owner)
- `search_path` definido em todas as funções (anti-hijacking)
- Dados pessoais anonimizáveis (LGPD) via `anonymized_at` em teachers e students
- Soft delete em profiles (`deleted_at`) preserva dados para auditoria
