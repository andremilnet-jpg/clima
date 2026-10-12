'use strict';

// ===== Configuração =====
const URL_GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_PREVISAO = 'https://api.open-meteo.com/v1/forecast';
const DIAS_PREVISAO = 15;
const CHAVE_STORAGE = 'clima:ultimaCidade';

// Códigos WMO → descrição, ícone (dia/noite) e tema de fundo
const wmo = {
  0:  { texto: 'Céu limpo', dia: '☀️', noite: '🌙', tema: 'sol' },
  1:  { texto: 'Predominantemente limpo', dia: '🌤️', noite: '🌙', tema: 'sol' },
  2:  { texto: 'Parcialmente nublado', dia: '⛅', noite: '☁️', tema: 'nublado' },
  3:  { texto: 'Nublado', dia: '☁️', noite: '☁️', tema: 'nublado' },
  45: { texto: 'Neblina', dia: '🌫️', noite: '🌫️', tema: 'nublado' },
  48: { texto: 'Neblina com geada', dia: '🌫️', noite: '🌫️', tema: 'nublado' },
  51: { texto: 'Garoa fraca', dia: '🌦️', noite: '🌧️', tema: 'chuva' },
  53: { texto: 'Garoa', dia: '🌦️', noite: '🌧️', tema: 'chuva' },
  55: { texto: 'Garoa forte', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  56: { texto: 'Garoa congelante', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  57: { texto: 'Garoa congelante forte', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  61: { texto: 'Chuva fraca', dia: '🌦️', noite: '🌧️', tema: 'chuva' },
  63: { texto: 'Chuva moderada', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  65: { texto: 'Chuva forte', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  66: { texto: 'Chuva congelante', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  67: { texto: 'Chuva congelante forte', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  71: { texto: 'Neve fraca', dia: '🌨️', noite: '🌨️', tema: 'nublado' },
  73: { texto: 'Neve', dia: '🌨️', noite: '🌨️', tema: 'nublado' },
  75: { texto: 'Neve forte', dia: '❄️', noite: '❄️', tema: 'nublado' },
  77: { texto: 'Grãos de neve', dia: '🌨️', noite: '🌨️', tema: 'nublado' },
  80: { texto: 'Pancadas de chuva fracas', dia: '🌦️', noite: '🌧️', tema: 'chuva' },
  81: { texto: 'Pancadas de chuva', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  82: { texto: 'Pancadas de chuva fortes', dia: '🌧️', noite: '🌧️', tema: 'chuva' },
  85: { texto: 'Pancadas de neve', dia: '🌨️', noite: '🌨️', tema: 'nublado' },
  86: { texto: 'Pancadas de neve fortes', dia: '❄️', noite: '❄️', tema: 'nublado' },
  95: { texto: 'Trovoada', dia: '⛈️', noite: '⛈️', tema: 'tempestade' },
  96: { texto: 'Trovoada com granizo', dia: '⛈️', noite: '⛈️', tema: 'tempestade' },
  99: { texto: 'Trovoada forte com granizo', dia: '⛈️', noite: '⛈️', tema: 'tempestade' },
};

function infoTempo(codigo) {
  return wmo[codigo] || { texto: 'Indisponível', dia: '🌡️', noite: '🌡️', tema: 'nublado' };
}

function icone(codigo, ehDia = true) {
  const info = infoTempo(codigo);
  return ehDia ? info.dia : info.noite;
}

// ===== Elementos =====
const el = {
  campo: document.getElementById('campo-busca'),
  sugestoes: document.getElementById('sugestoes'),
  status: document.getElementById('status'),
  vazio: document.getElementById('vazio'),
  conteudo: document.getElementById('conteudo'),
  cidadeNome: document.getElementById('cidade-nome'),
  atualDesc: document.getElementById('atual-desc'),
  atualMinMax: document.getElementById('atual-minmax'),
  atualIcone: document.getElementById('atual-icone'),
  atualValor: document.getElementById('atual-valor'),
  dias: document.getElementById('dias'),
  diaTitulo: document.getElementById('dia-titulo'),
  grafico: document.getElementById('grafico'),
  tabelaWrap: document.getElementById('tabela-wrap'),
  horas: document.getElementById('horas'),
};

const estado = {
  cidade: null,
  dias: [],          // [{ data, max, min, chuva, codigo, horas: [...] }]
  agora: null,       // 'YYYY-MM-DDTHH'
  diaSelecionado: 0,
  sugestoes: [],
  indiceAtivo: -1,
  grafico: null,
};

// ===== Utilidades =====
const fmt = (n) => Math.round(n);
const fmtMm = (n) => (n === 0 ? '0' : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));

function dataLocal(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function nomeDia(iso, indice) {
  if (indice === 0) return 'Hoje';
  if (indice === 1) return 'Amanhã';
  return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function dataCurta(iso) {
  return dataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function dataLonga(iso) {
  return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function nomeCidade(c) {
  return c.admin1 ? `${c.name}, ${c.admin1}` : c.name;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function mostrarStatus(texto, { erro = false, tentarNovamente = null } = {}) {
  el.status.textContent = texto;
  el.status.classList.toggle('erro', erro);
  if (tentarNovamente) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = 'Tentar novamente';
    botao.addEventListener('click', tentarNovamente);
    el.status.appendChild(botao);
  }
}

// ===== Armazenamento =====
function salvarUltimaCidade(cidade) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(cidade));
  } catch (_) { /* armazenamento indisponível: segue sem lembrar */ }
}

function lerUltimaCidade() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    const c = bruto ? JSON.parse(bruto) : null;
    return c && typeof c.latitude === 'number' && typeof c.longitude === 'number' ? c : null;
  } catch (_) {
    return null;
  }
}

// ===== API =====
let controleBusca = null;

async function buscarCidades(termo) {
  if (controleBusca) controleBusca.abort();
  controleBusca = new AbortController();
  const params = new URLSearchParams({
    name: termo, count: '8', language: 'pt', countryCode: 'BR', format: 'json',
  });
  const resp = await fetch(`${URL_GEO}?${params}`, { signal: controleBusca.signal });
  if (!resp.ok) throw new Error(`Geocoding ${resp.status}`);
  const dados = await resp.json();
  return (dados.results || []).map((r) => ({
    name: r.name, admin1: r.admin1 || '', latitude: r.latitude, longitude: r.longitude,
  }));
}

async function buscarPrevisao(cidade) {
  const params = new URLSearchParams({
    latitude: cidade.latitude,
    longitude: cidade.longitude,
    timezone: 'auto',
    forecast_days: String(DIAS_PREVISAO),
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    current: 'temperature_2m,weather_code,is_day',
  });
  const resp = await fetch(`${URL_PREVISAO}?${params}`);
  if (!resp.ok) throw new Error(`Forecast ${resp.status}`);
  return resp.json();
}

// ===== Transformação =====
function agruparPorDia(dados) {
  const h = dados.hourly;
  const porData = {};
  h.time.forEach((t, i) => {
    const data = t.slice(0, 10);
    (porData[data] ||= []).push({
      hora: t.slice(11, 13),
      chave: t.slice(0, 13),
      temp: h.temperature_2m[i],
      umidade: h.relative_humidity_2m[i],
      vento: h.wind_speed_10m[i],
      chuva: h.precipitation[i],
      codigo: h.weather_code[i],
      ehDia: h.is_day[i] === 1,
    });
  });
  const d = dados.daily;
  return d.time.map((data, i) => ({
    data,
    max: d.temperature_2m_max[i],
    min: d.temperature_2m_min[i],
    chuva: d.precipitation_sum[i],
    codigo: d.weather_code[i],
    horas: porData[data] || [],
  }));
}

// ===== Renderização =====
function aplicarTema(codigo, ehDia) {
  const tema = infoTempo(codigo).tema;
  document.body.dataset.tema = !ehDia && tema !== 'tempestade' ? 'noite' : tema;
}

function renderAtual(dados) {
  const c = dados.current;
  const hoje = estado.dias[0];
  const ehDia = c.is_day === 1;
  el.cidadeNome.textContent = nomeCidade(estado.cidade);
  el.atualDesc.textContent = infoTempo(c.weather_code).texto;
  el.atualMinMax.textContent = hoje ? `Máx. ${fmt(hoje.max)}° · Mín. ${fmt(hoje.min)}°` : '';
  el.atualIcone.textContent = icone(c.weather_code, ehDia);
  el.atualValor.textContent = `${fmt(c.temperature_2m)}°`;
  aplicarTema(c.weather_code, ehDia);
}

function renderDias() {
  el.dias.innerHTML = '';
  estado.dias.forEach((dia, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dia';
    b.setAttribute('aria-pressed', String(i === estado.diaSelecionado));
    b.setAttribute('aria-label',
      `${nomeDia(dia.data, i)} ${dataCurta(dia.data)}: ${infoTempo(dia.codigo).texto}, ` +
      `máxima ${fmt(dia.max)}°, mínima ${fmt(dia.min)}°, chuva ${fmtMm(dia.chuva)} milímetros`);
    b.innerHTML = `
      <span class="dia-nome">${nomeDia(dia.data, i)}</span>
      <span class="dia-data">${dataCurta(dia.data)}</span>
      <span class="dia-icone" aria-hidden="true">${icone(dia.codigo)}</span>
      <span class="dia-temp">${fmt(dia.max)}° <span class="min">${fmt(dia.min)}°</span></span>
      <span class="dia-chuva">💧 ${fmtMm(dia.chuva)} mm</span>`;
    b.addEventListener('click', () => selecionarDia(i));
    el.dias.appendChild(b);
  });
}

function selecionarDia(i) {
  estado.diaSelecionado = i;
  [...el.dias.children].forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
  renderHoras();
  renderGrafico();
}

function renderHoras() {
  const dia = estado.dias[estado.diaSelecionado];
  el.diaTitulo.textContent = `Hora a hora · ${dataLonga(dia.data)}`;
  el.horas.innerHTML = dia.horas.map((h) => `
    <tr class="${h.chave === estado.agora ? 'agora' : ''}">
      <td>${h.chave === estado.agora ? 'Agora' : `${h.hora}h`}</td>
      <td class="ic" title="${infoTempo(h.codigo).texto}">${icone(h.codigo, h.ehDia)}</td>
      <td class="temp">${fmt(h.temp)}°</td>
      <td>${fmt(h.umidade)}%</td>
      <td>${fmt(h.vento)}</td>
      <td class="${h.chuva > 0 ? 'chove' : ''}">${fmtMm(h.chuva)}</td>
    </tr>`).join('');

  // Rola a tabela até a hora atual (só no dia de hoje)
  const linhaAgora = el.horas.querySelector('tr.agora');
  const cabecalho = el.tabelaWrap.querySelector('thead');
  el.tabelaWrap.scrollTop = linhaAgora ? linhaAgora.offsetTop - cabecalho.offsetHeight : 0;
}

function renderGrafico() {
  if (typeof Chart === 'undefined') return; // CDN indisponível: a tabela continua funcionando
  const dia = estado.dias[estado.diaSelecionado];
  const rotulos = dia.horas.map((h) => `${h.hora}h`);
  const temps = dia.horas.map((h) => h.temp);
  const chuvas = dia.horas.map((h) => h.chuva);

  if (estado.grafico) {
    estado.grafico.data.labels = rotulos;
    estado.grafico.data.datasets[0].data = temps;
    estado.grafico.data.datasets[1].data = chuvas;
    estado.grafico.update();
    return;
  }

  const corTexto = 'rgba(255,255,255,0.85)';
  const corGrade = 'rgba(255,255,255,0.12)';
  estado.grafico = new Chart(el.grafico, {
    data: {
      labels: rotulos,
      datasets: [
        {
          type: 'line', label: 'Temperatura (°C)', data: temps, yAxisID: 'yTemp',
          borderColor: '#ffd166', backgroundColor: 'rgba(255,209,102,0.18)',
          fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2.5,
        },
        {
          type: 'bar', label: 'Chuva (mm)', data: chuvas, yAxisID: 'yChuva',
          backgroundColor: 'rgba(127,211,255,0.75)', borderRadius: 3, maxBarThickness: 14,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: corTexto, boxWidth: 12, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.yAxisID === 'yTemp'
              ? ` Temperatura: ${fmt(ctx.parsed.y)}°C`
              : ` Chuva: ${fmtMm(ctx.parsed.y)} mm`,
          },
        },
      },
      scales: {
        x: { ticks: { color: corTexto, maxTicksLimit: 8 }, grid: { display: false } },
        yTemp: {
          position: 'left',
          ticks: { color: corTexto, callback: (v) => `${v}°` },
          grid: { color: corGrade },
        },
        yChuva: {
          position: 'right', min: 0, suggestedMax: 5,
          ticks: { color: corTexto, callback: (v) => `${v} mm` },
          grid: { display: false },
        },
      },
    },
  });
}

// ===== Fluxo principal =====
async function carregarCidade(cidade) {
  estado.cidade = cidade;
  el.campo.value = nomeCidade(cidade);
  mostrarStatus(`Carregando previsão de ${nomeCidade(cidade)}…`);
  try {
    const dados = await buscarPrevisao(cidade);
    estado.dias = agruparPorDia(dados);
    estado.agora = dados.current.time.slice(0, 13);
    estado.diaSelecionado = 0;
    salvarUltimaCidade(cidade);

    el.vazio.hidden = true;
    el.conteudo.hidden = false;
    renderAtual(dados);
    renderDias();
    el.dias.scrollLeft = 0;
    selecionarDia(0);
    mostrarStatus('');
  } catch (erro) {
    console.error(erro);
    mostrarStatus('Não foi possível carregar a previsão. Verifique sua conexão.', {
      erro: true, tentarNovamente: () => carregarCidade(cidade),
    });
  }
}

// ===== Autocompletar =====
function fecharSugestoes() {
  el.sugestoes.hidden = true;
  el.sugestoes.innerHTML = '';
  el.campo.setAttribute('aria-expanded', 'false');
  el.campo.removeAttribute('aria-activedescendant');
  estado.sugestoes = [];
  estado.indiceAtivo = -1;
}

function mostrarInfoSugestao(texto) {
  el.sugestoes.innerHTML = `<li class="info" role="option" aria-disabled="true">${texto}</li>`;
  el.sugestoes.hidden = false;
  el.campo.setAttribute('aria-expanded', 'true');
}

function renderSugestoes() {
  el.sugestoes.innerHTML = '';
  estado.sugestoes.forEach((c, i) => {
    const li = document.createElement('li');
    li.id = `sugestao-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === estado.indiceAtivo));
    li.innerHTML = `<strong></strong> <small></small>`;
    li.querySelector('strong').textContent = c.name;
    li.querySelector('small').textContent = c.admin1;
    // mousedown para disparar antes do blur do campo
    li.addEventListener('mousedown', (e) => { e.preventDefault(); escolherSugestao(i); });
    el.sugestoes.appendChild(li);
  });
  el.sugestoes.hidden = false;
  el.campo.setAttribute('aria-expanded', 'true');
  if (estado.indiceAtivo >= 0) {
    el.campo.setAttribute('aria-activedescendant', `sugestao-${estado.indiceAtivo}`);
    el.sugestoes.children[estado.indiceAtivo].scrollIntoView({ block: 'nearest' });
  } else {
    el.campo.removeAttribute('aria-activedescendant');
  }
}

function escolherSugestao(i) {
  const cidade = estado.sugestoes[i];
  if (!cidade) return;
  fecharSugestoes();
  el.campo.blur();
  carregarCidade(cidade);
}

const aoDigitar = debounce(async () => {
  const termo = el.campo.value.trim();
  if (termo.length < 2) { fecharSugestoes(); return; }
  try {
    const resultados = await buscarCidades(termo);
    // usuário já digitou outra coisa ou saiu do campo
    if (el.campo.value.trim() !== termo || document.activeElement !== el.campo) return;
    estado.sugestoes = resultados;
    estado.indiceAtivo = resultados.length ? 0 : -1;
    if (resultados.length) renderSugestoes();
    else mostrarInfoSugestao('Nenhuma cidade encontrada no Brasil.');
  } catch (erro) {
    if (erro.name === 'AbortError') return;
    console.error(erro);
    mostrarInfoSugestao('Erro ao buscar cidades. Verifique sua conexão.');
  }
}, 300);

el.campo.addEventListener('input', aoDigitar);

el.campo.addEventListener('keydown', (e) => {
  const total = estado.sugestoes.length;
  if (e.key === 'ArrowDown' && total) {
    e.preventDefault();
    estado.indiceAtivo = (estado.indiceAtivo + 1) % total;
    renderSugestoes();
  } else if (e.key === 'ArrowUp' && total) {
    e.preventDefault();
    estado.indiceAtivo = (estado.indiceAtivo - 1 + total) % total;
    renderSugestoes();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (total) escolherSugestao(Math.max(estado.indiceAtivo, 0));
  } else if (e.key === 'Escape') {
    fecharSugestoes();
  }
});

el.campo.addEventListener('focus', () => el.campo.select());
el.campo.addEventListener('blur', () => setTimeout(fecharSugestoes, 100));

// ===== Início =====
const ultima = lerUltimaCidade();
if (ultima) carregarCidade(ultima);
