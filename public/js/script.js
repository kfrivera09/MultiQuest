
// ------------------- VARIABLES GLOBALES -------------------
let remainingAttempts = 2;
let currentRound = 1;
const totalRounds = 5;
let score = 0;
let fragmentDuration = 3;
let audio = new Audio();
let usedSongs = [];
let selectedArtist = '';

// ------------------- ELEMENTOS DEL DOM -------------------
const playGameBtn = document.getElementById('play-game-btn');
const playFragmentBtn = document.getElementById('play-fragment-btn');
const optionsContainer = document.getElementById('answers-container');
const questionText = document.getElementById('question-text');
const feedback = document.getElementById('feedback');
const menuSection = document.getElementById('menu');
const quizSection = document.getElementById('quiz');
const attemptsElement = document.getElementById('attempts');
const scoreElement = document.getElementById('score');
const resultSection = document.getElementById('result');
const resultScore = document.querySelector('#result p span');
const restartBtn = document.getElementById('restart-btn');
const artistForm = document.getElementById('artist-form');
const loadingIndicator = document.getElementById('loading-indicator');

// ------------------- FUNCIONES -------------------
function mostrarCarga() {
  loadingIndicator.style.display = 'block';
}

function ocultarCarga() {
  loadingIndicator.style.display = 'none';
}

playFragmentBtn.addEventListener('click', () => {
  if (audio.src && audio.src !== "") {
    playFragment(audio.src);
  } else {
    feedback.textContent = 'Por favor, selecciona una canción válida antes de reproducir.';
  }
});

function playFragment(url) {
  if (!url || typeof url !== 'string') {
    feedback.textContent = 'Lo sentimos, no hay fragmentos disponibles para esta canción.';
    playFragmentBtn.textContent = '🎧 Reproducir Fragmento';
    playFragmentBtn.disabled = false;
    return;
  }

  audio.pause();
  audio = new Audio(url);
  audio.currentTime = 0;

  playFragmentBtn.textContent = 'Cargando...';
  playFragmentBtn.disabled = true;

  audio.addEventListener('canplaythrough', () => {
    audio.play().then(() => {
      playFragmentBtn.textContent = '🎧 Reproducir Fragmento';
      playFragmentBtn.disabled = false;
      setTimeout(() => audio.pause(), fragmentDuration * 1000);
    }).catch(() => {
      feedback.textContent = 'Error al reproducir el fragmento.';
      playFragmentBtn.textContent = '🎧 Reproducir Fragmento';
      playFragmentBtn.disabled = false;
    });
  }, { once: true });
}

function updateProgress() {
  const progressElement = document.getElementById('game-progress');
  if (progressElement) {
    progressElement.textContent = `Ronda ${currentRound} de ${totalRounds}`;
  }
}

playGameBtn.addEventListener('click', () => {
  menuSection.style.display = 'none';
  artistForm.style.display = 'block';
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateOptions(correctSong, songs) {
  const incorrects = shuffleArray(songs.filter(song => song.id !== correctSong.id)).slice(0, 2);
  return shuffleArray([correctSong.title, ...incorrects.map(song => song.title)]);
}

function displayQuestion(correctSong, options) {
  questionText.textContent = '¿Cuál es el título de esta canción?';
  optionsContainer.innerHTML = '';

  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.className = 'option-btn';
    btn.onclick = () => checkAnswer(option, correctSong.title);
    optionsContainer.appendChild(btn);
  });
}

async function startGame() {
  updateProgress();
  const songs = await fetchSongs(selectedArtist);
  if (!songs.length) {
    feedback.textContent = 'No hay canciones disponibles.';
    playFragmentBtn.disabled = true;
    return;
  }

  const song = getRandomSong(songs);
  if (!song || !song.stream_url) {
    feedback.textContent = 'Esta canción no tiene fragmento disponible.';
    playFragmentBtn.disabled = true;
    return;
  }

  remainingAttempts = 2;
  attemptsElement.textContent = remainingAttempts;

  audio.src = song.stream_url;
  playFragmentBtn.disabled = false;
  feedback.textContent = '';

  const options = generateOptions(song, songs);
  displayQuestion(song, options);
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    const gained = remainingAttempts === 2 ? 5 : 2;
    score += gained;
    scoreElement.textContent = score;
    feedback.textContent = `¡Correcto! 🎉 +${gained} puntos`;

    currentRound++;
    fragmentDuration = 3;
    remainingAttempts = 2;
    attemptsElement.textContent = remainingAttempts;

    if (currentRound > totalRounds) {
      endGame(true);
    } else {
      updateProgress();
      startGame();
    }
  } else {
    remainingAttempts--;
    attemptsElement.textContent = remainingAttempts;
    feedback.textContent = '¡Incorrecto! Intenta de nuevo.';

    if (remainingAttempts <= 0) {
      endGame(false);
    } else {
      fragmentDuration += 3;
      playFragment(audio.src);
    }
  }
}

function endGame(success) {
  quizSection.style.display = 'none';
  hideScoreContainer();
  resultSection.style.display = 'block';
  resultScore.textContent = score;

  if (success) {
    feedback.textContent = '¡Felicitaciones! 🎉 Has completado el juego.';
    resultSection.style.backgroundColor = '#DFF0D8';
  } else {
    feedback.textContent = '¡Juego terminado! No te quedan intentos.';
    resultSection.style.backgroundColor = '#F2DEDE';
  }
}

async function fetchSongs(selectedArtist) {
  try {
    if (!selectedArtist) {
      throw new Error('selectedArtist está indefinido.');
    }

    const apiUrl = `/api/songs?artist=${encodeURIComponent(selectedArtist)}`;
    mostrarCarga();

    const res = await fetch(apiUrl);
    if (res.status === 404) {
      const { error } = await res.json();
      feedback.textContent = error || 'No se encontró el artista.';
      return [];
    }
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener canciones.`);
    }

    const data = await res.json();
    const songs = data.songs || [];
    const artistRealName = data.artist || selectedArtist;
    const artistTitleEl = document.getElementById('artist-title');
    if (artistTitleEl) artistTitleEl.textContent = `🎵 Artista: ${artistRealName}`;

    return songs;
  } catch (err) {
    feedback.textContent = 'No se pudieron cargar las canciones. Intenta más tarde.';
    return [];
  } finally {
    ocultarCarga();
  }
}

function getRandomSong(songs) {
  const availableSongs = songs.filter(song => !usedSongs.includes(song.id));
  if (availableSongs.length === 0) {
    usedSongs = [];
    return getRandomSong(songs);
  }
  const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
  usedSongs.push(randomSong.id);
  return randomSong;
}

document.getElementById('artist-search-btn').addEventListener('click', () => {
  const artistName = document.getElementById('artist-name').value.trim();
  if (!artistName) {
    feedback.textContent = 'Por favor, introduce un nombre de artista válido.';
    return;
  }

  selectedArtist = artistName;
  artistForm.style.display = 'none';
  quizSection.style.display = 'flex';
  showScoreContainer();
  startGame();
});

function showScoreContainer() {
  document.getElementById('score-container').style.display = 'block';
}

function hideScoreContainer() {
  document.getElementById('score-container').style.display = 'none';
}

document.getElementById("back-home-btn").addEventListener("click", () => {
  window.location.href = "home.html";
});

restartBtn.addEventListener('click', () => {
  resultSection.style.display = 'none';
  quizSection.style.display = 'flex';
  currentRound = 1;
  score = 0;
  remainingAttempts = 2;
  fragmentDuration = 3;
  usedSongs = [];
  scoreElement.textContent = score;
  attemptsElement.textContent = remainingAttempts;
  feedback.textContent = '';
  updateProgress();
  showScoreContainer();
  startGame();
});

function volverAInicio() {
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
}

document.getElementById("mid-restart-btn").addEventListener("click", volverAInicio);


