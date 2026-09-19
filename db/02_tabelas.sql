-- Rode como administrador:  mysql -u root -p --default-character-set=utf8mb4 < db/02_tabelas.sql

USE cruzeta_painel;

CREATE TABLE IF NOT EXISTS areas (
  id        INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  slug      VARCHAR(30)       NOT NULL,
  nome      VARCHAR(60)       NOT NULL,
  descricao VARCHAR(255)      NULL,
  ordem     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_areas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tarefas (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  area_id       INT UNSIGNED      NOT NULL,
  grupo         VARCHAR(60)       NULL,
  titulo        VARCHAR(200)      NOT NULL,
  detalhe       TEXT              NULL,
  status        ENUM('a_fazer','em_andamento','concluida','bloqueada') NOT NULL DEFAULT 'a_fazer',
  prioridade    ENUM('baixa','media','alta') NOT NULL DEFAULT 'media',
  responsavel   VARCHAR(80)       NULL,
  prazo         DATE              NULL,
  concluida_em  DATETIME          NULL,
  ordem         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  criada_em     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tarefas_area_status (area_id, status),
  CONSTRAINT fk_tarefas_area FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados que precisam ser colhidos (vêm dos campos entre colchetes do documento inicial).
CREATE TABLE IF NOT EXISTS campos_dados (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  area_id       INT UNSIGNED      NOT NULL,
  grupo         VARCHAR(60)       NULL,
  chave         VARCHAR(60)       NOT NULL,
  rotulo        VARCHAR(140)      NOT NULL,
  tipo          ENUM('texto','longo','numero','data','opcao') NOT NULL DEFAULT 'texto',
  opcoes        VARCHAR(255)      NULL,
  origem        VARCHAR(120)      NULL,
  obrigatorio   TINYINT(1)        NOT NULL DEFAULT 0,
  valor         TEXT              NULL,
  ordem         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  atualizado_em DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_campos_area_chave (area_id, chave),
  CONSTRAINT fk_campos_area FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Diário de avanços: o que foi feito, quando e (opcionalmente) em qual tarefa.
CREATE TABLE IF NOT EXISTS avancos (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  area_id       INT UNSIGNED NOT NULL,
  tarefa_id     INT UNSIGNED NULL,
  data_registro DATE         NOT NULL,
  titulo        VARCHAR(160) NOT NULL,
  descricao     TEXT         NULL,
  autor         VARCHAR(80)  NULL,
  origem        ENUM('manual','automatico') NOT NULL DEFAULT 'manual',
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_avancos_area_data (area_id, data_registro),
  CONSTRAINT fk_avancos_area   FOREIGN KEY (area_id)   REFERENCES areas (id)   ON DELETE CASCADE,
  CONSTRAINT fk_avancos_tarefa FOREIGN KEY (tarefa_id) REFERENCES tarefas (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
