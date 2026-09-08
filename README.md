# Burnwatch

On-device LLM spend radar. OpenAI, Anthropic, Groq, and Gemini usage stay in **this browser**. No server, no accounts.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Use

1. Click **Load a sample month**, or go to **Sources** and upload a CSV.
2. CSV header: `date,model,cost_usd,input_tokens,output_tokens,requests`
3. Dates must be `YYYY-MM-DD`. If cost is missing, Burnwatch estimates from tokens.
4. Set a monthly cap under **Budgets**.
5. **Export local backup** keeps a JSON file on your computer.

Data is stored in this browser (`localStorage` key `burnwatch-workspace`). Wipe it from Sources.

## Build static files

```bash
npm run build
```

The `dist/` folder is a static site. Host it on GitHub Pages, Netlify, or Cloudflare Pages — still fully client-side.
