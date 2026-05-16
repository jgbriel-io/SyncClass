---
capitulo: 6
titulo: Implementação
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---
> [!INFO] Resumo do Capítulo
> Detalhamento da stack tecnológica, estrutura do projeto, padrões de desenvolvimento adotados e a descrição das funcionalidades implementadas em cada módulo.

---

## 6.1 Stack Tecnológica

A stack **está sendo utilizada** priorizando:

- **Produtividade:** O uso do Supabase elimina o backend tradicional; o shadcn/ui provê a base do design system.
- **Tipagem:** TypeScript *end-to-end* com tipos gerados automaticamente do banco via `supabase gen types`.
- **Qualidade:** TanStack Query para gestão de cache e estado de servidor; Zod para validação rigorosa de dados.

## 6.2 Estrutura de Pastas

A organização do código **segue** o seguinte diretório:

```text
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

🖼️ **Figura:** Estrutura de pastas formatada

## 6.3 Padrões de Código

### 6.3.1 Separação de Responsabilidades

O fluxo de dados **está estruturado** em camadas:
```text
Components → Hooks → Supabase SDK → PostgreSQL
```

- **Components:** Atuam apenas na camada de UI, sem lógica de negócio direta.
- **Hooks:** Centralizam o uso do TanStack Query para busca de dados e mutations para escrita.
- **Supabase SDK:** Gerencia as chamadas diretas ao banco de dados, isoladas dos componentes.

### 6.3.2 Exemplo — Hook de Dados
Abaixo, um exemplo de como a lógica de busca de alunos **está implementada**:

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
Para consistência visual, o sistema **utiliza** tokens de design:

```ts
<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

## 6.4 Módulos Implementados

### 6.4.1 Módulo de Alunos
- CRUD completo com *soft delete* e restauração de registros.
- Filtros dinâmicos por status, professor e aniversariantes.
- Paginação *server-side* para lidar com grandes volumes de dados.
- Suporte a alunos estrangeiros (país e telefone internacional).

🖼️ **Print:** Tela de listagem de alunos

### 6.4.2 Módulo de Aulas
- Registro individual e em pacote de aulas.
- Controle de presença (presente/faltou/pendente).
- Avaliação pós-aula com nota, feedback e observações pedagógicas.
- Validação em tempo real de sobreposição de horários.

🖼️ **Print:** Tela de registro de aula / pacote de aulas

### 6.4.3 Módulo Financeiro
- Geração de cobranças individuais e automação para pacotes.
- Ciclo de status: pendente → pago / cancelado / abonado / extornado.
- Upload e fluxo de aprovação de comprovantes.
- Geração de QR Code PIX para facilitação do pagamento.
- Idempotência garantida via `idempotency_keys`.

🖼️ **Print:** Tela financeira com status de cobranças

### 6.4.4 Módulo de Atividades
- Criação de atividades com prazo, anexo e descrição.
- Fluxo de entrega pelo aluno com upload de arquivo.
- Interface de correção para o professor com nota e feedback.

🖼️ **Print:** Tela de atividades

### 6.4.5 Portal do Aluno e Dashboard
- **Portal:** Visão simplificada para o aluno com histórico e pagamentos.
- **Dashboard:** Métricas de receita, total de alunos e agenda do dia.

🖼️ **Print:** Dashboard do professor e Portal do aluno

## 6.5 Números do Projeto
Até o estágio atual, o projeto **apresenta** as seguintes métricas de implementação:

| **Métrica** | **Valor** |
| :--- | :--- |
| Total de arquivos | 391 |
| Linhas de código | ~46.400 |
| Componentes React | 126 |
| Hooks customizados | 23 |
| Migrations SQL | 23 |
| Commits realizados | ~218 |
| Tempo de desenvolvimento | ~3 meses |

---

## Assets Necessários
- [ ] 🖼️ **Print:** Telas de Alunos, Aulas, Financeiro e Atividades.
- [ ] 🖼️ **Print:** Dashboard do professor e Portal do aluno (Mobile).
- [ ] 🖼️ **Figura:** Estrutura de pastas formatada.