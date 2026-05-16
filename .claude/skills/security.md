# Skill: Security

Steering de segurança — operações destrutivas, sistema, credenciais.

## Sempre Perguntar Antes de Executar

### Operações Destrutivas
- Deletar arquivos/pastas (`rm`, `del`, `Remove-Item`, `rmdir`)
- Sobrescrever arquivos existentes
- Operações em massa (bulk delete, bulk rename)
- Modificar arquivos de configuração do sistema

### Operações de Sistema
- Instalar pacotes globalmente (`npm -g`, `pip install --global`, `scoop`, `winget`, `choco`)
- Modificar variáveis de ambiente do sistema (`PATH`, `PATHEXT`, etc.)
- Alterar configurações do Windows (registro, Group Policy, serviços)
- Fazer download/upload de arquivos da internet
- Abrir portas ou modificar firewall

## Nunca Executar Sem Confirmação Explícita

### Crítico
- `rm -rf` ou equivalente recursivo
- `dd`, `mkfs`, `shred`, `format` (ferramentas de destruição de dados)
- `chmod 777` (permissões inseguras)
- Qualquer comando que afete `/etc/`, arquivos de credenciais (`.env`, `secrets.json`), ou chaves privadas
- Modificar `HKEY_LOCAL_MACHINE` no registro Windows
- Desabilitar/habilitar serviços do Windows
- Comandos com `--global` ou `--system` que afetem fora do projeto

## Regras Gerais

### Preferência
- **Padrão:** Operações não-destrutivas.
- **Local > Global:** Instalações locais ao projeto (npm install local).
- **Explicit > Implicit:** Confirmar destino antes de mover/renomear.

### Credenciais e Secrets
- **NUNCA expor:** Valores de secrets, tokens, senhas em output.
- **Referência:** Usar nome da variável só: `$env:DATABASE_URL` em vez de `"postgres://user:pass@..."`
- **Arquivo .env:** Não fazer commit de `.env.local` — alertar usuário.

### Dúvida
- Em caso de dúvida sobre impacto, **perguntar antes** de agir.
- Reversibilidade é o critério: "Posso desfazer isso em 30s?"

## Padrão de Confirmação

**Antes de deletar/modificar/instalar:**

> ⚠️ **Aviso:** Este comando [descrição].
> 
> ```bash
> [comando exato]
> ```
> 
> Confirma? (sim/não)

## Exceções (Não Perguntar)

- `git` commits/pushes quando explicitamente autorizado.
- `ls`, `find`, `cat`, `grep` — read-only, seguro.
- `npm run` (scripts definidos em package.json).
- Edições em arquivos do projeto com `Edit` tool.
- Criar/modificar arquivos em `.claude/` ou `docs/tcc/`.

## Checklist para Comando Potencialmente Perigoso

- [ ] É destrutivo (delete/overwrite/reset)?
- [ ] Afeta sistema (env, registry, services, global install)?
- [ ] Usa credenciais ou secrets?
- [ ] Modifica fora do diretório de trabalho?
- [ ] Afeta compartilhado (git push, merge)?

Se **SIM** a qualquer item: **PERGUNTAR ANTES**.
