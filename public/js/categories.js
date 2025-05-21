// Datos de ejemplo: Juegos por categoría
const games = {
    music: [
        {
            name: 'Trivia Musical',
            description: 'Adivina canciones y géneros.',
            image: 'images/music1.jpg',
            link: '/html/index.html'
        },
        {
            name: 'Songless',
            description: 'Identifica canciones con fragmentos cortos.',
            image: 'images/music2.jpg',
            link: '/html/songless.html'
        }
    ],
    words: [
        {
            name: 'Wordless',
            description: 'Adivina palabras en pocos intentos.',
            image: 'images/words1.jpg'
        },
        {
            name: 'Versus Crucigramas',
            description: 'Compite resolviendo crucigramas temáticos.',
            image: 'images/words2.jpg'
        }
    ],
    general: [
        {
            name: 'Trivia Historia',
            description: 'Preguntas sobre historia.',
            image: 'images/general1.jpg'
        },
        {
            name: 'Trivia Ciencia',
            description: 'Explora el mundo de la ciencia.',
            image: 'images/general2.jpg'
        }
    ]
};

// area de funciones

// Función para mostrar juegos según la categoría seleccionada
function showGames(category) {
    const container = document.getElementById('games-container');
    container.innerHTML = ''; // Limpiar juegos anteriores

    // Recorrer los juegos de la categoría seleccionada
    games[category].forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <img src="${game.image}" alt="${game.name}">
            <div class="game-info">
                <h4>${game.name}</h4>
                <p>${game.description}</p>
                ${game.link ? `<a href="${game.link}" class="play-link">Jugar</a>` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    // Cambiar el título de la sección según la categoría (formateado)
    const formattedTitle = {
        music: "Música",
        words: "Palabras",
        general: "Cultura General"
    };
    document.getElementById('games-title').textContent = `Juegos de ${formattedTitle[category] || category}`;

    // Hacer scroll suave hacia la sección de juegos
    const gamesSection = document.getElementById("games");
    gamesSection.scrollIntoView({ behavior: "smooth" });
}

// Función para manejar el evento de clic en los botones de categoría
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}
