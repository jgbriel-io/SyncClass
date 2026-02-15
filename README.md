# 🎓 Edu Core Zen

Sistema de gestão de aulas e cobranças para professores e alunos.

**Versão**: 2.0.0 | **Status**: ✅ Produção | **Score**: 10/10

---

## 🚀 Quick Start

```bash
# 1. Clone o repositório
git clone [url-do-repo]
cd edu-core-zen

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Execute o schema no Supabase
# Abra supabase/migrations/00_SCHEMA_CONSOLIDADO.sql no SQL Editor e execute

# 5. Inicie o servidor
npm run dev
```

---

## 📚 Documentação

### Guias Principais
- **[GUIA_COMPLETO.md](docs/GUIA_COMPLETO.md)** - Guia técnico completo (deploy, arquitetura, desenvolvimento)
- **[TESTES.md](docs/TESTES.md)** - Guia de testes e fluxos completos
- **[HISTORICO.md](docs/HISTORICO.md)** - Changelog, status e auditorias

### Database
- **[00_SCHEMA_CONSOLIDADO.sql](supabase/migrations/00_SCHEMA_CONSOLIDADO.sql)** - Schema completo do banco
- **[99_DIAGNOSTICO.sql](supabase/migrations/99_DIAGNOSTICO.sql)** - Scripts de diagnóstico
- **[README.md](supabase/migrations/README.md)** - Documentação do schema

---

## 🏗️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS
- **State**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Database**: PostgreSQL com RLS, Triggers e RPCs

---

## ✨ Funcionalidades

### Para Administradores
- ✅ Gestão completa de alunos e professores
- ✅ Visualização de todas as aulas e cobranças
- ✅ Dashboard com métricas gerais
- ✅ Sistema de auditoria completo

### Para Professores
- ✅ Gestão de seus alunos
- ✅ Registro de aulas (individuais ou pacotes)
- ✅ Controle de cobranças
- ✅ Criação e correção de atividades
- ✅ Dashboard personalizado

### Para Alunos
- ✅ Visualização de suas aulas
- ✅ Acompanhamento de cobranças
- ✅ Chave PIX para pagamento
- ✅ Entrega de atividades
- ✅ Histórico completo

---

## 🎯 Destaques Técnicos

### Segurança
- 🔒 RLS (Row Level Security) em 100% das tabelas
- 🔒 50+ políticas de segurança por papel
- 🔒 Auditoria de todas as operações
- 🔒 Idempotência em operações críticas

### Performance
- ⚡ Views enriquecidas para queries otimizadas
- ⚡ Índices em todas as colunas de busca
- ⚡ Paginação em todas as listas
- ⚡ Cache inteligente com React Query

### Qualidade
- ✅ TypeScript 100%
- ✅ Componentes reutilizáveis
- ✅ Hooks customizados
- ✅ Validações no banco e no front

---

## 📦 Estrutura do Projeto

```
edu-core-zen/
├── docs/                    # Documentação
│   ├── GUIA_COMPLETO.md    # Guia técnico completo
│   ├── TESTES.md           # Guia de testes
│   └── HISTORICO.md        # Changelog e auditorias
├── src/
│   ├── components/         # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários
│   ├── pages/              # Páginas
│   └── integrations/       # Supabase client
└── supabase/
    └── migrations/         # Migrations SQL
        ├── 00_SCHEMA_CONSOLIDADO.sql
        ├── 99_DIAGNOSTICO.sql
        └── README.md
```

---

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Executa linter
npm run test         # Executa testes (em desenvolvimento)
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Suporte

- 📧 Email: [seu-email]
- 💬 Discord: [seu-discord]
- 🐛 Issues: [github-issues]

---

**Desenvolvido com ❤️ usando React + Supabase**
