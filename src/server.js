// Execução local / hosts tradicionais. No Vercel o ponto de entrada é api/index.js.
try { process.loadEnvFile(); } catch { /* sem .env: usa variáveis do ambiente */ }
const app = require('./app');
const { BASE_URL, port } = require('./config');
app.listen(port, () => console.log('Yannis do Oeste em ' + BASE_URL));
