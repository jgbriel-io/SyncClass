# Edu Core Zen - Sistema de Gestão Educacional

![CI Status](https://github.com/YOUR_USERNAME/edu-core-zen/workflows/CI%20-%20Continuous%20Integration/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node](https://img.shields.io/badge/Node-20.x-green)

Sistema completo de gestão para escolas e cursos, com painéis para administradores, professores e alunos.

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Verificar qualidade do código
npm run check

# Build para produção
npm run build
```

## ✨ Features

- 👨‍💼 **Painel Administrativo** - Gestão completa de alunos, professores e finanças
- 👨‍🏫 **Painel do Professor** - Registro de aulas, notas e frequência
- 👨‍🎓 **Painel do Aluno** - Acompanhamento de aulas e situação financeira
- 📊 **Relatórios e Dashboards** - Visualização de métricas importantes
- 🔐 **Autenticação e Permissões** - Sistema completo com RLS (Supabase)
- 📱 **Responsivo** - Interface adaptável para todos os dispositivos

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **UI:** shadcn/ui + Tailwind CSS + Radix UI
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **State:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React

## 📋 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificar erros de código
npm run lint:fix     # Corrigir erros automaticamente
npm run type-check   # Verificar tipos TypeScript
npm run check        # Lint + Type check
npm run ci           # Simular CI localmente
npm test             # Rodar testes
```

## 🔍 Qualidade de Código

Este projeto usa **CI (Continuous Integration)** para garantir qualidade:

- ✅ ESLint - Padrões de código
- ✅ TypeScript - Verificação de tipos
- ✅ Build check - Garantia de build funcional
- ✅ 0 erros no código (160 erros corrigidos!)

**Antes de fazer push:**

```bash
npm run check
```

[📖 Leia o guia completo de CI](.github/CI_GUIDE.md)

## 📦 Build Otimizado

Bundle otimizado com code splitting:
- **Bundle inicial:** ~206 KB (gzipped)
- **Redução de 84%** no bundle inicial (1.3MB → 206KB)
- Lazy loading de todas as páginas
- Chunks separados para vendors

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
