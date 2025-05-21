import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const WORDNIK_API_KEY = "TU_API_KEY_AQUI"; // Reemplaza con tu clave

// Endpoint para obtener una palabra aleatoria de 5 letras
router.get("/wordless", async (req, res) => {
    try {
        const url = `https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minLength=5&maxLength=5&api_key=${WORDNIK_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.word) {
            return res.status(500).json({ error: "Error al obtener una palabra aleatoria." });
        }

        res.json({ word: data.word });
    } catch (error) {
        console.error("Error con Wordnik API:", error);
        res.status(500).json({ error: "Error al obtener la palabra. Intenta nuevamente." });
    }
});

export default router;