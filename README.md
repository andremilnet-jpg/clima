# Previsão do Tempo Brasil

Página web que mostra a previsão do tempo hora a hora, de hoje até 15 dias à frente, para qualquer cidade do Brasil: temperatura, umidade, vento e chuva.

- Dados: [Open-Meteo](https://open-meteo.com/), gratuita e sem chave de API
- Sem backend e sem build: só `index.html`, `style.css` e `script.js`
- Requisitos completos em [PRD.md](PRD.md)

## Rodar localmente
Abra o `index.html` no navegador com dois cliques, ou suba um servidor local:

```bash
npx serve .
# ou
python -m http.server 8000
```

## Publicar no GitHub Pages
1. Crie um repositório público no GitHub (ex.: `clima`).
2. Envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/clima.git
   git push -u origin main
   ```
3. No repositório, vá em **Settings → Pages**, em *Source* escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. Em 1 ou 2 minutos a página fica no ar em `https://SEU-USUARIO.github.io/clima/`.
