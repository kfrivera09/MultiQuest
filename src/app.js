import express from 'express';
import triviaRoutes from './routes/triviaRoutes.js';
import songlessRoutes from './routes/songlessRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Archivos estáticos (como CSS, JS e imágenes)
app.use(express.static(path.resolve('public')));

// Página de inicio (landing)
app.get('/', (req, res) => {
  res.sendFile(path.resolve('public/html/home.html'));
});

// Página de la trivia musical
app.get('/trivia', (req, res) => {
  res.sendFile(path.resolve('public/html/index.html'));
});

// Rutas de APIs
console.log('Cargando rutas desde triviaRoutes.js...');
app.use('/api', triviaRoutes);

console.log('Cargando rutas desde songlessRoutes.js...');
app.use('/api', songlessRoutes);

// No usamos app.listen()
export default app;
