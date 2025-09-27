// Node.js/Express proxy for PlantNet API
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');
const app = express();
const upload = multer();

app.use(cors());

const PLANTNET_API_KEY = '2b1001iXI7bhbHm2M1VtGPT1F';

app.post('/api/plantnet', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file received' });
    }
    const form = new FormData();
    form.append('images', req.file.buffer, req.file.originalname);
    form.append('organs', 'auto');
    form.append('api-key', PLANTNET_API_KEY);

    const response = await fetch('https://my-api.plantnet.org/v2/identify/all', {
      method: 'POST',
      body: form
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('PlantNet proxy running on port 5000'));
