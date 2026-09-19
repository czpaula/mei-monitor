-- Rode como administrador do MySQL:  mysql -u root -p < db/01_criar_banco.sql

CREATE DATABASE IF NOT EXISTS cruzeta_painel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Troque TROQUE_ESTA_SENHA pela sua senha (a mesma vai no arquivo .env).
CREATE USER IF NOT EXISTS 'painel'@'localhost'  IDENTIFIED BY 'TROQUE_ESTA_SENHA';
CREATE USER IF NOT EXISTS 'painel'@'127.0.0.1' IDENTIFIED BY 'TROQUE_ESTA_SENHA';

-- O painel só precisa ler e gravar dados; não recebe permissão de alterar a estrutura.
GRANT SELECT, INSERT, UPDATE, DELETE ON cruzeta_painel.* TO 'painel'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON cruzeta_painel.* TO 'painel'@'127.0.0.1';
FLUSH PRIVILEGES;
