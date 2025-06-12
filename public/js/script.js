// ------------------- VARIABLES GLOBALES -------------------
let remainingAttempts = 2;
let currentRound = 1;
const totalRounds = 5;
let score = 0;
let fragmentDuration = 3;
let audio = new Audio();
let usedSongs = [];
let selectedArtist = ''; // Almacenar el artista seleccionado

// ------------------- ELEMENTOS DEL DOM -------------------
const playGameBtn = document.getElementById('play-game-btn'); // Botón "Jugar"
const playFragmentBtn = document.getElementById('play-fragment-btn'); // Botón "Reproducir Fragmento"
const optionsContainer = document.getElementById('answers-container');
const questionText = document.getElementById('question-text');
const feedback = document.getElementById('feedback');
const menuSection = document.getElementById('menu');
const quizSection = document.getElementById('quiz'); // Sección principal del juego
const attemptsElement = document.getElementById('attempts');
const scoreElement = document.getElementById('score');
const resultSection = document.getElementById('result');
const resultScore = document.querySelector('#result p span');
const restartBtn = document.getElementById('restart-btn');
const artistForm = document.getElementById('artist-form'); // Formulario para buscar por artista

// ------------------- FUNCIONES -------------------
const loadingIndicator = document.getElementById('loading-indicator');

// función para mostrar el indicador de carga
function mostrarCarga() {
  loadingIndicator.style.display = 'block';
}

function ocultarCarga() {
  loadingIndicator.style.display = 'none';
}

playFragmentBtn.addEventListener('click', () => {
    console.log('Botón "Reproducir Fragmento" clicado.');
    if (audio.src && audio.src !== "") {
        playFragment(audio.src); // Reproduce el fragmento
    } else {
        feedback.textContent = 'Por favor, selecciona una canción válida antes de reproducir.';
        console.error('Intento de reproducir sin fragmento cargado.');
    }
});

function playFragment(url) {
    if (!url || typeof url !== 'string') {
        feedback.textContent = 'Lo sentimos, no hay fragmentos disponibles para esta canción.';
        playFragmentBtn.textContent = '🎧 Reproducir Fragmento';
        playFragmentBtn.disabled = false;
        return;
    }

    // Detener cualquier reproducción previa
    audio.pause();
    audio = new Audio(url); // Crea un nuevo objeto de Audio
    audio.currentTime = 0; // Inicia desde el principio

    // Cambiar el estado del botón durante la carga
    playFragmentBtn.textContent = 'Cargando...';
    playFragmentBtn.disabled = true;

    audio.addEventListener('canplaythrough', () => {
        // Reproduce el audio una vez que esté listo
        audio.play().then(() => {
            playFragmentBtn.textContent = '🎧 Reproducir Fragmento';
            playFragmentBtn.disabled = false;
            setTimeout(() => audio.pause(), fragmentDuration * 1000); // Pausa después del tiempo configurado
        }).catch(err => {
            console.error('Error al reproducir:', err);
            feedback.textContent = 'Error al reproducir el fragmento.';
            playFragmentBtn.textContent = '🎧 Reproducir Fragmento';
            playFragmentBtn.disabled = false;
        });
    }, { once: true });
}

// Actualizar progreso
function updateProgress() {
    const progressElement = document.getElementById('game-progress');
    if (progressElement) {
        progressElement.textContent = `Ronda ${currentRound} de ${totalRounds}`;
    }
}

// Evento de clic para el botón "Jugar"
playGameBtn.addEventListener('click', () => {
    console.log('Botón "Jugar" clicado.');
    menuSection.style.display = 'none'; // Ocultar el menú principal
    artistForm.style.display = 'block'; // Mostrar el formulario para búsqueda por artista
});

// Generar opciones de respuesta
function generateOptions(correctSong, songs) {
    const incorrects = shuffleArray(songs.filter(song => song.id !== correctSong.id)).slice(0, 2); // Seleccionar canciones incorrectas
    const options = shuffleArray([correctSong.title, ...incorrects.map(song => song.title)]); // Mezclar opciones
    return options;
}

function generateOptions(correctSong, songs) {
    const incorrects = shuffleArray(songs.filter(song => song.id !== correctSong.id)).slice(0, 2); // Selecciona dos canciones incorrectas
    const options = shuffleArray([correctSong.title, ...incorrects.map(song => song.title)]); // Mezcla las opciones
    return options;
} 

// Mezclar elementos de un array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateOptions(correctSong, songs) {
    const incorrects = shuffleArray(songs.filter(song => song.id !== correctSong.id)).slice(0, 2); // Selecciona dos canciones incorrectas
    const options = shuffleArray([correctSong.title, ...incorrects.map(song => song.title)]); // Mezcla las opciones
    return options;
}

function displayQuestion(correctSong, options) {
    questionText.textContent = '¿Cuál es el título de esta canción?'; // Texto de la pregunta
    optionsContainer.innerHTML = ''; // Limpia el contenedor de opciones

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-btn';
        btn.onclick = () => checkAnswer(option, correctSong.title); // Valida si la respuesta es correcta
        optionsContainer.appendChild(btn); // Añade el botón al contenedor
    });
}

// Iniciar juego
async function startGame() {
    console.log('Iniciando el juego...');
    updateProgress();

    // Llama a fetchSongs con el artista seleccionado
    const songs = await fetchSongs(selectedArtist);
    if (!songs.length) {
        feedback.textContent = 'No hay canciones disponibles.';
        console.error('No se encontraron canciones.');
        playFragmentBtn.disabled = true;
        return;
    }

    // Selecciona una canción aleatoria
    const song = getRandomSong(songs);
    if (!song || !song.stream_url) {
        feedback.textContent = 'Error al cargar el fragmento.';
        console.error('No se pudo cargar el fragmento.');
        playFragmentBtn.disabled = true;
        return;
    }

    // Reinicia los intentos y configura el fragmento
    remainingAttempts = 2;
    attemptsElement.textContent = remainingAttempts;

    audio.src = song.stream_url; // Configura la canción seleccionada
    playFragmentBtn.disabled = false;
    feedback.textContent = '';

    // Generar opciones de respuesta y mostrar la pregunta
    const options = generateOptions(song, songs);
    displayQuestion(song, options);
}

// Validar respuesta seleccionada
function checkAnswer(selected, correct) {
    if (selected === correct) {
        const gained = remainingAttempts === 2 ? 5 : 2; // Puntos según intentos restantes
        score += gained; // Actualizar puntaje
        scoreElement.textContent = score; // Mostrar puntaje actualizado
        feedback.textContent = `¡Correcto! 🎉 +${gained} puntos`; // Mostrar mensaje de éxito

        currentRound++; // Avanzar a la siguiente ronda
        fragmentDuration = 3; // Restablecer duración del fragmento
        remainingAttempts = 2; // Restablecer intentos
        attemptsElement.textContent = remainingAttempts; // Mostrar intentos actualizados

        if (currentRound > totalRounds) {
            endGame(true); // Terminar el juego con éxito
        } else {
            updateProgress(); // Actualizar progreso de ronda
            startGame(); // Iniciar siguiente ronda
        }
    } else {
        remainingAttempts--; // Reducir intentos restantes
        attemptsElement.textContent = remainingAttempts; // Mostrar intentos actualizados
        feedback.textContent = '¡Incorrecto! Intenta de nuevo.'; // Mostrar mensaje de error

        if (remainingAttempts <= 0) {
            endGame(false); // Terminar el juego por fallar
        } else {
            fragmentDuration += 3; // Extender duración del fragmento para ayudar
            playFragment(audio.src); // Reproducir nuevamente el fragmento
        }
    }
}

// Terminar el juego
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

// Obtener canciones desde el backend
async function fetchSongs(selectedArtist) {
    try {
        if (!selectedArtist) {
            throw new Error('selectedArtist está indefinido.');
        }

        const apiUrl = `/api/songs?artist=${encodeURIComponent(selectedArtist)}`;
        mostrarCarga(); // Mostrar indicador de carga

        const res = await fetch(apiUrl);
        if (!res.ok) {
            throw new Error(`Error ${res.status}: No se pudieron obtener canciones.`);
        }

        const data = await res.json(); // <-- cambio aquí
        const songs = data.songs || []; // <-- y aquí

        console.info('Respuesta del backend:', songs);

        if (!Array.isArray(songs) || songs.length === 0) {
            throw new Error('Sin canciones válidas.');
        }

        return songs;
    } catch (err) {
        feedback.textContent = 'No se pudieron cargar las canciones. Intenta más tarde.';
        console.error('Error al obtener canciones:', err.message);
        return [];
    } finally {
        ocultarCarga(); // Ocultar indicador de carga
    }
}

// Seleccionar canción aleatoria sin repetir
function getRandomSong(songs) {
    const availableSongs = songs.filter(song => !usedSongs.includes(song.id));
    if (availableSongs.length === 0) {
        usedSongs = []; // Reiniciar la lista de canciones usadas si todas han sido utilizadas
        return getRandomSong(songs); // Llamada recursiva para reutilizar canciones
    }
    const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    usedSongs.push(randomSong.id); // Añadir la canción seleccionada a la lista de canciones usadas
    return randomSong;
}

// Manejar el botón Confirmar en el formulario de artista
document.getElementById('artist-search-btn').addEventListener('click', () => {
    const artistName = document.getElementById('artist-name').value.trim();
    if (!artistName) {
        feedback.textContent = 'Por favor, introduce un nombre de artista válido.';
        console.error('Error: Artista vacío.');
        return;
    }

    console.log('Artista seleccionado:', artistName);

    selectedArtist = artistName; // Configura el artista seleccionado
    artistForm.style.display = 'none'; // Ocultar el formulario de artista
    quizSection.style.display = 'flex'; // Mostrar el juego
    showScoreContainer();
    startGame(); // Inicia el juego con el artista seleccionado
});

// Mostrar puntaje
function showScoreContainer() {
    document.getElementById('score-container').style.display = 'block';
}

// Ocultar puntaje
function hideScoreContainer() {
    document.getElementById('score-container').style.display = 'none';
}  

//boton para volver al home
document.getElementById("back-home-btn").addEventListener("click", () => {
    window.location.href = "home.html";
});

// Evento de clic para el botón "Jugar de Nuevo"
restartBtn.addEventListener('click', () => {
    resultSection.style.display = 'none'; // Ocultar la sección de resultados
    menuSection.style.display = 'flex'; // Mostrar el menú principal
    currentRound = 1; // Reiniciar ronda
    score = 0; // Reiniciar puntaje
    remainingAttempts = 2; // Restablecer intentos
    fragmentDuration = 3; // Restablecer duración del fragmento
    usedSongs = []; // Vaciar canciones usadas
    scoreElement.textContent = score; // Actualizar visualmente el puntaje
    attemptsElement.textContent = remainingAttempts; // Actualizar visualmente los intentos
    feedback.textContent = ''; // Limpiar mensajes de feedback
    updateProgress(); // Reiniciar progreso
});