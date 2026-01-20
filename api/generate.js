// /api/generate.js — VERSION CORRIGÉE ET FONCTIONNELLE

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt manquant" });
        }

        const GEMINI_MODEL = "gemini-1.5-flash";

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                    ]
                })
            }
        );

        const data = await response.json();

        let text = "Aucune réponse générée.";

        if (data.candidates?.length > 0) {
            text = data.candidates[0].content.parts[0].text;
        }

        return res.status(200).json({ text });

    } catch (error) {
        console.error("Erreur serveur API Gemini :", error);
        return res.status(500).json({ error: "Erreur serveur interne" });
    }
}
