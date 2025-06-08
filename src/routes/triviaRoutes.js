import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const normalize = (str) => str?.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "");

// Función para mezclar un arreglo
const shuffleSongs = (songs) => {
    for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    return songs;
};

router.get('/songs', async (req, res) => {
    const artistNameRaw = req.query.artist;
    if (!artistNameRaw) {
        return res.status(400).json({ error: 'Debe proporcionar un nombre de artista para buscar canciones.' });
    }
    const artistName = normalize(artistNameRaw);

    try {
        // 1. Buscar artista para obtener su ID
        const searchArtistUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistNameRaw)}`;
        const artistResp = await fetch(searchArtistUrl);
        const artistData = await artistResp.json();

        if (!artistData.data || artistData.data.length === 0) {
            return res.status(404).json({ error: `No se encontró el artista '${artistNameRaw}'.` });
        }

        // Tomar el primer artista que coincida bien (podrías mejorar lógica de selección)
        const artist = artistData.data.find(a => normalize(a.name) === artistName) || artistData.data[0];
        const artistId = artist.id;

        // 2. Obtener álbumes del artista (limitamos a 6 para no saturar)
        const albumsUrl = `https://api.deezer.com/artist/${artistId}/albums?limit=6`;
        const albumsResp = await fetch(albumsUrl);
        const albumsData = await albumsResp.json();

        if (!albumsData.data || albumsData.data.length === 0) {
            return res.status(404).json({ error: `No se encontraron álbumes para el artista '${artistNameRaw}'.` });
        }

        let allSongs = [];

        // 3. Por cada álbum, obtener sus canciones
        for (const album of albumsData.data) {
            const albumTracksUrl = `https://api.deezer.com/album/${album.id}/tracks`;
            const tracksResp = await fetch(albumTracksUrl);
            const tracksData = await tracksResp.json();

            if (tracksData.data && tracksData.data.length > 0) {
                // Filtrar canciones con preview y que el artista coincida
                const filteredTracks = tracksData.data.filter(track => 
                    track.preview &&
                    normalize(track.artist.name) === artistName
                ).map(track => ({
                    id: track.id,
                    title: track.title,
                    artist: track.artist.name,
                    stream_url: track.preview,
                    duration: track.duration,
                }));

                allSongs = allSongs.concat(filteredTracks);
            }
        }

        // 4. Mezclar canciones y limitar a 30
        allSongs = shuffleSongs(allSongs).slice(0, 30);

        if (!allSongs.length) {
            return res.status(404).json({ error: `No se encontraron canciones para el artista '${artistNameRaw}'.` });
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
