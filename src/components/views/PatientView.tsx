"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Video, Music, Wind, MessageCircle, Loader2, Volume2, Play } from "lucide-react";
import { useMicVAD } from "@ricky0123/vad-react";
import * as ort from "onnxruntime-web";
import { cn } from "@/lib/utils";

// Make onnxruntime available for vad-react
if (typeof window !== "undefined") {
    (window as any).ort = ort;
}

export function PatientView() {
    // 1. STATE MANAGEMENT
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 2. THE EAR (VAD HOOK)
    const vad = useMicVAD({
        startOnLoad: false,
        onSpeechStart: () => {
            console.log("Speech Started");
            setIsTalking(true);
            // Barge-in: Stop any playing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            }
        },
        onSpeechEnd: (audio) => {
            console.log("Speech Ended");
            setIsTalking(false);
            setIsProcessing(true);
            handleUserSpeech(audio);
        },
    });

    // 3. INTERACTION HANDLER
    const startConversation = () => {
        setIsSessionActive(true);
        vad.start();
    };

    // 4. API INTEGRATION
    const handleUserSpeech = async (audioFloat32: Float32Array) => {
        try {
            // Convert Float32Array to WAV Base64 for Gemini
            const wavBase64 = float32ToWavBase64(audioFloat32);

            // Construct Gemini Multimodal Payload
            // forcing "message" to be an array so backend passes it to model.sendMessage([])
            const messagePayload = [
                {
                    inlineData: {
                        mimeType: "audio/wav",
                        data: wavBase64
                    }
                },
                { text: "Respond to this verbal statement." }
            ];

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

            const data = await res.json();
            setIsProcessing(false);

            if (data.audio) {
                playAudio(data.audio);
            }
        } catch (error) {
            console.error("Error sending audio:", error);
            setIsProcessing(false);
        }
    };

    const playAudio = (base64Audio: string) => {
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.src = `data:audio/mpeg;base64,${base64Audio}`;
            audioRef.current.play();
            audioRef.current.onended = () => setIsPlaying(false);
        }
    };

    return (
        <div className="relative w-full h-full">
            <audio ref={audioRef} className="hidden" />

            {/* MAIN CONTENT */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end">

                {/* STATUS INDICATOR (ONLY WHEN ACTIVE) */}
                {isSessionActive && (
                    <div className="absolute top-12 left-0 right-0 flex justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "px-6 py-2 rounded-full backdrop-blur-md border flex items-center gap-3 shadow-lg transition-colors duration-300",
                                isTalking ? "bg-red-500/20 border-red-500/50 text-red-200" :
                                    isProcessing ? "bg-blue-500/20 border-blue-500/50 text-blue-200" :
                                        isPlaying ? "bg-green-500/20 border-green-500/50 text-green-200" :
                                            "bg-black/40 border-white/10 text-white/60"
                            )}
                        >
                            {isTalking && <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Listening...</>}
                            {isProcessing && <><Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Thinking...</>}
                            {isPlaying && <><Volume2 className="w-4 h-4 text-green-400 animate-pulse" /> Speaking...</>}
                            {!isTalking && !isProcessing && !isPlaying && <><Mic className="w-4 h-4" /> Listening Hands-Free</>}
                        </motion.div>
                    </div>
                )}

                <div className="flex items-end justify-between w-full">
                    {/* Logo */}
                    <motion.h1 className="text-white text-4xl font-serif font-bold tracking-tight mb-4 drop-shadow-md">
                        everLoved
                    </motion.h1>

                    {/* Controls */}
                    <div className="flex flex-col items-end gap-6 mb-4">
                        {/* Conversation Button - Works as Manual Emergency Trigger too */}
                        <motion.button
                            onClick={startConversation}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                            transition={isPlaying ? { repeat: Infinity, duration: 2 } : {}}
                            className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl mt-4 transition-all duration-300",
                                isTalking ? "bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]" :
                                    isProcessing ? "bg-blue-500 scale-100" : "bg-white"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                                <Mic className={cn("w-8 h-8", isTalking ? "text-white" : "text-black")} />
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
    const sampleRate = 16000; // VAD default
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
