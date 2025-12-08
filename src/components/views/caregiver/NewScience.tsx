"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function NewScience() {
    const articles = [
        { date: "Nov 28, 2025", category: "Research", title: "Breakthrough in Non-Invasive Memory Stimulation", desc: "New study shows promising results using 40Hz gamma frequency light and sound therapy to reduce amyloid plaques." },
        { date: "Nov 25, 2025", category: "Caregiving", title: "The Power of Personalized Music Therapy", desc: "How curated playlists from a patient's youth can significantly reduce agitation and improve mood." },
        { date: "Nov 20, 2025", category: "Clinical Trials", title: "Phase 3 Trial Results for Leqembi", desc: "Detailed analysis of the latest clinical data on the efficacy and safety profile of the new antibody treatment." },
        { date: "Nov 18, 2025", category: "Wellness", title: "Circadian Rhythms and Dementia", desc: "Understanding the importance of light exposure and sleep hygiene in managing sundowning symptoms." },
        { date: "Nov 15, 2025", category: "Technology", title: "AI Companions in Elderly Care", desc: "Ethical considerations and practical benefits of using AI avatars for social engagement." },
        { date: "Nov 10, 2025", category: "Nutrition", title: "The MIND Diet: Updated Guidelines", desc: "Recent findings on specific nutrients that may slow cognitive decline in early-stage Alzheimer's." },
    ];

    return (
        <div className="w-full h-full p-8 pt-24 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 text-center">
                    <h2 className="text-5xl font-serif text-white mb-4">New Science</h2>
                    <p className="text-white/60 max-w-2xl mx-auto">Curated research, clinical updates, and therapeutic resources for the modern caregiver.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-all hover:-translate-y-1 duration-300"
                        >
                            <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-4">
                                {article.category} • {article.date}
                            </div>
                            <h3 className="text-xl font-serif text-white mb-3 group-hover:text-blue-200 transition-colors">
                                {article.title}
                            </h3>
                            <p className="text-sm text-white/60 leading-relaxed mb-6">
                                {article.desc}
                            </p>
                            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white group-hover:pl-2 transition-all">
                                Read Article <ArrowRight className="w-3 h-3" />
                            </button>

                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
