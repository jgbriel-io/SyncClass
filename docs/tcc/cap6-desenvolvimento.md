> **Status:** 🟠 Rascunho — adicionar prints de tela
> **Última Atualização:** 21/04/2026

## 6.1 Stack Tecnológica

A stack foi escolhida priorizando:

- **Produtividade:** Supabase elimina backend tradicional; shadcn/ui elimina design system do zero.
- **Tipagem:** TypeScript _end-to-end_ (tipos gerados do banco via `supabase gen types`).
- **Qualidade:** TanStack Query para cache e estado de servidor; Zod para validação.

## 6.2 Estrutura de Pastas

```
src/
├── components/        # 126 componentes React
│   ├── ui/            # shadcn/ui + componentes base customizados
│   ├── students/      # Domínio: alunos
│   ├── classes/       # Domínio: aulas
│   ├── financial/     # Domínio: financeiro
│   ├── activities/    # Domínio: atividades
│   ├── admin/         # Componentes exclusivos do admin
│   ├── layout/        # Shells por role (AdminShell, TeacherShell, StudentShell)
│   ├── filters/       # Filtros por módulo
│   └── auth/          # AuthRedirect, ProtectedRoute, ChangePasswordDialog
├── hooks/             # 23 hooks (TanStack Query + mutations)
├── pages/             # Páginas por role (admin/, teacher/, student/)
├── contexts/          # AuthContext
├── integrations/
│   └── supabase/      # client.ts, types gerados, env.ts
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize()
    ├── utils/         # formatters, patterns, errorMapper, sanitize
    ├── validation/    # schemas Zod
    └── security/      # errorHandler
supabase/
├── migrations/        # 23 migrations SQL
└── functions/         # 5 Edge Functions (Deno/TypeScript)
```

> 🖼️ **Figura:** Estrutura de pastas formatada

## 6.3 Padrões de Código

### 6.3.1 Separação de Responsabilidades

```
Components → Hooks → Supabase SDK → PostgreSQL
```

- **Components:** Apenas UI, sem lógica de negócio.
- **Hooks:** TanStack Query para dados, mutations para escrita.
- **Supabase SDK:** Chamadas ao banco, nunca em componentes.

### 6.3.2 Exemplo — Hook de Dados

```ts
export const useStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ['students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, status, pay_day, hourly_rate')
        .eq('teacher_id', teacherId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000,
  });
};
```

### 6.3.3 Design Tokens

Sistema de tokens para consistência visual:

```ts
<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

## 6.4 Módulos Implementados

### 6.4.1 Módulo de Alunos

- CRUD completo com _soft delete_ e restauração.
- Filtros por status, professor e aniversariantes.
- Paginação _server-side_.
- Suporte a alunos estrangeiros (país, telefone internacional).

> 🖼️ **Print:** Tela de listagem de alunos

### 6.4.2 Módulo de Aulas

- Registro individual e em pacote.
- Controle de presença (presente/faltou/pendente).
- Avaliação pós-aula (nota, feedback, observações).
- Validação de sobreposição de horários.

> 🖼️ **Print:** Tela de registro de aula / pacote de aulas

### 6.4.3 Módulo Financeiro

- Cobranças individuais e por pacote.
- Status: pendente → pago / cancelado / abonado / extornado.
- Upload e aprovação de comprovante.
- QR Code PIX para pagamento pelo aluno.
- Idempotência via `idempotency_keys`.

> 🖼️ **Print:** Tela financeira com status de cobranças

### 6.4.4 Módulo de Atividades

- Criação com prazo, arquivo e descrição.
- Entrega pelo aluno com arquivo de resposta.
- Correção com nota, feedback e arquivo de correção.
- Status: pendente → enviada → entregue → corrigida / atrasada.

> 🖼️ **Print:** Tela de atividades

### 6.4.5 Portal do Aluno

- Histórico de aulas com cards.
- Extrato financeiro unificado.
- Entrega de atividades.
- Pagamento via PIX com QR Code.

> 🖼️ **Print:** Portal do aluno (mobile)

### 6.4.6 Dashboard

- Métricas: total de alunos, aulas do mês, receita, pendências.
- Gráfico de crescimento de alunos (filtro 3/6/12 meses).
- Próximos pagamentos e aniversariantes do mês.
- Aulas do dia.

> 🖼️ **Print:** Dashboard do professor

## 6.5 Números do Projeto

|**Métrica**|**Valor**|
|---|---|
|Total de arquivos|391|
|Linhas de código|~46.400|
|Componentes React|126|
|Hooks customizados|23|
|Migrations SQL|23|
|Edge Functions|5|
|Commits (histórico completo)|~218|
|Tempo de desenvolvimento|~3 meses|

---

## Assets Necessários

- [ ] 🖼️ Print: Tela de listagem de alunos
- [ ] 🖼️ Print: Tela de registro de aula
- [ ] 🖼️ Print: Tela financeira
- [ ] 🖼️ Print: Tela de atividades
- [ ] 🖼️ Print: Portal do aluno (mobile)
- [ ] 🖼️ Print: Dashboard do professor
- [ ] 🖼️ Print: Tela admin — visão geral
- [ ] 🖼️ Figura: Estrutura de pastas formatada
