# Próximos Passos — TCC SyncClass

> Atualizado em: 06/06/2026
> Estado: caps 1-6 + Referências + Apêndices A-E (texto) no Word. Falta apêndice (corpo), assets visuais e ajustes finais.

---

## ✅ Feito hoje (06/06)

### Conteúdo / escrita (nos `.md`)

- Revisão impessoal dos caps 1-6 + apêndices: **0 ocorrências** de 1ª pessoa, clichê ou informalidade; todas as citações resolvem nas Referências.
- **Tom de voz validado** — não é texto genérico de IA (0 adjetivo vazio, em-dash mínimo, variância de frase humana). Quebrados 3 tricolons adjetivais; em-dash de prosa reduzido.
- **Quadro comparativo** de concorrentes (Classroom/Moodle/Planilha/Apps) resgatado da versão antiga → **Quadro 2.1** (§2.1); Quadro ISO renumerado para 2.2.
- **Hipóteses antigas** (impacto no usuário) resgatadas como **validação futura** no §5.4.
- **8 títulos enforcados** corrigidos (texto de abertura antes da 1ª subseção): §1.4, §2.7, §3.2, §3.3, §3.4, Apêndices C, D, D.2.
- Bloco de código `is_admin()` formalizado como **Figura 3.3** (legenda + fonte + chamada + lista).
- **Reclassificação Tabela→Quadro** (conteúdo textual): 4.2, 4.3, 6.1, B.1-E.1 viraram **Quadro**. Só Tabela 3.1 e 4.1 (numéricas) seguem Tabela. Listas reescritas.
- Expansões de frase: trade-off do BaaS (§2.7.2), defesa em profundidade (§2.8), §3.1, §3.3.1, §3.4.1, §4.1, §3.3.2 quebrado em 3 parágrafos.
- _a priori_ / _a posteriori_ em itálico.
- **Gantt** (§6.2): adicionada faixa de **redação do TCC** (junho), distinta do desenvolvimento.
- **Lista de Siglas**: removidas ABNT/BOLA órfãs; DER passou a ser usada; adicionadas **RF, RNF, UC, CSS, JSON** (41 siglas).
- Resumo + Abstract trazidos para `capitulos-final/resumo-e-abstract-final.md`.
- Spec do **formulário Google Forms** criado em `pendencias-manuais/formulario-google-forms.md`.

### Word (FINAL SYNCCLASS - TCC.docx)

- Colados caps 1-6, Referências, Apêndices A-E (texto), Resumo/Abstract, 3 Listas.
- Numeração de página corrigida (capa = 1, introdução = 15).
- Fonte → **Arial** (corpo todo).
- Corrigidos os 5 títulos de seção errados (3.2.1, 3.2.2, 3.3.1, 3.4.2, 3.8) e as 4 legendas erradas (Quadros 3.1/3.2/3.3 + Figura 3.2); removido "Quadro 1" stray.
- Conversão pandoc (md → docx com tabelas Word reais) para apêndice.

### Validações feitas

- Estrutura: 6 caps completos, fidelidade de texto docx vs `.md` ~99%.
- Legendas do corpo: todas corretas, ordem ascendente.
- assets-pendentes: 8 figuras pendentes corretas.

---

## 🔴 Falta fazer — CRÍTICO

- [ ] **Colar o corpo do Apêndice** no Word (de `capitulos-final/_word/apendices-final.docx` — tabelas Word reais). Conferir que Quadros B.1-E.1 entram.
- [ ] **Corrigir Lista de Figuras**: remover 2 entradas erradas ("Figura 3.1 — Métricas do código-fonte" e "Figura 4.1 — Métricas do desenvolvimento" — são **Tabelas**, não figuras). Mais fácil: recolar as 3 listas das versões corretas em `capitulos-final/listas/*.md`.
- [ ] **Rebaixar hierarquia de títulos**: hoje está **tudo Título 1**. X.Y → Título 2; X.Y.Z → Título 3. Senão o sumário sai sem escalonamento.
- [ ] **Ficha catalográfica**: ainda é placeholder ("Título do Trabalho", "Nome Completo do autor", "colocar nº de páginas") e em **Times New Roman**. Preencher os dados reais + converter para Arial (está em caixa de texto, Ctrl+A não pega — clicar dentro).
- [ ] **Folha de aprovação**: ausente. Montar pelo template FEPI.
- [ ] **Capa / folha de rosto**: preencher dados reais (título, nome, ano, orientador).

## 🟠 Falta fazer — ASSETS VISUAIS (amanhã)

- [ ] **Figura 3.1** — Fluxo de desenvolvimento iterativo (draw.io: planejamento → branch → PR → revisão)
- [ ] **Figura 3.2** — DER (dbdiagram.io, 11 tabelas)
- [ ] **Figura 4.1** — Print: listagem de alunos (professor)
- [ ] **Figura 4.2** — Print: fluxo financeiro / PIX
- [ ] **Figura 4.3** — Print: portal do aluno (mobile)
- [ ] **Figura 4.4** — Print: painel do professor
- [ ] **Figura 6.1** — Gantt (5 fases mar-jun + faixa de redação)
- [ ] **Figura D.1** — Diagrama de Casos de Uso UML (draw.io)
- [ ] **Apêndice A — Formulário**: aplicar Google Forms (spec em `formulario-google-forms.md`), colar link de homologação, coletar respostas → incorporar resultados (remover marcadores `[PLACEHOLDER]`).

## 🟡 Falta fazer — AJUSTES FINAIS

- [ ] Trocar os **✓ do Quadro 2.1** por "Sim" (opcional — remove fonte Segoe UI Symbol).
- [ ] Bloco de código (Figura 3.3): se quiser monoespaçado, reaplicar Courier New só nele.
- [ ] **Atualizar campos** depois de tudo: Sumário + Listas (botão direito → Atualizar Campo → índice inteiro).
- [ ] Legendas de figura/tabela/quadro: fonte **tamanho 10** (Fonte Secundária FEPI), espaço simples.
- [ ] Conferir margens (Sup/Esq 3 cm · Inf/Dir 2 cm), espaçamento 1,5, recuo 1,25, justificado.
- [ ] (Opcional) Pré-textuais: dedicatória, agradecimentos, epígrafe.

---

## 📌 Observações importantes

- **Hipóteses pivotaram** de "impacto no usuário" → "produtividade de engenharia" (H1 prazo, H2 backend ≥60%, H3 IA ≥3×). Documento 100% coerente com as novas. As antigas viraram trabalho futuro (§5.4).
- **Apêndice A (survey) não aplicado** — se não der tempo até a defesa, declarar como "trabalho futuro em andamento", não como dado coletado.
- **Vulnerabilidades pra defesa oral**: estimativas H2/H3 retrospectivas e autoavaliadas (sem grupo de controle); limiares arbitrados _a priori_; N=1. O texto já declara tudo — antecipar na arguição.
- Os `.md` em `capitulos-final/` são a **fonte final** — sempre à frente do Word. Em caso de dúvida de conteúdo, eles mandam.
- Fonte única: **Arial** (FEPI aceita Arial ou Times; escolhido Arial).
