# Assets Pendentes — TCC

> Tudo que precisa ser criado/capturado/montado manualmente para completar a entrega.
> Estrutura: 6 capítulos (1 Introdução, 2 Referencial, 3 Metodologia, 4 Resultados, 5 Conclusão, 6 Cronograma) + Referências + Apêndices A–E (fim do documento).

---

## Como capturar

**Prints de tela:** rodar `npm run dev` → capturar com a aplicação em uso real
**Diagramas:** usar draw.io, Lucidchart ou dbdiagram.io
**Resultados de testes:** rodar `npm run test` e capturar o output

> **Nota:** testes E2E não foram implementados (declarado como limitação/trabalho futuro).

---

## Figuras pendentes (corpo)

- [ ] 🖼️ **Figura 3.1** — Fluxo de desenvolvimento iterativo do SyncClass (planejamento → ação → observação → reflexão) — §3.2
- [ ] 🖼️ **Figura 3.2** — DER completo (dbdiagram.io a partir de `docs/database/schema.md`; 11 tabelas) — §3.5.2
- [ ] 🖼️ **Figura 4.1** — Tela de listagem de alunos (perfil professor) — §4.1
- [ ] 🖼️ **Figura 4.2** — Fluxo financeiro: geração de cobrança e pagamento PIX — §4.1
- [ ] 🖼️ **Figura 4.3** — Portal do aluno (perfil aluno, mobile) — §4.1
- [ ] 🖼️ **Figura 4.4** — Painel do professor — §4.1
- [ ] 🖼️ **Figura 6.1** — Gantt do desenvolvimento — §6.2
  - Período: **março a junho de 2026** (~3 meses)
  - 5 fases: Fundação (mar) · Consolidação (mar–abr) · Expansão (abr–mai) · Qualidade e segurança (mai) · Estabilização (mai–jun)
  - Dados: `capitulo6-final.md` Tabela 6.1

## Figuras pendentes (apêndices)

- [ ] 🖼️ **Figura D.1** — Diagrama de Casos de Uso (UML): atores (admin/professor/aluno) e UC01–UC26 — draw.io ou Lucidchart — Apêndice D

## Outros pendentes

- [ ] 📋 **Apêndice A — Formulário de avaliação exploratória** — aplicar o Google Forms com professores/alunos voluntários e incorporar os resultados (hoje placeholder, pendente de execução)
- [ ] 📄 (opcional) Output dos 304 testes (Vitest) — capturar terminal de `npm run test` (Cap. 4)
- [ ] 🖼️ (opcional) Converter as tabelas longas dos Apêndices B–E em imagem para impressão

## Elementos pré-textuais

- [x] Resumo + Abstract + palavras-chave (`resumo-e-abstract.md`)
- [x] Listas de Figuras, Tabelas, Quadros e Siglas (`listas/`) — faltam só as páginas (XX) na diagramação
- [ ] Capa, folha de rosto, folha de aprovação — montar no Word (template FEPI)
- [ ] Sumário — gerar automático no Word
- [ ] (opcional) Dedicatória, agradecimentos, epígrafe

---

## Resumo por prioridade

| Prioridade | Asset                                     | Onde               |
| ---------- | ----------------------------------------- | ------------------ |
| 🔴 Alta    | DER (Figura 3.2)                          | Cap. 3             |
| 🔴 Alta    | Prints das telas (Figuras 4.1–4.4)        | Cap. 4             |
| 🔴 Alta    | Gantt março–junho (Figura 6.1)            | Cap. 6             |
| 🔴 Alta    | Capa, folha de rosto, sumário             | Pré-textual (Word) |
| 🟠 Média   | Diagrama de Casos de Uso UML (Figura D.1) | Apêndice D         |
| 🟠 Média   | Fluxo de desenvolvimento (Figura 3.1)     | Cap. 3             |
| 🟠 Média   | Formulário exploratório aplicado          | Apêndice A         |
| 🟡 Baixa   | Output de testes (Vitest)                 | Cap. 4             |
| 🟡 Baixa   | Tabelas de apêndice como imagem           | Apêndices B–E      |
