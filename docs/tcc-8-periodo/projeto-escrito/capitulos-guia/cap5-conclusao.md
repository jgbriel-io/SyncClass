# 5 CONCLUSÃO

Este capítulo retoma o problema e o objetivo geral do trabalho, sintetiza as conclusões sobre as três hipóteses cuja análise detalhada foi apresentada no Capítulo 4, declara as limitações identificadas durante o desenvolvimento, propõe trabalhos futuros para a evolução da plataforma e encerra com as considerações finais.

## 5.1 Síntese do Trabalho

O trabalho partiu do problema da sobrecarga administrativa enfrentada pelo professor autônomo de inglês, que acumula a atividade pedagógica com a gestão de alunos, agendamento de aulas, controle de cobranças e acompanhamento de atividades, em geral apoiado por ferramentas dispersas e não integradas. O objetivo geral foi investigar a viabilidade de desenvolver e entregar um SaaS funcional para a gestão desse profissional, por um único desenvolvedor com suporte de assistente de IA generativa, em prazo acadêmico.

A entrega corresponde ao SyncClass, uma plataforma SaaS web que cobre os módulos de alunos, aulas, financeiro e atividades, com suporte a três perfis de usuário (administrador, professor e aluno). O sistema não se restringiu a um artefato funcional em ambiente controlado: encontra-se em uso ativo por um professor autônomo de inglês e seus alunos, o que caracteriza validação em ambiente real. Os requisitos foram coletados junto a um usuário real, o professor que contratou o desenvolvimento, o que ancora o produto em uma necessidade concreta de mercado, e não em uma hipótese de problema construída a posteriori.

## 5.2 Conclusões sobre as Hipóteses

A análise detalhada das três hipóteses, com a apresentação das evidências e da discussão metodológica, foi conduzida no Capítulo 4. Esta seção apresenta apenas a síntese das conclusões.

A hipótese H1, relativa à viabilidade de desenvolver um SaaS funcional por um único desenvolvedor com suporte de IA generativa em prazo acadêmico, foi confirmada: o sistema foi desenvolvido em 4,5 meses (janeiro a junho de 2026), registrou 152 commits na branch principal e encontra-se em operação real.

A hipótese H2, relativa à redução de pelo menos 60% do esforço de desenvolvimento backend pela adoção do Supabase como BaaS, foi confirmada com ressalva metodológica: a estimativa é qualitativa, fundamentada na enumeração das superfícies de backend eliminadas (autenticação, autorização por RLS, API de dados, storage, realtime e migrations versionadas) e na literatura de computação em nuvem, sem medição formal por ausência de grupo de controle.

A hipótese H3, relativa à aceleração de pelo menos três vezes no tempo de execução de tarefas de scaffolding, geração de migrations SQL e auditoria de segurança pelo uso de IA generativa, foi confirmada com limitações: as evidências baseiam-se em estimativas retrospectivas elaboradas pelo próprio desenvolvedor, sujeitas a viés de confirmação, conforme declarado no protocolo de medição descrito na seção 3.3.

## 5.3 Limitações do Trabalho

As seguintes limitações foram identificadas e devem moldar a interpretação dos resultados.

As estimativas de ganho associadas às hipóteses H2 e H3 são retrospectivas e foram produzidas sem grupo de controle. A comparação com uma stack tradicional equivalente e a comparação entre execução com e sem assistência de IA refletem a avaliação do próprio executor, e não medições experimentais controladas.

Não foram implementados testes de integração automatizados que cubram o ciclo completo da aplicação ao banco de dados, incluindo a verificação de políticas RLS, RPCs, triggers e Edge Functions. Essa ausência constitui ressalva direta ao requisito não funcional de tempo de resposta inferior a dois segundos: o requisito foi declarado, porém não foi verificado empiricamente, uma vez que não foram realizados testes de carga com volume real de dados.

O trabalho configura um caso único, conduzido por um desenvolvedor sobre um domínio específico, o que limita a validade externa dos resultados. As conclusões não devem ser generalizadas para equipes, outros domínios ou outras combinações de ferramentas sem investigação adicional.

## 5.4 Trabalhos Futuros

A evolução da plataforma e o aprofundamento da investigação apontam para as seguintes frentes.

A primeira é a implementação de testes de integração reais no pipeline de integração contínua, cobrindo o ciclo da aplicação ao banco de dados, com verificação de políticas RLS, RPCs, triggers e Edge Functions. A segunda é a adoção de testes de ponta a ponta com Playwright, que validem os fluxos críticos de forma automatizada. A terceira é o suporte a múltiplos idiomas, ampliando o alcance da plataforma. A quarta é a expansão do painel do aluno, com mais recursos de acompanhamento. A quinta é a implementação dos requisitos funcionais planejados e ainda não construídos (RF32 a RF35), cujo detalhamento consta do Capítulo 4.

Encontra-se em andamento, ainda, a aplicação de um formulário exploratório a professores e alunos voluntários, com a versão de homologação da plataforma, destinado a coletar feedback externo sobre a usabilidade percebida e a complementar as evidências internas reunidas neste trabalho.

## 5.5 Considerações Finais

O desenvolvimento do SyncClass evidenciou que um único desenvolvedor, apoiado por ferramentas adequadas e pelo uso estratégico de IA generativa, pode entregar um produto SaaS completo, seguro e funcional em prazo acadêmico, com usuários reais em operação.

Do ponto de vista social, a plataforma contribui para o Objetivo de Desenvolvimento Sustentável 4 (educação de qualidade) e para o Objetivo de Desenvolvimento Sustentável 8 (trabalho decente): ao reduzir a carga administrativa do professor autônomo, viabiliza uma gestão profissional acessível a quem atua de forma individual, sem suporte institucional, e libera o profissional para concentrar-se na atividade pedagógica, contribuindo para a qualidade do ensino de idiomas.
