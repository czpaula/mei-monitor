'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');

const PORT = Number(process.env.PORT || 3000);
const HOST = '127.0.0.1'; // escuta só neste computador

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  dateStrings: true, // DATE e DATETIME voltam como texto, sem conversão de fuso
  waitForConnections: true,
  connectionLimit: 5,
});

const STATUS = ['a_fazer', 'em_andamento', 'concluida', 'bloqueada'];
const PRIORIDADES = ['baixa', 'media', 'alta'];

// ---------- utilidades ----------
const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const limpar = (valor, max) => {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto.slice(0, max);
};

const ehData = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const idDe = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const invalido = (res, erro) => res.status(400).json({ erro });
const naoEncontrado = (res, erro) => res.status(404).json({ erro });

async function areaPorSlug(slug) {
  const [rows] = await pool.query('SELECT id, slug, nome, descricao FROM areas WHERE slug = ?', [slug]);
  return rows[0] || null;
}

// ---------- aplicação ----------
const app = express();
app.disable('x-powered-by');

// Só aceita pedidos feitos para localhost ou 127.0.0.1 (protege contra DNS rebinding).
app.use((req, res, next) => {
  const host = String(req.headers.host || '').toLowerCase();
  if (host === `localhost:${PORT}` || host === `127.0.0.1:${PORT}`) return next();
  return res.status(403).json({ erro: 'Host não permitido' });
});

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- áreas ----------
app.get('/api/areas', rota(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT a.id, a.slug, a.nome, a.descricao,
      (SELECT COUNT(*) FROM tarefas t WHERE t.area_id = a.id) AS tarefas_total,
      (SELECT COUNT(*) FROM tarefas t WHERE t.area_id = a.id AND t.status = 'concluida') AS tarefas_concluidas,
      (SELECT COUNT(*) FROM campos_dados c WHERE c.area_id = a.id) AS campos_total,
      (SELECT COUNT(*) FROM campos_dados c WHERE c.area_id = a.id AND c.valor IS NOT NULL AND c.valor <> '') AS campos_preenchidos
    FROM areas a
    ORDER BY a.ordem, a.id`);
  res.json(rows);
}));

// ---------- tarefas ----------
app.get('/api/areas/:slug/tarefas', rota(async (req, res) => {
  const area = await areaPorSlug(req.params.slug);
  if (!area) return naoEncontrado(res, 'Área não encontrada');
  const [rows] = await pool.query('SELECT * FROM tarefas WHERE area_id = ? ORDER BY ordem, id', [area.id]);
  res.json(rows);
}));

app.post('/api/areas/:slug/tarefas', rota(async (req, res) => {
  const area = await areaPorSlug(req.params.slug);
  if (!area) return naoEncontrado(res, 'Área não encontrada');
  const b = req.body || {};
  const titulo = limpar(b.titulo, 200);
  if (!titulo) return invalido(res, 'Informe o título da tarefa');
  const prioridade = b.prioridade || 'media';
  if (!PRIORIDADES.includes(prioridade)) return invalido(res, 'Prioridade inválida');
  if (b.prazo && !ehData(b.prazo)) return invalido(res, 'O prazo deve estar no formato AAAA-MM-DD');

  const [prox] = await pool.query('SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM tarefas WHERE area_id = ?', [area.id]);
  const [ins] = await pool.query(
    `INSERT INTO tarefas (area_id, grupo, titulo, detalhe, prioridade, responsavel, prazo, ordem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [area.id, limpar(b.grupo, 60), titulo, limpar(b.detalhe, 5000), prioridade,
      limpar(b.responsavel, 80), b.prazo || null, prox[0].proxima]);
  const [rows] = await pool.query('SELECT * FROM tarefas WHERE id = ?', [ins.insertId]);
  res.status(201).json(rows[0]);
}));

app.patch('/api/tarefas/:id', rota(async (req, res) => {
  const id = idDe(req.params.id);
  if (!id) return invalido(res, 'Id inválido');
  const [atuais] = await pool.query('SELECT * FROM tarefas WHERE id = ?', [id]);
  const atual = atuais[0];
  if (!atual) return naoEncontrado(res, 'Tarefa não encontrada');

  const b = req.body || {};
  const sets = [];
  const vals = [];

  if ('titulo' in b) {
    const v = limpar(b.titulo, 200);
    if (!v) return invalido(res, 'O título não pode ficar vazio');
    sets.push('titulo = ?'); vals.push(v);
  }
  if ('grupo' in b) { sets.push('grupo = ?'); vals.push(limpar(b.grupo, 60)); }
  if ('detalhe' in b) { sets.push('detalhe = ?'); vals.push(limpar(b.detalhe, 5000)); }
  if ('responsavel' in b) { sets.push('responsavel = ?'); vals.push(limpar(b.responsavel, 80)); }
  if ('prioridade' in b) {
    if (!PRIORIDADES.includes(b.prioridade)) return invalido(res, 'Prioridade inválida');
    sets.push('prioridade = ?'); vals.push(b.prioridade);
  }
  if ('prazo' in b) {
    if (b.prazo && !ehData(b.prazo)) return invalido(res, 'O prazo deve estar no formato AAAA-MM-DD');
    sets.push('prazo = ?'); vals.push(b.prazo || null);
  }
  if ('status' in b) {
    if (!STATUS.includes(b.status)) return invalido(res, 'Status inválido');
    if (b.status !== atual.status) {
      sets.push('status = ?'); vals.push(b.status);
      sets.push(b.status === 'concluida' ? 'concluida_em = NOW()' : 'concluida_em = NULL');
    }
  }
  if (!sets.length) return invalido(res, 'Nada para atualizar');

  await pool.query(`UPDATE tarefas SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);

  // Ao concluir uma tarefa, o painel registra o avanço sozinho.
  if (b.status === 'concluida' && atual.status !== 'concluida') {
    await pool.query(
      `INSERT INTO avancos (area_id, tarefa_id, data_registro, titulo, descricao, origem)
       VALUES (?, ?, CURDATE(), 'Tarefa concluída', ?, 'automatico')`,
      [atual.area_id, id, atual.titulo]);
  }
  const [rows] = await pool.query('SELECT * FROM tarefas WHERE id = ?', [id]);
  res.json(rows[0]);
}));

app.delete('/api/tarefas/:id', rota(async (req, res) => {
  const id = idDe(req.params.id);
  if (!id) return invalido(res, 'Id inválido');
  const [r] = await pool.query('DELETE FROM tarefas WHERE id = ?', [id]);
  if (!r.affectedRows) return naoEncontrado(res, 'Tarefa não encontrada');
  res.status(204).end();
}));

// ---------- dados a colher ----------
app.get('/api/areas/:slug/campos', rota(async (req, res) => {
  const area = await areaPorSlug(req.params.slug);
  if (!area) return naoEncontrado(res, 'Área não encontrada');
  const [rows] = await pool.query('SELECT * FROM campos_dados WHERE area_id = ? ORDER BY ordem, id', [area.id]);
  res.json(rows);
}));

app.put('/api/campos/:id', rota(async (req, res) => {
  const id = idDe(req.params.id);
  if (!id) return invalido(res, 'Id inválido');
  const [atuais] = await pool.query('SELECT * FROM campos_dados WHERE id = ?', [id]);
  const campo = atuais[0];
  if (!campo) return naoEncontrado(res, 'Campo não encontrado');

  let valor = limpar(req.body && req.body.valor, 5000);
  if (valor !== null) {
    if (campo.tipo === 'data' && !ehData(valor)) return invalido(res, 'Informe uma data válida');
    if (campo.tipo === 'numero') {
      const n = Number(valor.replace(',', '.'));
      if (!Number.isFinite(n)) return invalido(res, 'Informe só números, por exemplo 1500.50');
      valor = String(n);
    }
    if (campo.tipo === 'opcao' && !String(campo.opcoes || '').split(';').includes(valor)) {
      return invalido(res, 'Opção inválida');
    }
  }
  await pool.query('UPDATE campos_dados SET valor = ? WHERE id = ?', [valor, id]);
  const [rows] = await pool.query('SELECT * FROM campos_dados WHERE id = ?', [id]);
  res.json(rows[0]);
}));

// ---------- avanços ----------
app.get('/api/areas/:slug/avancos', rota(async (req, res) => {
  const area = await areaPorSlug(req.params.slug);
  if (!area) return naoEncontrado(res, 'Área não encontrada');
  const [rows] = await pool.query(
    `SELECT v.*, t.titulo AS tarefa_titulo
       FROM avancos v
       LEFT JOIN tarefas t ON t.id = v.tarefa_id
      WHERE v.area_id = ?
      ORDER BY v.data_registro DESC, v.id DESC`,
    [area.id]);
  res.json(rows);
}));

app.post('/api/areas/:slug/avancos', rota(async (req, res) => {
  const area = await areaPorSlug(req.params.slug);
  if (!area) return naoEncontrado(res, 'Área não encontrada');
  const b = req.body || {};
  const titulo = limpar(b.titulo, 160);
  if (!titulo) return invalido(res, 'Informe o título do avanço');
  if (b.data_registro && !ehData(b.data_registro)) return invalido(res, 'A data deve estar no formato AAAA-MM-DD');

  let tarefaId = null;
  if (b.tarefa_id) {
    tarefaId = idDe(b.tarefa_id);
    const [t] = await pool.query('SELECT id FROM tarefas WHERE id = ? AND area_id = ?', [tarefaId, area.id]);
    if (!tarefaId || !t.length) return invalido(res, 'Tarefa inválida para esta área');
  }
  const [ins] = await pool.query(
    `INSERT INTO avancos (area_id, tarefa_id, data_registro, titulo, descricao, autor, origem)
     VALUES (?, ?, COALESCE(?, CURDATE()), ?, ?, ?, 'manual')`,
    [area.id, tarefaId, b.data_registro || null, titulo, limpar(b.descricao, 5000), limpar(b.autor, 80)]);
  const [rows] = await pool.query(
    `SELECT v.*, t.titulo AS tarefa_titulo FROM avancos v LEFT JOIN tarefas t ON t.id = v.tarefa_id WHERE v.id = ?`,
    [ins.insertId]);
  res.status(201).json(rows[0]);
}));

app.delete('/api/avancos/:id', rota(async (req, res) => {
  const id = idDe(req.params.id);
  if (!id) return invalido(res, 'Id inválido');
  const [r] = await pool.query('DELETE FROM avancos WHERE id = ?', [id]);
  if (!r.affectedRows) return naoEncontrado(res, 'Avanço não encontrado');
  res.status(204).end();
}));

// ---------- erros ----------
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err && err.type === 'entity.parse.failed') return invalido(res, 'JSON inválido');
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno. Veja a mensagem no terminal do servidor.' });
});

// ---------- início ----------
(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('Não foi possível conectar ao MySQL:', e.message);
    console.error('Confira o arquivo .env e se o MySQL está ligado.');
    process.exit(1);
  }
  app.listen(PORT, HOST, () => {
    console.log(`Painel da Cruzeta Forge em http://127.0.0.1:${PORT}`);
  });
})();
