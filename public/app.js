'use strict';

// ---------- comunicação com a API ----------
async function chamar(metodo, caminho, corpo) {
  const opcoes = { method: metodo, headers: {} };
  if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }
  let resp;
  try {
    resp = await fetch(caminho, opcoes);
  } catch (e) {
    throw new Error('Não foi possível falar com o servidor. Ele está rodando?');
  }
  if (resp.status === 204) return null;
  let dados = null;
  try {
    dados = await resp.json();
  } catch (e) {
    dados = null;
  }
  if (!resp.ok) {
    throw new Error((dados && dados.erro) || `Erro ${resp.status}`);
  }
  return dados;
}

const api = {
  get: (caminho) => chamar('GET', caminho),
  post: (caminho, corpo) => chamar('POST', caminho, corpo || {}),
  put: (caminho, corpo) => chamar('PUT', caminho, corpo || {}),
  patch: (caminho, corpo) => chamar('PATCH', caminho, corpo || {}),
  del: (caminho) => chamar('DELETE', caminho),
};

// ---------- criação de elementos sem innerHTML ----------
function h(tag, props, ...filhos) {
  const el = document.createElement(tag);
  let valor;
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'value') valor = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'checked' || k === 'disabled') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  if (valor !== undefined) el.value = valor; // depois dos filhos, para o select funcionar
  return el;
}

// ---------- estado ----------
const estado = {
  areas: [],
  areaAtual: null,
  abaAtual: 'tarefas',
  filtroStatus: 'todas',
  requisicaoId: 0,
};

const STATUS_ROTULOS = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada',
};
const PRIORIDADE_ROTULOS = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const TIPO_ROTULOS = { texto: 'Texto', longo: 'Texto longo', numero: 'Número', data: 'Data', opcao: 'Opção' };

// ---------- avisos ----------
let avisoTimer = null;
function avisar(mensagem, tipo) {
  const el = document.getElementById('aviso');
  el.textContent = mensagem;
  el.className = 'aviso' + (tipo === 'erro' ? ' erro' : '');
  el.hidden = false;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => { el.hidden = true; }, 4000);
}

// ---------- navegação por hash ----------
function lerHash() {
  const partes = (location.hash || '').replace(/^#/, '').split('/');
  return { slug: partes[0] || null, aba: partes[1] || 'tarefas' };
}

function ir(slug, aba) {
  location.hash = `${slug}/${aba || 'tarefas'}`;
}

window.addEventListener('hashchange', () => {
  const { slug, aba } = lerHash();
  if (!slug) return;
  estado.abaAtual = aba;
  desenharArea(slug);
});

// ---------- carregar áreas ----------
async function carregarAreas() {
  estado.areas = await api.get('/api/areas');
  desenharMenu();
  desenharResumoGeral();
}

function desenharResumoGeral() {
  const total = estado.areas.reduce((s, a) => s + a.tarefas_total, 0);
  const feitas = estado.areas.reduce((s, a) => s + a.tarefas_concluidas, 0);
  const campos = estado.areas.reduce((s, a) => s + a.campos_total, 0);
  const preenchidos = estado.areas.reduce((s, a) => s + a.campos_preenchidos, 0);
  const alvo = document.getElementById('resumo-geral');
  alvo.replaceChildren(
    h('span', null, 'Tarefas: ', h('b', null, `${feitas} de ${total}`)),
    h('span', null, 'Dados: ', h('b', null, `${preenchidos} de ${campos}`)),
  );
}

function desenharMenu() {
  const menu = document.getElementById('menu-areas');
  const { slug: slugAtual } = lerHash();
  menu.replaceChildren(
    ...estado.areas.map((area) => {
      const pct = area.tarefas_total ? Math.round((area.tarefas_concluidas / area.tarefas_total) * 100) : 0;
      const ativo = area.slug === slugAtual;
      return h('button', {
        class: 'menu-item' + (ativo ? ' ativo' : ''),
        type: 'button',
        onclick: () => ir(area.slug, estado.abaAtual),
      },
        h('span', { class: 'nome' }, area.nome),
        h('div', { class: 'prog-linha' },
          h('div', { class: 'barra' }, h('i', { style: `width:${pct}%` })),
          h('span', { class: 'prog-texto' }, `${area.tarefas_concluidas}/${area.tarefas_total}`),
        ),
      );
    }),
  );
}

// ---------- desenhar área ----------
async function desenharArea(slug) {
  const meuId = ++estado.requisicaoId;
  const conteudo = document.getElementById('conteudo');
  const area = estado.areas.find((a) => a.slug === slug);
  if (!area) {
    conteudo.replaceChildren(h('p', { class: 'vazio' }, 'Área não encontrada.'));
    return;
  }
  estado.areaAtual = area;
  desenharMenu();

  const cabecalho = h('div', { class: 'cabecalho-area' },
    h('h1', null, area.nome),
    h('p', null, area.descricao || ''),
  );

  const abas = h('div', { class: 'abas' },
    ...[
      ['tarefas', 'Tarefas'],
      ['dados', 'Dados a colher'],
      ['avancos', 'Avanços'],
    ].map(([chave, rotulo]) => h('button', {
      class: 'aba-botao' + (estado.abaAtual === chave ? ' ativa' : ''),
      type: 'button',
      onclick: () => ir(area.slug, chave),
    }, rotulo)),
  );

  const corpo = h('div', { class: 'aba-corpo' }, h('p', { class: 'vazio' }, 'Carregando…'));
  conteudo.replaceChildren(cabecalho, abas, corpo);
  conteudo.focus();

  try {
    let novoCorpo;
    if (estado.abaAtual === 'dados') novoCorpo = await abaDados(area);
    else if (estado.abaAtual === 'avancos') novoCorpo = await abaAvancos(area);
    else novoCorpo = await abaTarefas(area);

    if (meuId !== estado.requisicaoId) return; // resposta atrasada, tela já mudou
    corpo.replaceChildren(novoCorpo);
  } catch (e) {
    if (meuId !== estado.requisicaoId) return;
    corpo.replaceChildren(h('p', { class: 'vazio' }, e.message));
  }
}

// ---------- aba: tarefas ----------
function estaAtrasada(tarefa) {
  if (!tarefa.prazo || tarefa.status === 'concluida') return false;
  return tarefa.prazo < new Date().toISOString().slice(0, 10);
}

async function abaTarefas(area) {
  const tarefas = await api.get(`/api/areas/${area.slug}/tarefas`);

  const filtros = h('div', { class: 'filtros' },
    ...[
      ['todas', 'Todas'],
      ['abertas', 'Abertas'],
      ['concluida', 'Concluídas'],
    ].map(([chave, rotulo]) => h('button', {
      class: 'filtro-botao' + (estado.filtroStatus === chave ? ' ativo' : ''),
      type: 'button',
      onclick: () => { estado.filtroStatus = chave; desenharArea(area.slug); },
    }, rotulo)),
  );

  const visiveis = tarefas.filter((t) => {
    if (estado.filtroStatus === 'abertas') return t.status !== 'concluida';
    if (estado.filtroStatus === 'concluida') return t.status === 'concluida';
    return true;
  });

  const grupos = new Map();
  for (const t of visiveis) {
    const chave = t.grupo || 'Outras';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(t);
  }

  const listaGrupos = [...grupos.entries()].map(([grupo, itens]) =>
    h('div', { class: 'grupo' },
      h('div', { class: 'grupo-titulo' }, grupo),
      ...itens.map((t) => cartaoTarefa(area, t)),
    ));

  const formNova = formNovaTarefa(area);

  return h('div', null,
    filtros,
    visiveis.length ? h('div', null, ...listaGrupos) : h('p', { class: 'vazio' }, 'Nenhuma tarefa nesse filtro.'),
    formNova,
  );
}

function cartaoTarefa(area, tarefa) {
  const atrasada = estaAtrasada(tarefa);
  const mensagem = h('span', { class: 'campo-mensagem' });

  const checkbox = h('input', {
    type: 'checkbox',
    checked: tarefa.status === 'concluida',
    onchange: async (ev) => {
      const novoStatus = ev.target.checked ? 'concluida' : 'a_fazer';
      ev.target.disabled = true;
      try {
        await api.patch(`/api/tarefas/${tarefa.id}`, { status: novoStatus });
        await carregarAreas();
        desenharArea(area.slug);
      } catch (e) {
        ev.target.checked = !ev.target.checked;
        ev.target.disabled = false;
        avisar(e.message, 'erro');
      }
    },
  });

  const selectStatus = h('select', {
    onchange: async (ev) => {
      try {
        await api.patch(`/api/tarefas/${tarefa.id}`, { status: ev.target.value });
        await carregarAreas();
        desenharArea(area.slug);
      } catch (e) {
        avisar(e.message, 'erro');
      }
    },
  }, ...Object.entries(STATUS_ROTULOS).map(([v, r]) => h('option', { value: v, selected: v === tarefa.status || undefined }, r)));
  selectStatus.value = tarefa.status;

  const botaoExcluir = h('button', {
    class: 'botao perigo',
    type: 'button',
    onclick: async () => {
      if (!confirm('Excluir esta tarefa?')) return;
      try {
        await api.del(`/api/tarefas/${tarefa.id}`);
        await carregarAreas();
        desenharArea(area.slug);
      } catch (e) {
        avisar(e.message, 'erro');
      }
    },
  }, 'Excluir');

  return h('div', { class: 'card' },
    h('div', { class: 'tarefa-linha' },
      checkbox,
      h('div', { class: 'tarefa-corpo' },
        h('div', { class: 'tarefa-titulo' + (tarefa.status === 'concluida' ? ' concluida' : '') }, tarefa.titulo),
        tarefa.detalhe ? h('div', { class: 'tarefa-detalhe' }, tarefa.detalhe) : null,
        h('div', { class: 'tarefa-meta' },
          h('span', { class: 'etiqueta ' + tarefa.prioridade }, PRIORIDADE_ROTULOS[tarefa.prioridade]),
          h('span', { class: 'etiqueta status-' + tarefa.status }, STATUS_ROTULOS[tarefa.status]),
          tarefa.responsavel ? h('span', null, '👤 ' + tarefa.responsavel) : null,
          tarefa.prazo ? h('span', null, '📅 ' + tarefa.prazo) : null,
          atrasada ? h('span', { class: 'etiqueta atrasada' }, 'Atrasada') : null,
        ),
        h('div', { class: 'tarefa-acoes', style: 'margin-top:8px' }, selectStatus, botaoExcluir),
        mensagem,
      ),
    ),
  );
}

function formNovaTarefa(area) {
  let tituloEl, grupoEl, prioridadeEl, prazoEl;
  const mensagem = h('span', { class: 'campo-mensagem' });

  const enviar = async () => {
    const titulo = tituloEl.value.trim();
    if (!titulo) { mensagem.className = 'campo-mensagem erro'; mensagem.textContent = 'Informe o título'; return; }
    try {
      await api.post(`/api/areas/${area.slug}/tarefas`, {
        titulo,
        grupo: grupoEl.value.trim() || null,
        prioridade: prioridadeEl.value,
        prazo: prazoEl.value || null,
      });
      tituloEl.value = '';
      grupoEl.value = '';
      prazoEl.value = '';
      await carregarAreas();
      desenharArea(area.slug);
    } catch (e) {
      mensagem.className = 'campo-mensagem erro';
      mensagem.textContent = e.message;
    }
  };

  return h('div', { class: 'card' },
    h('div', { class: 'grupo-titulo' }, 'Nova tarefa'),
    h('div', { class: 'form-linha' },
      h('div', { class: 'campo' }, h('label', null, 'Título'),
        tituloEl = h('input', { type: 'text' })),
      h('div', { class: 'campo' }, h('label', null, 'Grupo'),
        grupoEl = h('input', { type: 'text' })),
      h('div', { class: 'campo' }, h('label', null, 'Prioridade'),
        prioridadeEl = h('select', null, ...Object.entries(PRIORIDADE_ROTULOS).map(([v, r]) => h('option', { value: v }, r)))),
      h('div', { class: 'campo' }, h('label', null, 'Prazo'),
        prazoEl = h('input', { type: 'date' })),
      h('button', { class: 'botao', type: 'button', onclick: enviar }, 'Adicionar'),
    ),
    mensagem,
  );
}

// ---------- aba: dados a colher ----------
async function abaDados(area) {
  const campos = await api.get(`/api/areas/${area.slug}/campos`);
  const grupos = new Map();
  for (const c of campos) {
    const chave = c.grupo || 'Outros';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(c);
  }
  const atualizarCabecalho = async () => { await carregarAreas(); };
  return h('div', null,
    ...[...grupos.entries()].map(([grupo, itens]) =>
      h('div', { class: 'grupo' },
        h('div', { class: 'grupo-titulo' }, grupo),
        ...itens.map((c) => campoDados(c, atualizarCabecalho)),
      )),
  );
}

function campoDados(c, aoSalvar) {
  const mensagem = h('span', { class: 'campo-mensagem' });
  let entrada;

  if (c.tipo === 'longo') {
    entrada = h('textarea', { value: c.valor || '' });
  } else if (c.tipo === 'opcao') {
    const opcoes = String(c.opcoes || '').split(';').filter(Boolean);
    entrada = h('select', null,
      h('option', { value: '' }, '— selecione —'),
      ...opcoes.map((o) => h('option', { value: o }, o)));
    entrada.value = c.valor || '';
  } else if (c.tipo === 'numero') {
    entrada = h('input', { type: 'text', inputmode: 'decimal', value: c.valor || '' });
  } else if (c.tipo === 'data') {
    entrada = h('input', { type: 'date', value: c.valor || '' });
  } else {
    entrada = h('input', { type: 'text', value: c.valor || '' });
  }

  entrada.addEventListener('change', async () => {
    try {
      const novo = await api.put(`/api/campos/${c.id}`, { valor: entrada.value });
      if ('value' in entrada) entrada.value = novo.valor || '';
      c.valor = novo.valor;
      mensagem.className = 'campo-mensagem salvo';
      mensagem.textContent = 'Salvo ✓';
      await aoSalvar();
    } catch (e) {
      mensagem.className = 'campo-mensagem erro';
      mensagem.textContent = e.message;
    }
  });

  return h('div', { class: 'card campo-dado' },
    h('label', null, c.rotulo, c.obrigatorio ? h('span', { class: 'obrigatorio' }, ' *') : null),
    entrada,
    h('span', { class: 'origem' }, `${TIPO_ROTULOS[c.tipo]} · fonte: ${c.origem || '—'}`),
    mensagem,
  );
}

// ---------- aba: avanços ----------
async function abaAvancos(area) {
  const [avancos, tarefas] = await Promise.all([
    api.get(`/api/areas/${area.slug}/avancos`),
    api.get(`/api/areas/${area.slug}/tarefas`),
  ]);

  let tituloEl, dataEl, descricaoEl, tarefaEl;
  const mensagem = h('span', { class: 'campo-mensagem' });
  const hoje = new Date().toISOString().slice(0, 10);

  const enviar = async () => {
    const titulo = tituloEl.value.trim();
    if (!titulo) { mensagem.className = 'campo-mensagem erro'; mensagem.textContent = 'Informe o título'; return; }
    try {
      await api.post(`/api/areas/${area.slug}/avancos`, {
        titulo,
        data_registro: dataEl.value || null,
        descricao: descricaoEl.value.trim() || null,
        tarefa_id: tarefaEl.value || null,
      });
      tituloEl.value = '';
      descricaoEl.value = '';
      tarefaEl.value = '';
      dataEl.value = hoje;
      desenharArea(area.slug);
    } catch (e) {
      mensagem.className = 'campo-mensagem erro';
      mensagem.textContent = e.message;
    }
  };

  const form = h('div', { class: 'card' },
    h('div', { class: 'grupo-titulo' }, 'Registrar avanço'),
    h('div', { class: 'form-linha' },
      h('div', { class: 'campo' }, h('label', null, 'Título'), tituloEl = h('input', { type: 'text' })),
      h('div', { class: 'campo' }, h('label', null, 'Data'), dataEl = h('input', { type: 'date', value: hoje })),
      h('div', { class: 'campo' }, h('label', null, 'Tarefa relacionada (opcional)'),
        tarefaEl = h('select', null,
          h('option', { value: '' }, '— nenhuma —'),
          ...tarefas.map((t) => h('option', { value: t.id }, t.titulo)))),
    ),
    h('div', { class: 'campo', style: 'margin-bottom:10px' }, h('label', null, 'Descrição'),
      descricaoEl = h('textarea', null)),
    h('button', { class: 'botao', type: 'button', onclick: enviar }, 'Registrar'),
    mensagem,
  );

  const linha = (av) => h('div', { class: 'avanco-item' },
    h('div', { class: 'avanco-data' }, av.data_registro + (av.origem === 'automatico' ? ' · automático' : '')),
    h('div', { class: 'avanco-titulo' }, av.titulo),
    av.descricao ? h('div', { class: 'avanco-descricao' }, av.descricao) : null,
    av.tarefa_titulo ? h('div', { class: 'avanco-tarefa' }, '↳ ' + av.tarefa_titulo) : null,
    h('button', {
      class: 'botao perigo',
      type: 'button',
      style: 'margin-top:6px',
      onclick: async () => {
        if (!confirm('Excluir este avanço?')) return;
        try {
          await api.del(`/api/avancos/${av.id}`);
          desenharArea(area.slug);
        } catch (e) {
          avisar(e.message, 'erro');
        }
      },
    }, 'Excluir'),
  );

  return h('div', null,
    form,
    avancos.length ? h('div', null, ...avancos.map(linha)) : h('p', { class: 'vazio' }, 'Nenhum avanço registrado ainda.'),
  );
}

// ---------- atualizar mantendo a rolagem ----------
async function atualizar() {
  const y = window.scrollY;
  await carregarAreas();
  const { slug } = lerHash();
  if (slug) await desenharArea(slug);
  window.scrollTo(0, y);
}

// ---------- início ----------
(async () => {
  try {
    await carregarAreas();
  } catch (e) {
    document.getElementById('conteudo').replaceChildren(h('p', { class: 'vazio' }, e.message));
    return;
  }
  const { slug, aba } = lerHash();
  estado.abaAtual = aba || 'tarefas';
  if (slug) {
    desenharArea(slug);
  } else if (estado.areas.length) {
    ir(estado.areas[0].slug, 'tarefas');
  } else {
    document.getElementById('conteudo').replaceChildren(h('p', { class: 'vazio' }, 'Nenhuma área cadastrada ainda.'));
  }
})();
