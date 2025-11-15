// api/status.js
module.exports = (req, res) => {
  res.json({ status: 'active', version: 'Vercel v1.0' });
};
