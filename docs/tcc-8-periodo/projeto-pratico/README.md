# Projeto Prático — SyncClass

**Última Atualização:** 2026-06-03

Documentação de suporte ao projeto prático do TCC. Complementa os capítulos escritos com dados extraídos do código, histórico de desenvolvimento e resumo executivo.

---

## Estrutura

```
docs/tcc-8-periodo/projeto-pratico/
├── README.md                                  ← Este arquivo
├── conclusao-desenvolvimento.md               ← Status final, métricas, sprints, hipóteses
├── resumo-orientador.md                       ← Resumo executivo para orientador
├── referencias.md                             ← Dados extraídos do código (cap3–7)
└── historico-de-desenvolvimento-syncclass.md  ← Timeline completa sprint 1–31
```

---

## Arquivos

### conclusao-desenvolvimento.md

Status final do projeto com todas as 31 sprints documentadas. Inclui:

- Métricas: 152 commits, 305 arquivos TS, ~50k linhas, 70 migrations, 304 testes, 9 Edge Functions
- Histórico de sprints por fase (MVP → Refatoração → Segurança → QA → Fixes)
- Hipóteses H1/H2/H3 com evidências
- Features fora do escopo (trabalhos futuros)
- Critérios de aceite de qualidade atingidos

**Útil para:** Cap6, Cap8, Cap10

---

### resumo-orientador.md

Resumo executivo de 1 página. Stack, métricas, fases, hipóteses, pendências.

**Útil para:** Apresentação ao orientador, defesa

---

### referencias.md

Dados extraídos automaticamente do código-fonte (20/05/2026, atualizado Jun/2026):

- Stack com versões exatas (cap3)
- RF01-RF35: 31 implementados + 4 futuros + RF34 AbacatePay ✅ (cap4)
- RNF01-RNF36: 36 implementados (cap4)
- 62 regras de negócio (cap4)

**Útil para:** Base de dados para rascunhos cap3–cap7

---

### historico-de-desenvolvimento-syncclass.md

Timeline completa sprint 1–31 com marcos e períodos. Reconstruída a partir do histórico git (migrations, docs/sprints/, 152 commits).

**Útil para:** Cap8 — seção de cronograma

---

## Relação com Capítulos TCC

| Arquivo                                     | Capítulos                                                    |
| ------------------------------------------- | ------------------------------------------------------------ |
| `conclusao-desenvolvimento.md`              | Cap6 (métricas), Cap8 (sprints/hipóteses), Cap10 (conclusão) |
| `resumo-orientador.md`                      | Apresentação ao orientador                                   |
| `referencias.md`                            | Cap3 (stack), Cap4 (requisitos/regras)                       |
| `historico-de-desenvolvimento-syncclass.md` | Cap8 (cronograma)                                            |

---

## Referências

- **Capítulos:** `docs/tcc-8-periodo/projeto-escrito/capitulos-guia/`
- **Sprints:** `docs/sprints/` (Sprint 1-31)
- **Gestão:** `docs/tcc-8-periodo/gestao-projeto/`
