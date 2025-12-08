"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Video, Music, Wind, MessageCircle, Loader2, Volume2 } from "lucide-react";
import Image from "next/image";
import { PersonaProfile } from "@/types";

// Default Profile for Testing
const DEFAULT_PROFILE: PersonaProfile = {
    name: "Sarah",
    relation: "Daughter",
    gender: "female",
    lifeStory: "I grew up in Ohio. I love gardening and my dog, Rover. I was a teacher for 30 years.",
    blockTravel: true,
    blockAliveClaims: true,
    redirectConfusion: true,
    customBoundaries: "",
    avatarPhoto: "",
    backgroundPhotos: [],
    activeBackgroundIndex: 0,
};

type InteractionState = "idle" | "listening" | "processing" | "speaking";

export function PatientView() {
    const [state, setState] = useState<InteractionState>("idle");
    const [transcript, setTranscript] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleMicClick = () => {
        if (state !== "idle") return;

        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice features not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;

        recognition.onstart = () => setState("listening");

        recognition.onresult = async (event: any) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            setState("processing");
            await sendMessage(text);
        };

        recognition.onerror = (event: any) => {
            console.error(event.error);
            setState("idle");
        };

        recognition.onend = () => {
            if (state === "listening") setState("idle");
        };

        recognition.start();
    };

    const sendMessage = async (text: string) => {
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, profile: DEFAULT_PROFILE }),
            });

            const data = await res.json();

            if (data.audio) {
                playAudio(data.audio);
            } else {
                setState("idle");
            }
        } catch (error) {
            console.error(error);
            setState("idle");
        }
    };

    const playAudio = (base64Audio: string) => {
        setState("speaking");
        if (audioRef.current) {
            audioRef.current.src = `data:audio/mpeg;base64,${base64Audio}`;
            audioRef.current.play();
            audioRef.current.onended = () => setState("idle");
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Hidden Audio Element */}
            <audio ref={audioRef} className="hidden" />

            {/* Content */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">

                {/* Status Indicator (Top Center) */}
                <div className="w-full flex justify-center mt-12">
                    <AnimatePresence mode="wait">
                        {state !== "idle" && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-white font-medium flex items-center gap-3 border border-white/10"
                            >
                                {state === "listening" && (
                                    <>
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        Listening...
                                    </>
                                )}
                                {state === "processing" && (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                        Thinking...
                                    </>
                                )}
                                {state === "speaking" && (
                                    <>
                                        <Volume2 className="w-4 h-4 text-green-400" />
                                        Speaking...
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-end justify-between w-full">
                    {/* Logo */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-4xl font-serif font-bold tracking-tight mb-4 drop-shadow-md"
                    >
                        everLoved
                    </motion.h1>

                    {/* Controls */}
                    <div className="flex flex-col items-end gap-6 mb-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-white/90 text-black rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium">Conversation</span>
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
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 text-white/90 hover:text-white transition-colors drop-shadow-sm"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-lg font-medium">{item.label}</span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Main Interaction Button */}
                        <motion.button
                            onClick={handleMicClick}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            animate={state === "listening" ? { boxShadow: "0 0 0 8px rgba(255, 255, 255, 0.3)" } : {}}
                            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl mt-4 transition-colors ${state === "listening" ? "bg-red-500" : "bg-white"
                                }`}
                        >
                            <Mic className={`w-8 h-8 ${state === "listening" ? "text-white" : "text-black"}`} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
