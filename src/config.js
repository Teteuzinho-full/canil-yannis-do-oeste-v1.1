const port = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : `http://localhost:${port}`)).replace(/\/$/, '');
module.exports = { BASE_URL, port };
