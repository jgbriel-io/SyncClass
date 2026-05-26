# Archive — Documentação Histórica do SyncClass

**Última Atualização:** 2026-05-20

## Contexto

Este diretório contém **documentação histórica e de referência técnica** do projeto SyncClass. Diferente da documentação oficial em `docs/tcc/` (voltada para o TCC acadêmico), o archive preserva:

- **Detalhamento técnico completo** de requisitos, regras de negócio e implementação
- **Histórico de desenvolvimento** com análise de commits e evolução do projeto
- **Validação de metodologia** com evidências de que sprints documentadas são fiéis ao trabalho real
- **Referência para manutenção** com mapeamento completo Requisitos → Código

**Quando usar:**

- Precisa de detalhes técnicos completos (arquivos, migrations, testes) de um requisito
- Quer entender a evolução histórica do projeto (commits, fases, decisões)
- Precisa validar que a metodologia ágil foi aplicada corretamente
- Busca referência técnica para manutenção ou extensão do sistema

**Quando NÃO usar:**

- Leitura do TCC → use `docs/tcc/` (resumo acadêmico)
- Entender arquitetura atual → use `docs/architecture/overview.md`
- Consultar sprints → use `docs/sprints/` (documentação oficial)

---

## Organização

Este diretório está organizado por categoria de documentação:

---

## Estrutura

```
docs/tcc/archive/
├── README.md                              ← Este arquivo
├── requisitos/
│   ├── requisitos-funcionais.md          ← RF01-RF30 (todos os 30 requisitos)
│   └── requisitos-nao-funcionais.md      ← RNF01-RNF36 (todos os 36 requisitos)
├── regras-de-negocio/
│   └── regras-de-negocio.md              ← 59 regras completas (referência)
└── gestao-projeto/
    ├── historico-desenvolvimento.md      ← 165 commits originais (jan-fev 2026)
    └── validacao-sprints-1-15.md         ← Validação 97.8% (sprints 1-15) (prova de metodologia)
```

---

## Requisitos

### requisitos-funcionais.md

**Status:** ✅ Consolidado no Cap4 (seções 4.2.1 e 4.2.2)

Detalha **todos os 30 requisitos funcionais** (RF01-RF30) implementados:

**RF01-RF20 (Principais):**

- CRUD de alunos, professores, aulas, atividades
- Gestão financeira (cobranças, pagamentos, PIX)
- Dashboard e métricas
- Portal do aluno
- Autenticação e gerenciamento de usuários
- Anonimização LGPD

**RF21-RF30 (Adicionais):**

- Soft delete e restauração
- Hard delete com validação
- Gestão de faltas
- Suporte a estrangeiros
- Upload de foto de perfil
- Histórico completo
- API de CEP
- Timeline de transações
- Invalidação de sessões
- Limpeza automática (LGPD)

**Uso:** Referência técnica completa com evidências de código, migrations e testes. Cap4 é a fonte oficial resumida.

---

### requisitos-nao-funcionais.md

**Status:** ✅ Consolidado no Cap4 (seções 4.3.2 a 4.3.6)

Lista os **26 requisitos não funcionais adicionais** (RNF11-RNF36) implementados:

**Segurança (RNF11-RNF16):**

- Sanitização XSS, validação de email, encriptação PIX, search path security, invalidação de sessões, SECURITY DEFINER

**Performance (RNF17-RNF21):**

- Índices compostos, materialized views, paginação, code splitting, query optimization

**Usabilidade (RNF22-RNF27):**

- Design tokens, skeletons, empty states, formatters, toasts, dialogs

**Rastreabilidade (RNF28-RNF32):**

- Audit logs, performance logs, histórico, rastreamento de confirmação, logs estruturados

**Manutenção (RNF33-RNF36):**

- Cleanup automático, migrations versionadas, Edge Functions

**Uso:** Referência histórica. Cap4 é a fonte oficial.

---

## Regras de Negócio

### regras-de-negocio.md

**Status:** ✅ Ativo (referência completa)

Documenta **59 regras de negócio** extraídas do código, organizadas por módulo:

1. Usuários e Autenticação (RN-001 a RN-006)
2. Professores (RN-007 a RN-011)
3. Alunos (RN-012 a RN-016)
4. Aulas (RN-017 a RN-022)
5. Financeiro (RN-023 a RN-030)
6. Atividades (RN-031 a RN-035)
7. Segurança e Permissões (RN-036 a RN-042)
8. LGPD e Privacidade (RN-043 a RN-047)
9. Performance e Rate Limiting (RN-048 a RN-052)
10. Validação Frontend (RN-053 a RN-055)

**Uso:** Referência completa de regras de negócio. Cap4 tem 59 regras (resumo).

**Diferença vs Cap4:**

- Cap4: 59 regras (resumo para TCC)
- Archive: 59 regras completas (referência técnica com fontes)

---

## Gestão de Projeto

### historico-desenvolvimento.md

**Status:** ✅ Ativo (referência histórica)

Análise dos **165 commits originais** da branch `old-homolog` (jan-fev 2026):

- Evolução do projeto em 4 fases
- Estatísticas por tipo de commit (feat, fix, docs, etc)
- Features implementadas vs não implementadas
- Comparação old-homolog vs branch atual
- Lições aprendidas (o que funcionou, o que deixamos passar, o que mudamos)

**Uso:** Referência histórica do desenvolvimento. Útil para Cap8 (Gestão de Projeto).

**Métricas:**

- 165 commits (19 jan - 18 fev 2026)
- 70% seguem Conventional Commits
- 74 features implementadas
- 70 bugs corrigidos

---

### validacao-sprints-1-15.md

**Status:** ✅ Ativo (prova de metodologia)

Validação das **sprints 1-15** contra commits reais e trabalho executado:

- Taxa de validação: **97.8%** (45 de 46 features com evidência nas sprints 1-6)
- Distribuição de commits por sprint (1-6)
- Mapeamento: features documentadas → commits reais
- Discrepâncias encontradas (1 feature sem evidência direta)
- **Sprints 7-9:** Migrations, auditorias, reestruturação (pós-old-homolog)
- **Sprints 10-15:** Refatorações e centralização de strings (100% validadas)

**Uso:** Prova que sprints são documentação retroativa **válida e precisa**. Útil para Cap8 (Gestão de Projeto).

**Conclusão:** As sprints 1-15 são representação fiel do histórico do projeto.

---

## Relação com Documentação Oficial

| Documento Archive              | Documento Oficial                   | Relação              | Diferença                                                                            |
| ------------------------------ | ----------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `requisitos-funcionais.md`     | `docs/tcc/cap4-requisitos.md` (4.2) | Detalhamento técnico | Archive: evidências completas (arquivos, migrations, testes). Cap4: resumo acadêmico |
| `requisitos-nao-funcionais.md` | `docs/tcc/cap4-requisitos.md` (4.3) | Detalhamento técnico | Archive: implementação detalhada. Cap4: resumo acadêmico                             |
| `regras-de-negocio.md`         | `docs/tcc/cap4-requisitos.md` (4.4) | Referência completa  | Archive: 59 regras com fontes. Cap4: 59 regras resumidas                             |
| `historico-desenvolvimento.md` | `docs/tcc/cap8-gestao.md`           | Referência histórica | Archive: análise completa de 165 commits. Cap8: resumo de gestão                     |
| `validacao-sprints-1-15.md`    | `docs/tcc/cap8-gestao.md`           | Prova de metodologia | Archive: validação detalhada com critérios. Cap8: resumo de metodologia              |

**Princípio:** Archive é **referência técnica completa**. Docs oficiais são **resumo acadêmico/executivo**.

---

## Quando Usar Este Archive

### Use os arquivos de Requisitos quando:

- Precisar de detalhes técnicos completos de RF21-RF30 ou RNF11-RNF36
- Quiser ver evidências de implementação (arquivos, migrations, testes)
- Precisar rastrear um requisito específico até o código

### Use Regras de Negócio quando:

- Precisar da lista completa de 59 regras (Cap4 tem 55)
- Quiser ver mapeamento Requisitos → Regras → Código
- Precisar de referência técnica detalhada

### Use Gestão de Projeto quando:

- Precisar de contexto histórico do desenvolvimento
- Quiser validar metodologia ágil aplicada
- Precisar de métricas de commits e features
- Estiver escrevendo Cap8 (Gestão de Projeto)

---

## Arquivos Removidos

### analise-cobertura-requisitos.md

**Removido em:** 2026-05-20  
**Razão:** Consolidado em `requisitos-funcionais-adicionais.md` e `requisitos-nao-funcionais-adicionais.md`  
**Status:** Missão cumprida — Cap4 já atualizado com RF21-RF30 e RNF11-RNF36

### Pasta sprint-23/

**Removida em:** 2026-05-20  
**Razão:** Trabalho intermediário já consolidado nas Sprints 12-15 oficiais  
**Conteúdo:** 26 arquivos de auditoria e validação da centralização de strings  
**Status:** Redundante — Sprints 12-15 já documentam o resultado final

---

## Manutenção

Este archive deve ser mantido como **referência histórica**. Não adicionar novos arquivos sem justificativa clara.

**Critérios para adicionar ao archive:**

- ✅ Documentação histórica valiosa
- ✅ Referência técnica completa
- ✅ Prova de metodologia ou decisões
- ❌ Trabalho intermediário já consolidado
- ❌ Documentação redundante com docs oficiais

---

## Referências

- **Documentação Oficial:** `docs/tcc/` (Cap1-Cap10)
- **Sprints:** `docs/sprints/` (Sprint 1-27)
- **Código:** `src/`, `supabase/`
- **Arquitetura:** `docs/architecture/overview.md`, `docs/database/overview.md`
