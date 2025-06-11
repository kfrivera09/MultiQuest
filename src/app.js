import express from 'express';
import triviaRoutes from './src/routes/triviaRoutes.js';
import songlessRoutes from './src/routes/songlessRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // Obtiene el nombre del archivo
const __dirname = path.dirname(__filename); // Obtiene el directorio actual

const app = express();
const port = 3000;

// Middleware para servir archivos estáticos (como CSS o imágenes)
app.use(express.static(path.resolve('public')));

// Ruta principal para servir la página de aterrizaje (home.html)
app.get('/', (req, res) => {
    res.sendFile(path.resolve('public/html/home.html')); // Servir home.html como landing principal
});

// Ruta específica para servir Trivia Musical (index.html)
app.get('/trivia', (req, res) => {
    res.sendFile(path.resolve('public/html/index.html')); // Servir index.html al acceder a /trivia
});

// Rutas de la API (incluye las rutas de trivia)
console.log('Cargando rutas desde triviaRoutes.js...');
app.use('/api', triviaRoutes); // Define las rutas específicas para la API

// Ruta para servir la página de Songless (songless.html)
console.log('Cargando rutas desde songlessRoutes.js...');
app.use('/api', songlessRoutes); // Asegúrate de que esta línea exista para incluir las rutas de songlessRoutes

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});