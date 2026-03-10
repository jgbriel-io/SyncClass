# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD do projeto.

## 📋 Workflows Disponíveis

### 1. CI - Continuous Integration (`ci.yml`)

**Quando roda:** Em todo `push` e `pull_request` para as branches `main` e `dev`.

**O que faz:**
- ✅ Instala dependências com `npm ci`
- 🔍 Valida código com ESLint (`npm run lint`)
- 📝 Verifica tipos TypeScript (`tsc --noEmit`)
- 🏗️ Faz build do projeto (`npm run build`)
- 📊 Mostra tamanho dos bundles gerados

**Por que é importante:**
Impede que código com erros de lint, tipos ou build quebrado seja mergeado no repositório.

### 2. Dependency Check (`dependency-check.yml`)

**Quando roda:** 
- Automaticamente toda segunda-feira às 9h UTC
- Manualmente via GitHub Actions UI

**O que faz:**
- 🔒 Verifica vulnerabilidades de segurança (`npm audit`)
- 📦 Lista pacotes desatualizados

**Por que é importante:**
Mantém o projeto seguro e atualizado, alertando sobre vulnerabilidades conhecidas.

## 🚀 Como Usar

### Verificar status dos workflows

1. Vá para a aba **Actions** no GitHub
2. Veja o status de cada workflow
3. Clique em um workflow para ver detalhes

### Rodar manualmente

Para o workflow de dependências:
1. Vá em **Actions** → **Dependency Check**
2. Clique em **Run workflow**

## 🛠️ Manutenção

### Adicionar novos checks

Edite o arquivo `ci.yml` e adicione novos steps após o build:

```yaml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

### Ajustar Node version

Atualmente usa Node 20.x (LTS). Para mudar, edite:

```yaml
strategy:
  matrix:
    node-version: [20.x]
```

## 📚 Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Setup Action](https://github.com/actions/setup-node)
- [Checkout Action](https://github.com/actions/checkout)
