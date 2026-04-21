# Sprint 15 — Exportação de Relatórios em PDF
**Período:** Maio 2026
**Status:** ⬜ Pendente
**Estimativa:** ~2h

## Objetivo
Permitir que professores exportem extrato financeiro e histórico de aulas em PDF.

## Dependência
Instalar `jspdf` + `jspdf-autotable`:
```bash
npm install jspdf jspdf-autotable
```

## Tarefas

### 15.1 — Utilitário `exportPdf.ts`
**Arquivo:** `src/lib/utils/exportPdf.ts`

```ts
export const exportFinancialPdf = (records: FinancialRecord[], studentName: string) => {
  const doc = new jsPDF();
  // cabeçalho com nome do aluno e data
  // tabela com autoTable
  doc.save(`extrato-${studentName}-${format(new Date(), 'yyyy-MM')}.pdf`);
};

export const exportClassLogsPdf = (logs: ClassLog[], studentName: string) => { ... };
```

---

### 15.2 — Botão de exportar no `FinancialView`
**Arquivo:** `src/components/financial/FinancialView.tsx`
- Botão "Exportar PDF" no header da tabela
- Exporta os registros filtrados atualmente visíveis

---

### 15.3 — Botão de exportar no `ClassesView`
**Arquivo:** `src/components/classes/ClassesView.tsx`
- Mesmo padrão do 15.2

---

### 15.4 — Exportar extrato no portal do aluno
**Arquivo:** `src/pages/student/StudentFinancial.tsx`
- Aluno pode exportar seu próprio extrato

## Critério de Conclusão
- PDF gerado com cabeçalho (nome, período, data de geração)
- Tabela formatada com todos os campos relevantes
- Funciona nos 3 contextos (admin, professor, aluno)
