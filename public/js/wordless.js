let secretWord = "";
let attemptCount = 0;
const maxAttempts = 5;

// Obtiene la palabra secreta desde el backend
async function getSecretWord() {
    try {
        const response = await fetch("/api/wordless");
        const data = await response.json();
        secretWord = data.word.toLowerCase();
        console.info("Palabra secreta:", secretWord);
    } catch (error) {
        console.error("Error al obtener la palabra secreta:", error);
    }
}

// Compara el intento del usuario con la palabra secreta
document.getElementById("submit-btn").addEventListener("click", () => {
    const userWord = document.getElementById("word-input").value.trim().toLowerCase();

    if (userWord.length !== secretWord.length) {
        displayMessage("error", `Debe ser una palabra de ${secretWord.length} letras.`);
        return;
    }

    attemptCount++;
    updateAttempts(userWord);

    if (userWord === secretWord) {
        displayMessage("success", "¡Correcto! Has adivinado la palabra.");
        endGame();
    } else if (attemptCount >= maxAttempts) {
        displayMessage("error", `Has agotado tus intentos. La palabra era: ${secretWord}`);
        endGame();
    } else {
        document.getElementById("round-info").textContent = `Intento: ${attemptCount + 1}/5`;
        document.getElementById("word-input").value = "";
    }
});

// Muestra intentos y colores de letras
function updateAttempts(userWord) {
    const attemptsList = document.getElementById("attempts-list");
    const attemptDiv = document.createElement("div");
    attemptDiv.classList.add("attempt");

    userWord.split("").forEach((letter, index) => {
        const letterDiv = document.createElement("div");
        letterDiv.classList.add("letter");

        if (letter === secretWord[index]) {
            letterDiv.classList.add("green"); // 🟩 Letra correcta en posición correcta
        } else if (secretWord.includes(letter)) {
            letterDiv.classList.add("yellow"); // 🟨 Letra en posición incorrecta
        } else {
            letterDiv.classList.add("gray"); // ⬜ Letra incorrecta
        }

        letterDiv.textContent = letter;
        attemptDiv.appendChild(letterDiv);
    });

    attemptsList.appendChild(attemptDiv);
}

// Muestra mensajes en pantalla
function displayMessage(type, text) {
    const messageArea = document.getElementById("message-area");
    messageArea.innerHTML = `<p class="${type}">${text}</p>`;
}

// Finaliza el juego
function endGame() {
    document.getElementById("word-input").disabled = true;
    document.getElementById("submit-btn").disabled = true;
}

// Inicia el juego y obtiene la palabra
document.getElementById("start-btn").addEventListener("click", () => {
    document.getElementById("game-area").style.display = "block";
    getSecretWord();
});