# Sprint 28 — Testes Manuais: Cobertura Completa

**Período:** 26/05/2026  
**Status:** 🔴 Pendente  
**Tipo:** QA Manual

## Contexto

Varredura manual de todas as 20 rotas da aplicação, cobrindo happy path, edge cases, isolamento de roles e fluxos críticos. Executar com `npm run dev` + usuário real no Supabase.

**Usuários necessários para teste:**

- 1 admin
- 2 professores (A e B — para testar isolamento)
- 2 alunos (vinculados a professores diferentes)

---

## 1. Auth / Rotas Públicas

### `/login`

- [x] Login com credenciais válidas (admin) → redireciona `/admin`
- [x] Login com credenciais válidas (teacher) → redireciona `/teacher`
- [x] Login com credenciais válidas (student) → redireciona `/student`
- [x] Login com senha errada → mensagem de erro em PT-BR
- [x] Login com email inexistente → mensagem de erro
- [x] Acesso a `/admin` sem autenticação → redireciona `/login`
- [x] Acesso a `/teacher` sem autenticação → redireciona `/login`
- [x] Acesso a `/student` sem autenticação → redireciona `/login`

### `/esqueci-senha`

- [x] Formulário renderiza
- [x] Email válido → confirmação enviada (toast)
- [x] Email inexistente → sem vazamento de informação (mesma mensagem)

### `/redefinir-senha`

- [ ] Página renderiza com token válido
- [ ] Nova senha salva → login funciona com nova senha
- [ ] Token inválido/expirado → erro tratado

---

## 2. Admin — `/admin`

### Dashboard (`/admin`)

- [x] Métricas carregam (total alunos, professores, cobranças)
- [x] Sem erro de console

### Students (`/admin/students`)

- [x] Lista todos os alunos de todos os professores
- [x] Busca por nome funciona
- [x] Filtros (status, professor) funcionam
- [x] Paginação funciona
- [x] Criar estudante → aparece na lista
- [x] Editar aluno → dados atualizados (students.name, profiles.full_name, auth.users sincronizados)
- [x] Hard delete → remove permanentemente (confirmação obrigatória)
- [x] Admin não vê botões de ação nas linhas da tabela (read-only)

### Teachers (`/admin/teachers`)

- [x] Lista todos os professores
- [x] Criar professor → aparece na lista
- [x] Editar professor → dados atualizados
- [x] Soft delete → professor some da lista ativa
- [x] Restaurar professor arquivado → volta à lista
- [x] Hard delete → remove permanentemente (confirmação obrigatória)
- [x] Redefinir Senha

### Users (`/admin/users`)

- [x] Lista todos os usuários do sistema
- [x] Criar usuário (admin/professor/aluno) → modal exibe email + senha gerada (sem envio de email)
- [x] Criar aluno com professor vinculado → aluno aparece na visão do professor logado
- [x] Coluna Vínculo exibe professor correto para alunos criados via aba Users
- [x] Editar aluno → nome propagado para students.name, profiles.full_name e auth.users
- [x] Editar professor → dados atualizados em teachers e profiles
- [x] Seletor de professor pré-preenchido ao reabrir formulário de edição de aluno
- [x] Hard delete (usuário com vínculo student/teacher) → anonimiza domain record + remove auth
- [x] Deletar usuário → sessão invalidada (logout automático se logado)

### Financial (`/admin/financial`)

- [x] Lista cobranças de todos os professores
- [x] Filtro por status (pendente/pago/cancelado) funciona
- [x] Filtro por período funciona
- [x] Admin não vê botões de ação (read-only — confirmar/rejeitar comprovante é exclusivo do professor)

### Classes (`/admin/classes`)

- [x] Lista aulas de todos os professores
- [x] Filtros por período e aluno funcionam
- [x] Filtro por status (em_aberto, agendada, avaliação_pendente, concluída) funciona
- [x] Ordenação por data (mais recente / mais antiga) funciona
- [x] Admin não vê botões de ação nas linhas (read-only)

### Activities (`/admin/activities`)

- [x] Lista atividades de todos os professores
- [x] Filtros de status funcionam
- [x] Admin não vê botões de ação nas linhas (read-only)

### Overview (`/admin/overview`)

- [x] Visão consolidada de todos os professores carrega
- [x] Métricas por professor corretas
- [x] Filtro de status removido (N/A no contexto de overview agregado)

---

## 3. Professor — `/teacher`

### Home (`/teacher`)

- [ ] Dashboard com métricas do professor logado
- [ ] Lista de aniversariantes do mês
- [ ] Próximas aulas agendadas

### Students (`/teacher/students`)

- [ ] Lista apenas alunos do professor logado (não vê alunos de outros professores)
- [ ] Busca e filtros funcionam
- [ ] Criar aluno (campos obrigatórios + validação de CPF/telefone) → aparece na lista
- [ ] Criar aluno estrangeiro (sem CPF) → funciona
- [x] Editar aluno → dados atualizados (students.name, profiles.full_name, auth.users propagados em todas as visões)
- [ ] Upload foto de perfil → foto exibida
- [ ] Soft delete → aluno some da lista ativa
- [ ] Restaurar aluno arquivado
- [ ] Sheet de detalhes do aluno abre com histórico completo

### Financial (`/teacher/financial`)

- [ ] Lista cobranças apenas dos alunos do professor
- [ ] Criar cobrança individual → aparece na lista
- [ ] Criar cobrança de pacote (vincula N aulas) → aparece corretamente
- [ ] Editar cobrança pendente
- [ ] Cancelar cobrança
- [ ] Abonar cobrança
- [ ] Timeline de transações exibe histórico
- [ ] Ver QR Code PIX de cobrança

### Classes (`/teacher/classes`)

- [ ] Lista aulas do professor
- [ ] Criar aula simples (data, hora, duração, aluno, presença) → aparece
- [ ] Criar pacote de aulas (cria múltiplas aulas + 1 cobrança vinculada)
- [ ] Editar aula (data, nota, feedback, duração)
- [ ] Registrar falta (presença = false)
- [ ] Deletar aula
- [ ] Filtro por aluno e período funcionam

### Activities (`/teacher/activities`)

- [ ] Lista atividades do professor
- [ ] Criar atividade (título, prazo, aluno) → aparece
- [ ] Editar atividade
- [ ] Deletar atividade
- [ ] Ver submissão do aluno (arquivo)
- [ ] Corrigir atividade (nota + feedback + arquivo de correção) → aluno vê correção

### Overview (`/teacher/overview`)

- [ ] Resumo do próprio desempenho/métricas carrega

---

## 4. Aluno — `/student`

### Home (`/student`)

- [ ] Tela inicial carrega com informações do aluno
- [ ] Responsivo em mobile (375px)

### History (`/student/history`)

- [ ] Histórico de aulas exibe corretamente (data, duração, nota, feedback)
- [ ] Paginação funciona

### Financial (`/student/financial`)

- [ ] Lista cobranças do aluno logado (não vê cobranças de outros alunos)
- [ ] Status de cada cobrança exibido corretamente
- [ ] Upload de comprovante de pagamento → status muda para "aguardando confirmação"
- [ ] Ver QR Code PIX de cobrança pendente

### Checkout (`/student/financial/checkout/:recordId`)

- [ ] Carrega cobrança específica pelo ID
- [ ] Upload de comprovante funciona
- [ ] ID de outro aluno → acesso bloqueado (RLS)

### Activities (`/student/activities`)

- [ ] Lista atividades atribuídas ao aluno
- [ ] Submeter atividade (upload de arquivo) → status muda
- [ ] Ver nota e correção após professor avaliar

---

## 5. Fluxos Críticos Cross-Cutting

### Isolamento de Dados (RLS)

- [ ] Professor A não consegue ver alunos do Professor B (testar via URL direta)
- [ ] Aluno A não consegue ver financeiro do Aluno B (`/student/financial/checkout/:idDoAlunoB`)
- [ ] Teacher não acessa rotas `/admin/*` → redireciona ou 403
- [ ] Teacher não acessa rotas `/student/*` → redireciona ou 403
- [ ] Student não acessa rotas `/admin/*` → redireciona ou 403
- [ ] Student não acessa rotas `/teacher/*` → redireciona ou 403
- [ ] Admin acessa `/teacher/*` e `/student/*` — verificar se bloqueado ou permitido

### Sessão e Auth

- [ ] Logout → sessão encerrada, redirect para `/login`
- [ ] Trocar senha in-app (ChangePasswordDialog, dentro da sessão) → nova senha funciona no próximo login
- [ ] Trocar senha com senha atual errada → erro exibido
- [ ] Sessão expirada → redirect automático para `/login`

### LGPD

- [ ] Admin consegue anonimizar aluno (dados pessoais substituídos)
- [ ] Aluno consegue solicitar exportação dos próprios dados
- [ ] Registro anonimizado não exibe dados originais

### Upload de Arquivos

- [ ] Foto de perfil (professor e aluno) — upload e exibição
- [ ] Comprovante de pagamento — upload pelo aluno
- [ ] Arquivo de atividade — upload pelo aluno
- [ ] Arquivo de correção — upload pelo professor

### Estados de UI

- [ ] Empty states exibidos em listas vazias (sem alunos, sem aulas, etc.)
- [ ] Skeletons de loading visíveis durante carregamento
- [ ] Toasts de sucesso e erro aparecem após operações
- [ ] Dialogs de confirmação para ações destrutivas (delete)

### Responsividade

- [ ] `/student/*` — mobile 375px (portal do aluno é mobile-first)
- [ ] `/teacher/*` — tablet 768px
- [ ] Tabelas com scroll horizontal em mobile

### Integrações e Validações

- [ ] **CEP API** — criar aluno, digitar CEP válido → endereço auto-preenchido
- [ ] **CEP inválido** → campo sem preenchimento automático, sem crash
- [ ] **Email whitelist** — convidar usuário com domínio bloqueado (ex: `@tempmail.com`) → erro exibido
- [ ] **PIX key masking** — chave PIX do professor exibida mascarada (não em texto claro)
- [ ] **Idempotência** — tentar criar cobrança duplicada → sistema não duplica
- [ ] **Real-time** — professor cria aula em aba A → lista em aba B atualiza sem refresh

### Rotas Alias e Edge Cases

- [ ] `/students` (alias de StudentShell) → carrega corretamente
- [ ] `/teachers` (alias de TeacherShell) → carrega corretamente
- [ ] Rota inexistente (ex: `/xyzabc`) → página 404 exibida

### Volume de Dados

- [ ] Lista com 20+ alunos → paginação funciona
- [ ] Lista com 50+ aulas → paginação funciona, sem degradação visível
- [ ] Financeiro com 30+ cobranças → filtros e paginação funcionam

---

## Resumo de Itens

| Módulo                     | Itens   | Status             |
| -------------------------- | ------- | ------------------ |
| Auth / Público             | 11      | 8 ✅ / 3 pendentes |
| Admin                      | 41      | 41 ✅ concluído    |
| Professor                  | 28      | pendente           |
| Aluno                      | 13      | pendente           |
| Cross-cutting (original)   | 20      | pendente           |
| Sessão e Auth (adicionais) | 2       | pendente           |
| Integrações e Validações   | 6       | pendente           |
| Rotas Alias e Edge Cases   | 3       | pendente           |
| Volume de Dados            | 3       | pendente           |
| **Total**                  | **127** |                    |

---

## Critério de Conclusão

Sprint concluída quando todos os 116 itens testados, com bugs críticos (bloqueadores) resolvidos antes de marcar ✅.

**Bugs encontrados:** documentar abaixo com `[BUG-XXX]` + rota + descrição + severidade.

---

## Validação de Toasts (Sprint 29 — refactor centralização)

Após as mudanças de sprint 29 (strings de toast movidas para `src/content/`), validar que cada ação abaixo exibe o toast correto. Marcar ✅ quando confirmado na UI.

### Alunos

| Ação                     | Toast esperado                                | Status |
| ------------------------ | --------------------------------------------- | ------ |
| Criar aluno              | "Aluno cadastrado com sucesso!"               | ⏳     |
| Editar aluno             | "Aluno atualizado com sucesso!"               | ⏳     |
| Arquivar aluno           | "Aluno arquivado e dados anonimizados (LGPD)" | ⏳     |
| Hard delete aluno        | "Aluno excluído definitivamente."             | ⏳     |
| Restaurar aluno          | "Aluno restaurado com sucesso!"               | ⏳     |
| Alterar dia de pagamento | "Dia de pagamento atualizado com sucesso!"    | ⏳     |

### Professores

| Ação                  | Toast esperado                        | Status |
| --------------------- | ------------------------------------- | ------ |
| Criar professor       | "Professor cadastrado com sucesso!"   | ⏳     |
| Editar professor      | "Professor atualizado com sucesso!"   | ⏳     |
| Arquivar professor    | "Professor arquivado com sucesso!"    | ⏳     |
| Editar chave PIX      | "Chave PIX atualizada com sucesso!"   | ⏳     |
| Hard delete professor | "Professor excluído definitivamente." | ⏳     |

### Aulas

| Ação                        | Toast esperado                             | Status |
| --------------------------- | ------------------------------------------ | ------ |
| Registrar aula sem cobrança | "Aula registrada com sucesso!"             | ⏳     |
| Registrar aula com cobrança | "Aula e cobrança registradas com sucesso!" | ⏳     |
| Editar aula                 | "Aula atualizada com sucesso!"             | ⏳     |
| Deletar aula                | "Registro removido com sucesso!"           | ⏳     |

### Financeiro

| Ação                | Toast esperado                      | Status |
| ------------------- | ----------------------------------- | ------ |
| Criar cobrança      | "Cobrança criada com sucesso!"      | ⏳     |
| Confirmar pagamento | "Pagamento confirmado com sucesso!" | ⏳     |
| Desfazer pagamento  | "Pagamento desfeito com sucesso!"   | ⏳     |
| Editar cobrança     | "Cobrança atualizada com sucesso!"  | ⏳     |
| Excluir cobrança    | "Cobrança excluída com sucesso!"    | ⏳     |

### Atividades

| Ação              | Toast esperado                      | Status |
| ----------------- | ----------------------------------- | ------ |
| Enviar atividade  | "Atividade enviada com sucesso!"    | ⏳     |
| Editar atividade  | "Atividade atualizada com sucesso!" | ⏳     |
| Enviar correção   | "Correção enviada com sucesso!"     | ⏳     |
| Excluir atividade | "Atividade excluída com sucesso!"   | ⏳     |

### Perfil / Usuários

| Ação                          | Toast esperado                                                             | Status |
| ----------------------------- | -------------------------------------------------------------------------- | ------ |
| Alterar foto de perfil        | "Foto de perfil atualizada."                                               | ⏳     |
| Alterar nome (settings)       | "Nome atualizado com sucesso!"                                             | ⏳     |
| Alterar email (settings)      | "Email atualizado com sucesso!"                                            | ⏳     |
| Admin alterar role de usuário | "Usuário atualizado com sucesso!"                                          | ⏳     |
| Admin convidar professor      | "Professor e conta de acesso criados com sucesso!"                         | ⏳     |
| Admin reset senha de usuário  | "Senha redefinida com sucesso. O usuário precisará fazer login novamente." | ⏳     |
| Vincular usuário a aluno      | "Usuário vinculado ao aluno com sucesso."                                  | ⏳     |
| Desvincular usuário           | "Vínculo entre usuário e aluno removido."                                  | ⏳     |

### Comprovante de Pagamento

| Ação                          | Toast esperado                                             | Status |
| ----------------------------- | ---------------------------------------------------------- | ------ |
| Aluno envia comprovante       | "Comprovante enviado! Aguarde a confirmação do professor." | ⏳     |
| Professor aprova comprovante  | "Pagamento confirmado com sucesso!"                        | ⏳     |
| Professor rejeita comprovante | "Comprovante rejeitado."                                   | ⏳     |

---

## Bugs Encontrados

_Nenhum registrado ainda._
