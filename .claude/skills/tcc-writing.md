# Skill: TCC Writing

Escrita acadêmica para TCC SyncClass — 10 capítulos, normas FEPI/ABNT 2026.

## Objetivo

Estruturar, revisar e finalizar texto dos capítulos do TCC seguindo normas de formatação, tom acadêmico e qualidade esperada.

## Normas Obrigatórias

### Voz e Tom
- **Impessoalidade absoluta:** Voz passiva ou terceira pessoa do singular.
- **NUNCA primeira pessoa:** Proibido "eu", "nós", "desenvolvemos", "implementei".
- **Exemplos corretos:**
  - "Desenvolveu-se a infraestrutura..." ✅
  - "A plataforma centraliza..." ✅
  - "Eu desenvolvi..." ❌
  - "Implementamos..." ❌

### Formatação (Word)
- **Fonte:** Arial ou Times New Roman, tamanho **12**.
- **Secundária:** Tamanho **10** (citações longas, legendas, rodapé).
- **Espaçamento:** 1,5 no corpo | Simples em citações e legendas.
- **Recuo parágrafo:** 1,25 cm primeira linha.
- **Alinhamento:** Justificado.
- **Margens:** Superior/Esquerda 3 cm | Inferior/Direita 2 cm.
- **Impressão:** Anverso (frente) apenas.

### Citações
- **Curta (≤ 3 linhas):** Entre aspas no corpo do texto: "Lorem ipsum..." (AUTOR, ano).
- **Longa (> 3 linhas):** 
  - Recuo 4 cm do corpo.
  - Fonte tamanho 10.
  - Espaço simples.
  - Sem aspas.
  - (AUTOR, ano) após.
- **Indireta:** Paráfrase sem aspas com (AUTOR, ano) no final.

### Referências Bibliográficas
- **Ordem:** Alfabética por sobrenome.
- **Formato:** Título em **Negrito**.
- **Alinhamento:** À esquerda.
- **Espaçamento:** Simples entre cada referência, uma linha em branco entre itens.
- **Localização:** `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md`.

### Figuras e Tabelas
```
Figura X – Título da Figura         (tamanho 12, centralizado, ACIMA da imagem)
[imagem/tabela]
Fonte: O autor (2026).              (tamanho 10, centralizado, ABAIXO da imagem)
```
- Toda figura/tabela deve ser mencionada e explicada **antes** de aparecer no texto.

### Glossário Técnico
- Primeira aparição de termos técnicos (SaaS, BaaS, RLS, MVP, IA, etc.): explicar brevemente.
- Ex: "O modelo **SaaS (Software as a Service)** permite..."

## Estrutura dos 10 Capítulos

Arquivo base: `docs/tcc/cap{N}-{slug}.md`

| Cap. | Título | Conteúdo | Status |
|------|--------|----------|--------|
| 1 | Introdução | Problema, Objetivos, Justificativa (ODS), Hipóteses | ✅ Concluído |
| 2 | Referencial Teórico | MVP, SaaS/BaaS, LGPD, ISO 25010 | 🟠 Rascunho |
| 3 | Metodologia | Pesquisa-Ação, Kanban, IA como metodologia | 🔴 Pendente |
| 4 | Engenharia de Requisitos | RF, RNF, UML, Casos de Uso | 🔴 Pendente |
| 5 | Arquitetura e Modelagem | DER, RLS, Diagramas de Fluxo, Tabelas | 🔴 Pendente |
| 6 | Implementação Técnica | Stack, Pastas, Módulos, Componentes, Hooks | 🔴 Pendente |
| 7 | Qualidade e Testes | Vitest, Playwright, ISO 25010 Validation | 🔴 Pendente |
| 8 | Gestão do Projeto | Sprints, Gantt, Riscos, Produtividade IA | 🔴 Pendente |
| 9 | Infraestrutura e Deploy | Docker, CI/CD, GitHub Actions, Cloud | 🔴 Pendente |
| 10 | Conclusão | Validação de Hipóteses, Trabalhos Futuros | 🔴 Pendente |

## Estilo de Escrita

- **Claro e conciso:** Frases curtas, parágrafos bem estruturados.
- **Técnico mas acessível:** Explicar conceitos complexos sem ser superficial.
- **Evidência:** Cada afirmação deve ter suporte (citação, código, dados).
- **Sem clichês:** Evitar "é importante", "é crucial", "é vital".
- **Progressão lógica:** Cada seção prepara a próxima.

## Estrutura de Seção Padrão

```markdown
## N.X Título da Seção

Parágrafo introdutório contextualiza o tema.

### N.X.Y Subseção (opcional)

Conteúdo específico com citações onde relevante (AUTOR, ano).

**Tabela/Figura (se houver):**
Figura X – Título...

Parágrafo explicativo após figura.
```

## Checklist Antes de Enviar Capítulo

- [ ] Voz passiva/3ª pessoa — zero primeira pessoa.
- [ ] Todas as figuras/tabelas citadas antes de aparecer.
- [ ] Fontes: 12 corpo, 10 legendas/citações.
- [ ] Espaçamento: 1,5 corpo, simples em citações.
- [ ] Referências: todas as citações estão na lista final?
- [ ] Glossário: termos técnicos explicados na primeira aparição?
- [ ] Sem pontuação ao fim de títulos (exceto interrogação).
- [ ] Alinhamento justificado em todo o texto.

## Referências Base (Já Coletadas)

Ver: `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md`

Principais fontes:
- Eric Ries — *A startup enxuta* (MVP).
- Laudon & Laudon — *Sistemas de Informação Gerenciais* (SI).
- NIST — *The NIST Definition of Cloud Computing* (Cloud/SaaS).
- ISO/IEC 25010 — Modelo de Qualidade.
- Lei nº 13.709/2018 — LGPD.
- Objetivos de Desenvolvimento Sustentável (ONU).

---

## 🔑 Traduzir Código Real → Texto Acadêmico

**Princípio:** Tudo que está no código/docs deve virar narrativa impessoal e justificada.

### Fontes Verídicas do Projeto (consultar antes de afirmar)
- `docs/tcc/tcc-referencia.md` — números, tabelas, RFs/RNFs extraídos do código.
- `docs/architecture/overview.md` — diagramas, camadas, problemas detectados.
- `docs/architecture/clean-code.md` — design patterns implementados.
- `docs/sprints/` — 24 sprints (nome, escopo, decisões).
- `supabase/migrations/` — schema real (25 migrations).
- `src/hooks/` — services e queries reais.
- `src/components/` — domínios e organização.
- `package.json` — versões exatas.

### Padrões de Tradução

**❌ Errado (1ª pessoa):**
> "Eu escolhi o Supabase porque ele me oferece RLS nativo e eu queria evitar montar um backend."

**✅ Correto (impessoal):**
> "A escolha do Supabase como Backend as a Service (BaaS) fundamenta-se em três fatores: (i) suporte nativo a Row Level Security (RLS), garantindo isolamento de dados em nível de linha; (ii) redução do esforço de infraestrutura, alinhada à hipótese H2; e (iii) integração de autenticação, banco e storage em uma única solução."

**❌ Errado (informal):**
> "Tem 25 migrations e umas 5 Edge Functions."

**✅ Correto (acadêmico):**
> "O projeto contempla 25 migrações SQL versionadas, executadas via Supabase CLI, e 5 Edge Functions implementadas em Deno/TypeScript, responsáveis por operações que requerem privilégios de service role (Tabela X)."

### Estrutura de Justificativa Técnica

Toda decisão técnica no TCC segue o tripé:

```
1. CONTEXTO  — Qual problema/necessidade existia?
2. ALTERNATIVAS  — Que opções foram consideradas?
3. CRITÉRIOS  — Por que a escolhida atende melhor?
```

**Exemplo:**

> A camada de persistência precisa garantir isolamento entre professores autônomos, evitando vazamento de dados entre inquilinos (multi-tenancy). Foram avaliadas três alternativas: (i) controle de acesso na camada de aplicação, suscetível a falhas humanas; (ii) bancos de dados separados por inquilino, com sobrecarga operacional; (iii) Row Level Security (RLS) nativo do PostgreSQL, com políticas declarativas no próprio banco. Optou-se pela terceira opção por aproximar a regra de segurança do dado e reduzir a superfície de erro (POSTGRESQL, 2024).

### Vocabulário — Evitar / Preferir

| ❌ Evitar | ✅ Preferir |
|----------|-------------|
| "fiz", "implementei" | "foi implementado", "implementou-se" |
| "achei melhor" | "optou-se por", "considerou-se mais adequado" |
| "muito rápido" | "tempo de resposta inferior a 2s (RNF06)" |
| "fácil de usar" | "interface conforme princípios de usabilidade ISO 25010" |
| "no código" | "no código-fonte" |
| "rolou bem" | "apresentou resultado satisfatório" |
| "tipo" | "como, por exemplo" |
| "a gente fez" | "realizou-se", "desenvolveu-se" |
| "deu certo" | "obteve êxito", "validou-se" |

### Conectivos Acadêmicos (usar para fluidez)

- **Causalidade:** "em virtude de", "decorrente de", "uma vez que"
- **Adversidade:** "no entanto", "todavia", "em contrapartida"
- **Conclusão:** "portanto", "desta forma", "conclui-se que"
- **Adição:** "ademais", "além disso", "outrossim"
- **Exemplificação:** "a título de exemplo", "como ilustração"

### Citação de Próprio Código no TCC

Ao referenciar arquivo/módulo do projeto:

> "O isolamento por inquilino é implementado em `src/integrations/supabase/client.ts` (Apêndice A), que instancia o cliente Supabase com a chave anônima do projeto. As políticas RLS, declaradas em SQL nas migrações `supabase/migrations/`, garantem que cada consulta retorne apenas registros pertencentes ao usuário autenticado."

**Nunca** colar trechos longos no corpo. Usar Apêndices para código.

### Como Justificar Trade-offs Honestos

TCC bom é honesto sobre limitações.

**Exemplo:**
> "A pirâmide de testes do projeto contempla atualmente apenas a camada de testes unitários (Vitest), com cobertura concentrada em hooks customizados e funções utilitárias. A ausência de testes end-to-end (e.g., Playwright) configura-se como limitação reconhecida, sendo apontada como trabalho futuro no Capítulo 10."

### Capítulo a Capítulo — Foco Esperado

| Cap. | Use o que para escrever |
|------|--------------------------|
| 1 — Introdução | ✅ Pronto. Apenas revisar consistência com versão final. |
| 2 — Referencial | Citações acadêmicas. Conceitos: SaaS, BaaS, MVP, RLS, ISO 25010, LGPD, ODS. |
| 3 — Metodologia | Pesquisa-Ação + Kanban + IA como copilota. Citar Anderson (Kanban), Ries (MVP). |
| 4 — Requisitos | Tabela RF (20)/RNF (10) de `tcc-referencia.md`. UML (Casos de Uso). |
| 5 — Arquitetura | Diagramas de `docs/architecture/overview.md`. DER do schema real. |
| 6 — Implementação | Estrutura de pastas + design patterns (`docs/architecture/clean-code.md`). |
| 7 — Qualidade | Tabela ISO 25010 + cobertura Vitest. **Ressalvar ausência de E2E.** |
| 8 — Gestão | 24 sprints de `docs/sprints/`. Gantt retroativo. Métricas IA. |
| 9 — Deploy | Docker (se houver), GitHub Actions, ambiente prod. |
| 10 — Conclusão | Validar H1, H2, H3 com evidências do projeto. Trabalhos futuros. |

### Checklist Específico — Voz Impessoal

Antes de salvar capítulo, fazer Find/Replace:

- "eu " → reescrever
- "nós " → reescrever
- "fiz", "fizemos", "implementei", "implementamos" → voz passiva
- "minha", "meu", "nosso", "nossa" → "o presente trabalho", "o projeto"
- "vou explicar" → "explica-se", "será explicado"
- "achei que" → "considerou-se", "constatou-se"

---

## 🛠️ Processo Iterativo de Drafting

Normas acima dizem **o que** o texto deve ser. Esta seção diz **como** chegar lá. Drafting acadêmico em três fases.

### Fase 1 — Fragmentos (matéria-prima bruta)

Antes de escrever capítulo formal, capturar fragmentos: notas, observações sobre código, decisões técnicas anotadas, citações encontradas em leitura, ideias soltas.

**Arquivo de matéria-prima:** `docs/tcc/_fragmentos/cap{N}-fragmentos.md`

Formato: fragmentos separados por `---`, sem frontmatter, sem estrutura imposta. H1 com título de trabalho do capítulo no topo.

Exemplo:
```markdown
# Fragmentos — Capítulo 3 Metodologia

A escolha de Pesquisa-Ação se justifica porque o pesquisador participa
da construção da solução. Citar Thiollent.

---

> "A pesquisa-ação é um tipo de pesquisa social com base empírica..."
> (THIOLLENT, 2011, p. 14)

Trecho útil pra abertura. Confirma citação na fonte original.

---

Kanban entrou porque o projeto teve 24 sprints fluidas, sem
cerimônias rígidas. Ver `docs/sprints/`. Anderson é a referência.
Pesquisar paper original.

---

Hipótese: IA não substitui metodologia, atua como copiloto dentro
dela. Diferenciar de "metodologia da IA" vs "IA na metodologia".
```

**Regra crucial:** fragmento existe para autor entender, não para leitor frio. Bar é "isso me serve quando eu voltar?", não "isso está pronto para o TCC?".

### Fase 2 — Forma (matéria-prima → seção formatada)

Quando fragmentos do capítulo estão maduros (10–20 fragmentos), começar a moldagem.

**Loop por seção:**

1. **Ler** o arquivo de fragmentos do capítulo do início ao fim.
2. **Propor 2–3 aberturas candidatas** para a seção, cada uma implicando tese/ângulo diferente. Mostrar ao usuário. Não escrever no arquivo do TCC ainda.
3. **Usuário escolhe** uma abertura (ou pede híbrida).
4. **Escrever apenas o parágrafo de abertura** no arquivo do capítulo (`docs/tcc/cap{N}-{slug}.md`).
5. **Perguntar:** "dado este parágrafo, o que o leitor precisa ler em seguida?" Puxar fragmento relevante da pilha, transformá-lo em parágrafo acadêmico (voz impessoal, citação ABNT, vocabulário formal).
6. **Discutir o formato do próximo bloco:** prosa, lista, tabela, figura, callout? Decisão deliberada:
   - **Prosa vs. lista:** prosa carrega argumento; lista carrega itens paralelos. Se não são paralelos, prosa.
   - **Tabela vs. estrutura repetida em prosa:** se mesma forma se repete 3+ vezes com mesmos campos, tabela. Senão prosa.
   - **Figura vs. descrição textual:** figura quando estrutura é o ponto (DER, fluxo, UML). Prosa quando o ponto é argumento.
   - **Citação direta vs. paráfrase:** direta quando palavras exatas importam. Paráfrase quando só a ideia importa.
   - **Código no corpo vs. apêndice:** trechos curtos (≤5 linhas) inline; mais que isso → Apêndice.
7. **Escrever esse bloco** no arquivo do capítulo. Re-ler o arquivo antes de cada escrita — usuário pode ter editado entre turnos.
8. **Loop 5–7** até a seção fechar.

**Regra:** nunca escrever vários parágrafos de uma vez. Um bloco por turno. Drift acontece quando se escreve adiante.

### Fase 3 — Revisão impessoal final

Antes de marcar capítulo como ✅ no índice, varredura final automatizada. Skill global `tcc-revisao-impessoal` cobre isso, mas resumo:

1. Find/Replace de pronomes pessoais (checklist da seção anterior).
2. Find de clichês: "é importante", "é crucial", "é vital", "atualmente", "nos dias de hoje".
3. Find de informalidade: "tipo", "a gente", "rolou", "tá", "pra" (em prosa formal — em citação direta literal mantém).
4. Conferir cada figura/tabela citada **antes** de aparecer.
5. Conferir cada autor citado no corpo presente em `Referências Bibliográficas.md`.
6. Conferir glossário: termo técnico explicado na primeira ocorrência do capítulo.

### Quando NÃO usar processo iterativo

- Reescrita de parágrafo já existente: editar direto, não voltar pra fragmentos.
- Correção pontual (erro de norma, citação errada): edit em lugar.
- Tradução de tabela já decidida: aplicação direta das normas, sem brainstorm.

Processo iterativo é para **conteúdo novo** que ainda não tem forma decidida.
