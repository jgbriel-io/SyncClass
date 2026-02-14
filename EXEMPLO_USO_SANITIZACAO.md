# 🔒 Guia de Uso: Sanitização XSS

## Como Aplicar Sanitização em Componentes

### 1. Importar o utilitário

```typescript
import { sanitizeHtml, sanitizeText, escapeHtml } from "@/lib/utils/sanitize";
```

### 2. Escolher o método apropriado

#### `sanitizeHtml()` - Para texto com formatação básica
Use quando o campo pode conter formatação HTML simples (negrito, itálico, quebras de linha).

```tsx
// ✅ SEGURO - Permite tags básicas de formatação
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }} />
```

**Permite**: `<b>`, `<i>`, `<em>`, `<strong>`, `<br>`, `<p>`, `<ul>`, `<ol>`, `<li>`  
**Remove**: Scripts, event handlers, iframes, etc.

#### `sanitizeText()` - Para texto puro
Use quando o campo NÃO deve conter nenhuma formatação HTML.

```tsx
// ✅ SEGURO - Remove TODAS as tags
<p>{sanitizeText(student.observations)}</p>
```

#### `escapeHtml()` - Alternativa leve
Use quando não precisa de DOMPurify (mais performático).

```tsx
// ✅ SEGURO - Escapa caracteres especiais
<p>{escapeHtml(classLog.feedback)}</p>
```

---

## 3. Exemplos de Aplicação

### Exemplo 1: ActivityDetailSheet

**ANTES (VULNERÁVEL)**:
```tsx
<div className="space-y-2">
  <Label>Descrição</Label>
  <p className="text-sm">{activity.description}</p>
</div>
```

**DEPOIS (SEGURO)**:
```tsx
import { sanitizeHtml } from "@/lib/utils/sanitize";

<div className="space-y-2">
  <Label>Descrição</Label>
  <div 
    className="text-sm prose prose-sm max-w-none"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }}
  />
</div>
```

---

### Exemplo 2: ClassDetailSheet

**ANTES (VULNERÁVEL)**:
```tsx
{classLog.feedback && (
  <div>
    <Label>Feedback</Label>
    <p>{classLog.feedback}</p>
  </div>
)}
```

**DEPOIS (SEGURO)**:
```tsx
import { sanitizeText } from "@/lib/utils/sanitize";

{classLog.feedback && (
  <div>
    <Label>Feedback</Label>
    <p>{sanitizeText(classLog.feedback)}</p>
  </div>
)}
```

---

### Exemplo 3: StudentDetailSheet

**ANTES (VULNERÁVEL)**:
```tsx
{student.observations && (
  <DetailSection title="Observações">
    <p className="text-sm text-muted-foreground">
      {student.observations}
    </p>
  </DetailSection>
)}
```

**DEPOIS (SEGURO)**:
```tsx
import { escapeHtml } from "@/lib/utils/sanitize";

{student.observations && (
  <DetailSection title="Observações">
    <p className="text-sm text-muted-foreground">
      {escapeHtml(student.observations)}
    </p>
  </DetailSection>
)}
```

---

## 4. Campos que DEVEM ser sanitizados

### Alta Prioridade (Texto do usuário renderizado)
- ✅ `activity.description`
- ✅ `activity.feedback`
- ✅ `activity.student_response_text`
- ✅ `classLog.feedback`
- ✅ `classLog.observations`
- ✅ `classLog.title`
- ✅ `student.observations`
- ✅ `financialRecord.description`
- ✅ `teacher.observations` (se existir)

### Média Prioridade (Nomes e títulos)
- ⚠️ `student.name` (improvável, mas possível)
- ⚠️ `teacher.name`
- ⚠️ `activity.title`

### Baixa Prioridade (Campos controlados)
- 🟢 `email` (já validado por Zod)
- 🟢 `cpf` (apenas números)
- 🟢 `phone` (apenas números)
- 🟢 `amount` (apenas números)

---

## 5. Checklist de Implementação

### Componentes a Atualizar:
- [ ] `src/components/activities/ActivityDetailSheet.tsx`
- [ ] `src/components/classes/ClassDetailSheet.tsx`
- [ ] `src/components/admin/StudentDetailSheet.tsx`
- [ ] `src/components/admin/TeacherDetailSheet.tsx`
- [ ] `src/components/financial/FinancialTableRow.tsx`
- [ ] `src/components/classes/ClassLogRow.tsx`
- [ ] `src/components/activities/ActivitiesTableRow.tsx`
- [ ] Qualquer outro componente que renderize texto do usuário

### Como Testar:
1. Criar um registro com texto malicioso:
   ```
   <script>alert('XSS')</script>
   <img src=x onerror="alert('XSS')">
   ```

2. Verificar que:
   - O script NÃO é executado
   - O texto é exibido como texto puro ou com tags seguras
   - Não há erros no console

---

## 6. Performance

### DOMPurify vs escapeHtml

**DOMPurify** (`sanitizeHtml`, `sanitizeText`):
- ✅ Mais seguro (biblioteca battle-tested)
- ✅ Suporta formatação HTML
- ⚠️ Mais pesado (~45KB)
- ⚠️ Mais lento (~0.5ms por campo)

**escapeHtml**:
- ✅ Muito leve (~0.1KB)
- ✅ Muito rápido (~0.01ms por campo)
- ⚠️ Não suporta formatação HTML
- ⚠️ Menos robusto

**Recomendação**:
- Use `sanitizeHtml()` para campos com formatação (descrições, feedback)
- Use `escapeHtml()` para campos simples (nomes, títulos, observações curtas)

---

## 7. Exemplo Completo

```tsx
import { sanitizeHtml, sanitizeText, escapeHtml } from "@/lib/utils/sanitize";

export function ActivityDetailSheet({ activity }: Props) {
  return (
    <BaseDetailSheet open={open} onOpenChange={onOpenChange} title="Detalhes da Atividade">
      <div className="space-y-4">
        {/* Título - escapeHtml (leve) */}
        <div>
          <Label>Título</Label>
          <p className="font-medium">{escapeHtml(activity.title)}</p>
        </div>

        {/* Descrição - sanitizeHtml (permite formatação) */}
        {activity.description && (
          <div>
            <Label>Descrição</Label>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }}
            />
          </div>
        )}

        {/* Feedback - sanitizeText (remove todas as tags) */}
        {activity.feedback && (
          <div>
            <Label>Feedback do Professor</Label>
            <p className="text-sm">{sanitizeText(activity.feedback)}</p>
          </div>
        )}
      </div>
    </BaseDetailSheet>
  );
}
```

---

## 8. Testes Automatizados

```typescript
// src/lib/utils/sanitize.test.ts
import { sanitizeHtml, sanitizeText, escapeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("deve remover scripts", () => {
    const dirty = '<script>alert("XSS")</script>Texto seguro';
    expect(sanitizeHtml(dirty)).toBe("Texto seguro");
  });

  it("deve permitir tags básicas", () => {
    const dirty = "<b>Negrito</b> e <i>itálico</i>";
    expect(sanitizeHtml(dirty)).toBe("<b>Negrito</b> e <i>itálico</i>");
  });

  it("deve remover event handlers", () => {
    const dirty = '<img src=x onerror="alert(1)">';
    expect(sanitizeHtml(dirty)).not.toContain("onerror");
  });
});

describe("sanitizeText", () => {
  it("deve remover todas as tags", () => {
    const dirty = "<b>Negrito</b> texto";
    expect(sanitizeText(dirty)).toBe("Negrito texto");
  });
});

describe("escapeHtml", () => {
  it("deve escapar caracteres especiais", () => {
    const dirty = '<script>alert("XSS")</script>';
    expect(escapeHtml(dirty)).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;");
  });
});
```

---

## 9. Próximos Passos

1. ✅ Instalar DOMPurify: `npm install dompurify @types/dompurify`
2. ✅ Criar `src/lib/utils/sanitize.ts`
3. ⏳ Atualizar componentes (ver checklist acima)
4. ⏳ Criar testes automatizados
5. ⏳ Revisar código com `grep -r "dangerouslySetInnerHTML" src/`
6. ⏳ Documentar no README

---

**Importante**: NUNCA use `dangerouslySetInnerHTML` sem sanitizar o conteúdo primeiro!
