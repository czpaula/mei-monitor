-- Rode UMA vez:  mysql -u root -p --default-character-set=utf8mb4 < db/03_seed_administrativa.sql
-- Fonte dos dados: "Documento Inicial de Criação da Empresa" (campos entre colchetes e checklist).

USE cruzeta_painel;

INSERT IGNORE INTO areas (slug, nome, descricao, ordem) VALUES
  ('administrativa', 'Administrativa', 'Constituição da empresa, sócios, contabilidade, registros e conformidade', 1),
  ('financeira',     'Financeira',     'Capital, custos, orçamento por experimento e retorno financeiro',          2),
  ('produtos',       'Produtos',       'Ideias, experimentos e aplicativos no mercado',                           3),
  ('marketing',      'Marketing',      'Marca, presença digital e aquisição de usuários',                         4);

SET @adm = (SELECT id FROM areas WHERE slug = 'administrativa');

-- ---------------------------------------------------------------
-- DADOS A COLHER
-- colunas: area, grupo, chave, rótulo, tipo, opções, origem no documento, obrigatório, valor inicial, ordem
-- ---------------------------------------------------------------
INSERT IGNORE INTO campos_dados (area_id, grupo, chave, rotulo, tipo, opcoes, origem, obrigatorio, valor, ordem) VALUES
  (@adm, 'Identificação', 'razao_social',      'Razão social (termina em LTDA)',      'texto', NULL, 'Visão geral', 1, NULL, 1),
  (@adm, 'Identificação', 'nome_fantasia',     'Nome fantasia',                       'texto', NULL, 'Visão geral', 1, 'Cruzeta Forge Tecnologia', 2),
  (@adm, 'Identificação', 'slogan',            'Slogan',                              'texto', NULL, 'Visão geral', 0, 'Forging · Innovation · Precision', 3),
  (@adm, 'Identificação', 'atividade',         'Atividade',                           'longo', NULL, 'Visão geral', 1, 'Desenvolvimento, lançamento e operação de aplicativos móveis e web', 4),
  (@adm, 'Identificação', 'sede_cidade_uf',    'Sede (cidade/UF)',                    'texto', NULL, 'Visão geral', 1, NULL, 5),
  (@adm, 'Identificação', 'endereco_sede',     'Endereço da sede para o registro',    'longo', NULL, 'Checklist de abertura', 1, NULL, 6),
  (@adm, 'Identificação', 'previsao_abertura', 'Previsão de abertura',                'data',  NULL, 'Visão geral', 0, NULL, 7),

  (@adm, 'Societário', 'tipo_societario',   'Tipo societário',                                          'opcao', 'LTDA;SLU', 'Estrutura jurídica e societária', 1, NULL, 10),
  (@adm, 'Societário', 'socios',            'Sócios e participações (nome e percentual de cada um)',    'longo', NULL, 'Visão geral', 1, NULL, 11),
  (@adm, 'Societário', 'capital_social',    'Capital social (R$)',                                      'numero', NULL, 'Estrutura jurídica e societária', 1, NULL, 12),
  (@adm, 'Societário', 'data_integralizacao', 'Data de integralização do capital',                      'data',  NULL, 'Estrutura jurídica e societária', 0, NULL, 13),
  (@adm, 'Societário', 'administrador',     'Sócio administrador',                                      'texto', NULL, 'Estrutura jurídica e societária', 1, NULL, 14),
  (@adm, 'Societário', 'acordo_socios',     'Situação do acordo de sócios',                             'opcao', 'Não iniciado;Em elaboração;Assinado', 'Estrutura jurídica e societária', 0, NULL, 15),

  (@adm, 'Equipe', 'resp_produto',           'Responsável: produto e estratégia',   'texto', NULL, 'Equipe, tecnologia e ferramentas de medição', 0, NULL, 20),
  (@adm, 'Equipe', 'resp_engenharia',        'Responsável: engenharia',             'texto', NULL, 'Equipe, tecnologia e ferramentas de medição', 0, NULL, 21),
  (@adm, 'Equipe', 'resp_design',            'Responsável: design',                 'texto', NULL, 'Equipe, tecnologia e ferramentas de medição', 0, NULL, 22),
  (@adm, 'Equipe', 'resp_crescimento',       'Responsável: crescimento e dados',    'texto', NULL, 'Equipe, tecnologia e ferramentas de medição', 0, NULL, 23),
  (@adm, 'Equipe', 'resp_financas_juridico', 'Responsável: finanças e jurídico',    'texto', NULL, 'Equipe, tecnologia e ferramentas de medição', 0, NULL, 24),

  (@adm, 'Tributário e contábil', 'contador',          'Contador ou escritório (nome e contato)',             'texto', NULL, 'Regime tributário e CNAEs', 1, NULL, 30),
  (@adm, 'Tributário e contábil', 'regime_tributario', 'Regime tributário',                                   'opcao', 'Simples Nacional;Lucro Presumido;Lucro Real', 'Regime tributário e CNAEs', 1, NULL, 31),
  (@adm, 'Tributário e contábil', 'cnae_principal',    'CNAE principal (código e descrição)',                 'texto', NULL, 'Regime tributário e CNAEs', 1, NULL, 32),
  (@adm, 'Tributário e contábil', 'cnaes_secundarios', 'CNAEs secundários',                                   'longo', NULL, 'Regime tributário e CNAEs', 0, NULL, 33),

  (@adm, 'Registros (após a abertura)', 'cnpj',                 'CNPJ',                                              'texto', NULL, 'Checklist de abertura', 0, NULL, 40),
  (@adm, 'Registros (após a abertura)', 'nire',                 'NIRE (registro na Junta Comercial)',                'texto', NULL, 'Checklist de abertura', 0, NULL, 41),
  (@adm, 'Registros (após a abertura)', 'inscricao_municipal',  'Inscrição municipal',                               'texto', NULL, 'Checklist de abertura', 0, NULL, 42),
  (@adm, 'Registros (após a abertura)', 'certificado_validade', 'Validade do certificado digital e-CNPJ',            'data',  NULL, 'Checklist de abertura', 0, NULL, 43),
  (@adm, 'Registros (após a abertura)', 'banco_pj',             'Banco da conta PJ (só o nome do banco)',            'texto', NULL, 'Checklist de abertura', 0, NULL, 44),

  (@adm, 'Marca e lojas', 'duns',          'Número D-U-N-S',                     'texto', NULL, 'Marca, propriedade intelectual, LGPD e contas nas lojas', 0, NULL, 50),
  (@adm, 'Marca e lojas', 'processo_inpi', 'Nº do processo da marca no INPI',    'texto', NULL, 'Marca, propriedade intelectual, LGPD e contas nas lojas', 0, NULL, 51),
  (@adm, 'Marca e lojas', 'dominio',       'Domínio da empresa',                  'texto', NULL, 'Marca, propriedade intelectual, LGPD e contas nas lojas', 0, NULL, 52),
  (@adm, 'Marca e lojas', 'email_empresa', 'E-mail da empresa',                   'texto', NULL, 'Marca, propriedade intelectual, LGPD e contas nas lojas', 0, NULL, 53);

-- ---------------------------------------------------------------
-- CHECKLIST DO DOCUMENTO INICIAL
-- colunas: area, grupo, título, detalhe, status, prioridade, ordem
-- ---------------------------------------------------------------
INSERT INTO tarefas (area_id, grupo, titulo, detalhe, status, prioridade, ordem) VALUES
  (@adm, 'Decisões pendentes dos sócios', 'Quantos são os sócios e qual a participação de cada um (define LTDA ou SLU)', 'Preencher em Dados a colher: tipo societário e sócios e participações.', 'a_fazer', 'alta', 1),
  (@adm, 'Decisões pendentes dos sócios', 'Cidade e estado da sede e endereço para o registro', 'Preencher em Dados a colher: sede e endereço da sede.', 'a_fazer', 'alta', 2),
  (@adm, 'Decisões pendentes dos sócios', 'Capital social e forma de integralização', 'Não há capital mínimo legal; deve cobrir a abertura e os primeiros meses.', 'a_fazer', 'alta', 3),
  (@adm, 'Decisões pendentes dos sócios', 'Se a empresa também prestará serviços sob encomenda como caixa inicial', NULL, 'a_fazer', 'alta', 4),
  (@adm, 'Decisões pendentes dos sócios', 'Orçamento total inicial, teto por experimento e meses de fôlego', 'Os valores vão para a área Financeira.', 'a_fazer', 'alta', 5),

  (@adm, 'Constituição', 'Contratar contador e confirmar CNAEs, regime tributário e forma de emitir nota', 'Levar ao contador o tratamento das receitas das lojas de aplicativos.', 'a_fazer', 'alta', 6),
  (@adm, 'Constituição', 'Consulta de viabilidade de nome e endereço na Junta Comercial', NULL, 'a_fazer', 'alta', 7),
  (@adm, 'Constituição', 'Contrato social e acordo de sócios, revisados por advogado', NULL, 'a_fazer', 'alta', 8),
  (@adm, 'Constituição', 'Registro na Junta e emissão do CNPJ e das inscrições', 'Ao concluir, preencher CNPJ, NIRE e inscrição municipal em Dados a colher.', 'a_fazer', 'alta', 9),
  (@adm, 'Constituição', 'Certificado digital e-CNPJ', NULL, 'a_fazer', 'media', 10),
  (@adm, 'Constituição', 'Alvará e licenças municipais, se exigidos', NULL, 'a_fazer', 'media', 11),
  (@adm, 'Constituição', 'Conta bancária PJ, separada das contas pessoais', NULL, 'a_fazer', 'media', 12),

  (@adm, 'Marca e presença digital', 'Pesquisa de disponibilidade e pedido de registro da marca no INPI', NULL, 'a_fazer', 'media', 13),
  (@adm, 'Marca e presença digital', 'Domínio, e-mail da empresa e site institucional', 'A Apple exige site público da empresa para a conta de organização.', 'a_fazer', 'media', 14),
  (@adm, 'Marca e presença digital', 'Versões finais da logo (vertical, horizontal, fundo escuro, monocromática)', 'Arquivos finais gerados; falta a validação dos sócios.', 'em_andamento', 'media', 15),

  (@adm, 'Lojas e conformidade', 'Solicitar o número D-U-N-S', 'Pedir logo depois que o CNPJ sair; o prazo varia.', 'a_fazer', 'media', 16),
  (@adm, 'Lojas e conformidade', 'Abrir conta Apple Developer (organização) e Google Play Console (organização)', NULL, 'a_fazer', 'media', 17),
  (@adm, 'Lojas e conformidade', 'Modelos de política de privacidade e termos de uso', NULL, 'a_fazer', 'media', 18),
  (@adm, 'Lojas e conformidade', 'Contratos de cessão de direitos e confidencialidade com sócios e freelancers', NULL, 'a_fazer', 'media', 19),

  (@adm, 'Método', 'Levantar as primeiras dez ideias e pontuar no scorecard', NULL, 'a_fazer', 'media', 20),
  (@adm, 'Método', 'Escolher as duas primeiras apostas e fixar metas numéricas por escrito', NULL, 'a_fazer', 'media', 21),
  (@adm, 'Método', 'Montar o modelo-base técnico e as ferramentas de medição', NULL, 'a_fazer', 'media', 22);

-- ---------------------------------------------------------------
-- PRIMEIROS AVANÇOS REGISTRADOS
-- ---------------------------------------------------------------
INSERT INTO avancos (area_id, tarefa_id, data_registro, titulo, descricao, origem) VALUES
  (@adm, NULL, '2026-09-19', 'Documento inicial de criação da empresa elaborado', 'Visão geral, modelo de negócio, estrutura jurídica, plano financeiro, roadmap e checklist de abertura.', 'manual'),
  (@adm, (SELECT id FROM tarefas WHERE area_id = @adm AND ordem = 15), '2026-09-19', 'Versões finais da logo geradas', 'Vertical, horizontal, fundo escuro e monocromáticas, em SVG e PNG.', 'manual');
