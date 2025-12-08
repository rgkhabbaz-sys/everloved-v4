import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, profile } = await req.json();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // --- 1. DUAL-LAYER CLINICAL SYSTEM PROMPT ---
        const systemPrompt = `
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

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "I understand. I am ready to be a loving companion." }] },
            ],
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();

        // --- 2. GENDERED VOICE GENERATION (ElevenLabs) ---
        const voiceId = profile.gender === 'male'
            ? process.env.ELEVENLABS_VOICE_ID_MALE
            : process.env.ELEVENLABS_VOICE_ID_FEMALE;

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

        if (!voiceRes.ok) throw new Error("Voice generation failed");

        const audioBuffer = await voiceRes.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString("base64");

        return NextResponse.json({ text, audio: audioBase64 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error processing request" }, { status: 500 });
    }
}
