import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

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

  try {
    // Buscar artista por nombre
    const searchArtistUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistNameRaw)}`;
    const artistResp = await fetch(searchArtistUrl);
    const artistData = await artistResp.json();

    if (!artistData.data || artistData.data.length === 0) {
      return res.status(404).json({ error: `No se encontró el artista '${artistNameRaw}'.` });
    }

    // Seleccionar el primer artista encontrado (más relevante)
    const selectedArtist = artistData.data[0];
    const artistId = selectedArtist.id;

    let allSongs = [];

    // Obtener álbumes
    const albumsUrl = `https://api.deezer.com/artist/${artistId}/albums?limit=8`;
    const albumsResp = await fetch(albumsUrl);
    const albumsData = await albumsResp.json();

    if (albumsData.data && albumsData.data.length > 0) {
      for (const album of albumsData.data) {
        const albumTracksUrl = `https://api.deezer.com/album/${album.id}/tracks`;
        const tracksResp = await fetch(albumTracksUrl);
        const tracksData = await tracksResp.json();

        if (tracksData.data && tracksData.data.length > 0) {
          const filteredTracks = tracksData.data.filter(track => track.preview).map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist.name,
            stream_url: track.preview,
            duration: track.duration,
          }));
          allSongs = allSongs.concat(filteredTracks);
        }
      }
    }

    // Si no hay suficientes, buscar top tracks
    if (allSongs.length < 10) {
      const topTracksUrl = `https://api.deezer.com/artist/${artistId}/top?limit=15`;
      const topResp = await fetch(topTracksUrl);
      const topData = await topResp.json();

      if (topData.data && topData.data.length > 0) {
        const topSongs = topData.data.filter(track => track.preview).map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist.name,
          stream_url: track.preview,
          duration: track.duration,
        }));
        allSongs = allSongs.concat(topSongs);
      }
    }

    // Si aún no hay suficientes, buscar canciones globales por nombre del artista
    if (allSongs.length < 20) {
      const globalSearchUrl = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistNameRaw)}"`;
      const globalResp = await fetch(globalSearchUrl);
      const globalData = await globalResp.json();

      if (globalData.data && globalData.data.length > 0) {
        const globalTracks = globalData.data.filter(track => track.preview).map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist.name,
          stream_url: track.preview,
          duration: track.duration,
        }));
        allSongs = allSongs.concat(globalTracks);
      }
    }

    allSongs = shuffleSongs(allSongs).slice(0, 30);

    if (!allSongs.length) {
      return res.status(404).json({ error: `No se encontraron canciones para el artista '${artistNameRaw}'.` });
    }

    res.json({
      artist: selectedArtist.name,
      songs: allSongs
    });

  } catch (error) {
    console.error('Error al conectar con Deezer API:', error);
    res.status(500).json({
      error: 'Hubo un problema al obtener canciones. Por favor, intenta nuevamente.',
    });
  }
});

export default router;
