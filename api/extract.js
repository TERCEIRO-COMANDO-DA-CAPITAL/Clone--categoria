// api/extract.js
const { createWorker } = require('tesseract.js');
const fetch = require('node-fetch');
const FormData = require('form-data');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  let buffer;
  const webhook = req.body.discord_webhook;

  try {
    // --- 1. Pegar imagem (URL ou upload) ---
    if (req.body.url) {
      const response = await fetch(req.body.url);
      if (!response.ok) throw new Error('Falha ao baixar imagem');
      buffer = Buffer.from(await response.arrayBuffer());
    } else if (req.files?.image) {
      buffer = req.files.image.data;
    } else {
      return res.status(400).json({ error: 'Envie url ou image' });
    }

    // --- 2. OCR com Tesseract (suporte a emojis) ---
    const worker = await createWorker('por+eng');
    const { data: { text } } = await worker.recognize(buffer, {
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789áàâãéèêíóôõúçñÁÀÂÃÉÈÊÍÓÔÕÚÇÑ!@#$%^&*()_+-=[]{}|;:",./<>?😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵😡😠🤬😷🤒🤕🤢🤮🤧😇🤠🥳🥸🤓🧐'
    });
    await worker.terminate();

    // --- 3. Extrair com regex flexível ---
    const catRegex = /Categoria\s*\(([\s\S]*?)\)/gi;
    const canalRegex = /Canal\s*\(([\s\S]*?)\)/gi;

    const categorias = [...text.matchAll(catRegex)].map(m => m[1].trim());
    const canais = [...text.matchAll(canalRegex)].map(m => m[1].trim());

    if (categorias.length === 0 && canais.length === 0) {
      return res.status(404).json({ error: 'Nada encontrado' });
    }

    const result = { categorias, canais };

    // --- 4. Enviar para Discord (opcional) ---
    if (webhook) {
      try {
        await axios.post(webhook, {
          embeds: [{
            title: 'OCR Extraído com Sucesso',
            description: `**Categorias:**\n${categorias.join('\n')}\n\n**Canais:**\n${canais.join('\n')}`,
            color: 0x00ff88,
            timestamp: new Date()
          }]
        });
      } catch (e) { console.error('Discord error:', e.message); }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
