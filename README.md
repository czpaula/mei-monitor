# mei-monitor

Painel local de acompanhamento da construção da Cruzeta Forge Tecnologia — uma aplicação web que roda só no seu computador: um servidor Node.js conversa com o MySQL local e entrega páginas em HTML, CSS e JavaScript ao navegador, para acompanhar tarefas, dados a colher e avanços de cada área da empresa (Administrativa, Financeira, Produtos e Marketing).

## Como rodar

1. Instale Node.js (LTS, 18+) e MySQL 8 (ou MariaDB).
2. Crie o banco e o usuário local (troque a senha antes de rodar):
   ```bash
   mysql -u root -p < db/01_criar_banco.sql
   mysql -u root -p --default-character-set=utf8mb4 < db/02_tabelas.sql
   mysql -u root -p --default-character-set=utf8mb4 < db/03_seed_administrativa.sql
   mysql -u root -p --default-character-set=utf8mb4 < db/04_seed_outras_areas.sql
   ```
3. Copie `.env.example` para `.env` e preencha a senha do usuário `painel` criada no passo 2.
4. Instale as dependências e inicie o servidor:
   ```bash
   npm install
   npm start
   ```
5. Abra `http://127.0.0.1:3000` no navegador.

Detalhes completos (conferências, solução de problemas, backup e como adicionar uma área nova) estão no guia passo a passo original.
