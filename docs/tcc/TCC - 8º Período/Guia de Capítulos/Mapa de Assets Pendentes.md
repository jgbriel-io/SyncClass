---
titulo: Mapa de Assets e Evidências
projeto: SyncClass - Plataforma SaaS
status: 🟦 Planejamento de Coleta
ultima_atualizacao: 21/04/2026
tags: [tcc/assets, syncclass, evidencias, diagramas]
---

> [!ABSTRACT] Objetivo
> Este documento centraliza todos os elementos visuais, diagramas e capturas de tela necessários para compor o corpo do TCC, garantindo que a fundamentação teórica seja acompanhada de evidências práticas.

---

## 🛠️ Protocolo de Captura

### 1. Prints de Tela (UI/UX)

- **Ambiente:** Rodar `npm run dev` localmente.
- **Dados:** Utilizar dados fictícios realistas (ex: Aluno: "John Doe", Aula: "Business English").
- **Padrão:** Capturar janelas inteiras ou áreas específicas sem barras do navegador.

### 2. Diagramas Técnicos

- **Ferramentas sugeridas:** [dbdiagram.io](https://dbdiagram.io) (Banco), [draw.io](https://draw.io) ou Lucidchart (Arquitetura e Casos de Uso).
- **Estilo:** Manter uma paleta de cores consistente em todos os diagramas.

### 3. Evidências de Teste

- **Comandos:**

```bash
# Executar e printar output do terminal
npm run test           # Testes Unitários (Vitest)
npm run test:e2e:report # Relatório Visual (Playwright)
```

---

## 📂 Checklist por Capítulo

### Cap. 2 — Referencial Teórico

- [ ] 🖼️ **Pirâmide de Serviços em Nuvem:** Diagrama comparativo IaaS vs. PaaS vs. SaaS.

- [ ] 🖼️ **Modelo ISO/IEC 25010:** Infográfico com as 8 características de qualidade.

- [ ] 🖼️ **Pirâmide de Testes:** Representação (Unitários > Integração > E2E).

[Image of software testing pyramid]

### Cap. 4 — Engenharia de Requisitos

- [ ] 🖼️ **Tabela RF/RNF:** Versão formatada para impressão (PDF/PNG).
- [ ] 🖼️ **Diagrama de Casos de Uso (UML):** Representação dos atores (Admin, Professor, Aluno) e suas interações.

### Cap. 5 — Arquitetura e Modelagem

- [ ] 🖼️ **DER Completo:** Gerar a partir do `schema.md`. Essencial para mostrar as 11 tabelas.
- [ ] 🖼️ **Arquitetura de Fluxo:** Diagrama (Frontend React ↔ Supabase Auth/DB ↔ Edge Functions).
- [ ] 🖼️ **Tabela de Rotas:** Mapa visual dos endpoints e páginas por perfil.

### Cap. 6 — Implementação Técnica

- [ ] 🖼️ **Dashboard Principal:** Visão geral do professor com métricas.
- [ ] 🖼️ **Módulo Financeiro:** Tela de cobranças e status de pagamento.
- [ ] 🖼️ **Registro de Aulas:** Interface de criação de pacotes e logs de aula.
- [ ] 🖼️ **Módulo de Atividades:** Visão do professor corrigindo exercícios.
- [ ] 🖼️ **Portal do Aluno (Mobile):** Print evidenciando a responsividade.
- [ ] 🖼️ **Estrutura de Pastas:** Árvore de diretórios formatada (ex: `tree src/`).

### Cap. 7 — Qualidade e Validação

- [ ] 🖼️ **Output Vitest:** Captura do terminal com "Passed" em todos os 161 testes.
- [ ] 🖼️ **Relatório Playwright:** Dashboard de execução dos testes E2E.

### Cap. 8 — Gestão do Projeto

- [ ] 🖼️ **Gráfico de Gantt Retroativo:** Cronograma visual das 9 sprints.
- [ ] 🖼️ **Matriz de Riscos:** Tabela visual (Probabilidade x Impacto).

### Cap. 9 — Infraestrutura e Deploy

- [ ] 🖼️ **Diagrama de Infraestrutura:** (VPS Host ↔ Docker Container ↔ Supabase Cloud).
- [ ] 🖼️ **Workflow CI/CD:** Fluxograma das etapas do GitHub Actions.

---

## 🚩 Prioridades de Coleta

| Prioridade     | Asset              | Importância                                    |
| :------------- | :----------------- | :--------------------------------------------- |
| 🔴 **Crítica** | DER Completo       | Fundamental para aprovação da modelagem.       |
| 🔴 **Crítica** | Prints dos Módulos | Prova de existência do MVP funcional.          |
| 🔴 **Crítica** | Gantt Retroativo   | Justifica o tempo e o gap de histórico.        |
| 🟠 **Média**   | Casos de Uso       | Necessário para a fundamentação de requisitos. |
| 🟠 **Média**   | Output de Testes   | Garante a nota no quesito "Qualidade".         |

---

**Notas Adicionais:**

- Salvar todos os arquivos em uma pasta central `/assets/tcc/` para facilitar a inserção no documento final.
- Para os diagramas conceituais, priorizar o estilo minimalista.
