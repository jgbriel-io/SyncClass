# Supabase CLI

## Instalação (Windows)

```bash
# Via Scoop (recomendado)
scoop install supabase

# Via npx (sem instalação permanente)
npx supabase <comando>
```

Não usar `npm install -g supabase` — não é suportado.

## Linkar projeto

```bash
npx supabase link --project-ref yxwtxewwszoovqrjrrfb
```

O project ref está na URL do dashboard: `supabase.com/dashboard/project/<REF>`.

## Comandos

```bash
# Aplicar migrations pendentes
npx supabase db push

# Executar SQL diretamente
npx supabase db execute --file arquivo.sql

# Deploy de edge function
npx supabase functions deploy <nome>

# Ver status (requer Docker para ambiente local)
npx supabase status
```

## Credenciais

Dashboard → Settings → API:
- `anon` key → `VITE_SUPABASE_PUBLISHABLE_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (nunca commitar, nunca no frontend)
