"use client";

import { motion } from "framer-motion";
import { Activity, Brain, Clock, Zap, Sun, Moon, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export function WellnessDashboard() {
    const metrics = [
        { label: "Verbal Perseveration", value: "12 events/hr", sub: "↓ 10% Stable", icon: MessageSquareIcon, color: "text-green-400" },
        { label: "Aphasia Risk", value: "0.8 Noun/Verb", sub: "Stable", icon: MicIcon, color: "text-white" },
        { label: "Sundowning Onset", value: "16:30 PM", sub: "Earlier", icon: Sun, color: "text-yellow-400" },
        { label: "Emotional Range", value: "40% Positive", sub: "Flat Affect: 15%", icon: SmileIcon, color: "text-white" },
        { label: "Orientation", value: "28 / 30", sub: "Stable", icon: Brain, color: "text-green-400" },
        { label: "Sleep Quality (WASO)", value: "4x Wakes/night", sub: "↑ 1x", icon: Moon, color: "text-yellow-400" },
        { label: "Gait Velocity", value: "0.8 m/s", sub: "Stable", icon: Activity, color: "text-white" },
        { label: "Hydration Adherence", value: "1.2 L/day", sub: "↓ Low Warning", icon: Droplets, color: "text-orange-400" },
    ];

    return (
        <div className="w-full h-full p-8 pt-24 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-4xl font-serif text-white mb-2">Digital Biomarkers</h2>
                    <p className="text-white/60">Longitudinal monitoring of cognitive, behavioral, and physiological indicators.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((m, i) => (
                        <MetricCard key={i} metric={m} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ metric, index }: { metric: any; index: number }) {
    const Icon = metric.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/5 transition-colors"
        >
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{metric.label}</span>
                <Icon className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
            </div>

            <div className="relative z-10">
                <div className="text-2xl font-bold text-white mb-1 font-serif tracking-tight">{metric.value.split(" ")[0]} <span className="text-sm font-sans font-normal opacity-60">{metric.value.split(" ").slice(1).join(" ")}</span></div>
                <div className={cn("text-xs font-medium", metric.color)}>{metric.sub}</div>
            </div>

            {/* Sparkline decoration */}
            <div className="absolute bottom-6 right-6 w-20 h-8 opacity-50">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path d="M0,30 L20,35 L40,10 L60,25 L80,5 L100,20" fill="none" stroke="currentColor" strokeWidth="2" className={metric.color} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </motion.div>
    )
}

// Simple Icon placeholders since I missed importing some specific ones
const MessageSquareIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const MicIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>;
const SmileIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg>;
