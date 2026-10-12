# PRD: Previsão do Tempo Brasil (página web)

## Contexto
O André quer uma página HTML pública onde qualquer pessoa busca uma cidade brasileira e consulta a previsão do tempo hora a hora, de hoje até 15 dias à frente: temperatura, umidade, vento e chuva. A pasta do projeto (`Testes\clima`) está vazia, então tudo começa do zero.

## 1. Visão do produto
- **Público:** público geral, publicado na internet.
- **Problema:** consultar de forma rápida e visual a previsão detalhada (por hora) de qualquer município brasileiro, com até 15 dias de antecedência.
- **Sucesso:** o usuário digita a cidade, escolhe o dia e vê as horas daquele dia em poucos segundos, no celular.

## 2. Requisitos funcionais (v1)
| # | Requisito |
|---|-----------|
| RF1 | Campo de busca com **autocompletar** só de cidades do Brasil. Começa a sugerir a partir de 2 letras, espera 300 ms após a digitação e mostra "Cidade, Estado". |
| RF2 | **Faixa de 15 dias** rolável na horizontal. Cada cartão mostra dia da semana e data, ícone, máx/mín e chuva do dia. "Hoje" vem selecionado. |
| RF3 | Ao clicar num dia aparece o **detalhe por hora** desse dia (00h–23h). Para hoje, a tela rola até a hora atual. |
| RF4 | **Gráfico** do dia com a temperatura em linha e a chuva (mm) em barras. |
| RF5 | **Tabela** hora a hora com hora, ícone, temperatura (°C), umidade (%), vento (km/h) e chuva (mm). |
| RF6 | **Lembrar a última cidade** (localStorage). Ao reabrir, a página carrega a última cidade direto. Sem cidade salva, mostra estado vazio com a busca. |
| RF7 | **Visual dinâmico:** o fundo e a paleta mudam conforme a condição atual e se é dia ou noite (sol, nublado, chuva, tempestade, noite). |
| RF8 | Estados de **carregando**, **erro** (sem internet, API fora) e **cidade não encontrada**, com mensagens em PT-BR. |

**Fora do escopo da v1:** GPS, favoritos, link compartilhável, probabilidade de chuva, alertas, outros idiomas.

## 3. Requisitos não funcionais
- **Celular primeiro:** layout pensado a partir de 360 px, que se amplia no desktop.
- Idioma PT-BR, unidades °C, km/h, mm e %. Datas no formato `seg, 12/10`.
- Desempenho: dados prontos em menos de 2 s numa conexão 4G (a previsão vem numa única chamada).
- Acessibilidade: contraste AA nos fundos dinâmicos, teclado na busca (setas/Enter/Esc), `aria-live` nos estados.
- Sem chave de API, sem backend e sem build.

## 4. Dados: Open-Meteo (gratuita, sem cadastro)
- **Busca de cidades:** `https://geocoding-api.open-meteo.com/v1/search?name={q}&count=8&language=pt&countryCode=BR`, que retorna `name`, `admin1` (estado), `latitude` e `longitude`.
- **Previsão:** `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&timezone=auto&forecast_days=15`
  - `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day`
  - `daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code`
  - `current=temperature_2m,weather_code,is_day` (alimenta o fundo dinâmico)
- O `weather_code` (padrão WMO) é convertido em descrição PT-BR, ícone e tema de fundo.

## 5. Arquitetura / arquivos
```
clima/
├── index.html   # estrutura: cabeçalho+busca, faixa de dias, gráfico, tabela, estados
├── style.css    # mobile-first, variáveis CSS por tema (sol/nublado/chuva/tempestade/noite)
├── script.js    # busca+debounce, fetch Open-Meteo, render, localStorage, mapa WMO
└── README.md    # como rodar e publicar no GitHub Pages
```
- Gráfico com **Chart.js 4.4.1** via cdnjs, com versão fixa.
- Ícones de clima em emoji/SVG inline (sem dependência extra).
- Organização do `script.js`: `buscarCidades()`, `buscarPrevisao()`, `agruparPorDia()`, `renderDias()`, `renderHoras()`, `renderGrafico()`, `aplicarTema()`, `wmo` (tabela código → {texto, ícone, tema}), `salvar/lerUltimaCidade()` (com try/catch).

## 6. Publicação
GitHub Pages: criar um repositório, enviar os 4 arquivos e ativar Pages na branch `main`. O README terá o passo a passo.

## 7. Verificação
1. Abrir `index.html` localmente (ou `npx serve`) e buscar "Campinas", "São Paulo" e "Oiapoque". As sugestões devem mostrar o estado.
2. Conferir os 15 cartões, de hoje (12/10) até 26/10, e que clicar em cada um troca o gráfico e a tabela.
3. Comparar alguns valores com a resposta crua da API.
4. Recarregar a página: a última cidade deve voltar.
5. Usar o DevTools no modo celular (360 px) e no modo offline para checar o layout e a mensagem de erro.
6. Testar o fundo dinâmico com cidades em condições diferentes, ou forçar um `weather_code`.
