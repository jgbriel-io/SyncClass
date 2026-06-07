# Guia de Alterações no Word Final do TCC

Atualizado em: 2026-06-07  
Origem: atualizações pós-sprint 32 (remoção CEP, reembolso PIX, LGPD export, contagens)

---

## CAPÍTULO 3 — Metodologia

### Seção 3.3 (Delimitação da Pesquisa) — roteiro QA

**Localizar:** `187 itens de verificação em 20 rotas`  
**Substituir por:** `175 itens de verificação em 20 rotas`

### Seção 3.4.2 (Síntese Quantitativa dos Requisitos)

**Localizar:** trecho com `30 requisitos funcionais foram implementados` e `Outros 6 requisitos... RF32 a RF37... reembolso de pagamento PIX`  
**Substituir por:**

> 32 requisitos funcionais foram implementados ao longo das 31 iterações de desenvolvimento, incluindo a exportação de dados pessoais para conformidade com a LGPD (iteração 20) e o reembolso de pagamento PIX via AbacatePay (iteração 32). Outros 4 requisitos foram identificados como desejáveis, mas mantidos fora do escopo do produto mínimo viável e registrados como trabalhos futuros (RF32 a RF35): sistema de notificações, exportação de relatórios em PDF, integração com Google Calendar e gamificação.

### Seção 3.9 (Infraestrutura e Deploy) — Edge Functions

**Localizar:** `operam sete Edge Functions com ambiente de execução Deno`  
**Substituir por:** `operam nove Edge Functions com ambiente de execução Deno`

**Localizar:** `composta pela geração de cobrança e pela recepção de notificações de confirmação por webhook.`  
**Substituir por:** `composta pela geração de cobrança, pela recepção de notificações de confirmação por webhook e pelo processamento de reembolsos, além da exportação de dados pessoais para conformidade com a LGPD.`

---

## CAPÍTULO 4 — Resultados

### Tabela 4.1 (Métricas do desenvolvimento)

| Campo                | De                   | Para                     |
| -------------------- | -------------------- | ------------------------ |
| Edge Functions       | 7                    | **9**                    |
| Testes automatizados | 304 (em 28 arquivos) | **301 (em 28 arquivos)** |

### Seção 4.3.1 (Testes Automatizados) — 3 ocorrências de "304"

**Localizar:** `304 casos de teste automatizados`  
**Substituir por:** `301 casos de teste automatizados`

**Localizar:** `304 testes automatizados` _(ocorre 2× — Quadro 4.1 e parágrafo seguinte)_  
**Substituir por:** `301 testes automatizados`

### Seção 4.3.2 (Campanha de Testes Manuais) — roteiro QA

**Localizar:** `O roteiro de verificação totaliza 187 itens`  
**Substituir por:** `O roteiro de verificação totaliza 175 itens`

---

## APÊNDICE B — Requisitos Funcionais

### Texto introdutório (antes do Quadro B.1)

**Localizar:** trecho com `(RF21 a RF31, à exceção do RF27). Sete` ou qualquer variante anterior  
**Substituir por:** `(RF21 a RF26, RF28 a RF31, RF36 e RF37). Quatro`

**Localizar:** qualquer variante de `(RF27 e RF32 a RF37)` / `(RF32 a RF37)` / `(RF32 a RF36)`  
**Substituir por:** `(RF32 a RF35)`

**Localizar:** `Os 30 requisitos funcionais implementados` (ou `Os 31...`)  
**Substituir por:** `Os 32 requisitos funcionais implementados`

### Título do Quadro B.1

**Localizar:** `Quadro B.1 — Requisitos funcionais implementados (RF01 a RF31, exceto RF27)`  
_(ou qualquer variante anterior)_  
**Substituir por:** `Quadro B.1 — Requisitos funcionais implementados (RF01 a RF26, RF28 a RF31, RF36 e RF37)`

### Tabela Quadro B.1 — duas linhas novas (após RF31)

Adicionar ao final da tabela, após a linha do RF31:

| RF36 | Exportação de dados pessoais (portabilidade LGPD) | LGPD | Média | 20 |
| RF37 | Reembolso de pagamento PIX (AbacatePay) | Financeiro | Baixa | 32 |

### Notas abaixo da tabela B.1

Após a nota do RF31, adicionar:

> **Nota sobre RF36:** a exportação de dados pessoais foi implementada na iteração 20; a Edge Function correspondente foi implantada em produção na iteração 32.
>
> **Nota sobre RF37:** o reembolso de pagamento PIX via AbacatePay foi implementado na iteração 32, após a conclusão do escopo inicial do MVP.

### Título do Quadro B.2

**Localizar:** qualquer variante de `RF27 e RF32 a RF37` / `RF32 a RF37` / `RF32 a RF36`  
**Substituir por:** `RF32 a RF35`

### Tabela Quadro B.2 — remover linhas

- Remover linha do **RF27** (se ainda presente)
- Remover linha do **RF36** (exportação LGPD — agora implementado)
- Remover linha do **RF37** (reembolso PIX — agora implementado)

---

## LISTA DE SIGLAS (se presente no Word)

- **Remover** entrada: `CEP — Código de Endereçamento Postal`

---

## LISTA DE QUADROS (se presente no Word)

| De                                            | Para                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Quadro B.1 — `...RF01 a RF31, exceto RF27...` | `Requisitos funcionais implementados (RF01 a RF26, RF28 a RF31, RF36 e RF37)` |
| Quadro B.2 — `...RF27 e RF32 a RF37...`       | `Requisitos funcionais planejados (RF32 a RF35)`                              |

---

## VERIFICAÇÃO FINAL (Ctrl+F no Word)

Pesquisar e corrigir qualquer ocorrência remanescente:

- `CEP` — zero ocorrências fora de "CPF" ou citações bibliográficas
- `RF27` — zero ocorrências
- `304` — zero ocorrências no corpo do texto
- `187 itens` — zero ocorrências
- `sete Edge` — zero ocorrências
- `7 Edge` ou `8 Edge` — zero ocorrências (deve ser 9)
- `ainda não implantada em produção` — zero ocorrências
- `reembolso ainda não implementada` — zero ocorrências
- `30 requisitos` ou `31 requisitos` — zero ocorrências (deve ser 32)
- `6 requisitos... trabalhos futuros` ou `5 requisitos... trabalhos futuros` — zero (deve ser 4)
