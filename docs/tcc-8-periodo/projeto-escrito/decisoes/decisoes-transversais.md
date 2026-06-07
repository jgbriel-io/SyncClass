# Decisões Transversais — TCC SyncClass

**Última verificação:** 2026-06-03
**Fonte:** git log, npm test, contagem direta de arquivos e migrations

Valores canônicos a serem usados identicamente em todos os capítulos finais.
Qualquer divergência detectada em revisão deve ser corrigida com base neste arquivo — não nas versões locais dos rascunhos.

---

## 0. Estrutura do Trabalho (decidida pelo orientador em 03/06/2026)

O TCC adota estrutura de 5 capítulos + cronograma + apêndices:

| Capítulo | Título                   | Origem                                                           |
| -------- | ------------------------ | ---------------------------------------------------------------- |
| 1        | Introdução               | cap 1 anterior                                                   |
| 2        | Referencial Teórico      | cap 2 anterior                                                   |
| 3        | Metodologia              | caps 3+4+5+6+7+8+9 anteriores (subtópicos 3.4–3.9, sintetizados) |
| 4        | Resultados e Discussão   | novo: sistema entregue, métricas, análise de H1/H2/H3            |
| 5        | Conclusão                | cap 10 anterior, com trabalhos futuros dentro                    |
| 6        | Cronograma de Atividades | Gantt + fases (saiu do antigo cap 8)                             |
| —        | Referências              | lista final                                                      |
| —        | Apêndices A–E            | Forms (A), RF completos (B), RNF/RN (C), UCs (D), matriz (E)     |

**Terminologia:** "iteração" substitui "Sprint" em todos os capítulos finais (ex: "vigésima oitava iteração").
**Estilo:** terceira pessoa, sem travessão como pontuação em prosa, sem jargão de IA.
**Tabelas completas** (35 RF, regras de negócio, UCs, matriz) ficam nos apêndices; o corpo do cap 3 traz sínteses.

---

## 1. Período de Desenvolvimento

| Grandeza                      | Valor               | Fonte                                                       |
| ----------------------------- | ------------------- | ----------------------------------------------------------- |
| Início (histórico versionado) | 10 de março de 2026 | Primeiro commit da `branch` principal (`git log --reverse`) |
| Fim                           | 3 de junho de 2026  | Data da entrega / último commit                             |
| Duração real                  | **~3 meses**        | Mar 10 → Jun 3 = ~85 dias (março a junho de 2026)           |

**Como usar em texto:**

- H1: "O sistema foi desenvolvido em aproximadamente três meses (março a junho de 2026) por um único desenvolvedor."
- Usar "aproximadamente três meses (março a junho de 2026)". O período é o do histórico de versionamento (git); o escopo do projeto inicia no primeiro commit. Não usar "4,5 meses" nem "janeiro".

---

## 2. Commits

| Grandeza                            | Valor   | Fonte                                                |
| ----------------------------------- | ------- | ---------------------------------------------------- |
| Commits — branch main (verificável) | **152** | `git log --oneline \| wc -l` (verificado 2026-06-03) |

**Como usar em texto:**

- Cap 6: "O desenvolvimento registrou 152 commits na branch principal, abrangendo o período de março a junho de 2026."
- Não usar "317", "165" ou "147" em nenhum capítulo.

---

## 3. Artefatos de Código

| Grandeza                                                      | Valor   | Fonte                                    |
| ------------------------------------------------------------- | ------- | ---------------------------------------- |
| Arquivos TypeScript/TSX (excl. testes, .d.ts e tipos gerados) | **329** | `find src -name "*.tsx" -o -name "*.ts"` |
| Componentes React (\*.tsx excl. testes)                       | **181** | `find src/components -name "*.tsx"`      |
| Hooks customizados (*.ts em src/hooks, incl. *Service.ts)     | **37**  | `find src/hooks -name "*.ts"`            |
| Migrations SQL                                                | **70**  | `ls supabase/migrations/*.sql \| wc -l`  |
| Requisitos Funcionais implementados                           | **32**  | RF01–RF26, RF28–RF31, RF36, RF37         |
| RF planejados / trabalhos futuros                             | **4**   | RF32–RF35                                |
| Testes automatizados                                          | **301** | `npm run test` — 2026-06-07              |

| Linhas de código (src) | **~50.000** | `find src -name "*.ts" -o -name "*.tsx" \| grep -v "test\|\.d\.ts\|integrations/supabase/types" \| xargs wc -l` |

**Como usar em texto:**

- Não usar "184 componentes" — correto é 181.
- Não usar "359 arquivos TS" (bruto) — correto é 329 (excl. testes, .d.ts e tipos gerados).
- Não usar "~55.000 linhas" — correto é ~50.000 (excl. `src/integrations/supabase/types.ts` gerado).
- "70 migrations" — verificado no filesystem.

---

## 4. Hipóteses — Limiares e Enunciados Canônicos

### H1 — Prazo

> "O desenvolvimento de um SaaS funcional para gestão de professores autônomos de inglês, realizado por um único desenvolvedor com suporte de IA generativa, foi concluído em aproximadamente três meses (março a junho de 2026)."

- **Confirmada:** sistema funcional entregue por desenvolvedor solo em ~3 meses.
- Período corresponde ao histórico de versionamento (git); escopo do projeto inicia no primeiro commit (10/mar/2026).
- Caps que precisam alinhar: 1, 3, 4, 5, 6.

### H2 — Redução de esforço backend

> "A adoção do Supabase como BaaS reduziu em ≥60% o esforço estimado de desenvolvimento backend em comparação com uma stack tradicional equivalente (Node.js + PostgreSQL + Express)."

- **Limiar obrigatório:** ≥60%. Nunca "significativamente" sem número.
- Metodologia de cálculo: enumerar superfícies eliminadas (auth, storage, realtime, RLS, migrations automáticas) e estimar esforço equivalente em stack manual.
- Caps que precisam alinhar: 1, 5, 6, 10.

### H3 — Aceleração por IA

> "O uso de IA generativa (Claude) como assistente de desenvolvimento acelerou em pelo menos 3 vezes o tempo de execução de tarefas de scaffolding, geração de migrations SQL e auditoria de segurança."

- **Unidade:** tempo de execução de tarefas específicas (não linhas de código).
- **Exemplos aderentes ao enunciado:** Sprint 1–2 (scaffolding inicial), Sprint 24 (auditoria de RLS), Sprint 9 (migrations complexas).
- **Limitação a declarar:** estimativa retrospectiva, sujeita a viés do desenvolvedor.
- Caps que precisam alinhar: 1, 6, 10.

---

## 5. Nomenclatura Metodológica

| Termo correto                                      | Termos a evitar                                |
| -------------------------------------------------- | ---------------------------------------------- |
| "modelo iterativo incremental com ciclos semanais" | "Kanban", "Scrum", "sprints fixas"             |
| "ciclos semanais de desenvolvimento"               | "sprints de 1 semana" (Scrum implícito)        |
| "assistente de IA Claude (Anthropic)"              | "Claude via Kiro IDE", "Kiro" como metodologia |

**Referências obrigatórias para metodologia:**

- Anderson, D. J. (2010). _Kanban: Successful Evolutionary Change for Your Technology Business._
- Pressman, R. S.; Maxim, B. R. (2016). _Engenharia de Software: uma abordagem profissional._ 8. ed.
- Thiollent, M. (2011). _Metodologia da Pesquisa-Ação._
- Tripp, D. (2005). Pesquisa-ação: uma introdução metodológica.

---

## 6. Outros Valores Fixos

| Grandeza                | Valor                                          | Observação                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LGPD — artigo aplicável | Art. 16, I da Lei nº 13.709/2018               | Uso em cap. 1 seção 1.3 e cap. 9                                                                                                                                                                                                                                                                                |
| Sprints totais          | 31                                             | Documentadas em `docs/sprints/` (Sprints 1–31)                                                                                                                                                                                                                                                                  |
| Tabelas no banco        | 11                                             | `activities`, `audit_logs`, `class_logs`, `financial_record_class_logs`, `financial_records`, `idempotency_keys`, `profiles`, `rate_limits`, `students`, `teachers`, `webhook_processing_log`. **NÃO** existe `user_roles` (dropada na migration 45; papel unificado em `profiles.role`) nem `performance_logs` |
| AbacatePay              | Implementado na Sprint 30                      | **Remover de "trabalhos futuros"** em cap. 10                                                                                                                                                                                                                                                                   |
| Resultado QA Sprint 28  | Ver `docs/sprints/sprint-28-testes-manuais.md` | Usar número real no cap. 7; placeholder se indisponível                                                                                                                                                                                                                                                         |

---

## Checklist de Consistência (usar no step 11)

Após escrever todos os caps finais, rodar grep para confirmar ausência de:

```bash
grep -rn "3 meses\|147 commit\|184 component\|VPS manual\
\|gateway de pagamento real\|trabalhos futuros.*AbacatePay\
\| eu \| nós \|implementei\|desenvolvemos\|significativamente" \
docs/tcc-8-periodo/projeto-escrito/capitulos-final/
```

Zero hits = consistência OK.
