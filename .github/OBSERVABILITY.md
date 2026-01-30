# Guia de Observabilidade

Este documento descreve como o sistema de observabilidade está configurado e como utilizá-lo efetivamente.

## Stack de Observabilidade

- **Sentry**: Rastreamento de erros e monitoramento de performance
- **Error Boundary**: Captura de erros do React
- **Logger centralizado**: API unificada para logging
- **PII Collection**: Coleta automática de IP para identificar padrões por localização

## Configuração

### 1. Configurar Sentry

1. Crie uma conta em [sentry.io](https://sentry.io)
2. Crie um novo projeto React
3. Copie o DSN fornecido
4. Adicione ao seu arquivo `.env`:

```env
VITE_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
VITE_ENVIRONMENT="production"
```

### 2. Ambientes

O sistema automaticamente detecta o ambiente:

- **development**: Modo local com amostragem 100%
- **production**: Modo produção com amostragem 10%

## Uso do Logger Centralizado

### Importação

```typescript
import { logger } from "@/lib/sentry";
```

### Métodos Disponíveis

#### 1. Log de Informação

```typescript
logger.info("Operação concluída com sucesso", {
  userId: "123",
  action: "create_student",
});
```

#### 2. Log de Aviso

```typescript
logger.warn("Taxa de requisições alta detectada", {
  endpoint: "/api/students",
  count: 150,
});
```

#### 3. Log de Erro

```typescript
// Com objeto Error
try {
  await createStudent();
} catch (error) {
  logger.error(error as Error, {
    studentData: sanitizedData,
    context: "createStudent",
  });
}

// Com string
logger.error("Falha ao conectar com API externa", {
  service: "payment-gateway",
  statusCode: 503,
});
```

#### 4. Contexto de Usuário

```typescript
// Definir usuário (feito automaticamente no AuthContext)
logger.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Limpar usuário (feito automaticamente no logout)
logger.clearUser();
```

#### 5. Breadcrumbs (Rastro de Ações)

```typescript
logger.addBreadcrumb(
  "Formulário de aluno preenchido",
  "user-action",
  {
    fields: ["name", "email", "cpf"],
    formId: "student-form",
  }
);
```

## Error Boundary

### Uso Básico

O Error Boundary global já está configurado no `main.tsx`. Ele captura erros não tratados em qualquer componente React.

### Error Boundary Customizado

```typescript
import ErrorBoundary from "@/components/ErrorBoundary";

function MyFeature() {
  return (
    <ErrorBoundary>
      <ComplexComponent />
    </ErrorBoundary>
  );
}
```

### HOC com Error Boundary

```typescript
import { withErrorBoundary } from "@/components/ErrorBoundary";

const MyComponent = () => {
  // ...
};

export default withErrorBoundary(MyComponent);
```

## Melhores Práticas

### 1. Use Logger em Vez de Console

❌ **Evite:**
```typescript
console.error("Erro ao criar usuário", error);
```

✅ **Prefira:**
```typescript
logger.error(error, {
  context: "useCreateUser",
  userId: user.id,
});
```

### 2. Adicione Contexto Rico

```typescript
logger.error(error, {
  context: "payment-processing",
  studentId: student.id,
  amount: payment.amount,
  paymentMethod: payment.method,
  timestamp: new Date().toISOString(),
});
```

### 3. Use Breadcrumbs para Rastrear Fluxo

```typescript
// No início de operações críticas
logger.addBreadcrumb("Iniciando pagamento", "payment", {
  studentId,
  amount,
});

try {
  await processPayment();
  logger.addBreadcrumb("Pagamento processado", "payment", { success: true });
} catch (error) {
  logger.error(error, { context: "processPayment" });
}
```

### 4. Filtre Dados Sensíveis

❌ **Nunca:**
```typescript
logger.error(error, {
  password: user.password,
  creditCard: payment.cardNumber,
});
```

✅ **Sempre sanitize:**
```typescript
logger.error(error, {
  userId: user.id,
  paymentMethod: payment.method, // apenas o tipo, não os números
});
```

## Monitoramento no Sentry

### Dashboard Principal

1. Acesse [sentry.io](https://sentry.io)
2. Navegue até seu projeto
3. Visualize:
   - **Issues**: Erros agrupados
   - **Performance**: Métricas de performance
   - **Releases**: Versões deployadas
   - **Replays**: Sessões gravadas (quando houver erro)

### Alertas

Configure alertas no Sentry para:
- Novos tipos de erro
- Aumento repentino de erros
- Erros em rotas críticas

### Release Tracking

Adicione tags de release para rastrear erros por versão:

```bash
# No CI/CD
export SENTRY_RELEASE=$(git rev-parse --short HEAD)
```

## Troubleshooting

### Logger não funciona

Verifique se:
1. `VITE_SENTRY_DSN` está configurado no `.env`
2. Sentry foi inicializado no `main.tsx`
3. Não há erros no console do navegador

### Dados sensíveis aparecendo

O Sentry filtra automaticamente:
- Headers `Authorization` e `Cookie`
- Erros de `ResizeObserver` (ruído do navegador)
- Requisições canceladas

**Dados coletados (sendDefaultPii: true):**
- Endereço IP do usuário (útil para identificar padrões por região)
- User-Agent (navegador e sistema operacional)

Esses dados **NÃO** são coletados:
- Tokens de autenticação
- Cookies de sessão
- Senhas ou dados de cartão de crédito
- Dados de formulários (são mascarados no Session Replay)

Para adicionar mais filtros, edite `beforeSend` em `src/lib/sentry.ts`.

### Performance Impact

A configuração atual minimiza impacto:
- **Development**: 100% de amostragem (todas as transações)
- **Production**: 10% de amostragem (1 a cada 10 transações)
- Eventos são enviados de forma assíncrona
- Replay de sessão apenas em erros

## Desenvolvimento Local

### Testar Integração do Sentry

Para validar que o Sentry está funcionando corretamente, use o componente de teste:

```tsx
// Em desenvolvimento, adicione temporariamente ao App.tsx
import SentryTest from "@/components/SentryTest";

function App() {
  return (
    <>
      <SentryTest /> {/* Apenas em dev */}
      {/* Resto da aplicação */}
    </>
  );
}
```

O componente oferece botões para testar:
- ✅ Captura de exceções
- ✅ Captura de mensagens
- ✅ Avisos
- ✅ Breadcrumbs
- ✅ Error Boundary
- ✅ Dialog de feedback do usuário

### Testar sem enviar ao Sentry

Para desenvolver sem enviar dados ao Sentry:

```env
# .env.local
VITE_SENTRY_DSN=""
```

Os logs continuarão aparecendo no console, mas não serão enviados ao Sentry.

## Checklist de Deploy

- [ ] `VITE_SENTRY_DSN` configurado em produção
- [ ] `VITE_ENVIRONMENT` definido como "production"
- [ ] Alertas configurados no Sentry
- [ ] Integração com Slack/Discord configurada (opcional)
- [ ] Source maps habilitados para stack traces melhores (opcional)

## Recursos Adicionais

- [Documentação do Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Best Practices](https://docs.sentry.io/product/best-practices/)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
