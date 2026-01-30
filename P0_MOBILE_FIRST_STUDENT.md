# 🔴 P0: Mobile-First Student Experience

**Data:** 30/01/2026  
**Estratégia:** Admin = Desktop (densidade) | Aluno = Mobile (app nativo)  
**Objetivo:** Transformar experiência do aluno em app mobile-first

---

## 🎯 Visão

### Premissa Central
- **Admin/Professor:** Desktop power user (tabelas densas, múltiplas colunas, produtividade)
- **Aluno:** Mobile app experience (cards verticais, gestos, PWA instalável)

### Diferenciais do Aluno Mobile
- 📱 Cards verticais ao invés de tabelas horizontais
- 🎨 Bottom navigation (já implementado)
- 📲 PWA instalável (adicionar à tela inicial)
- 🚫 Sem zoom automático em inputs
- ⚡ Experiência fluida tipo app nativo
- ♿ Totalmente acessível (WCAG A)

---

## 🔴 P0-1: App View para Aluno (Mobile-First)

### Problema Atual
Páginas do aluno ainda usam componentes densos de admin:
- `StudentHome.tsx` — Dashboard com métricas
- `StudentHistory.tsx` — Tabela de aulas
- `StudentFinancial.tsx` — Tabela de cobranças

### Solução: Cards Verticais em Mobile

#### StudentHistory.tsx — Aulas

**Antes (tabela):**
```tsx
<div className="overflow-x-auto">
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Professor</th>
        <th>Status</th>
        <th>Nota</th>
      </tr>
    </thead>
    {/* scroll horizontal no mobile */}
  </table>
</div>
```

**Depois (cards mobile-first):**
```tsx
<div className="space-y-3">
  {classLogs.map(log => (
    <Card key={log.id} className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatDate(log.class_date)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{log.teacher?.name}</span>
          </div>
          
          {log.attendance && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Presente</span>
            </div>
          )}
          
          {log.grade && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Nota: {log.grade}</span>
            </div>
          )}
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  ))}
</div>
```

#### StudentFinancial.tsx — Cobranças

**Cards com status visual:**
```tsx
<div className="space-y-3">
  {financialRecords.map(record => (
    <Card 
      key={record.id} 
      className={cn(
        "p-4 border-l-4",
        record.status === "pago" && "border-l-success",
        record.status === "pendente" && "border-l-warning",
        record.status === "atrasado" && "border-l-destructive"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            {formatCurrency(record.amount)}
          </span>
          <Badge variant={getStatusVariant(record.status)}>
            {record.status}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Vencimento: {formatDate(record.due_date)}</span>
          </div>
          
          {record.description && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{record.description}</span>
            </div>
          )}
        </div>
        
        {record.status === "pendente" && (
          <Button className="w-full" size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar Agora
          </Button>
        )}
      </div>
    </Card>
  ))}
</div>
```

#### StudentHome.tsx — Dashboard

**Cards de métricas com ícones grandes:**
```tsx
<div className="space-y-4">
  {/* Saldo de Aulas */}
  <Card className="p-6">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <BookOpen className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Aulas restantes</p>
        <p className="text-3xl font-bold">{remainingClasses}</p>
      </div>
    </div>
  </Card>
  
  {/* Próxima Aula */}
  <Card className="p-6">
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold">Próxima aula</span>
      </div>
      <div className="space-y-1">
        <p className="text-lg font-medium">{nextClass.date}</p>
        <p className="text-sm text-muted-foreground">
          com {nextClass.teacher}
        </p>
      </div>
    </div>
  </Card>
  
  {/* Status Financeiro */}
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Pendente</p>
        <p className="text-2xl font-bold text-warning">
          {formatCurrency(pendingAmount)}
        </p>
      </div>
      <Button>Ver detalhes</Button>
    </div>
  </Card>
</div>
```

### Implementação

**Arquivos para criar:**
- `src/components/student/StudentClassCard.tsx`
- `src/components/student/StudentFinancialCard.tsx`
- `src/components/student/StudentMetricCard.tsx`

**Arquivos para atualizar:**
- `src/pages/student/StudentHome.tsx`
- `src/pages/student/StudentHistory.tsx`
- `src/pages/student/StudentFinancial.tsx`

---

## 🔴 P0-2: Acessibilidade WCAG Nível A

### Checklist Crítico

#### 2.1 Botões com Ícones (15+ ocorrências)

**Arquivos do portal do aluno:**
- `StudentLayout.tsx` — Botões de navegação
- `StudentHome.tsx` — Botões de ações
- `StudentHistory.tsx` — Botões de detalhes

**Correção:**
```tsx
// ❌ Antes
<Button variant="ghost" size="icon">
  <MoreHorizontal className="h-4 w-4" />
</Button>

// ✅ Depois
<Button variant="ghost" size="icon" aria-label="Ver mais opções">
  <MoreHorizontal className="h-4 w-4" />
</Button>
```

#### 2.2 Dialogs sem Descrição

**Arquivos:**
- Nenhum no portal do aluno (apenas admin/teacher)
- ✅ Não crítico para P0 do aluno

#### 2.3 Skip Links

**Adicionar em `StudentLayout.tsx`:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
>
  Pular para conteúdo principal
</a>

<main id="main-content" className="...">
  {children}
</main>
```

---

## 🔴 P0-3: PWA (Progressive Web App)

### 3.1 Manifest.json

**Criar:** `public/manifest.json`

```json
{
  "name": "Edu Core Zen - Portal do Aluno",
  "short_name": "Edu Core",
  "description": "Acompanhe suas aulas, notas e pagamentos",
  "start_url": "/student",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/classes.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["education", "productivity"],
  "lang": "pt-BR",
  "dir": "ltr"
}
```

### 3.2 Atualizar index.html

**Adicionar no `<head>`:**
```html
<!-- PWA -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Edu Core" />

<!-- iOS Icons -->
<link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
<link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
<link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.png" />
<link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
<link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
<link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
<link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.png" />
<link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />

<!-- Android -->
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
```

### 3.3 Service Worker (Vite PWA Plugin)

**Instalar:**
```bash
npm install -D vite-plugin-pwa
```

**Atualizar `vite.config.ts`:**
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: false, // Usar manifest.json manual
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### 3.4 Gerar Ícones

**Tool recomendada:** https://realfavicongenerator.net/

**Tamanhos necessários:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**Criar pasta:** `public/icons/`

---

## 🔴 P0-4: Bloqueio de Zoom em Inputs Mobile

### Problema
Navegadores mobile dão zoom automático ao focar em inputs com `font-size < 16px`, quebrando a experiência de app.

### Solução Completa

#### 4.1 Atualizar Viewport Meta Tag

**index.html:**
```html
<!-- ❌ Antes -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- ✅ Depois -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

**⚠️ Cuidado:** Isso impede zoom manual. Compensar com:
1. Font size adequado (16px+ em inputs)
2. Controles de acessibilidade (botões de aumentar texto)

#### 4.2 Ajustar Font Size de Inputs

**Atualizar `input.tsx`:**
```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-base", // ⚡ 16px no mobile (era text-sm = 14px)
          "md:text-sm", // 14px no desktop
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Atualizar `textarea.tsx`:**
```typescript
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
          "text-base", // ⚡ 16px no mobile
          "md:text-sm", // 14px no desktop
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

#### 4.3 Ajustar Select

**Atualizar `select.tsx`:**
```typescript
<SelectPrimitive.Trigger
  className={cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
    "text-base", // ⚡ 16px no mobile
    "md:text-sm", // 14px no desktop
    "ring-offset-background",
    // ... resto
  )}
>
```

---

## 📋 Checklist de Implementação P0

### Fase 1: Acessibilidade WCAG A (2 horas)
- [ ] Adicionar `aria-label` em botões do portal do aluno
- [ ] Adicionar skip link em `StudentLayout.tsx`
- [ ] Testar com leitor de tela (NVDA/VoiceOver)

### Fase 2: Bloqueio de Zoom (1 hora)
- [ ] Atualizar viewport meta tag
- [ ] Ajustar `input.tsx` (`text-base md:text-sm`)
- [ ] Ajustar `textarea.tsx` (`text-base md:text-sm`)
- [ ] Ajustar `select.tsx` (`text-base md:text-sm`)
- [ ] Testar em iPhone/Android real

### Fase 3: PWA Manifest (2 horas)
- [ ] Criar `public/manifest.json`
- [ ] Gerar ícones (72x72 até 512x512)
- [ ] Adicionar meta tags no `index.html`
- [ ] Instalar `vite-plugin-pwa`
- [ ] Configurar `vite.config.ts`
- [ ] Testar "Adicionar à tela inicial" no mobile

### Fase 4: App View Mobile (8 horas)
- [ ] Criar `StudentClassCard.tsx`
- [ ] Criar `StudentFinancialCard.tsx`
- [ ] Criar `StudentMetricCard.tsx`
- [ ] Refatorar `StudentHome.tsx` (cards verticais)
- [ ] Refatorar `StudentHistory.tsx` (cards verticais)
- [ ] Refatorar `StudentFinancial.tsx` (cards verticais)
- [ ] Adicionar gestos (swipe, pull-to-refresh - opcional)
- [ ] Testar em dispositivos reais

**Total:** ~13 horas (2 dias)

---

## 🎯 Resultado Esperado

### Antes (Atual)
- Portal do aluno usa componentes de admin
- Tabelas horizontais em mobile
- Zoom automático em inputs
- Não instalável
- Acessibilidade básica

### Depois (P0 Completo)
- ✅ Cards verticais mobile-first
- ✅ Experiência de app nativo
- ✅ PWA instalável na tela inicial
- ✅ Sem zoom automático (UX fluida)
- ✅ WCAG Nível A compliant
- ✅ Bottom navigation (já tem)
- ✅ Ícone personalizado
- ✅ Splash screen (via manifest)

---

## 📱 Demo Visual (Esperado)

```
┌─────────────────────┐
│  [Logo] Edu Core    │  ← Header fixo
├─────────────────────┤
│                     │
│  📚 Aulas restantes │  ← Card métrica
│      12 aulas       │
│                     │
├─────────────────────┤
│                     │
│  🕐 Próxima aula    │  ← Card próxima aula
│  15/02 - 14h        │
│  Prof. João         │
│                     │
├─────────────────────┤
│                     │
│  💰 Pendente        │  ← Card financeiro
│  R$ 250,00          │
│  [Ver detalhes]     │
│                     │
└─────────────────────┘
│ 🏠  📚  💰  👤      │  ← Bottom nav
└─────────────────────┘
```

---

## 🚀 Ordem de Execução Recomendada

**Dia 1 - Manhã (4h):**
1. P0-2: Acessibilidade WCAG A (2h)
2. P0-4: Bloqueio de zoom (1h)
3. P0-3: PWA setup inicial (1h)

**Dia 1 - Tarde (4h):**
4. P0-3: PWA ícones e manifest (2h)
5. P0-1: Criar componentes de cards (2h)

**Dia 2 - Integral (8h):**
6. P0-1: Refatorar páginas do aluno (6h)
7. Testes em dispositivos reais (2h)

**Total:** 2 dias completos

---

## ✅ Critérios de Sucesso

### Técnicos
- [ ] Lighthouse PWA Score > 90
- [ ] Lighthouse Accessibility Score > 95
- [ ] Sem zoom automático em inputs
- [ ] Instalável via "Adicionar à tela inicial"
- [ ] Cards responsivos < 768px

### UX
- [ ] Aluno consegue instalar app
- [ ] Navegação fluida sem scroll horizontal
- [ ] Ícone personalizado na tela inicial
- [ ] Splash screen ao abrir
- [ ] Feedback visual imediato

### Acessibilidade
- [ ] Leitores de tela funcionam
- [ ] Navegação por teclado (Tab)
- [ ] Skip links funcionais
- [ ] Contraste adequado

---

**Prioridade:** 🔴 P0 — Crítico  
**Esforço:** 2 dias (16 horas)  
**ROI:** 🟢 Máximo — Define experiência do aluno  
**Próximo passo:** Implementar agora!
