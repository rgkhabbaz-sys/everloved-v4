"use client";

import { motion } from "framer-motion";
import { Mic, Video, Music, Wind, MessageCircle } from "lucide-react";
import Image from "next/image";

export function PatientView() {
    return (
        <div className="relative w-full h-full">
            {/* Background */}
            {/* Background removed to allow global dynamic layer to show through */}

            {/* Content */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end">
                <div className="flex items-end justify-between w-full">
                    {/* Logo */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-4xl font-serif font-bold tracking-tight mb-4"
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
                                    className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-lg font-medium">{item.label}</span>
                                </motion.button>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl mt-2"
                        >
                            <Mic className="w-8 h-8 text-black" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
