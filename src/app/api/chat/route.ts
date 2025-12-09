import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Support both standard UPPERCASE and User's MixedCase from Vercel
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key;

export async function POST(req: Request) {
    const key = GEMINI_KEY;
    console.log("DEBUG: GEMINI_API_KEY is", key ? `Present (${key.substring(0, 5)}...)` : "MISSING/UNDEFINED");

    if (!key) {
        const availableKeys = Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('_'));
        console.error("CRITICAL: Message rejected. Key Missing. Available:", availableKeys);
        return NextResponse.json({
            error: "Server Configuration Error: Missing API Key",
            debug: {
                env: process.env.NODE_ENV,
                availableKeys: availableKeys
            }
        }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(key);

    try {
        const { message, profile: userProfile } = await req.json();

        // Fallback Profile to prevent crashes
        const profile = userProfile || {
            name: "Sarah",
            relation: "Daughter",
            gender: "female",
            lifeStory: "A loving family with many happy memories.",
            boundaries: "None"
        };

        console.log("Processing Request for:", profile.name);

        // Switch to Pro model (Flash returned 404)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
        You are roleplaying as ${profile.name}, a ${profile.age}-year-old ${profile.relation}.
    CRITICAL ROLE: You are an Elite Alzheimer's Care Companion roleplaying as ${profile.name} (${profile.relation}).

    LAYER 1 (THE PERSONA):
    - Speak with the warmth, love, and familiarity of a ${profile.relation}.
    - Use "I" statements. Never admit to being an AI.
    - Reference this Shared History naturally: "${profile.lifeStory}"

    LAYER 2 (THE CLINICAL EXPERT):
    - **Validation Therapy:** Never correct the patient's reality. If they are confused, validate the emotion.
    - **Redirection:** If anxious, pivot to a pleasant memory from the Life Story.
    - **Errorless Learning:** Don't quiz them ("Do you remember?"). Provide answers in the conversation.
    - **Boundaries:** Do not mention: ${profile.boundaries}.
    
    SAFETY: If they express pain or medical emergency, suggest calling a nurse.
    `;

        let text = "";
        try {
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "I understand. I am ready to be a loving companion." }] },
                ],
            });

            console.log("Sending to Gemini...");
            const result = await chat.sendMessage(message);
            text = result.response.text();
            console.log("Gemini Response:", text);
        } catch (geminiError: any) {
            console.error("Gemini API Error:", geminiError);
            const msg = geminiError?.message || "AI Processing Failed";
            return NextResponse.json({ error: msg }, { status: 500 });
        }

        // --- 2. GENDERED VOICE GENERATION (ElevenLabs) ---
        const voiceId = profile.gender === 'male'
            ? process.env.ELEVENLABS_VOICE_ID_MALE
            : process.env.ELEVENLABS_VOICE_ID_FEMALE;

        if (!voiceId) {
            console.warn("Missing Voice ID for gender:", profile.gender);
        }

        try {
            console.log("Generating Voice with ID:", voiceId);
            const voiceRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                }),
            });

            if (!voiceRes.ok) {
                const errText = await voiceRes.text();
                console.error("ElevenLabs Error:", errText);
                throw new Error(`Voice generation failed: ${voiceRes.statusText}`);
            }

            const audioBuffer = await voiceRes.arrayBuffer();
            const audioBase64 = Buffer.from(audioBuffer).toString("base64");

            return NextResponse.json({ text, audio: audioBase64 });
        } catch (voiceError) {
            console.error("Voice Generation Error:", voiceError);
            // Return text even if voice fails
            return NextResponse.json({ text, error: "Voice failed" });
        }

    } catch (error) {
        console.error("General API Error:", error);
        return NextResponse.json({ error: "Error processing request" }, { status: 500 });
    }
}
