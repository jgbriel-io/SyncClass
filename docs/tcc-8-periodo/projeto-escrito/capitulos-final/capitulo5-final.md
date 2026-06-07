# 5 CONCLUSÃO

Este capítulo retoma o problema de pesquisa e o objetivo geral que orientaram o trabalho, sintetiza as conclusões sobre as três hipóteses cuja análise foi detalhada no Capítulo 4, declara as limitações identificadas ao longo do desenvolvimento, aponta frentes de trabalho futuro para a evolução da plataforma e encerra com as considerações finais.

## 5.1 Síntese do Trabalho

O trabalho partiu do problema da sobrecarga administrativa enfrentada pelo professor autônomo de inglês, que acumula a atividade pedagógica com a gestão de alunos, o agendamento de aulas, o controle de cobranças e o acompanhamento de atividades, em geral apoiado por ferramentas dispersas e não integradas. O objetivo geral consistiu em investigar a viabilidade de desenvolver e entregar um _Software as a Service_ (SaaS) funcional para a gestão desse profissional, por um único desenvolvedor com suporte de assistente de Inteligência Artificial (IA) generativa, em prazo acadêmico.

A entrega corresponde ao SyncClass, plataforma SaaS web que cobre os módulos de alunos, aulas, financeiro e atividades, com suporte a três perfis de usuário (administrador, professor e aluno). O sistema não se restringiu a um artefato funcional em ambiente controlado: encontra-se em uso ativo por um professor autônomo de inglês e seus alunos, o que caracteriza validação em ambiente real. Os requisitos foram coletados junto a um usuário real, o professor que demandou o desenvolvimento, o que ancora o produto em uma necessidade concreta de mercado, e não em uma hipótese de problema construída _a posteriori_.

## 5.2 Conclusões sobre as Hipóteses

A análise detalhada das três hipóteses, com a apresentação das evidências e da discussão metodológica, foi conduzida no Capítulo 4. Esta seção apresenta apenas a síntese das conclusões.

A hipótese H1, relativa à viabilidade de desenvolver um SaaS funcional por um único desenvolvedor com suporte de IA generativa em prazo acadêmico, foi confirmada: o sistema foi desenvolvido em aproximadamente três meses (março a junho de 2026), registrou 152 _commits_ na _branch_ principal e encontra-se em operação real.

A hipótese H2, relativa à redução de pelo menos 60% do esforço de desenvolvimento backend pela adoção do Supabase como _Backend as a Service_ (BaaS), foi confirmada com ressalva metodológica. A estimativa é qualitativa, fundamentada na enumeração dos serviços de backend dispensados de implementação manual (autenticação, autorização por RLS, API de dados, armazenamento de arquivos, tempo real e _migrations_ versionadas) e na literatura de computação em nuvem. O limiar de 60% foi arbitrado _a priori_, no enunciado da hipótese, e a evidência reunida o torna plausível, sem o quantificar por medição experimental, dada a ausência de grupo de controle.

A hipótese H3, relativa à aceleração de pelo menos três vezes no tempo de execução de tarefas de _scaffolding_, geração de _migrations_ SQL e auditoria de segurança pelo uso de IA generativa, foi confirmada por categoria de tarefa. Verificou-se aceleração superior ao fator de três vezes nas tarefas de geração de _migrations_ SQL e de auditoria de segurança, de domínio bem delimitado e repetitivo; na montagem inicial de módulos, cuja natureza decisória embute escolhas de produto e arquitetura, o ganho aproximou-se do limiar sem superá-lo de forma consistente. Em síntese, H3 é confirmada para as categorias de geração de _migrations_ SQL e de auditoria de segurança, e considerada apenas parcialmente atendida para a montagem inicial de módulos. As evidências apoiam-se em estimativas retrospectivas elaboradas pelo próprio desenvolvedor, sujeitas a viés de confirmação, conforme o protocolo de medição descrito na seção 3.3.

## 5.3 Limitações do Trabalho

As seguintes limitações foram identificadas e devem moldar a interpretação dos resultados.

As estimativas de ganho associadas às hipóteses H2 e H3 são retrospectivas e foram produzidas sem grupo de controle. A comparação com uma _stack_ tradicional equivalente e a comparação entre execução com e sem assistência de IA refletem a avaliação do próprio executor, e não medições experimentais controladas.

Não foram implementados testes de integração automatizados que cubram o ciclo completo da aplicação ao banco de dados, incluindo a verificação de políticas RLS, procedimentos remotos, gatilhos e Edge Functions. Essa ausência constitui ressalva direta ao requisito não funcional de tempo de resposta inferior a dois segundos: o requisito foi declarado, porém não foi verificado empiricamente, uma vez que não foram realizados testes de carga com volume real de dados.

No tocante à verificação manual, a campanha estruturada de testes, com roteiro de 175 itens, permanecia em execução à data de redação deste trabalho, de modo que parte do roteiro ainda não havia sido integralmente percorrida. Trata-se de limitação de natureza distinta da anterior, pois se refere à execução do processo de qualidade, e não à cobertura de testes automatizados.

O trabalho configura um caso único, conduzido por um desenvolvedor sobre um domínio específico, o que limita a validade externa dos resultados. As conclusões não devem ser generalizadas para equipes, outros domínios ou outras combinações de ferramentas sem investigação adicional.

## 5.4 Trabalhos Futuros

A evolução da plataforma e o aprofundamento da investigação apontam para as seguintes frentes.

A primeira é a implementação de testes de integração reais no _pipeline_ de integração contínua, cobrindo o ciclo da aplicação ao banco de dados, com verificação de políticas RLS, procedimentos remotos, gatilhos e Edge Functions. A segunda é a adoção de testes de ponta a ponta com Playwright, que validem os fluxos críticos de forma automatizada. A terceira é a conclusão da campanha de testes manuais em curso e o registro consolidado de seus resultados. A quarta é o suporte a múltiplos idiomas, ampliando o alcance da plataforma. A quinta é a expansão do painel do aluno, com mais recursos de acompanhamento. A sexta é a implementação dos requisitos funcionais planejados e ainda não construídos, cujo detalhamento consta do Apêndice B (Quadro B.2).

Planeja-se, ademais, a aplicação de um formulário exploratório a professores e alunos voluntários, com a versão de homologação da plataforma, destinado a coletar feedback externo sobre a usabilidade percebida e a complementar as evidências internas reunidas neste trabalho. O instrumento e o resultado dessa aplicação constam do Apêndice A.

Cabe registrar, por fim, que a investigação conduzida restringiu-se à viabilidade de construção do produto, ao passo que a aferição de seu impacto sobre o trabalho do professor permanece como frente distinta de pesquisa. Estudos posteriores, com população ampliada de usuários e delineamento experimental ou quase-experimental, poderão verificar empiricamente três hipóteses de impacto: a redução do tempo dedicado a tarefas administrativas após a adoção da plataforma; o ganho de rastreabilidade do progresso pedagógico do aluno proporcionado pelo histórico unificado; e o aumento do profissionalismo percebido pelos alunos em relação ao serviço prestado. Tais hipóteses, voltadas ao efeito do produto sobre os usuários, complementam as três hipóteses verificadas neste trabalho, centradas no processo de desenvolvimento, e demandariam instrumentos de coleta aplicados a professores e alunos ao longo de um período de uso.

## 5.5 Considerações Finais

O desenvolvimento do SyncClass evidenciou que um único desenvolvedor, apoiado por ferramentas adequadas e pelo uso estratégico de IA generativa, pode entregar um produto SaaS completo e seguro em prazo acadêmico, com usuários reais em operação.

Do ponto de vista social, a plataforma alinha-se ao Objetivo de Desenvolvimento Sustentável 4 (educação de qualidade) e ao Objetivo de Desenvolvimento Sustentável 8 (trabalho decente e crescimento econômico): ao reduzir a carga administrativa do professor autônomo, viabiliza uma gestão profissional acessível a quem atua de forma individual, sem suporte institucional, e libera o profissional para concentrar-se na atividade pedagógica, o que contribui para a qualidade do ensino de idiomas.
