# Gestão de Projeto — Documentação Histórica e de Referência

**Última Atualização:** 2026-06-03

## Contexto

Documentação histórica e referência técnica do SyncClass. Complementa o TCC acadêmico com detalhamento completo de requisitos, regras de negócio, histórico de desenvolvimento e validação de metodologia.

**Quando usar:**

- Precisar de detalhes técnicos completos (arquivos, migrations, testes) de um requisito
- Quiser entender a evolução histórica do projeto (commits, fases, decisões)
- Precisar validar que a metodologia foi aplicada corretamente
- Buscar referência técnica para manutenção ou extensão do sistema

**Quando NÃO usar:**

- Leitura do TCC → use `docs/tcc-8-periodo/projeto-escrito/capitulos/`
- Entender arquitetura atual → use `docs/architecture/overview.md`
- Consultar sprints → use `docs/sprints/`

---

## Estrutura

```
docs/tcc-8-periodo/gestao-projeto/
├── README.md                        ← Este arquivo
├── requisitos-funcionais.md         ← RF01-RF35 (31 implementados + 4 futuros)
├── requisitos-nao-funcionais.md     ← RNF01-RNF36 (36 implementados)
├── regras-de-negocio.md             ← 62 regras completas com fontes
├── historico-desenvolvimento.md     ← 165 commits originais (jan-fev 2026)
└── validacao-sprints-1-15.md        ← Validação 100% sprints 1-27 (28/31 em andamento)
```

---

## Arquivos

### requisitos-funcionais.md

**Status:** ✅ Atualizado (Jun/2026) — 35 RF (31 implementados + 4 futuros)

**RF01-RF30 (Implementados, Sprints 1-9):**

- CRUD de alunos, professores, aulas, atividades
- Gestão financeira (cobranças, pagamentos, PIX manual)
- Dashboard e métricas, portal do aluno
- Autenticação, convite, reset de senha
- LGPD: anonimização, soft delete, limpeza automática

**RF34 (Implementado, Sprint 30):**

- AbacatePay — pagamento PIX automático via webhook

**RF31/32/33/35 (Trabalhos Futuros):**

- Notificações, Exportação PDF, Google Calendar, Gamificação

---

### requisitos-nao-funcionais.md

**Status:** ✅ Atualizado (Jun/2026) — 36 RNF implementados

- **Segurança (RNF01-RNF16):** RLS, JWT, LGPD, XSS, rate limiting, SECURITY DEFINER
- **Performance (RNF17-RNF21):** Índices, materialized views, paginação, lazy loading
- **Usabilidade (RNF22-RNF27):** Design tokens, skeletons, empty states, formatters
- **Rastreabilidade (RNF28-RNF32):** Audit logs, performance logs, histórico
- **Manutenção (RNF33-RNF36):** Cleanup automático, 70 migrations, 9 Edge Functions

---

### regras-de-negocio.md

**Status:** ✅ Atualizado (Jun/2026) — 62 regras

| Módulo                      | Regras          |
| --------------------------- | --------------- |
| Usuários e Autenticação     | RN-001 a RN-006 |
| Professores                 | RN-007 a RN-011 |
| Alunos                      | RN-012 a RN-016 |
| Aulas                       | RN-017 a RN-022 |
| Financeiro                  | RN-023 a RN-030 |
| Atividades                  | RN-031 a RN-035 |
| Segurança e Permissões      | RN-036 a RN-042 |
| LGPD e Privacidade          | RN-043 a RN-047 |
| Performance e Rate Limiting | RN-048 a RN-052 |
| Validação Frontend          | RN-053 a RN-059 |
| AbacatePay (Sprint 30)      | RN-060 a RN-062 |

---

### historico-desenvolvimento.md

**Status:** ✅ Atualizado (Jun/2026)

Análise dos 165 commits originais da branch `old-homolog` (jan-fev 2026):

- Evolução em 4 fases (Fundação → Consolidação → Features → Qualidade)
- Estatísticas por tipo de commit
- Comparação old-homolog vs branch atual (~218 commits, Sprint 31)
- Lições aprendidas

**Útil para:** Cap8 (Gestão de Projeto)

---

### validacao-sprints-1-15.md

**Status:** ✅ Atualizado (Jun/2026) — cobre sprints 1-31

| Bloco        | Taxa            |
| ------------ | --------------- |
| Sprints 1-27 | 100%            |
| Sprint 28    | 🟡 Em andamento |
| Sprint 29-30 | 100%            |
| Sprint 31    | 🟡 Em andamento |

**Útil para:** Cap8 — prova que sprints são documentação retroativa válida e precisa

---

## Relação com Documentação Oficial

| Arquivo                        | Capítulo TCC | Diferença                                                               |
| ------------------------------ | ------------ | ----------------------------------------------------------------------- |
| `requisitos-funcionais.md`     | Cap4 §4.2    | Evidências completas (arquivos, migrations, testes) vs resumo acadêmico |
| `requisitos-nao-funcionais.md` | Cap4 §4.3    | Implementação detalhada vs resumo acadêmico                             |
| `regras-de-negocio.md`         | Cap4 §4.4    | 62 regras com fontes vs 59 regras resumidas                             |
| `historico-desenvolvimento.md` | Cap8         | Análise completa de 165 commits vs resumo de gestão                     |
| `validacao-sprints-1-15.md`    | Cap8         | Validação detalhada com critérios vs resumo de metodologia              |

---

## Referências

- **Capítulos TCC:** `docs/tcc-8-periodo/projeto-escrito/capitulos/`
- **Sprints:** `docs/sprints/` (Sprint 1-31)
- **Código:** `src/`, `supabase/`
- **Arquitetura:** `docs/architecture/overview.md`
