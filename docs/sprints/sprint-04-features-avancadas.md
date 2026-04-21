# Sprint 4 — Features Avançadas
**Período:** 31 janeiro – 08 fevereiro 2026  
**Status:** ✅ Concluída

## Objetivo
Implementar features de gestão de usuários, dashboard avançado, histórico do aluno e fluxos de reset de senha.

## O que foi feito

- Dashboard com gráfico de crescimento (filtros: 1/3/6/12 meses, visão diária)
- Página de histórico do aluno (`StudentHistory`)
- Upload de foto de perfil
- Reset de senha pelo próprio usuário
- Hard delete e soft delete de professores com visual consistente
- Ícone de reativar conta, exclusão definitiva, dialogs padronizados
- Hard delete sincroniza exclusão entre abas alunos e usuários
- Edge function `admin-delete-user` tolerante a registro já removido
- Unificação de `admin-reset-password` e `teacher-reset-password` em `reset-password` única
- Professor pode resetar senha de aluno vinculado
- Fluxo de ativação/reativação de contas
- Logout automático ao mudar senha
- Search bar global
- Validação de email com whitelist de provedores reais + rate limit
- Cards de previsão de faturamento, financeiro e estatísticas de alunos
- Auditoria e histórico de pagamento para admin
- Cards nas abas usuários/professores para admin
- Unificação de Extrato e Financeiro com timeline
- Card de histórico de aulas

## Commits

| Hash | Data | Descrição |
|------|------|-----------|
| `6d09289` | 01/02 | feat(dashboard): gráfico de crescimento |
| `1530a06` | 03/02 | feat: student historic page |
| `3532a28` | 01/02 | feat: upload profile pic |
| `240258f` | 02/02 | feat: reset password |
| `68bb98a` | 06/02 | feat: hard delete e visual consistente |
| `71d9c14` | 06/02 | refactor: unifica reset-password |
| `75ff132` | 06/02 | feat: professor pode resetar senha de aluno |
| `4516b99` | 06/02 | feat: usuario resetar a propria senha |
| `19d22ac` | 05/02 | feat: search bar |
| `4ed7965` | 07/02 | feat: cards de previsão de faturamento |
| `2caef87` | 07/02 | feat: auditoria e histórico de pagamento |
| `74d823e` | 08/02 | feat: cards nas abas usuarios/professores |
| `0735220` | 08/02 | Unifica Extrato e Financeiro |
| `7db810b` | 08/02 | feat: card histórico de aulas |
