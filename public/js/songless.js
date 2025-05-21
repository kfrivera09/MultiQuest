let currentSong = null;
let attemptCount = 0;
let audioDuration = 2;
let roundCount = 1;
const maxRounds = 5;
let selectedArtist = "";
let score = 0; // Inicialización de puntaje
let usedSongs = []; // Lista de canciones ya usadas

const loadingIndicator = document.getElementById('loading-indicator');

// función para mostrar el indicador de carga
function mostrarCarga() {
  loadingIndicator.style.display = 'block';
}

function ocultarCarga() {
  loadingIndicator.style.display = 'none';
}

// Función para normalizar nombres eliminando espacios, tildes y caracteres especiales
const normalizeTitle = (str) => {
    return str?.trim().toLowerCase()
        .normalize("NFD") // Descompone caracteres con acento
        .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas (tildes)
        .replace(/[^a-z0-9 ]/g, ""); // Filtra caracteres especiales
};

// Función para cargar una nueva canción sin repetir
async function loadNewSong() {
    try {
        mostrarCarga(); // Mostrar indicador de carga
        const response = await fetch(`/api/songless?artist=${encodeURIComponent(normalizeTitle(selectedArtist))}`);

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        ocultarCarga(); // Ocultar indicador de carga

        if (data.length === 0) {
            displayMessage("error", "No se encontraron canciones. Intenta con otro artista.");
            return;
        }

        // Filtrar canciones que no han sido usadas
        let availableSongs = data.filter(song => !usedSongs.includes(normalizeTitle(song.title)));

        if (availableSongs.length === 0) {
            displayMessage("error", "No quedan más canciones únicas de este artista. Intenta otro.");
            return;
        }

        // Elegir canción aleatoria de las disponibles
        currentSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        usedSongs.push(normalizeTitle(currentSong.title)); // Agregar a la lista de usadas

        document.getElementById('song-audio').src = currentSong.stream_url;
        console.info(`Nueva canción de la ronda ${roundCount}:`, currentSong.title);
    } catch (error) {
        console.error("Error al cargar la canción:", error);
        displayMessage("error", "Ocurrió un problema al obtener las canciones. Intenta de nuevo.");
    }
}

// Inicia el juego al recibir el nombre del artista
document.getElementById('start-btn').addEventListener('click', () => {
    selectedArtist = normalizeTitle(document.getElementById('artist-input').value.trim());

    if (!selectedArtist) {
        displayMessage("error", "Por favor, ingresa un nombre de artista.");
        return;
    }

    // Oculta el campo de entrada y el botón de inicio
    document.getElementById('artist-input').style.display = "none";
    document.getElementById('start-btn').style.display = "none";

    // Muestra el área del juego
    document.getElementById('game-area').style.display = "block";

    loadNewSong();
});

// Reproducción del fragmento de audio (siempre desde el inicio)
document.getElementById('play-btn').addEventListener('click', () => {
    const audioElement = document.getElementById('song-audio');
    audioElement.currentTime = 0; // 🔄 Reiniciar audio al inicio
    audioElement.play();
    setTimeout(() => {
        if (!audioElement.paused) {
            audioElement.pause();
        }
    }, audioDuration * 1000);
});

// Procesa el intento del usuario
document.getElementById('submit-btn').addEventListener('click', () => {
    const userGuess = normalizeTitle(document.getElementById('song-input').value);
    const attemptsList = document.getElementById('attempts-list');

    // Agregar intento al historial
    const li = document.createElement('li');
    li.textContent = userGuess;
    attemptsList.appendChild(li);

    // 🔎 Comparación mejorada ignorando tildes, símbolos y espacios adicionales
    if (userGuess === normalizeTitle(currentSong.title)) {
        let pointsEarned = 10 - (attemptCount >= 5 ? 6 : attemptCount); // Calcula puntos
        score += pointsEarned;
        displayMessage("success", `¡Correcto! Ganaste ${pointsEarned} puntos. Total: ${score}`);
        nextRound();
    } else {
        attemptCount++;
        if (attemptCount < 6) {
            audioDuration += 2; // ⏳ Aumenta la duración del fragmento
            displayMessage("error", `Incorrecto. Te quedan ${6 - attemptCount} intentos.`);
        } else {
            displayMessage("error", `Perdiste esta ronda. La canción era: ${currentSong.title}. Total: ${score} puntos.`);
            nextRound();
        }
    }
});

// Función para cambiar de ronda
function nextRound() {
    if (roundCount < maxRounds) {
        roundCount++;
        attemptCount = 0;
        audioDuration = 2;
        document.getElementById('attempts-list').innerHTML = "";
        document.getElementById('song-input').value = ""; // ✅ Limpia el campo de entrada
        document.getElementById('round-info').textContent = `Ronda: ${roundCount}/5`;
        loadNewSong();
    } else {
        displayMessage("success", `¡Juego terminado! Has completado las 5 rondas. Puntaje final: ${score}`);
    }
}

// Función para mostrar mensajes en pantalla
function displayMessage(type, text) {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<p class="${type}">${text}</p>`;
}

//boton para volver al home
document.getElementById("back-home-btn").addEventListener("click", () => {
    window.location.href = "home.html";
});