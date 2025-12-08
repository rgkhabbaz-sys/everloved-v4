"use client";

import { motion } from "framer-motion";
import { Heart, Settings, BookOpen, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "patient" | "caregiver" | "science" | "wellness";

interface TopNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
    const tabs = [
        { id: "patient", label: "Patient Comfort", icon: Heart },
        { id: "caregiver", label: "Caregiver Control", icon: Settings },
        { id: "science", label: "New Science", icon: BookOpen },
        { id: "wellness", label: "Health & Wellness", icon: Activity },
    ] as const;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="flex items-center gap-1 p-1.5 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                isActive
                                    ? "text-black bg-white/90 shadow-sm"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
