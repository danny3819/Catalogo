const express = require('express');
const app = express();
const productos = require('./data/productos.json');

// servir frontend
app.use(express.static('public'));

// API
app.get('/api/productos', (req, res) => {
  res.json(productos);
});

// puerto dinámico para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});