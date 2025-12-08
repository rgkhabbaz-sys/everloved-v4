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

    // Force ONNX to load WASM from our local public folder instead of CDN
    // This fixes "Failed to load resource" errors on restricted networks
    ort.env.wasm.wasmPaths = "/";

    // HIGH COMPATIBILITY MODE
    // Disable SIMD and Threading to support all browsers/devices
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false;
    ort.env.wasm.proxy = false;
}

export function PatientView() {
    // 1. STATE MANAGEMENT
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // 5. DEBUG LOGGING (History of last 3 logs)
    const [debugLog, setDebugLog] = useState<string[]>(["Ready."]);

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [msg, ...prev].slice(0, 3));
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 2. THE EAR (VAD HOOK)
    const vad = useMicVAD({
        startOnLoad: false,
        positiveSpeechThreshold: 0.6,
        // Load Model & Worklet from local public folder
        // @ts-ignore - modelURL and workletURL are valid but missing from type definitions
        modelURL: "/silero_vad.onnx",
        // @ts-ignore
        workletURL: "/vad.worklet.bundle.min.js",
        onSpeechStart: () => {
            addLog("Speech Detected...");
            setIsTalking(true);
            // Barge-in: Stop any playing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            }
        },
        onSpeechEnd: (audio) => {
            addLog("Speech Ended. Processing...");
            setIsTalking(false);
            setIsProcessing(true);
            handleUserSpeech(audio);
        },
    });

    // Monitor VAD Loading State & Run Diagnostics
    useEffect(() => {
        const runDiagnostics = async () => {
            // Diagnostic: Check global ORT
            if (!(window as any).ort) addLog("CRITICAL: Global 'ort' missing!");

            if (vad.loading) addLog(`Loading...(L:${vad.loading ? 1 : 0} E:${vad.errored ? 1 : 0})`);

            // DIAGNOSTIC: Check if files actually exist and ONNX works
            try {
                const modelRes = await fetch("/silero_vad.onnx", { method: 'HEAD' });
                if (!modelRes.ok) throw new Error(`Model 404 (${modelRes.status})`);

                // MANUAL TEST: Try to create session to see REAL error
                if ((window as any).ort) {
                    addLog("Diag: Testing ONNX Create...");
                    await (window as any).ort.InferenceSession.create("/silero_vad.onnx");
                    addLog("Diag: Session Create OK.");
                }
            } catch (diagErr: any) {
                console.error("Diagnostic Fail:", diagErr);
                addLog(`CRITICAL: ${diagErr.message}`);
                // If it's an object, dump it
                if (diagErr.errors) addLog(`Details: ${JSON.stringify(diagErr.errors)}`);
            }
        };
        runDiagnostics();

        if (vad.errored) {
            console.error("VAD Error Details:", vad.errored);
            addLog(`Error: ${JSON.stringify(vad.errored).slice(0, 40)}`);
        }
    }, [vad.loading, vad.errored, isSessionActive]);

    // 3. INTERACTION HANDLER
    const startConversation = async () => {
        try {
            addLog("Req Mic Access...");
            // Explicitly request permission to trigger the browser prompt
            await navigator.mediaDevices.getUserMedia({ audio: true });

            addLog("Mic OK. Starting VAD...");
            setIsSessionActive(true);

            // Await start to catch immediate failures
            await vad.start();
            addLog("VAD Start command sent.");
        } catch (err: any) {
            console.error("Start Failed:", err);
            addLog(`Error: Start Failed: ${err.message}`);
            alert("Failed to access microphone or start AI.");
        }
    };

    // 4. API INTEGRATION
    const handleUserSpeech = async (audioFloat32: Float32Array) => {
        try {
            addLog("Encoding Audio...");
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

            addLog("Sending to API...");
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
                addLog(`API Error: ${errData.error}`);
                alert("Error: " + (errData.error || "Failed to process speech. Check API keys."));
                setIsProcessing(false);
                return;
            }

            const data = await res.json();
            setIsProcessing(false);

            if (data.audio) {
                addLog("Playing Response...");
                playAudio(data.audio);
            } else {
                addLog("Received Text (No Audio)");
            }
        } catch (error) {
            console.error("Error sending audio:", error);
            addLog("Connection Failed");
            setIsProcessing(false);
            alert("Connection Error. Please check your network.");
        }
    };

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

                {/* STATUS INDICATOR (ONLY WHEN ACTIVE) */}
                {isSessionActive && (
                    <div className="absolute top-12 left-0 right-0 flex flex-col items-center pointer-events-none gap-2">
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
