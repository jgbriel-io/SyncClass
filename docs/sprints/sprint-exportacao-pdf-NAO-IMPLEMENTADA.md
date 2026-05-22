# Sprint 17 — Exportação de Relatórios em PDF

**Período:** Maio 2026  
**Status:** ⬜ Planejada  
**Estimativa:** ~2h  
**Tipo:** Feature (MVP Extension)

---

## Problem Statement

### Contexto

Professores e alunos precisam de relatórios impressos ou digitais para:

- Comprovação de pagamentos para contabilidade
- Histórico de aulas para controle pessoal
- Relatórios para pais de alunos menores
- Backup offline de dados financeiros

Atualmente, a única opção é copiar manualmente dados da tela ou fazer screenshots.

### Impacto

- Professores perdem tempo copiando dados manualmente
- Falta de profissionalismo ao apresentar relatórios
- Dificuldade em compartilhar informações com terceiros (contadores, pais)

### Objetivo

Permitir exportação de extrato financeiro e histórico de aulas em PDF formatado, com cabeçalho, logo e tabelas organizadas.

---

## Requirements

### Functional Requirements

- **FR-17.1:** Professor pode exportar extrato financeiro de um aluno em PDF
- **FR-17.2:** Professor pode exportar histórico de aulas de um aluno em PDF
- **FR-17.3:** Aluno pode exportar seu próprio extrato financeiro em PDF
- **FR-17.4:** PDF deve incluir cabeçalho com nome, período e data de geração
- **FR-17.5:** PDF deve incluir tabela formatada com todos os campos relevantes

### Non-Functional Requirements

- **NFR-17.1:** Geração de PDF deve ser client-side (sem backend)
- **NFR-17.2:** PDF deve ser legível e profissional
- **NFR-17.3:** Nome do arquivo deve incluir nome do aluno e período
- **NFR-17.4:** Exportação deve funcionar em Chrome, Firefox e Safari

### Out of Scope

- Exportação em outros formatos (Excel, CSV)
- Customização de layout do PDF
- Envio automático de PDF por email
- Assinatura digital do PDF

---

## Background

### Biblioteca jsPDF

`jspdf` é a biblioteca mais popular para geração de PDFs client-side em JavaScript. Suporta texto, imagens, tabelas e fontes customizadas.

```ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const doc = new jsPDF();
doc.text("Título", 10, 10);
autoTable(doc, {
  head: [["Coluna 1", "Coluna 2"]],
  body: [["Valor 1", "Valor 2"]],
});
doc.save("arquivo.pdf");
```

### Plugin jspdf-autotable

Extensão do jsPDF para criar tabelas formatadas automaticamente. Suporta:

- Headers e footers
- Estilos customizados
- Paginação automática
- Merge de células

---

## Proposed Solution

### Arquitetura

```
Usuário clica "Exportar PDF"
  ↓
Componente chama função `exportFinancialPdf(data, studentName)`
  ↓
jsPDF cria documento com cabeçalho e tabela
  ↓
Browser faz download do arquivo
```

### Estrutura do PDF

**Cabeçalho:**

- Logo do SyncClass (opcional)
- Título: "Extrato Financeiro" ou "Histórico de Aulas"
- Nome do aluno
- Período: "Janeiro 2026" ou "2025-2026"
- Data de geração: "Gerado em 20/05/2026"

**Tabela:**

- Extrato Financeiro: Data | Descrição | Valor | Status | Vencimento
- Histórico de Aulas: Data | Duração | Presença | Observações

**Rodapé:**

- Número da página
- "Gerado por SyncClass"

---

## Task Breakdown

### Task 17.1 — Instalar dependências

**Estimativa:** 5min  
**Responsável:** DevOps  
**Dependências:** Nenhuma

**Descrição:**
Instalar `jspdf` e `jspdf-autotable`.

**Comando:**

```bash
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf-autotable
```

**Acceptance Criteria:**

- Pacotes instalados sem conflitos
- TypeScript reconhece tipos

---

### Task 17.2 — Criar utilitário `exportFinancialPdf`

**Estimativa:** 30min  
**Responsável:** Frontend  
**Dependências:** 17.1

**Arquivo:** `src/lib/utils/exportPdf.ts`

**Descrição:**
Função que recebe array de `FinancialRecord` e gera PDF formatado.

**Implementação:**

```ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FinancialRecord } from "@/integrations/supabase/types";

export const exportFinancialPdf = (
  records: FinancialRecord[],
  studentName: string,
  period?: string
) => {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text("Extrato Financeiro", 14, 20);

  doc.setFontSize(12);
  doc.text(`Aluno: ${studentName}`, 14, 30);
  if (period) {
    doc.text(`Período: ${period}`, 14, 37);
  }
  doc.setFontSize(10);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    44
  );

  // Tabela
  autoTable(doc, {
    startY: 50,
    head: [["Data", "Descrição", "Valor", "Status", "Vencimento"]],
    body: records.map((record) => [
      format(new Date(record.record_date), "dd/MM/yyyy", { locale: ptBR }),
      record.description || "-",
      `R$ ${record.amount.toFixed(2)}`,
      record.status === "paid" ? "Pago" : "Pendente",
      record.due_date
        ? format(new Date(record.due_date), "dd/MM/yyyy", { locale: ptBR })
        : "-",
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
    alternateRowStyles: { fillColor: [249, 250, 251] }, // gray-50
  });

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      "Gerado por SyncClass",
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Download
  const fileName = `extrato-${studentName.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM")}.pdf`;
  doc.save(fileName);
};
```

**Acceptance Criteria:**

- PDF gerado com cabeçalho correto
- Tabela formatada com cores e estilos
- Rodapé com paginação
- Nome do arquivo inclui nome do aluno e mês

---

### Task 17.3 — Criar utilitário `exportClassLogsPdf`

**Estimativa:** 25min  
**Responsável:** Frontend  
**Dependências:** 17.1

**Arquivo:** `src/lib/utils/exportPdf.ts` (adicionar ao arquivo existente)

**Descrição:**
Função que recebe array de `ClassLog` e gera PDF formatado.

**Implementação:**

```ts
import type { ClassLog } from "@/integrations/supabase/types";

export const exportClassLogsPdf = (
  logs: ClassLog[],
  studentName: string,
  period?: string
) => {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text("Histórico de Aulas", 14, 20);

  doc.setFontSize(12);
  doc.text(`Aluno: ${studentName}`, 14, 30);
  if (period) {
    doc.text(`Período: ${period}`, 14, 37);
  }
  doc.setFontSize(10);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    44
  );

  // Estatísticas
  const totalClasses = logs.length;
  const totalPresent = logs.filter((log) => log.attendance).length;
  const totalAbsent = totalClasses - totalPresent;
  const totalHours = logs.reduce((sum, log) => sum + (log.duration || 0), 0);

  doc.setFontSize(10);
  doc.text(`Total de aulas: ${totalClasses}`, 14, 52);
  doc.text(`Presenças: ${totalPresent}`, 14, 58);
  doc.text(`Faltas: ${totalAbsent}`, 14, 64);
  doc.text(`Total de horas: ${totalHours}h`, 14, 70);

  // Tabela
  autoTable(doc, {
    startY: 76,
    head: [["Data", "Duração", "Presença", "Observações"]],
    body: logs.map((log) => [
      format(new Date(log.class_date), "dd/MM/yyyy", { locale: ptBR }),
      `${log.duration || 0}h`,
      log.attendance ? "Presente" : "Falta",
      log.notes || "-",
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      "Gerado por SyncClass",
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  // Download
  const fileName = `historico-aulas-${studentName.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM")}.pdf`;
  doc.save(fileName);
};
```

**Acceptance Criteria:**

- PDF gerado com estatísticas de presença
- Tabela formatada com dados de aulas
- Nome do arquivo inclui nome do aluno e mês

---

### Task 17.4 — Adicionar botão de exportar em `FinancialView`

**Estimativa:** 15min  
**Responsável:** Frontend  
**Dependências:** 17.2

**Arquivo:** `src/components/financial/FinancialView.tsx`

**Descrição:**
Adicionar botão "Exportar PDF" no header da tabela financeira.

**Implementação:**

```tsx
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportFinancialPdf } from "@/lib/utils/exportPdf";

// No componente, adicionar botão no header
<div className="flex items-center justify-between mb-4">
  <h2 className={typography("H2")}>Extrato Financeiro</h2>
  <Button
    variant="outline"
    size="sm"
    onClick={() => exportFinancialPdf(filteredRecords, studentName)}
    disabled={filteredRecords.length === 0}
  >
    <FileDown className={iconSize("SM")} />
    Exportar PDF
  </Button>
</div>;
```

**Acceptance Criteria:**

- Botão visível no header
- Desabilitado quando não há registros
- Exporta apenas registros filtrados atualmente visíveis
- Ícone de download presente

---

### Task 17.5 — Adicionar botão de exportar em `ClassesView`

**Estimativa:** 15min  
**Responsável:** Frontend  
**Dependências:** 17.3

**Arquivo:** `src/components/classes/ClassesView.tsx`

**Descrição:**
Adicionar botão "Exportar PDF" no header da tabela de aulas.

**Implementação:**

```tsx
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportClassLogsPdf } from "@/lib/utils/exportPdf";

// No componente, adicionar botão no header
<div className="flex items-center justify-between mb-4">
  <h2 className={typography("H2")}>Histórico de Aulas</h2>
  <Button
    variant="outline"
    size="sm"
    onClick={() => exportClassLogsPdf(filteredLogs, studentName)}
    disabled={filteredLogs.length === 0}
  >
    <FileDown className={iconSize("SM")} />
    Exportar PDF
  </Button>
</div>;
```

**Acceptance Criteria:**

- Botão visível no header
- Desabilitado quando não há registros
- Exporta apenas registros filtrados

---

### Task 17.6 — Adicionar exportação no portal do aluno

**Estimativa:** 10min  
**Responsável:** Frontend  
**Dependências:** 17.2

**Arquivo:** `src/pages/student/StudentFinancial.tsx`

**Descrição:**
Permitir que aluno exporte seu próprio extrato financeiro.

**Implementação:**

```tsx
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportFinancialPdf } from "@/lib/utils/exportPdf";
import { useAuth } from "@/contexts/AuthContext";

// No componente
const { profile } = useAuth();

<Button
  variant="outline"
  size="sm"
  onClick={() => exportFinancialPdf(records, profile?.full_name || "Aluno")}
  disabled={records.length === 0}
>
  <FileDown className={iconSize("SM")} />
  Exportar PDF
</Button>;
```

**Acceptance Criteria:**

- Aluno pode exportar seu próprio extrato
- Nome do aluno vem do profile
- Funciona mesmo sem nome (fallback "Aluno")

---

### Task 17.7 — Testes manuais de exportação

**Estimativa:** 20min  
**Responsável:** QA  
**Dependências:** 17.2-17.6

**Cenários de Teste:**

1. **Exportar extrato financeiro (professor):**
   - Abrir página de aluno
   - Clicar "Exportar PDF"
   - Verificar PDF gerado com dados corretos

2. **Exportar histórico de aulas (professor):**
   - Abrir página de aulas do aluno
   - Clicar "Exportar PDF"
   - Verificar estatísticas e tabela

3. **Exportar extrato (aluno):**
   - Login como aluno
   - Abrir "Financeiro"
   - Clicar "Exportar PDF"
   - Verificar dados corretos

4. **Exportar com filtros ativos:**
   - Filtrar registros por período
   - Exportar PDF
   - Verificar que apenas registros filtrados aparecem

5. **Exportar lista vazia:**
   - Filtrar para período sem registros
   - Verificar que botão está desabilitado

6. **Compatibilidade de browsers:**
   - Testar em Chrome, Firefox e Safari
   - Verificar que download funciona em todos

**Acceptance Criteria:**

- Todos os cenários passam
- PDF legível e profissional
- Nome do arquivo correto
- Sem erros no console

---

## Implementation Details

### Tecnologias Utilizadas

- **jsPDF 2.5:** Geração de PDFs client-side
- **jspdf-autotable 3.8:** Tabelas formatadas
- **date-fns 2.30:** Formatação de datas em português

### Padrões de Código

- Funções de exportação em `src/lib/utils/exportPdf.ts`
- Botões de exportação seguem padrão `variant="outline" size="sm"`
- Ícone `FileDown` de Lucide React
- Cores da tabela seguem design system (blue-500, gray-50)

### Considerações de Performance

- Geração de PDF é síncrona — pode travar UI em listas muito grandes (> 1000 registros)
- Solução: limitar exportação a 500 registros ou adicionar loading state

---

## Files to Create

### Frontend

- `src/lib/utils/exportPdf.ts`

---

## Files to Modify

### Frontend

- `src/components/financial/FinancialView.tsx` — adicionar botão de exportar
- `src/components/classes/ClassesView.tsx` — adicionar botão de exportar
- `src/pages/student/StudentFinancial.tsx` — adicionar botão de exportar

### Dependencies

- `package.json` — adicionar `jspdf` e `jspdf-autotable`

---

## Testing & Validation

### Unit Tests

- `exportPdf.test.ts` — testar geração de PDF com dados mock
- Verificar que nome do arquivo está correto
- Verificar que dados são formatados corretamente

### Integration Tests

- Testar exportação com dados reais do Supabase
- Verificar que filtros são respeitados

### Manual Testing

- Testar em 3 browsers (Chrome, Firefox, Safari)
- Testar com listas grandes (> 100 registros)
- Verificar paginação automática do PDF

---

## Results & Impact (Esperado)

### Métricas de Sucesso

- **Adoção:** 60% dos professores exportam PDF ao menos 1x por mês
- **Satisfação:** Feedback positivo sobre profissionalismo dos relatórios
- **Redução de tempo:** 5min economizados por relatório (vs copiar manualmente)

### Impacto no Usuário

- Professores podem compartilhar relatórios profissionais com contadores
- Alunos têm comprovante de pagamentos para fins fiscais
- Pais de alunos menores recebem relatórios formatados

---

## Technical Debt

### Débitos Conhecidos

- Geração de PDF pode travar UI em listas muito grandes
- Sem customização de layout (cores, logo, fontes)
- Sem opção de exportar em outros formatos (Excel, CSV)

### Melhorias Futuras

- Adicionar loading state durante geração de PDF
- Permitir customização de logo e cores
- Adicionar exportação em Excel usando `xlsx`
- Adicionar preview do PDF antes de baixar

---

## Next Steps

### Sprint 18 — Integração com Google Calendar

Sincronizar aulas registradas no SyncClass com Google Calendar do professor e aluno via OAuth.

### Sprint 19 — Pagamento Real (Stripe / Pix API)

Substituir fluxo manual de comprovante por pagamento real via Stripe ou API de Pix.

---

## References

### Documentação

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jspdf-autotable Documentation](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [date-fns Format](https://date-fns.org/docs/format)

### Código Relacionado

- `src/lib/utils/formatters.ts` — padrão de formatação de valores
- `src/components/ui/button.tsx` — componente Button do shadcn/ui
