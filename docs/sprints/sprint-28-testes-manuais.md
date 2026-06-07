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
- [x] Hard delete aluno sem aulas agendadas → modal exibe checkbox + botão bloqueado até marcar
- [x] Hard delete aluno COM aulas agendadas → mesmo modal com checkbox, force delete ao confirmar
- [x] Admin não vê botões de ação nas linhas da tabela (read-only)

### Teachers (`/admin/teachers`)

- [x] Lista todos os professores
- [x] Criar professor → aparece na lista
- [x] Editar professor → dados atualizados
- [x] Soft delete → professor some da lista ativa
- [x] Restaurar professor arquivado → volta à lista
- [x] Hard delete → remove permanentemente (confirmação obrigatória)
- [x] Hard delete professor sem aulas agendadas → modal exibe checkbox + botão bloqueado até marcar
- [x] Hard delete professor COM aulas agendadas → force delete ao confirmar checkbox
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
- [x] Hard delete usuário admin (sem vínculo) → modal com checkbox, profiles.full_name/email/avatar_url anonimizados
- [x] Deletar usuário → sessão invalidada (logout automático se logado)

### Financial (`/admin/financial`)

- [x] Lista cobranças de todos os professores
- [x] Filtro por status (pendente/pago/atrasado/validando/abonado/extornado/cancelado) funciona
- [x] Filtro por período funciona
- [x] Admin não vê botões de ação (read-only — reembolso e edição são exclusivos do professor)

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

- [x] Tabela de todos os alunos da plataforma carrega (não agrupada por professor — visão global)
- [x] Colunas: Nome, Professor, Status, Total Aulas, Aulas Mês, Valor Mês, Saldo
- [x] Métricas por aluno corretas (aulas e valores batem com o que está no financeiro/aulas)
- [x] Busca e filtros de status funcionam

---

## 3. Professor — `/teacher`

### Home (`/teacher`)

- [x] Dashboard com métricas do professor logado
- [x] Cards de estatísticas carregam (total alunos, aulas do mês, receita, pendências)
- [x] Cards financeiros carregam (total pago, pendente, atrasado)
- [x] Card de previsão de faturamento mensal exibe valor correto
- [x] Lista de aniversariantes do mês exibe alunos com aniversário no mês atual
- [x] Lista de próximos vencimentos exibe cobranças com vencimento próximo
- [x] Seção "Aulas de Hoje" exibe aulas agendadas para o dia atual
- [x] Contador de avaliações pendentes exibe aulas passadas sem attendance preenchido
- [x] Gráfico de crescimento de alunos renderiza com dados
- [x] Filtro do gráfico (3 / 6 / 12 meses) muda os dados exibidos
- [x] Sem erro de console no carregamento
- [x] Seletor de período (Mês / Semestre / Ano) exibido no header do dashboard
- [x] Alterar para "Semestre" → todos os cards atualizam (previsão, recebido, pendente, novos alunos, aulas)
- [x] Alterar para "Ano" → cards atualizam com escopo anual (jan–dez)
- [x] Voltar para "Mês" → valores voltam ao escopo mensal
- [x] Label "Novos este Mês/Semestre/Ano" muda conforme período selecionado
- [x] Label "Aulas este Mês/Semestre/Ano" muda conforme período selecionado
- [x] Card "Previsão" muda label (Mensal/Semestral/Anual) conforme período

### Students (`/teacher/students`)

- [x] Lista apenas alunos do professor logado (não vê alunos de outros professores)
- [x] Busca e filtros funcionam
- [x] Criar aluno brasileiro (campos obrigatórios + validação de telefone) → aparece na lista
- [x] Criar aluno estrangeiro (telefone internacional) → funciona
- [x] Editar aluno → dados atualizados (students.name, profiles.full_name, auth.users propagados em todas as visões)
- [x] Soft delete → aluno some da lista ativa
- [x] Restaurar aluno arquivado
- [x] Sheet de detalhes do aluno abre com histórico completo

### Classes (`/teacher/classes`)

- [x] Lista aulas do professor
- [x] Criar aula simples (data, hora, duração, aluno, presença) → aparece
- [x] Criar pacote de aulas (cria múltiplas aulas + 1 cobrança vinculada)
- [x] Editar aula (data, nota, feedback, duração)
- [x] Registrar falta (presença = false)
- [x] Registrar presença (presença = true)
- [x] Deletar aula
- [x] Filtro por aluno e período funcionam

### Financial (`/teacher/financial`)

- [x] Lista cobranças apenas dos alunos do professor
- [x] Criar cobrança individual → aparece na lista
- [x] Criar cobrança de pacote (vincula N aulas) → aparece corretamente
- [x] Editar cobrança pendente
- [ ] Cancelar cobrança
- [ ] Abonar cobrança
- [x] Timeline de transações exibe histórico
- [x] Cobrança `pago` com `payment_provider='abacate_pay'` → botão "Reembolso" visível
- [ ] Botão "Reembolso" (AbacatePay) → dialog exibe campo motivo + botão "Reembolsar via PIX"
- [ ] Confirmar reembolso AbacatePay → toast "Reembolso PIX processado com sucesso!", status → `extornado`
- [x] Cobrança `pago` sem `payment_provider` (manual/legado) → dialog exibe instrução manual + botão "Confirmar reembolso"
- [x] Confirmar reembolso manual → toast "Reembolso registrado com sucesso!", status → `extornado`
- [ ] Cobrança com aula vinculada (`attendance != null`) → aviso destrutivo extra exibido no dialog de reembolso

### Settings — Pagamentos (`/settings` ou `/teacher/settings`)

- [x] Aba "Pagamentos" exibe badge "Não configurado" sem API key salva
- [x] Campo API key não pré-preenche com ciphertext ao clicar "Configurar" (deve iniciar vazio)
- [x] Salvar API key válida → badge muda para "Configurado", webhook URL exibida
- [x] Webhook URL copiada com botão → toast de confirmação
- [x] Clicar "Editar" novamente → campo começa vazio (não mostra ciphertext)
- [x] Remover integração → badge volta para "Não configurado", webhook URL some
- [x] Professor sem API key → aluno vê mensagem amigável no checkout (não crash)

### Activities (`/teacher/activities`)

- [x] Lista atividades do professor
- [x] Criar atividade (título, prazo, aluno) → aparece
- [x] Editar atividade
- [x] Deletar atividade
- [x] Ver submissão do aluno (arquivo)
- [x] Corrigir atividade (nota + feedback + arquivo de correção) → aluno vê correção

### Overview (`/teacher/overview`)

- [x] Tabela dos próprios alunos com métricas carrega (Visão Geral dos Alunos)
- [x] Colunas: Nome, Status, Total Aulas, Aulas Mês, Valor Mês, Saldo
- [x] Valores batem com o que está em `/teacher/financial` e `/teacher/classes`
- [x] Busca e filtros de status funcionam

---

## 4. Aluno — `/student`

### Home (`/student`)

- [x] Tela inicial carrega com informações do aluno
- [ ] Responsivo em mobile (375px)

### History (`/student/history`)

- [ ] Histórico de aulas exibe corretamente (data, duração, nota, feedback)
- [ ] Paginação funciona

### Financial (`/student/financial`)

- [x] Lista cobranças do aluno logado (não vê cobranças de outros alunos)
- [ ] Status de cada cobrança exibido corretamente (pendente / pago / atrasado / abonado / extornado / cancelado)
- [ ] Cobrança `pendente` com `payment_provider='abacate_pay'` → botão "Pagar via PIX" leva para `/checkout/:id`

### Checkout (`/student/financial/checkout/:recordId`)

- [ ] Carrega cobrança específica pelo ID
- [ ] Cobrança AbacatePay: formulário de CPF exibido
- [ ] Cobrança AbacatePay: informar CPF + clicar "Gerar QR Code" → QR Code PIX renderiza
- [ ] Cobrança AbacatePay: segundo acesso com QR ainda válido → mesmo QR retornado (cache)
- [ ] Cobrança AbacatePay: após pagamento real → tela "Pagamento confirmado!" exibida automaticamente (realtime)
- [ ] Cobrança AbacatePay: QR expirado → formulário de CPF exibido novamente
- [ ] Cobrança manual/legada (`payment_provider != 'abacate_pay'`) → mensagem informativa exibida, sem formulário CPF
- [ ] Professor sem API key configurada → mensagem de erro amigável no checkout
- [ ] ID de outro aluno → acesso bloqueado (RLS)

### Activities (`/student/activities`)

- [x] Lista atividades atribuídas ao aluno
- [x] Submeter atividade (upload de arquivo) → status muda
- [x] Ver nota e correção após professor avaliar

---

## 5. Fluxos Críticos Cross-Cutting

### Isolamento de Dados (RLS)

- [x] Professor A não consegue ver alunos do Professor B (testar via URL direta)
- [x] Aluno A não consegue ver financeiro do Aluno B (`/student/financial/checkout/:idDoAlunoB`)
- [x] Teacher não acessa rotas `/admin/*` → redireciona ou 403
- [x] Teacher não acessa rotas `/student/*` → redireciona ou 403
- [x] Student não acessa rotas `/admin/*` → redireciona ou 403
- [x] Student não acessa rotas `/teacher/*` → redireciona ou 403
- [x] Admin acessa `/teacher/*` e `/student/*` — verificar se bloqueado ou permitido

### Sessão e Auth

- [ ] Logout → sessão encerrada, redirect para `/login`
- [ ] Trocar senha in-app (ChangePasswordDialog, dentro da sessão) → nova senha funciona no próximo login
- [ ] Trocar senha com senha atual errada → erro exibido
- [x] Sessão expirada → redirect automático para `/login`

### LGPD

- [ ] Admin consegue anonimizar aluno (dados pessoais substituídos)
- [ ] Aluno consegue solicitar exportação dos próprios dados
- [ ] Registro anonimizado não exibe dados originais

### Upload de Arquivos

- [ ] Foto de perfil — upload pelo próprio usuário via Settings → Perfil (professor em `/teacher`, aluno em `/student`; não é feito pelo professor na tela de gestão de alunos)
- [x] Arquivo de atividade — upload pelo aluno
- [x] Arquivo de correção — upload pelo professor

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

## 6. Validação de Toasts (Sprint 29 — refactor centralização)

Após as mudanças de sprint 29 (strings de toast movidas para `src/content/`), validar que cada ação exibe o toast correto na UI.

### Alunos

- [ ] Criar aluno → "Aluno cadastrado com sucesso!"
- [ ] Editar aluno → "Aluno atualizado com sucesso!"
- [ ] Arquivar aluno → "Aluno arquivado e dados anonimizados (LGPD)"
- [ ] Hard delete aluno → "Aluno excluído definitivamente."
- [ ] Restaurar aluno → "Aluno restaurado com sucesso!"
- [ ] Alterar dia de pagamento → "Dia de pagamento atualizado com sucesso!"

### Professores

- [ ] Criar professor → "Professor cadastrado com sucesso!"
- [ ] Editar professor → "Professor atualizado com sucesso!"
- [ ] Arquivar professor → "Professor arquivado com sucesso!"
- [ ] Editar chave PIX → "Chave PIX atualizada com sucesso!"
- [ ] Hard delete professor → "Professor excluído definitivamente."

### Aulas

- [ ] Registrar aula sem cobrança → "Aula registrada com sucesso!"
- [ ] Registrar aula com cobrança → "Aula e cobrança registradas com sucesso!"
- [ ] Editar aula → "Aula atualizada com sucesso!"
- [ ] Deletar aula → "Registro removido com sucesso!"

### Financeiro

- [ ] Criar cobrança → "Cobrança criada com sucesso!"
- [ ] Editar cobrança → "Cobrança atualizada com sucesso!"
- [ ] Excluir cobrança → "Cobrança excluída com sucesso!"
- [ ] Reembolso via AbacatePay → "Reembolso PIX processado com sucesso!"
- [ ] Reembolso manual → "Reembolso registrado com sucesso!"

### Atividades

- [x] Enviar atividade → "Atividade enviada com sucesso!"
- [x] Editar atividade → "Atividade atualizada com sucesso!"
- [x] Enviar correção → "Correção enviada com sucesso!"
- [x] Excluir atividade → "Atividade excluída com sucesso!"

### Perfil / Usuários

- [ ] Alterar foto de perfil → "Foto de perfil atualizada."
- [ ] Alterar nome (settings) → "Nome atualizado com sucesso!"
- [ ] Alterar email (settings) → "Email atualizado com sucesso!"
- [ ] Admin alterar role de usuário → "Usuário atualizado com sucesso!"
- [ ] Admin convidar professor → "Professor e conta de acesso criados com sucesso!"
- [ ] Admin reset senha de usuário → "Senha redefinida com sucesso. O usuário precisará fazer login novamente."
- [ ] Vincular usuário a aluno → "Usuário vinculado ao aluno com sucesso."
- [ ] Desvincular usuário → "Vínculo entre usuário e aluno removido."

### Pagamentos AbacatePay (Settings)

- [ ] Salvar API key → "Configuração salva com sucesso!"
- [ ] Copiar webhook URL → toast de confirmação de cópia

---

## Resumo de Itens

| Módulo                                  | Itens   | Status              |
| --------------------------------------- | ------- | ------------------- |
| Auth / Público                          | 11      | 8 ✅ / 3 pendentes  |
| Admin (incl. hard delete checkbox)      | 44      | 41 ✅ / 3 pendentes |
| Professor — Financial + Settings        | 37      | pendente            |
| Professor — Classes / Activities / Home | 22      | pendente            |
| Aluno — Financial + Checkout AbacatePay | 12      | pendente            |
| Aluno — Activities / History / Home     | 5       | pendente            |
| Cross-cutting (RLS, Sessão, LGPD)       | 15      | pendente            |
| Integrações, Edge Cases, Volume         | 12      | pendente            |
| Validação de Toasts (Sprint 29 + 30)    | 29      | pendente            |
| **Total**                               | **187** |                     |

---

## Critério de Conclusão

Sprint concluída quando todos os 187 itens testados, com bugs críticos (bloqueadores) resolvidos antes de marcar ✅.

Inclui 29 itens de validação de toasts. Itens de upload de comprovante e confirmação manual de pagamento removidos (fluxo substituído por AbacatePay na Sprint 30). Itens de checkout AbacatePay e reembolso adicionados.

**Bugs encontrados:** documentar abaixo com `[BUG-XXX]` + rota + descrição + severidade.

---

## Bugs Encontrados

_Nenhum registrado ainda._
