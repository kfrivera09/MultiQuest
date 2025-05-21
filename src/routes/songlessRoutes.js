import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Función para normalizar nombres eliminando espacios, tildes y caracteres innecesarios
const normalize = (str) => str?.trim().toLowerCase()
    .normalize("NFD") // Descompone caracteres con acento
    .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas (tildes)
    .replace(/[^a-z0-9 ]/g, ""); // Filtra caracteres especiales

// Endpoint para obtener canciones desde Deezer
router.get('/songless', async (req, res) => {
    const artist = normalize(req.query.artist);

    if (!artist) {
        return res.status(400).json({ error: 'Debe proporcionar un nombre de artista.' });
    }

    try {
        const resultsPerPage = 50;
        let allSongs = [];
        let pageIndex = 0;

        while (true) {
            const url = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artist)}"&limit=${resultsPerPage}&index=${pageIndex * resultsPerPage}`;
            console.info('Consulta a Deezer:', url);

            const response = await fetch(url);

            // Validación de la respuesta JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Error: La respuesta no es JSON válida.");
                return res.status(500).json({ error: "Error al obtener datos de Deezer." });
            }

            const data = await response.json();

            if (!data.data || data.data.length === 0) break;

            console.info("Canciones recibidas de Deezer:", data.data);

            const pageSongs = data.data
                .filter(song => song.preview && normalize(song.artist?.name).includes(artist)) // Coincidencia flexible
                .map(song => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist?.name,
                    stream_url: song.preview,
                    duration: song.duration,
                }));

            allSongs = [...allSongs, ...pageSongs];
            pageIndex++;
        }

        if (!allSongs.length) {
            return res.status(404).json({ error: `No se encontraron canciones para '${artist}'.` });
        }

        res.json(allSongs);
    } catch (error) {
        console.error('Error con Deezer API:', error);
        res.status(500).json({ error: 'Error al obtener canciones. Intenta nuevamente.' });
    }
});
export default router;