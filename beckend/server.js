// backend/server.js
const express = require('express');
const cors = require('cors');
const ocrRoutes = require('./routes/ocr');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Rota de status
app.get('/status', (req, res) => {
  res.json({ status: 'active', version: '2.0' });
});

// Rotas da API
app.use('/extract', ocrRoutes);

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
