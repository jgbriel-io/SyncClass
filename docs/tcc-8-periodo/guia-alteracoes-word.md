# Guia de Alterações no Word — FINAL SYNCCLASS

> Atualizado: 06/06. Status validado no `FINAL SYNCCLASS - TCC.docx`.
> ✅ = feito · ⬜ = falta. Os `.md` em `capitulos-final/` são a fonte correta.

---

## ✅ Já resolvido (validado no docx)

- ✅ Os 5 títulos de seção errados (3.2.1, 3.2.2, 3.3.1, 3.4.2, 3.8) — corrigidos.
- ✅ Fonte Arial — Times caiu de 28 para **1** (praticamente 100% Arial). ✓ podem ficar.
- ✅ Capítulo 6 (Cronograma) removido do corpo.
- ✅ Conclusão (cap 5) fecha o texto.

---

## 🔴 CRÍTICO — falta (bloqueia envio)

⬜ **1. Colar o Apêndice F (cronograma SUMIU)**
Você tirou o cap 6 mas **não colou o Apêndice F** → o cronograma/Gantt desapareceu do documento, e o §4.4 cita "Apêndice F" que **não existe** (referência quebrada).
→ Abrir `capitulos-final/_word/apendices-final.docx` → copiar o bloco **APÊNDICE F** → colar depois do Apêndice E.

⬜ **2. Colar o corpo dos Apêndices A–E**
Nenhum apêndice (A–F) está no corpo ainda — só nas listas. Colar tudo de `_word/apendices-final.docx` (depois das Referências).

⬜ **3. Ficha catalográfica — preencher dados**
Fonte já está Arial, mas o texto ainda é **placeholder** ("Título do Trabalho", "Nome Completo do autor"). Preencher: título real, autor, ano, nº de páginas, orientador.

⬜ **4. Hierarquia de títulos — tudo ainda Título 1**
T2=0, T3=0. Rebaixar: `X.Y` → **Título 2** (Ctrl+Alt+2); `X.Y.Z` → **Título 3** (Ctrl+Alt+3). Depois atualizar o sumário.

⬜ **5. Lista de Figuras — 2 entradas erradas**
"Figura 3.1/4.1 — Métricas…" são **Tabelas**, não figuras. Recolar as 3 listas de `capitulos-final/listas/*.md` (já corretas; Gantt virou **Figura F.1**).

---

## 🟠 Pré-textuais — falta

⬜ **6. Folha de aprovação** — montar pelo template FEPI (após folha de rosto).
⬜ **7. Capa / folha de rosto** — preencher título, nome, ano, orientador.
⬜ **8. §1.6 + Quadro 1.1 (cap 1)** — conferir: "cinco capítulos", "apêndices A a F", e Quadro 1.1 sem a linha do cap 6 (recopiar de `capitulo1-final.md`).

---

## 🟡 Assets visuais e acabamento

⬜ **9. Figuras (gerar/colar):** 3.1 fluxo, 3.2 DER, 4.1-4.4 prints, D.1 UML, **F.1 Gantt**. Legenda tamanho 10.
⬜ **10. Apêndice A — Formulário:** aplicar Google Forms (`pendencias-manuais/formulario-google-forms.md`), coletar respostas, remover `[PLACEHOLDER]`.
⬜ **11. Legendas** — fonte tamanho 10, espaço simples.
⬜ **12. Margens** — Sup/Esq 3 cm · Inf/Dir 2 cm · espaço 1,5 · recuo 1,25 · justificado.
⬜ **13. Numeração** — capa = 1 (oculta), número só da Introdução em diante (~pág 15).
⬜ **14. Atualização final** — Sumário + 3 Listas (botão direito → Atualizar Campo → índice inteiro).

---

## Estrutura final esperada

Capa → Folha de rosto → Folha de aprovação → Resumo → Abstract → Listas → Sumário → **1 Introdução · 2 Referencial · 3 Metodologia · 4 Resultados · 5 Conclusão** → Referências → **Apêndices A a F**.
