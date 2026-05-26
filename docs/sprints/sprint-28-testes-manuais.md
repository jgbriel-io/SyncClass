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

- [ ] Login com credenciais válidas (admin) → redireciona `/admin`
- [ ] Login com credenciais válidas (teacher) → redireciona `/teacher`
- [ ] Login com credenciais válidas (student) → redireciona `/student`
- [ ] Login com senha errada → mensagem de erro em PT-BR
- [ ] Login com email inexistente → mensagem de erro
- [ ] Acesso a `/admin` sem autenticação → redireciona `/login`
- [ ] Acesso a `/teacher` sem autenticação → redireciona `/login`
- [ ] Acesso a `/student` sem autenticação → redireciona `/login`

### `/esqueci-senha`

- [ ] Formulário renderiza
- [ ] Email válido → confirmação enviada (toast)
- [ ] Email inexistente → sem vazamento de informação (mesma mensagem)

### `/redefinir-senha`

- [ ] Página renderiza com token válido
- [ ] Nova senha salva → login funciona com nova senha
- [ ] Token inválido/expirado → erro tratado

---

## 2. Admin — `/admin`

### Dashboard (`/admin`)

- [ ] Métricas carregam (total alunos, professores, cobranças)
- [ ] Sem erro de console

### Students (`/admin/students`)

- [ ] Lista todos os alunos de todos os professores
- [ ] Busca por nome funciona
- [ ] Filtros (status, professor) funcionam
- [ ] Paginação funciona

### Teachers (`/admin/teachers`)

- [ ] Lista todos os professores
- [ ] Criar professor → aparece na lista
- [ ] Editar professor → dados atualizados
- [ ] Soft delete → professor some da lista ativa
- [ ] Restaurar professor arquivado → volta à lista
- [ ] Hard delete → remove permanentemente (confirmação obrigatória)

### Users (`/admin/users`)

- [ ] Lista todos os usuários do sistema
- [ ] Criar usuário via convite (email) → toast de sucesso
- [ ] Alterar role de usuário → funciona
- [ ] Deletar usuário → sessão invalidada (logout automático se logado)

### Financial (`/admin/financial`)

- [ ] Lista cobranças de todos os professores
- [ ] Filtro por status (pendente/pago/cancelado) funciona
- [ ] Filtro por período funciona
- [ ] Confirmar comprovante de pagamento → status muda para pago
- [ ] Rejeitar comprovante → status volta a pendente

### Classes (`/admin/classes`)

- [ ] Lista aulas de todos os professores
- [ ] Filtros por período e aluno funcionam

### Activities (`/admin/activities`)

- [ ] Lista atividades de todos os professores
- [ ] Filtros funcionam

### Overview (`/admin/overview`)

- [ ] Visão consolidada de todos os professores carrega
- [ ] Métricas por professor corretas

### Rate Limits (`/admin/rate-limits`)

- [ ] Dashboard de rate limiting carrega
- [ ] Contadores exibidos

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
- [ ] Editar aluno → dados atualizados
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

| Módulo                     | Itens   |
| -------------------------- | ------- |
| Auth / Público             | 11      |
| Admin                      | 30      |
| Professor                  | 28      |
| Aluno                      | 13      |
| Cross-cutting (original)   | 20      |
| Sessão e Auth (adicionais) | 2       |
| Integrações e Validações   | 6       |
| Rotas Alias e Edge Cases   | 3       |
| Volume de Dados            | 3       |
| **Total**                  | **116** |

---

## Critério de Conclusão

Sprint concluída quando todos os 116 itens testados, com bugs críticos (bloqueadores) resolvidos antes de marcar ✅.

**Bugs encontrados:** documentar abaixo com `[BUG-XXX]` + rota + descrição + severidade.

---

## Bugs Encontrados

_Nenhum registrado ainda._
