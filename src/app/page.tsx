"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { PatientView } from "@/components/views/PatientView";
import { CaregiverView } from "@/components/views/CaregiverView";
import { AnimatePresence, motion } from "framer-motion";

type Tab = "patient" | "caregiver" | "science" | "wellness";

const BACKGROUNDS: Record<Tab, string> = {
  patient: "/assets/images/bg-patient-v3.jpg",
  caregiver: "/assets/images/bg-caregiver-v3.jpg",
  science: "/assets/images/bg-science.png",
  wellness: "/assets/images/bg-health.jpg"
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("patient");

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans selection:bg-white/20">

      {/* Z-Index 0: Global Background Layer */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={activeTab}
            src={BACKGROUNDS[activeTab]}
            alt="Background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Z-Index 1: The Overlay (Critical for readability) */}
      <div className="absolute inset-0 z-1 bg-black/60 pointer-events-none" />

      {/* Z-Index 10: The Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab === "patient" ? "patient" : "caregiver-shell"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-full"
            >
              {activeTab === "patient" ? (
                <PatientView />
              ) : (
                <CaregiverView tab={activeTab} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
