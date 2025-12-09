
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Video, Music, Wind, MessageCircle, Loader2, Volume2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnergyVAD } from "@/hooks/useEnergyVAD";

export function PatientView() {
    // 1. STATE MANAGEMENT
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // 5. DEBUG LOGGING (History of last 3 logs)
    const [debugLog, setDebugLog] = useState<string[]>(["Ready."]);
    // 6. AI TEXT RESPONSE (Visible Feedback)
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [msg, ...prev].slice(0, 3));
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 2. THE EAR (Standard Web Audio VAD - Raw PCM Mode)
    const { start: startVAD, stop: stopVAD, userSpeaking, listening } = useEnergyVAD({
        positiveSpeechThreshold: 0.1, // Less sensitive to ignore background noise
        minSpeechDuration: 500,
        silenceTimeout: 800, // Faster silence detection
        maxSpeechDuration: 10000, // 10s Hard Limit (Fixes 413 Error)
        onSpeechStart: () => {
            addLog("Hearing voice...");
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            }
        },
        onSpeechEnd: (audioFloat32) => {
            // Note: audioFloat32 is a Float32Array (Raw PCM)
            const secs = (audioFloat32.length / 16000).toFixed(2);
            addLog(`Speech End. (${secs}s)`);
            if (parseFloat(secs) > 10) {
                addLog("Warning: Audio truncated >10s");
            }
            setIsProcessing(true);
            handleUserSpeech(audioFloat32);
        }
    });

    // 3. INTERACTION HANDLER
    const startConversation = async () => {
        try {
            addLog("Starting Ears...");
            setIsSessionActive(true);
            await startVAD();
            addLog("Listening (Local VAD)");
        } catch (err: any) {
            console.error("Start Failed:", err);
            addLog(`Error: ${err.message}`);
            alert("Microphone Access Failed");
        }
    };

    // 4. API INTEGRATION (Raw PCM -> WAV)
    const handleUserSpeech = async (audioFloat32: Float32Array) => {
        try {
            addLog("Encoding WAV...");

            // Convert Raw Float32 to WAV Base64
            const wavBase64 = float32ToWavBase64(audioFloat32);

            // Construct Gemini Payload (Compatible: audio/wav)
            const messagePayload = [
                {
                    inlineData: {
                        mimeType: "audio/wav",
                        data: wavBase64
                    }
                },
                { text: "Respond to this verbal statement." }
            ];

            addLog("Sending to API...");

            const storedProfile = localStorage.getItem("everloved_profile");
            const profile = storedProfile ? JSON.parse(storedProfile) : null;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messagePayload,
                    profile: profile || undefined
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error("API Error Details:", errData);

                let errorMsg = errData.error || "Unknown Error";
                if (errData.debug && errData.debug.availableKeys) {
                    errorMsg += `\n\nDEBUG INFO: Server sees these keys:\n${JSON.stringify(errData.debug.availableKeys)}`;
                }

                addLog(`API Error: ${errData.error}`);
                alert("API Error: " + errorMsg);
                setIsProcessing(false);
                return;
            }

            const data = await res.json();
            setIsProcessing(false);

            if (data.text) {
                setAiResponse(data.text);
            }

            if (data.audio) {
                addLog("Playing Response...");
                playAudio(data.audio);
            } else if (data.text) {
                addLog("Voice Failed. Using Backup.");
                if (data.error) console.warn("Voice API Error:", data.error);
                // Fallback to browser TTS
                fallbackSpeech(data.text);
            }
        } catch (error) {
            console.error("Error sending audio:", error);
            addLog("Connection Failed");
            setIsProcessing(false);
        }
    };

    const fallbackSpeech = (text: string) => {
        window.speechSynthesis.cancel(); // STOP any previous speech
        addLog("Attempting Backup Voice...");

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();

        // Prefer Samantha (Mac) or Google US English, backup to any EN voice
        const preferredVoice = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google US English"))
            || voices.find(v => v.lang.startsWith("en"));

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 0.9;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            addLog("Backup Voice Speaking...");
            setIsPlaying(true);
        };
        utterance.onend = () => {
            setIsPlaying(false);
            addLog("Listening...");
        };
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            addLog("TTS Failed.");
            setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    // Pre-load voices on mount to avoid empty voice list
    useEffect(() => {
        const load = () => window.speechSynthesis.getVoices();
        load();
        window.speechSynthesis.onvoiceschanged = load;
    }, []);

    const playAudio = async (base64Audio: string) => {
        setIsPlaying(true);
        if (audioRef.current) {
            try {
                audioRef.current.src = `data:audio/mpeg;base64,${base64Audio}`;
                await audioRef.current.play();
                addLog("Speaking...");
                audioRef.current.onended = () => {
                    setIsPlaying(false);
                    addLog("Listening...");
                };
            } catch (playError) {
                console.error("Playback failed:", playError);
                addLog("Error: Audio Autoplay Blocked");
                setIsPlaying(false);
            }
        }
    };

    return (
        <div className="relative w-full h-full">
            <audio ref={audioRef} className="hidden" />

            {/* MAIN CONTENT */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end">

                {/* STATUS INDICATOR */}
                {isSessionActive && (
                    <div className="absolute top-12 left-0 right-0 flex flex-col items-center pointer-events-none gap-2">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "px-6 py-2 rounded-full backdrop-blur-md border flex items-center gap-3 shadow-lg transition-colors duration-300",
                                userSpeaking ? "bg-red-500/20 border-red-500/50 text-red-200" :
                                    isProcessing ? "bg-blue-500/20 border-blue-500/50 text-blue-200" :
                                        isPlaying ? "bg-green-500/20 border-green-500/50 text-green-200" :
                                            "bg-black/40 border-white/10 text-white/60"
                            )}
                        >
                            {userSpeaking && <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Hearing Voice...</>}
                            {isProcessing && <><Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Thinking...</>}
                            {isPlaying && <><Volume2 className="w-4 h-4 text-green-400 animate-pulse" /> Speaking...</>}
                            {!userSpeaking && !isProcessing && !isPlaying && <><Mic className="w-4 h-4" /> Listening (Standard VAD)</>}
                        </motion.div>

                        {/* CRITICAL DEBUGGING: Voice Error Banner */}
                        {debugLog.some(l => l.startsWith("Voice Err:")) && (
                            <div className="bg-red-600 text-white p-4 rounded-lg shadow-2xl animate-bounce border-2 border-white mb-4 z-50 flex flex-col items-center gap-2">
                                <p className="font-bold text-lg">⚠️ AUDIO FAILURE ⚠️</p>
                                <p className="font-mono text-sm">{debugLog.find(l => l.startsWith("Voice Err:"))}</p>
                                <button
                                    onClick={() => aiResponse && fallbackSpeech(aiResponse)}
                                    className="px-4 py-2 bg-white text-red-600 font-bold rounded-full hover:bg-gray-100 transition-colors mt-2"
                                >
                                    ▶️ FORCE PLAY RESPONSE
                                </button>
                            </div>
                        )}

                        {/* AI RESPONSE TEXT - VISIBLE FEEDBACK */}
                        {aiResponse && (
                            <div className="mb-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 max-w-md text-center">
                                <p className="text-white/90 text-sm font-medium">"{aiResponse}"</p>
                            </div>
                        )}

                        {/* DEBUG LOG - VISIBLE TO USER */}
                        <div className="flex flex-col gap-1 items-center">
                            {debugLog.map((log, i) => (
                                <div key={i} className="text-[10px] font-mono text-white/60 bg-black/40 px-2 py-0.5 rounded shadow-sm">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-end justify-between w-full">
                    {/* Logo */}
                    <motion.h1 className="text-white text-4xl font-serif font-bold tracking-tight mb-4 drop-shadow-md">
                        everLoved
                    </motion.h1>

                    {/* Controls */}
                    <div className="flex flex-col items-end gap-6 mb-4">
                        {/* Conversation Button */}
                        <motion.button
                            onClick={startConversation}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                            transition={isPlaying ? { repeat: Infinity, duration: 2 } : {}}
                            className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl mt-4 transition-all duration-300",
                                userSpeaking ? "bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]" :
                                    isProcessing ? "bg-blue-500 scale-100" : "bg-white"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                                <Mic className={cn("w-8 h-8", userSpeaking ? "text-white" : "text-black")} />
                            )}
                        </motion.button>

                        <div className="flex flex-col gap-4 items-end">
                            {[
                                { label: "Video", icon: Video },
                                { label: "Music", icon: Music },
                                { label: "Calm", icon: Wind },
                            ].map((item, i) => (
                                <motion.button
                                    key={item.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 text-white/90 hover:text-white transition-colors drop-shadow-sm"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-lg font-medium">{item.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// AUDIO UTILS (WAV ENCODER)
// ----------------------------------------------------------------------------
function float32ToWavBase64(float32Array: Float32Array): string {
    const numChannels = 1;
    const sampleRate = 16000;
    const format = 1; // PCM
    const bitDepth = 16;

    const buffer = new ArrayBuffer(44 + float32Array.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + float32Array.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, float32Array.length * 2, true);

    // write the PCM samples
    let offset = 44;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    // Convert ArrayBuffer to Base64
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
