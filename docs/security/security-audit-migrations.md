# Histórico de Segurança

Correções de segurança consolidadas nas migrations 10-21.

## RLS e Isolamento (migrations 04, 17, 18, 21)

- RLS em todas as tabelas, policies com cast `::uuid` explícito
- Funções helper com `SECURITY DEFINER` para evitar recursão com RLS
- Isolamento por `teacher_id`: professor acessa apenas seus alunos
- Proteção contra mass assignment via policies de INSERT/UPDATE

## Autenticação (migrations 07, 08, 14)

- Rate limiting: 10 req/min por usuário
- Campo `must_change_password` para forçar troca de senha
- Sessões invalidadas ao desativar conta

## Lógica de Negócio (migrations 10, 13, 21)

- Trigger `validate_financial_logic` valida status e valores
- Função `is_valid_pix_key()` valida formato da chave PIX
- Constraint `grade CHECK (0-100)`

## Frontend

- `src/lib/security/errorHandler.ts` — mensagens amigáveis sem expor detalhes técnicos

## Proteções adicionais

- Views com `SECURITY INVOKER`
- `SET search_path` em todas as funções (anti-hijacking)
- Dados pessoais anonimizáveis via `anonymized_at` (LGPD)
