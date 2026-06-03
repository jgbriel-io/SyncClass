# Assets Pendentes — TCC

> Tudo que precisa ser criado/capturado manualmente para completar os capítulos.

---

## Como capturar

**Prints de tela:** rodar `npm run dev` → capturar com a aplicação em uso real  
**Diagramas:** usar draw.io, Lucidchart ou dbdiagram.io  
**Resultados de testes:** rodar os comandos abaixo e capturar o output

```bash
# Testes unitários
npm run test
```

> **Nota:** Testes E2E não foram implementados no escopo do MVP.

---

## Cap. 2 — Referencial Teórico

- [ ] 🖼️ Pirâmide IaaS/PaaS/SaaS com exemplos de cada camada
- [ ] 🖼️ Diagrama ISO 25010 com as 8 características
- [ ] 🖼️ Pirâmide de testes (unitários → integração → E2E)
- [ ] 🖼️ Arquitetura conceitual da plataforma

## Cap. 3 — Metodologia

- [ ] 🖼️ Tabela de ferramentas formatada para impressão
- [ ] 🖼️ Fluxo de desenvolvimento (diagrama do processo iterativo)

## Cap. 4 — Requisitos

- [ ] 🖼️ Tabela RF/RNF formatada para impressão
- [ ] 🖼️ Diagrama de Casos de Uso (UML) — draw.io ou Lucidchart

## Cap. 5 — Modelagem e Arquitetura

- [ ] 🖼️ DER completo — gerar no [dbdiagram.io](https://dbdiagram.io) a partir do schema em `docs/database/schema.md`
- [ ] 🖼️ Diagrama de arquitetura conceitual (frontend ↔ Supabase)
- [ ] 🖼️ Wireframes das telas principais (ou prints da aplicação)
- [ ] 🖼️ Tabela de rotas/endpoints formatada

## Cap. 6 — Desenvolvimento

- [ ] 🖼️ Print: Tela de listagem de alunos (admin ou professor)
- [ ] 🖼️ Print: Tela de registro de aula / pacote de aulas
- [ ] 🖼️ Print: Tela financeira com status de cobranças
- [ ] 🖼️ Print: Tela de atividades (professor)
- [ ] 🖼️ Print: Portal do aluno — mobile
- [ ] 🖼️ Print: Dashboard do professor
- [ ] 🖼️ Print: Tela admin — visão geral consolidada
- [ ] 🖼️ Figura: Estrutura de pastas formatada

## Cap. 7 — Qualidade

- [ ] Relatório de testes unitários (Vitest) — capturar output do terminal
- [ ] 🖼️ Tabela ISO 25010 formatada para impressão

## Cap. 8 — Gestão

- [ ] 🖼️ Gantt retroativo — montar no Excel/Google Sheets ou draw.io
  - Eixo X: semanas (19/jan → 26/mai 2026)
  - Eixo Y: sprints/módulos
  - Dados: ver `docs/sprints/historico-completo.md`

## Cap. 9 — Deploy

- [ ] 🖼️ Diagrama de infraestrutura (Cloudflare Pages + GitHub Actions + Supabase)
- [ ] 🖼️ Diagrama do pipeline CI/CD (GitHub Actions)

---

## Resumo por prioridade

| Prioridade | Asset                       | Capítulo   |
| ---------- | --------------------------- | ---------- |
| 🔴 Alta    | DER completo                | Cap. 5     |
| 🔴 Alta    | Prints das telas principais | Cap. 6     |
| 🔴 Alta    | Gantt retroativo            | Cap. 8     |
| 🟠 Média   | Diagrama de Casos de Uso    | Cap. 4     |
| 🟠 Média   | Output de testes            | Cap. 7     |
| 🟠 Média   | Diagrama de arquitetura     | Cap. 5     |
| 🟡 Baixa   | Pirâmide IaaS/PaaS/SaaS     | Cap. 2     |
| 🟡 Baixa   | ISO 25010                   | Cap. 2 / 7 |
| 🟡 Baixa   | Diagrama de infra/CI        | Cap. 9     |
