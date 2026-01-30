# ✅ TODO - Ações Pendentes

**Última atualização:** 30/01/2026

---

## 🚨 URGENTE (Fazer HOJE)

### 1. Configurar Rate Limiting
⏱️ **Tempo:** 2 minutos  
📖 **Guia:** [.github/RATE_LIMITING_QUICK_GUIDE.md](.github/RATE_LIMITING_QUICK_GUIDE.md)

```
✓ Passos:
1. Acessar https://app.supabase.com
2. Ir em Authentication → Rate Limits
3. Alterar "sign-ups and sign-ins" de 30 para 10
4. Alterar "anonymous users" de 30 para 10
5. Clicar em "Save changes"
```

**Por quê é urgente?**  
Sistema está vulnerável a ataques de brute force! 😱

---

## ⚡ IMPORTANTE (Fazer esta semana)

### 2. Aplicar Migrations SQL
⏱️ **Tempo:** 5 minutos  
📖 **Guia:** [APPLY_MIGRATIONS_GUIDE.md](./APPLY_MIGRATIONS_GUIDE.md)

```
✓ Passos:
1. Acessar Dashboard → SQL Editor
2. Copiar conteúdo de: supabase/migrations/student_balance_view.sql
3. Colar e executar (RUN)
4. Copiar conteúdo de: supabase/migrations/class_logs_improvements.sql
5. Colar e executar (RUN)
6. Verificar: SELECT * FROM student_complete_balance;
```

**Benefícios:**
- ⚡ Performance 10x melhor
- ✅ Saldo calculado automaticamente
- 📊 Estatísticas prontas

---

## 🧪 TESTAR (Após aplicar migrations)

### 3. Testar Nova Aba "Extrato"
⏱️ **Tempo:** 3 minutos

```
✓ Passos:
1. npm run dev
2. Acessar Dashboard → Alunos
3. Clicar em um aluno
4. Verificar nova aba "Extrato"
5. Confirmar que mostra aulas + cobranças
6. Verificar saldo atual está correto
```

**O que esperar:**
- 4 abas: Dados, Aulas, Financeiro, **Extrato**
- Timeline com aulas e cobranças
- Saldo atual em destaque
- Saldo após cada transação

---

## 🔄 OPCIONAL (Melhoria de Performance)

### 4. Atualizar Hooks para Usar Views
⏱️ **Tempo:** 15 minutos  
📖 **Ver:** [PERFORMANCE_AND_UX_IMPROVEMENTS.md](./PERFORMANCE_AND_UX_IMPROVEMENTS.md)

```typescript
// Em src/hooks/useStudents.ts

// ❌ Antes
const { data } = await supabase
  .from("students")
  .select();
// + cálculos manuais no React

// ✅ Depois
const { data } = await supabase
  .from("student_complete_balance")
  .select();
// Stats já vêm prontos!
```

**Benefícios:**
- Frontend mais leve
- Performance melhor
- Menos código

---

## 📝 CONSIDERAR (Futuro)

### 5. Adicionar Pergunta "Cobrar Falta?"
Quando professor registrar falta do aluno, perguntar se deve cobrar.

```typescript
if (!attendance) {
  const shouldCharge = confirm("Esta falta deve ser cobrada?");
  // ...
}
```

### 6. Indicador Visual de Saldo no Card
Badge mostrando saldo no card de cada aluno.

```tsx
<Badge variant={balance >= 0 ? "success" : "destructive"}>
  {formatCurrency(Math.abs(balance))}
</Badge>
```

### 7. Export de Extrato (PDF)
Botão para exportar extrato em PDF.

### 8. Dashboard de Inadimplência
View com alunos que têm cobranças atrasadas.

---

## 📋 Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Rate limiting configurado ⚠️
- [ ] Migrations aplicadas ⚠️
- [ ] Aba extrato testada
- [ ] Saldos conferidos
- [ ] `.env` em produção correto
- [ ] Sentry configurado
- [ ] Testes E2E executados

---

## 🎯 Status Atual

| Item | Status |
|------|--------|
| Erros de regex | ✅ Corrigido |
| Segurança (P0) | ✅ Implementado |
| Rate Limiting (P1-AUTH) | ⚠️ **PENDENTE** |
| Migrations SQL | ⚠️ **PENDENTE** |
| Componente Extrato | ✅ Criado |
| Documentação | ✅ Completa |

---

## 🚀 Prioridades

1. 🚨 **URGENTE:** Configurar Rate Limiting (2 min)
2. ⚡ **IMPORTANTE:** Aplicar Migrations (5 min)
3. 🧪 **TESTAR:** Aba Extrato (3 min)
4. 🔄 **OPCIONAL:** Atualizar Hooks (15 min)

**Tempo total mínimo:** 10 minutos  
**Tempo total completo:** 25 minutos

---

**Próxima ação:** Configurar Rate Limiting no Dashboard! 👉 [Guia Rápido](.github/RATE_LIMITING_QUICK_GUIDE.md)
