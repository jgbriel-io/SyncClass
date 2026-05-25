# Sprint 26 — Security Audit

**Período:** 25/05/2026  
**Status:** ⬜ Planejada  
**Tipo:** Segurança

## Contexto

Auditoria de segurança ampla cobrindo OWASP Top 10, JWT storage, CSP, open
redirects, file validation e rate limiting client-side. Complementa Sprint 23
(Edge Functions + hooks), Sprint 24 (RLS) e Sprint 25 (DB). Findings já
documentados em sprint-23 (BE-017, BE-023) não são repetidos aqui.

---

## Itens

### SEC-001 — JWT armazenado em `localStorage` (vulnerável a XSS)

**Severidade:** 🟠 Alta  
**Esforço:** 1h  
**Arquivo:** `src/integrations/supabase/client.ts:8`

**Problema:** Supabase SDK por padrão armazena JWT em `localStorage`. Qualquer
script inline (XSS) lê o token e impersona o usuário. `localStorage` não tem
proteção `httpOnly` — é acessível por qualquer JavaScript na página.

**Fix:** Configurar Supabase para usar cookies com `httpOnly` via `auth.storage`:

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: {
      // custom cookie storage — httpOnly via SSR ou BFF
      // alternativa mais simples: usar sessionStorage (limpa ao fechar tab)
      storage: sessionStorage,
    },
    persistSession: true,
  },
});
```

Para proteção real contra XSS, combinar com SEC-002 (CSP).

**Critério de aceite:** JWT não acessível via `localStorage.getItem('supabase.auth.token')`
no console do browser. Ou CSP implementado que bloqueia scripts inline.

---

### SEC-002 — Sem Content-Security-Policy

**Severidade:** 🟠 Alta  
**Esforço:** 1h30min  
**Arquivo:** `index.html:1`

**Problema:** Nenhum CSP configurado em `index.html` nem no servidor (Vite). Sem
CSP, XSS pode executar scripts arbitrários, exfiltrar tokens e fazer requests
para domínios externos.

**Fix:** Adicionar CSP mínimo no `index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  img-src 'self' data: blob: https://*.supabase.co;
  font-src 'self';
  frame-ancestors 'none';
"
/>
```

Ajustar `connect-src` com a URL do projeto Supabase.

**Critério de aceite:** DevTools → Network → Headers mostra CSP ativo.
Lighthouse Security audit não reporta CSP ausente.

---

### SEC-003 — Hard redirects para `/login` via `window.location` (open redirect)

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivos:** `src/contexts/AuthContext.tsx:108,188`, `src/hooks/useUserAuthMutations.ts:220`

**Problema:** `window.location.href = '/login'` e `window.location.replace('/login')`
usam path hardcoded. Embora `/login` seja relativo (sem domínio externo), o padrão
é frágil — se algum dia a string vier de parâmetro de URL ou config, vira open
redirect. Além disso, navegar via `window.location` contorna o React Router
history e quebra SPA transitions.

**Fix:** Usar `navigate('/login')` do React Router em todos os redirects de auth:

```ts
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

// em vez de window.location.href = '/login'
navigate("/login", { replace: true });
```

**Critério de aceite:** Logout e sessão expirada navegam para `/login` via
React Router. Sem `window.location` em flows de auth.

---

### SEC-004 — `fileValidation.ts` valida apenas MIME type (sem magic bytes)

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivo:** `src/lib/utils/fileValidation.ts:56`

**Problema:** Validação de arquivos (comprovantes de pagamento, material de atividades)
checa apenas `file.type` (MIME type declarado pelo browser). MIME type é controlado
pelo cliente — arquivo malicioso com extensão `.jpg` e conteúdo HTML/JS passa
a validação.

**Fix:** Validar magic bytes além do MIME type:

```ts
async function validateMagicBytes(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJPEG = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50; // %P
  return isJPEG || isPNG || isPDF;
}
```

**Critério de aceite:** Arquivo `.jpg` com conteúdo HTML rejeitado. Arquivo
válido aceito normalmente.

---

### SEC-005 — Rate limiting de upload client-side bypassável

**Severidade:** 🟡 Média  
**Esforço:** 45min  
**Arquivo:** `src/lib/utils/fileValidation.ts:44`

**Problema:** `uploadTimestamps` é um `Map` em memória no cliente. Usuário pode
contornar o rate limit recarregando a página, abrindo nova aba, ou usando
DevTools para limpar o estado. Sem enforcement server-side, não há proteção real.

**Fix:** Mover rate limiting de upload para Edge Function ou usar `check_rate_limit`
RPC do Supabase já existente no projeto:

```ts
// antes do upload, chamar o rate limit do banco
const { error } = await supabase.rpc("check_rate_limit", {
  p_operation: "file_upload",
  p_max_requests: 10,
  p_window_minutes: 1,
});
if (error) throw new Error("Limite de uploads atingido");
```

**Critério de aceite:** Upload após recarregar página continua limitado.
Rate limit persiste entre sessões do mesmo usuário.

---

### SEC-006 — `reset-password` vulnerável a timing attack (enumeração de email)

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivo:** `supabase/functions/reset-password/reset-password.ts:100`

**Problema:** `signInWithPassword()` com email existente demora mais que com
email inexistente (lookup no banco vs. rejeição imediata). Adversário pode
medir tempo de resposta para confirmar se email está cadastrado.

**Fix:** Usar `setTimeout` para equalizar tempo de resposta ou adicionar
delay constante independente do resultado:

```ts
const minResponseTime = 500; // ms
const start = Date.now();

const { error } = await supabase.auth.signInWithPassword(...);

const elapsed = Date.now() - start;
if (elapsed < minResponseTime) {
  await new Promise(r => setTimeout(r, minResponseTime - elapsed));
}
```

**Critério de aceite:** Tempo de resposta para email existente e inexistente
difere em < 50ms medido externamente.

---

## Ordem de Implementação Recomendada

| #   | Item    | Esforço | Risco | Impacto                         |
| --- | ------- | ------- | ----- | ------------------------------- |
| 1   | SEC-002 | 1h30min | Médio | 🟠 CSP bloqueia XSS inteiro     |
| 2   | SEC-001 | 1h      | Médio | 🟠 JWT fora do localStorage     |
| 3   | SEC-004 | 30min   | Baixo | Magic bytes validação de upload |
| 4   | SEC-005 | 45min   | Baixo | Rate limit upload server-side   |
| 5   | SEC-003 | 30min   | Baixo | window.location → navigate()    |
| 6   | SEC-006 | 30min   | Baixo | Timing attack em reset-password |

**Total estimado:** ~4h45min

## Dependências

- SEC-001 e SEC-002 devem ser implementados juntos (CSP + localStorage formam defesa complementar)
- SEC-005 depende de `check_rate_limit` RPC existente (migration 07) — já disponível
- SEC-003 requer React Router disponível no contexto de cada redirect (verificar providers)
- SEC-004 não tem dependências — patch autônomo em `fileValidation.ts`

## Não incluídos (já documentados)

| Finding                           | Sprint    | Item   |
| --------------------------------- | --------- | ------ |
| CORS wildcard Edge Functions      | Sprint 23 | BE-023 |
| useChangePassword sem senha atual | Sprint 23 | BE-017 |
| reset-password service role key   | Sprint 23 | BE-014 |

## Referências

- [Sprint 23](./sprint-23-backend-quality-fixes.md) — Edge Functions security
- [Sprint 24](./sprint-24-rls-audit.md) — RLS policies
- `src/integrations/supabase/client.ts` — SEC-001
- `index.html` — SEC-002
- `src/contexts/AuthContext.tsx` — SEC-003
- `src/hooks/useUserAuthMutations.ts` — SEC-003
- `src/lib/utils/fileValidation.ts` — SEC-004, SEC-005
- `supabase/functions/reset-password/reset-password.ts` — SEC-006
