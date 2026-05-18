# Phase 2 Validation Report - Detailed Analysis

**Task**: 2.7 Validar Fase 2 (0% hardcoding)
**Status**: ❌ FAILED
**Date**: 2024

---

## Summary

Phase 2 validation scanned **46 files** across 5 folders. Found **14 hardcoded strings** in **6 files**.

| Metric | Value |
|--------|-------|
| Total files scanned | 46 |
| Files with 0% hardcoding | 40 (87%) |
| Files with hardcoding | 6 (13%) |
| Total hardcoded strings | 14 |
| Hardcoding percentage | 13.0% |
| **Status** | **❌ FAILED** |

---

## Findings by Folder

### 📁 students/ — 8 hardcoded strings (3 files affected)

#### ⚠️ StudentDeleteDialog.tsx (2 issues)

**Line 54**: `"Importante:"`
```tsx
<strong>Importante:</strong> {studentsContent.archiveDialog.archiveNote}
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `archiveDialog.importantLabel`

**Line 116**: `"Atenção:"`
```tsx
<strong className="text-destructive">Atenção:</strong> {studentsContent.deleteDialog.warning}
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `deleteDialog.warningLabel`

---

#### ⚠️ StudentFormDialog.tsx (1 issue)

**Line 275**: `"Professor *"`
```tsx
<Label htmlFor="teacher">Professor *</Label>
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `formDialog.teacherLabel`

---

#### ⚠️ StudentsListView.tsx (5 issues)

**Line 277**: `"Valor/hora"`
```tsx
<TableHead>Valor/hora</TableHead>
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `tableHeaders.hourlyRate`

**Line 280**: `"Aulas"`
```tsx
<TableHead>Aulas</TableHead>
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `tableHeaders.classes`

**Line 283**: `"Total mensal"`
```tsx
<TableHead>Total mensal</TableHead>
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `tableHeaders.monthlyTotal`

**Line 286**: `"Dia pagto"`
```tsx
<TableHead>Dia pagto</TableHead>
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `tableHeaders.paymentDay`

**Line 289**: `"Financeiro"`
```tsx
<TableHead>Financeiro</TableHead>
```
**Type**: Content between tags
**Fix**: Move to `students.ts` → `tableHeaders.financial`

---

### 📁 teachers/ — 1 hardcoded string (1 file affected)

#### ⚠️ TeacherFormDialog.tsx (1 issue)

**Line 127**: `"Email *"`
```tsx
<Label htmlFor="email">Email *</Label>
```
**Type**: Content between tags
**Fix**: Move to `teachers.ts` → `formDialog.emailLabel`

---

### 📁 financial/ — ✅ 0% hardcoding

All 7 files are 100% centralized. No issues found.

---

### 📁 classes/ — 1 hardcoded string (1 file affected)

#### ⚠️ PostClassDialog.tsx (1 issue)

**Line 381**: `"O pagamento será marcado como extornado (devolvido ao aluno)"`
```tsx
<p className={`${TYPOGRAPHY.SMALL} mt-1`}>
  O pagamento será marcado como extornado (devolvido ao aluno)
</p>
```
**Type**: Content between tags
**Fix**: Move to `classes.ts` → `postClassDialog.refundDescription`

---

### 📁 activities/ — 4 hardcoded strings (1 file affected)

#### ⚠️ ActivityDetailSheet.tsx (4 issues)

**Line 109**: `"Baixar"`
```tsx
<Button size="sm" variant="outline" onClick={() => onDownload(...)}>
  <Download className="h-4 w-4 mr-1" />Baixar
</Button>
```
**Type**: Content between tags
**Fix**: Move to `activities.ts` → `detailSheet.downloadButton`

**Line 132**: `"Baixar"`
```tsx
<Button size="sm" variant="outline" onClick={() => onDownload(...)}>
  <Download className="h-4 w-4 mr-1" />Baixar
</Button>
```
**Type**: Content between tags
**Fix**: Move to `activities.ts` → `detailSheet.downloadButton` (reuse)

**Line 169**: `"Baixar"`
```tsx
<Button size="sm" variant="outline" onClick={() => onDownload(...)}>
  <Download className="h-4 w-4 mr-1" />Baixar
</Button>
```
**Type**: Content between tags
**Fix**: Move to `activities.ts` → `detailSheet.downloadButton` (reuse)

**Line 195**: `"Corrigir atividade"`
```tsx
<Button className="w-full h-10 border-none bg-success-action text-white hover:bg-success-action/90" onClick={() => setShowCorrectionForm(true)}>
  <Edit className="h-4 w-4 mr-2" />Corrigir atividade
</Button>
```
**Type**: Content between tags
**Fix**: Move to `activities.ts` → `detailSheet.correctActivityButton`

---

## Validation Checklist

All 6 types of tags/attributes were checked:

- [x] 1. Content between tags (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)
- [x] 2. placeholder="..." attributes
- [x] 3. title="..." attributes
- [x] 4. aria-label="..." attributes
- [x] 5. alt="..." attributes
- [x] 6. <option>Texto</option> content

**Result**: Hardcoded strings found only in type 1 (content between tags). No issues in types 2-6.

---

## Centralization Plan

### Step 1: Add strings to content files

#### students.ts
```ts
export const content = {
  // ... existing content ...
  archiveDialog: {
    // ... existing ...
    importantLabel: 'Importante:',
  },
  deleteDialog: {
    // ... existing ...
    warningLabel: 'Atenção:',
  },
  formDialog: {
    // ... existing ...
    teacherLabel: 'Professor *',
  },
  tableHeaders: {
    hourlyRate: 'Valor/hora',
    classes: 'Aulas',
    monthlyTotal: 'Total mensal',
    paymentDay: 'Dia pagto',
    financial: 'Financeiro',
  },
};
```

#### teachers.ts
```ts
export const content = {
  // ... existing content ...
  formDialog: {
    // ... existing ...
    emailLabel: 'Email *',
  },
};
```

#### classes.ts
```ts
export const content = {
  // ... existing content ...
  postClassDialog: {
    // ... existing ...
    refundDescription: 'O pagamento será marcado como extornado (devolvido ao aluno)',
  },
};
```

#### activities.ts
```ts
export const content = {
  // ... existing content ...
  detailSheet: {
    // ... existing ...
    downloadButton: 'Baixar',
    correctActivityButton: 'Corrigir atividade',
  },
};
```

### Step 2: Refactor components

#### StudentDeleteDialog.tsx
```tsx
// Line 54
<strong>{studentsContent.archiveDialog.importantLabel}</strong> {studentsContent.archiveDialog.archiveNote}

// Line 116
<strong className="text-destructive">{studentsContent.deleteDialog.warningLabel}</strong> {studentsContent.deleteDialog.warning}
```

#### StudentFormDialog.tsx
```tsx
// Line 275
<Label htmlFor="teacher">{studentsContent.formDialog.teacherLabel}</Label>
```

#### StudentsListView.tsx
```tsx
// Line 277
<TableHead>{studentsContent.tableHeaders.hourlyRate}</TableHead>

// Line 280
<TableHead>{studentsContent.tableHeaders.classes}</TableHead>

// Line 283
<TableHead>{studentsContent.tableHeaders.monthlyTotal}</TableHead>

// Line 286
<TableHead>{studentsContent.tableHeaders.paymentDay}</TableHead>

// Line 289
<TableHead>{studentsContent.tableHeaders.financial}</TableHead>
```

#### TeacherFormDialog.tsx
```tsx
// Line 127
<Label htmlFor="email">{teachersContent.formDialog.emailLabel}</Label>
```

#### PostClassDialog.tsx
```tsx
// Line 381
<p className={`${TYPOGRAPHY.SMALL} mt-1`}>
  {classesContent.postClassDialog.refundDescription}
</p>
```

#### ActivityDetailSheet.tsx
```tsx
// Lines 109, 132, 169
<Button size="sm" variant="outline" onClick={() => onDownload(...)}>
  <Download className="h-4 w-4 mr-1" />{activitiesContent.detailSheet.downloadButton}
</Button>

// Line 195
<Button className="w-full h-10 border-none bg-success-action text-white hover:bg-success-action/90" onClick={() => setShowCorrectionForm(true)}>
  <Edit className="h-4 w-4 mr-2" />{activitiesContent.detailSheet.correctActivityButton}
</Button>
```

### Step 3: Verify

After refactoring:
1. Run `npm run build` — must pass
2. Run validation script again — must show 0% hardcoding
3. Test components manually in browser

---

## Validation Methodology

**Tool**: Custom Node.js regex scanner
**Patterns**: 6 types of hardcoded strings (as per design.md)
**Scope**: All .tsx files in Phase 2 folders
**Exclusions**: Variables, expressions, empty strings, single characters
**Accuracy**: High confidence (regex-based pattern matching)

---

## Next Steps

1. ✅ Validation complete — 14 hardcoded strings identified
2. ⏳ Add strings to content files (students.ts, teachers.ts, classes.ts, activities.ts)
3. ⏳ Refactor 6 components to use centralized content
4. ⏳ Run `npm run build` to verify
5. ⏳ Re-run validation to confirm 0% hardcoding
6. ⏳ Mark task 2.7 as complete

---

## Files to Modify

1. `src/content/students.ts` — Add 6 new keys
2. `src/content/teachers.ts` — Add 1 new key
3. `src/content/classes.ts` — Add 1 new key
4. `src/content/activities.ts` — Add 2 new keys
5. `src/components/students/StudentDeleteDialog.tsx` — Update 2 lines
6. `src/components/students/StudentFormDialog.tsx` — Update 1 line
7. `src/components/students/StudentsListView.tsx` — Update 5 lines
8. `src/components/teachers/TeacherFormDialog.tsx` — Update 1 line
9. `src/components/classes/PostClassDialog.tsx` — Update 1 line
10. `src/components/activities/ActivityDetailSheet.tsx` — Update 4 lines

---

**Report Status**: Ready for refactoring
**Estimated Effort**: 30-45 minutes
**Risk Level**: Low (simple string replacements)
