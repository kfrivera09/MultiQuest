import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const normalize = (str) => str?.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "");

// Endpoint para obtener las top tracks de un artista desde Deezer
router.get('/songless', async (req, res) => {
    const artistQuery = req.query.artist?.trim();

    if (!artistQuery) {
        return res.status(400).json({ error: 'Debe proporcionar un nombre de artista.' });
    }

    try {
        // Paso 1: Buscar el artista y obtener su ID
        const searchUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistQuery)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.data || searchData.data.length === 0) {
            return res.status(404).json({ error: `No se encontró el artista '${artistQuery}'.` });
        }

        // Buscar el artista más similar al nombre ingresado
        const matchedArtist = searchData.data.find(a =>
            normalize(a.name).includes(artistQuery)
        ) || searchData.data[0];

        const artistId = matchedArtist.id;
        console.info(`Artista encontrado: ${matchedArtist.name} (ID: ${artistId})`);

        // Paso 2: Obtener las top tracks del artista
        const topTracksUrl = `https://api.deezer.com/artist/${artistId}/top?limit=50`;
        const topTracksResponse = await fetch(topTracksUrl);
        const topTracksData = await topTracksResponse.json();

        if (!topTracksData.data || topTracksData.data.length === 0) {
            return res.status(404).json({ error: `No se encontraron top tracks para '${matchedArtist.name}'.` });
        }

        // Filtrar y mapear las canciones
        const songs = topTracksData.data
            .filter(song => song.preview)
            .map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist?.name,
                stream_url: song.preview,
                duration: song.duration,
            }));

        if (!songs.length) {
            return res.status(404).json({ error: `No hay previews disponibles para las top tracks de '${matchedArtist.name}'.` });
        }

        res.json(songs);
    } catch (error) {
        console.error('Error con Deezer API:', error);
        res.status(500).json({ error: 'Error al obtener canciones. Intenta nuevamente.' });
    }
});

export default router;
