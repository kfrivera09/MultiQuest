import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Función para normalizar nombres eliminando espacios, tildes y caracteres innecesarios
const normalize = (str) => str?.trim().toLowerCase()
    .normalize("NFD") // Descompone caracteres con acento
    .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas (tildes)
    .replace(/[^a-z0-9 ]/g, ""); // Filtra caracteres especiales

// Endpoint para obtener canciones desde Deezer
router.get('/songs', async (req, res) => {
    const artist = normalize(req.query.artist);
    console.log('Artista recibido en el backend:', req.query.artist);
    console.log('Artista después de procesar:', artist);

    if (!artist) {
        return res.status(400).json({
            error: 'Debe proporcionar un nombre de artista para buscar canciones.',
        });
    }

    try {
        const resultsPerPage = 100;
        let allSongs = [];

        let pageIndex = 0;

        while (true) {
            const url = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(req.query.artist)}"&limit=${resultsPerPage}&index=${pageIndex * resultsPerPage}`;
            console.info('Consulta construida para Deezer:', url);

            const response = await fetch(url, { method: 'GET' });
            const data = await response.json();

            console.info('Respuesta completa de Deezer:', data);

            if (!data.data || data.data.length === 0) break;

            const pageSongs = data.data
                .filter(song => 
                    song.preview &&
                    normalize(song.artist?.name).includes(artist) // Coincidencia flexible
                )
                .map(song => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist?.name || 'Artista desconocido',
                    stream_url: song.preview,
                    duration: song.duration,
                }));

            allSongs = [...allSongs, ...pageSongs];
            pageIndex++;
        }

        // Mezclar las canciones de manera aleatoria
        const shuffleSongs = (songs) => {
            for (let i = songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }
            return songs;
        };

        // Seleccionar aleatoriamente 20 canciones
        allSongs = shuffleSongs(allSongs).slice(0, 20);

        if (!allSongs.length) {
            return res.status(404).json({
                error: `No se encontraron canciones para el artista '${req.query.artist}'.`,
            });
        }

        res.json(allSongs);
    } catch (error) {
        console.error('Error al conectar con Deezer API:', error);
        res.status(500).json({
            error: 'Hubo un problema al obtener canciones. Por favor, intenta nuevamente.',
        });
    }
});

export default router;