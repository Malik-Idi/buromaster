const chatBox = document.getElementById('chat-box');

const database = {
    "enseignants": {
        keywords: ["épreuve", "examen", "devoir", "interrogation", "sujet", "professeur", "enseignant", "classe", "évaluation", "quizz"],
        response: "📚 SECTION PROFS : BuroMaster AI peut générer des épreuves complètes. Précisez la matière (Maths, Français, SVT...) et le niveau (Collège/Lycée). Je peux structurer l'en-tête, les exercices et même le barème."
    },
    "eleves": {
        keywords: ["exposé", "exposer", "recherche", "élève", "étudiant", "devoir", "explication", "thème", "présentation"],
        response: "🎓 SECTION ÉLÈVES : Besoin d'un plan d'exposé ? Donnez-moi votre thème ! Je génère : 1. Introduction, 2. Développement structuré, 3. Conclusion et 4. Bibliographie conseillée."
    },
    "carriere": {
        keywords: ["cv", "curriculum", "lettre de motivation", "emploi", "stage", "embauche", "recrutement", "travail", "candidature"],
        response: "💼 SECTION CARRIÈRE : Je maîtrise la rédaction professionnelle. Je peux vous aider à lister vos compétences pour un CV moderne ou rédiger une lettre de motivation convaincante adaptée au poste visé."
    },
    "bureautique": {
        keywords: ["excel", "word", "powerpoint", "formule", "macro", "tableau", "mise en page", "diapo", "office"],
        response: "🖥️ EXPERT BUREAUTIQUE : Une formule Excel récalcitrante ? Un document Word à mettre en page ? Je vous guide pas à pas pour maîtriser les outils de Microsoft Office et Google Workspace."
    },
    "redaction": {
        keywords: ["rédiger", "écrire", "texte", "correction", "fautes", "orthographe", "synthèse", "résumé"],
        response: "✍️ SERVICE RÉDACTION : Copiez votre texte ici ! Je peux le corriger, en faire un résumé synthétique ou reformuler vos phrases pour un ton plus professionnel."
    },
    "salutations": {
        keywords: ["bonjour", "salut", "hello", "hi", "bonsoir", "qui es-tu", "tu fais quoi"],
        response: "🤖 Bonjour ! Je suis BuroMaster AI, votre assistant spécialisé en Éducation (épreuves, exposés), Carrière (CV, Lettres) et Bureautique. Comment puis-je vous assister ?"
    },
    "merci": {
        keywords: ["merci", "super", "génial", "top", "merci beaucoup", "thanks"],
        response: "De rien ! C'est un plaisir d'aider. Avez-vous besoin d'autre chose pour votre travail ?"
    }
};

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const userText = input.value.trim();
    if (!userText) return;

    // Affichage message utilisateur
    appendMessage('user', userText);
    input.value = '';

    // Message de chargement
    const loadingMsg = appendMessage('ai', 'Analyse de votre demande...');

    setTimeout(() => {
        const lowerText = userText.toLowerCase();
        let finalResponse = "Désolé, je n'ai pas encore d'informations spécifiques sur ce sujet. \n\nJe suis expert en : \n- Création d'épreuves (Profs)\n- Plans d'exposés (Élèves)\n- CV & Lettres de motivation\n- Aide Excel/Word.";

        // Système de détection par priorité
        for (let category in database) {
            const match = database[category].keywords.some(keyword => lowerText.includes(keyword));
            if (match) {
                finalResponse = database[category].response;
                break;
            }
        }

        loadingMsg.innerText = finalResponse;
    }, 1000);
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    // Permet d'interpréter les retours à la ligne \n
    div.style.whiteSpace = "pre-line";
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}
