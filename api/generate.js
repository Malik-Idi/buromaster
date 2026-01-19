// generate.js - Version légèrement améliorée
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt manquant" });
        }

        // Utilisons un modèle légèrement plus robuste pour les longs textes
        const GEMINI_MODEL = "gemini-2.5-flash"; // Bon pour des tâches plus longues et complexes

        const response = await fetch(
            `https://generativelanguage.googleapis.com{GEMINI_MODEL}:generateContent?key=` + process.env.GEMINI_API_KEY,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    // Vous pouvez ajouter des configurations ici (température, max output tokens) si nécessaire
                })
            }
        );

        const data = await response.json();

        // --- Amélioration de l'extraction du texte ---
        let text = "Aucune réponse générée ou bloquée par les filtres de sécurité.";
        
        if (data.candidates && data.candidates.length > 0) {
            text = data.candidates[0].content?.parts?.[0]?.text || text;
        } else if (data.error) {
            // Afficher l'erreur spécifique de Google si elle existe
            console.error("Erreur Gemini API:", data.error.message);
            text = "Erreur de l'API Gemini: " + data.error.message;
        }
        // ---------------------------------------------

        res.status(200).json({ text });

    } catch (error) {
        console.error("Erreur serveur:", error);
        res.status(500).json({ error: "Erreur serveur interne", details: error.message });
    }
}
