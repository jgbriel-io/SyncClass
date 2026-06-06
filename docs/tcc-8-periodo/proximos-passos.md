# Próximos Passos — TCC SyncClass (ENTREGA AMANHÃ)

> Atualizado: 06/06/2026. Status validado no `FINAL SYNCCLASS - TCC.docx`.
> Prioridade: terminar o documento. Form roda em paralelo.

---

## ✅ Já resolvido (validado no docx)

- Os 5 títulos de seção errados (3.2.1, 3.2.2, 3.3.1, 3.4.2, 3.8) — corrigidos.
- Fonte Arial — Times caiu de 28 → 1 (≈100% Arial). Os ✓ podem ficar.
- Capítulo 6 (Cronograma) removido do corpo; Conclusão fecha o texto.
- Texto dos capítulos 1-5 completo e revisado.

---

## 🔴 BLOQUEIA A ENTREGA — fazer primeiro

1. **Colar Apêndices A–F no corpo** (de `capitulos-final/_word/apendices-final.docx`, depois das Referências).
   - ⚠️ Inclui o **Apêndice F (cronograma)** — sem ele, o §4.4 cita "Apêndice F" que não existe (**referência quebrada**) e o Gantt some.

1b. **REFERÊNCIAS erradas — recolar a lista (GRAVE).** A lista de Referências no docx é uma versão antiga: faltam 6 autores citados (COHN, FOWLER, TANSTACK, THIOLLENT, TRIPP, VERCEL = citações órfãs) e sobram 4 não citados (BANKS, FLANAGAN, MORAN, RIES = refs órfãs).

- Apagar a seção Referências atual e recolar de `capitulos-final/_word/referencias.docx` (24 entradas, validado). Resolve os dois lados. Banca pega na hora — prioridade alta.

2. **Ficha catalográfica** — preencher dados reais (título, autor, ano, nº de páginas, orientador). Hoje é placeholder ("Título do Trabalho", "Nome Completo do autor").
3. **Capa / folha de rosto** — preencher título, nome, ano, orientador.
4. **Folha de aprovação** — montar pelo template FEPI (após folha de rosto).

## 🟠 IMPORTANTE — fazer se der tempo

5. **Hierarquia de títulos** — tudo está Título 1. Rebaixar: X.Y → Título 2 (Ctrl+Alt+2); X.Y.Z → Título 3 (Ctrl+Alt+3). Atualizar sumário.
6. **Lista de Figuras** — remover 2 entradas erradas ("Figura 3.1/4.1 — Métricas…" são Tabelas). Recolar de `capitulos-final/listas/*.md` (Gantt já é Figura F.1).
7. **Figuras** — gerar/colar: 3.1 fluxo, 3.2 DER, 4.1-4.4 prints, D.1 UML, F.1 Gantt. Legenda tamanho 10.
8. **Conferir** §1.6 + Quadro 1.1 (cap 1): "cinco capítulos", "apêndices A a F", sem linha do cap 6.

## 🟢 FORMULÁRIO (rodar em paralelo, sem travar nada)

> Orientador achou interessante, mas **não testa as hipóteses** (mede impacto no usuário, não produtividade). NÃO fazer deploy de homolog — o sistema já está em produção com usuários reais.

9. **Montar o Google Form** do spec pronto (`pendencias-manuais/formulario-google-forms.md`) — ~30 min.
10. **Disparar o link** pro professor real + alunos (contas reais, sem homolog).
11. **Coletar até amanhã.** Se vier resposta → "avaliação preliminar (N respondentes)". Se não → Apêndice A fica como **instrumento proposto** (validação em andamento). Os dois cenários são defensáveis.

## 🟡 ACABAMENTO FINAL

12. Legendas fonte 10, espaço simples · margens (Sup/Esq 3cm, Inf/Dir 2cm) · espaço 1,5 · recuo 1,25 · justificado.
13. Numeração: capa = 1 (oculta), número só da Introdução (~pág 15).
14. **Atualizar campos:** Sumário + 3 Listas (botão direito → Atualizar Campo → índice inteiro).

---

## Ordem sugerida hoje

1. Dispara o **form** pros usuários reais (deixa coletando).
2. Cola **Apêndices A-F** + preenche **capa/ficha** + **folha de aprovação** (bloqueadores).
3. Sobrou tempo: hierarquia, lista de figuras, figuras.
4. Final: atualizar sumário/listas + conferir margens/numeração.

## Notas

- Hipóteses: H1 prazo · H2 backend ≥60% · H3 IA ≥3× (produtividade de engenharia). Form é ortogonal — não bloqueia.
- Vulnerabilidades pra defesa: estimativas H2/H3 retrospectivas, sem grupo de controle, N=1. Já declaradas no texto — antecipar na arguição.
- `.md` em `capitulos-final/` = fonte da verdade (sempre à frente do Word).
- Guia detalhado de Word: `guia-alteracoes-word.md`.
