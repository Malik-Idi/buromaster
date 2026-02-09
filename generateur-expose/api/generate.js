export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {prompt} = req.body;

    if (!prompt) {
      return res.status(400).json({error: "Prompt manquant"});
    }

    // MISE À JOUR : Changement du modèle vers Gemini 2.5 Flash
    // Note : gemini-1.5-flash-latest n'est plus supporté.
    const GEMINI_MODEL = "gemini-2.5-flash";

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
                parts: [{text: prompt}]
              }
            ]
          })
        }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Gemini détaillée:", JSON.stringify(data, null, 2));
      return res.status(500).json({
        error: "Erreur Gemini API",
        details: data.error?.message || "Erreur inconnue"
      });
    }

    const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Aucune réponse générée.";

    res.status(200).json({text});

  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({
      error: "Erreur serveur interne",
      details: error.message
    });
  }
}
