const fs = require('fs');
const path = require('path');

async function listModels() {
    let key = process.env.GEMINI_API_KEY;

    if (!key) {
        try {
            const envPath = path.join(__dirname, '.env.local');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=(.*)/);
                if (match) {
                    key = match[1].trim();
                }
            }
        } catch (e) {
            console.error("Error reading .env.local", e);
        }
    }

    if (!key) {
        console.error("No API Key found.");
        return;
    }

    // Clean key if it has quotes
    key = key.replace(/^["']|["']$/g, '');

    console.log("Using Key ending in:", key.slice(-5));

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.error("Failed to list models:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
