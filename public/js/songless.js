let currentSong = null;
let attemptCount = 0;
let audioDuration = 2;
let roundCount = 1;
const maxRounds = 5;
let selectedArtist = "";
let score = 0;
let usedSongs = [];

const loadingIndicator = document.getElementById('loading-indicator');

function mostrarCarga() {
  loadingIndicator.style.display = 'block';
}

function ocultarCarga() {
  loadingIndicator.style.display = 'none';
}
// Función mejorada para normalizar títulos y entradas del usuario
const normalizeTitle = (str) => {
    return str?.trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")       
        .replace(/\(feat[^\)]*\)/gi, "")       
        .replace(/\[feat[^\]]*\]/gi, "")         
        .replace(/[^a-z0-9]/g, "")               
        .replace(/\s+/g, "");                    
};

async function loadNewSong() {
    try {
        mostrarCarga();
        const response = await fetch(`/api/songless?artist=${encodeURIComponent(normalizeTitle(selectedArtist))}`);

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        ocultarCarga();

        if (data.length === 0) {
            displayMessage("error", "No se encontraron canciones. Intenta con otro artista.");
            return;
        }

        let availableSongs = data.filter(song => !usedSongs.includes(normalizeTitle(song.title)));

        if (availableSongs.length === 0) {
            displayMessage("error", "No quedan más canciones únicas de este artista. Intenta otro.");
            return;
        }

        currentSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        usedSongs.push(normalizeTitle(currentSong.title));

        document.getElementById('song-audio').src = currentSong.stream_url;
        console.info(`Nueva canción de la ronda ${roundCount}:`, currentSong.title);
    } catch (error) {
        console.error("Error al cargar la canción:", error);
        displayMessage("error", "Ocurrió un problema al obtener las canciones. Intenta de nuevo.");
    }
}

document.getElementById('start-btn').addEventListener('click', () => {
    selectedArtist = normalizeTitle(document.getElementById('artist-input').value.trim());

    if (!selectedArtist) {
        displayMessage("error", "Por favor, ingresa un nombre de artista.");
        return;
    }

    document.getElementById('artist-input').style.display = "none";
    document.getElementById('start-btn').style.display = "none";
    document.getElementById('game-area').style.display = "block";

    loadNewSong();
});

document.getElementById('play-btn').addEventListener('click', () => {
    const audioElement = document.getElementById('song-audio');
    audioElement.currentTime = 0;
    audioElement.play();
    setTimeout(() => {
        if (!audioElement.paused) {
            audioElement.pause();
        }
    }, audioDuration * 1000);
});

document.getElementById('submit-btn').addEventListener('click', () => {
    const userGuess = normalizeTitle(document.getElementById('song-input').value);
    const attemptsList = document.getElementById('attempts-list');

    const li = document.createElement('li');
    li.textContent = userGuess;
    attemptsList.appendChild(li);

    if (userGuess === normalizeTitle(currentSong.title)) {
        let pointsEarned = 10 - (attemptCount >= 5 ? 6 : attemptCount);
        score += pointsEarned;
        displayMessage("success", `¡Correcto! Ganaste ${pointsEarned} puntos. Total: ${score}`);
        nextRound();
    } else {
        attemptCount++;
        if (attemptCount < 6) {
            audioDuration += 2;
            displayMessage("error", `Incorrecto. Te quedan ${6 - attemptCount} intentos.`);
        } else {
            displayMessage("error", `Perdiste esta ronda. La canción era: ${currentSong.title}. Total: ${score} puntos.`);
            nextRound();
        }
    }
});

function showFinalScore() {
    const gameArea = document.getElementById('game-area');
    const finalScoreDiv = document.getElementById('final-score');
    const finalPoints = document.getElementById('final-points');
    const finalMessage = document.getElementById('final-message');

    gameArea.style.display = "none";
    finalScoreDiv.style.display = "block";
    finalPoints.textContent = score;

    if (score === 50) {
        finalMessage.textContent = "¡Impresionante! Adivinaste todo perfectamente. 🏆";
    } else if (score >= 30) {
        finalMessage.textContent = "¡Muy bien! Lo hiciste genial 🎶";
    } else {
        finalMessage.textContent = "¡Buen intento! Puedes mejorar la próxima vez 🎧";
    }
}

function nextRound() {
    if (roundCount < maxRounds) {
        roundCount++;
        attemptCount = 0;
        audioDuration = 2;
        document.getElementById('attempts-list').innerHTML = "";
        document.getElementById('song-input').value = "";
        document.getElementById('round-info').textContent = `Ronda: ${roundCount}/5`;
        loadNewSong();
    } else {
        displayMessage("success", `¡Juego terminado! Puntaje final: ${score}`);
        setTimeout(() => {
            showFinalScore();
        }, 1000);
    }
}

function displayMessage(type, text) {
    const messageArea = document.getElementById('message-area');
    messageArea.className = "";
    if (type === "error") {
        messageArea.classList.add("message-error");
    } else if (type === "success") {
        messageArea.classList.add("message-success");
    }
    messageArea.textContent = text;
}

document.getElementById("restart-btn").addEventListener("click", () => {
    currentSong = null;
    attemptCount = 0;
    audioDuration = 2;
    roundCount = 1;
    score = 0;
    usedSongs = [];
    selectedArtist = "";

    const artistInput = document.getElementById('artist-input');
    artistInput.value = "";
    artistInput.style.display = "block";
    document.getElementById('start-btn').style.display = "inline-block";

    document.getElementById('game-area').style.display = "none";
    document.getElementById('final-score').style.display = "none";
    document.getElementById('song-input').value = "";
    document.getElementById('attempts-list').innerHTML = "";
    document.getElementById('round-info').textContent = `Ronda: 1/5`;
    document.getElementById('message-area').textContent = "";
});

document.getElementById("back-home-btn").addEventListener("click", () => {
    window.location.href = "home.html";
});
