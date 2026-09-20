-- Rode UMA vez, depois do 03_seed_administrativa.sql:
--   mysql -u root -p --default-character-set=utf8mb4 < db/04_seed_outras_areas.sql
-- Fonte dos dados: plano financeiro, método de validação, monetização e roadmap do documento inicial.

USE cruzeta_painel;

-- =================================================================
-- FINANCEIRA
-- =================================================================
SET @fin = (SELECT id FROM areas WHERE slug = 'financeira');

INSERT IGNORE INTO campos_dados (area_id, grupo, chave, rotulo, tipo, opcoes, origem, obrigatorio, valor, ordem) VALUES
  (@fin, 'Capital e orçamento', 'custos_abertura_total',  'Custos de abertura, total (R$)',                'numero', NULL, 'Plano financeiro inicial', 1, NULL, 1),
  (@fin, 'Capital e orçamento', 'custos_fixos_mensais',   'Custos fixos mensais (R$)',                     'numero', NULL, 'Plano financeiro inicial', 1, NULL, 2),
  (@fin, 'Capital e orçamento', 'meses_folego',           'Meses de fôlego',                               'numero', NULL, 'Plano financeiro inicial', 1, NULL, 3),
  (@fin, 'Capital e orçamento', 'capital_inicial',        'Capital inicial necessário (R$)',               'numero', NULL, 'Plano financeiro inicial', 1, NULL, 4),
  (@fin, 'Experimentos',        'teto_experimento_valor', 'Teto de gasto por experimento (R$)',            'numero', NULL, 'Modelo de negócio (regra do teto)', 1, NULL, 10),
  (@fin, 'Experimentos',        'teto_experimento_semanas','Teto de prazo por experimento (semanas)',      'numero', NULL, 'Modelo de negócio (regra do teto)', 1, NULL, 11),
  (@fin, 'Metas',               'pro_labore_mensal',      'Pró-labore mensal por sócio (R$)',              'numero', NULL, 'Regime tributário e CNAEs (Fator R)', 0, NULL, 20),
  (@fin, 'Metas',               'meta_receita_12m',       'Meta de receita ao fim de 12 meses (R$)',       'numero', NULL, 'Roadmap', 0, NULL, 21);

INSERT INTO tarefas (area_id, grupo, titulo, detalhe, prioridade, ordem) VALUES
  (@fin, 'Plano financeiro', 'Levantar os custos de abertura (Junta, certificado, alvará, contador, marca, contas das lojas)', NULL, 'alta', 1),
  (@fin, 'Plano financeiro', 'Levantar os custos fixos mensais (contabilidade, pró-labore, ferramentas, freelancers)', NULL, 'alta', 2),
  (@fin, 'Plano financeiro', 'Definir o orçamento de cada etapa do experimento (demanda, MVP, lançamento, reserva)', NULL, 'alta', 3),
  (@fin, 'Plano financeiro', 'Calcular o capital inicial necessário e os meses de fôlego', NULL, 'alta', 4),
  (@fin, 'Tributos e caixa', 'Definir o pró-labore e simular o Fator R com o contador', NULL, 'media', 5),
  (@fin, 'Tributos e caixa', 'Definir como emitir nota das receitas das lojas de aplicativos', 'Parte da receita vem de empresas no exterior.', 'media', 6),
  (@fin, 'Tributos e caixa', 'Abrir o controle mensal de receitas e despesas', NULL, 'media', 7);

-- =================================================================
-- PRODUTOS
-- =================================================================
SET @prod = (SELECT id FROM areas WHERE slug = 'produtos');

INSERT IGNORE INTO campos_dados (area_id, grupo, chave, rotulo, tipo, opcoes, origem, obrigatorio, valor, ordem) VALUES
  (@prod, 'Método', 'max_experimentos_ativos', 'Máximo de experimentos ativos ao mesmo tempo', 'numero', NULL, 'Modelo de negócio (método de validação)', 1, NULL, 1),
  (@prod, 'App 1',  'app1_nome',               'Nome do app 1',                                'texto',  NULL, 'Roadmap', 0, NULL, 10),
  (@prod, 'App 1',  'app1_monetizacao',        'Modelo de monetização do app 1',               'opcao',  'Assinatura;Compra única;Compras no app;Anúncios;Freemium', 'Roadmap', 0, NULL, 11),
  (@prod, 'App 1',  'app1_metas',              'Metas numéricas do app 1',                     'longo',  NULL, 'Roadmap', 0, NULL, 12);

INSERT INTO tarefas (area_id, grupo, titulo, detalhe, prioridade, ordem) VALUES
  (@prod, 'Método', 'Levantar as primeiras dez ideias e pontuar no scorecard', NULL, 'alta', 1),
  (@prod, 'Método', 'Escolher as duas primeiras apostas e fixar o máximo de experimentos ativos', NULL, 'alta', 2),
  (@prod, 'App 1', 'Definir o nome do app 1', NULL, 'media', 10),
  (@prod, 'App 1', 'Definir o modelo de monetização do app 1', NULL, 'media', 11),
  (@prod, 'App 1', 'Fixar as metas numéricas do app 1', NULL, 'media', 12),
  (@prod, 'App 1', 'Construir o MVP do app 1 e rodar o teste de demanda', NULL, 'media', 13);

-- =================================================================
-- MARKETING
-- =================================================================
SET @mkt = (SELECT id FROM areas WHERE slug = 'marketing');

INSERT IGNORE INTO campos_dados (area_id, grupo, chave, rotulo, tipo, opcoes, origem, obrigatorio, valor, ordem) VALUES
  (@mkt, 'Marca',     'site_endereco',        'Endereço do site institucional',         'texto', NULL, 'Marca, propriedade intelectual, LGPD e contas nas lojas', 1, NULL, 1),
  (@mkt, 'Marca',     'perfis_redes',         'Perfis nas redes sociais',                'longo', NULL, 'Marca, propriedade intelectual, LGPD e contas nas lojas', 0, NULL, 2),
  (@mkt, 'Aquisição', 'canais_prioritarios',  'Canais prioritários dos testes de demanda','longo', NULL, 'Modelo de negócio (método de validação)', 1, NULL, 10),
  (@mkt, 'Aquisição', 'orcamento_anuncios',   'Orçamento de anúncios de teste (R$)',      'numero', NULL, 'Plano financeiro inicial', 0, NULL, 11);

INSERT INTO tarefas (area_id, grupo, titulo, detalhe, prioridade, ordem) VALUES
  (@mkt, 'Marca',     'Publicar o site institucional', 'A Apple exige site público da empresa para a conta de organização.', 'alta', 1),
  (@mkt, 'Marca',     'Criar os perfis nas redes sociais', NULL, 'media', 2),
  (@mkt, 'Aquisição', 'Escolher os canais prioritários para os testes de demanda', NULL, 'alta', 10),
  (@mkt, 'Aquisição', 'Definir o orçamento de anúncios de teste', NULL, 'media', 11),
  (@mkt, 'Aquisição', 'Montar as ferramentas de medição de aquisição', NULL, 'media', 12);
