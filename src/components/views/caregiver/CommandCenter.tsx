"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Mic, Shield, Check, FileText, Brain, Zap, Heart, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandCenter() {
    const [activeSubTab, setActiveSubTab] = useState<"avatar" | "monitoring" | "analytics">("avatar");

    return (
        <div className="w-full h-full p-8 pt-24 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h2 className="text-4xl font-serif text-white mb-2">Caregiver Command Center</h2>
                <p className="text-white/60">Configure avatar, monitor interactions, and analyze well-being.</p>
            </motion.div>

            {/* Sub-navigation pills */}
            <div className="flex gap-2 p-1 bg-white/10 rounded-full backdrop-blur-md mb-8">
                {[
                    { id: "avatar", label: "Avatar Configuration" },
                    { id: "monitoring", label: "Monitoring Dashboard" },
                    { id: "analytics", label: "Cognitive Analytics" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                            activeSubTab === tab.id
                                ? "bg-white text-black shadow-sm"
                                : "text-white/70 hover:text-white"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeSubTab === "avatar" && (
                <>
                    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Photo Upload Card */}
                        <Card title="Photo Upload" icon={Upload}>
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl p-8 bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
                                <div className="p-4 bg-white/10 rounded-full mb-4 group-hover:bg-white/20 transition-colors">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-white/80 font-medium mb-1">Drag & drop or click to upload</p>
                                <button className="text-xs px-4 py-2 bg-white/10 rounded-full mt-2 hover:bg-white/20">Choose Files</button>
                                <p className="text-white/40 text-xs mt-4">Supports JPG, PNG</p>
                            </div>
                        </Card>

                        {/* Voice Engine Card */}
                        <Card title="Voice Engine" icon={Mic}>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs uppercase text-white/40 font-semibold tracking-wider mb-2 block">Voice Style</label>
                                    <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between border border-white/10">
                                        <span className="text-white/90">Gentle & Soft</span>
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-white/40 font-semibold tracking-wider mb-2 block">Tone Anchors</label>
                                    <div className="space-y-2">
                                        {["Calm", "Jovial", "Authoritative"].map((tone, i) => (
                                            <div key={tone} className="flex items-center gap-2">
                                                <div className={cn("w-4 h-4 rounded flex items-center justify-center", i <= 1 ? "bg-green-500 text-black" : "bg-white/10")}>
                                                    {i <= 1 && <Check className="w-3 h-3" />}
                                                </div>
                                                <span className="text-white/80">{tone}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Safety Settings Card - Split into Identity and Boundaries */}
                        <div className="space-y-6">
                            <Card title="Safety Settings" icon={Shield}>
                                <div className="space-y-4">
                                    <label className="text-xs uppercase text-white/40 font-semibold tracking-wider">Identity Configuration</label>
                                    <Input placeholder="Patient Name (e.g. Sarah)" />
                                    <Input placeholder="Avatar Name (e.g. Michel)" />
                                    <Input placeholder="Relationship (e.g. Mother)" />
                                    <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between border border-white/10">
                                        <span className="text-white/90">Female (Warm)</span>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Boundaries" icon={Shield} className="bg-stone-900/60">
                                <div className="space-y-3">
                                    {["Block travel promises", "Block 'being alive' claims", "Redirect confusion"].map((item) => (
                                        <div key={item} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center border border-green-500/50">
                                                <Check className="w-3 h-3 text-green-500" />
                                            </div>
                                            <span className="text-white/80 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Additional Row for Video and Life Story */}
                    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {/* Video Generation - Col 1 */}
                        <Card title="Video Generation" icon={VideoIcon}>
                            <div className="grid grid-cols-2 gap-4 h-48">
                                <button className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/20 rounded-2xl p-4 hover:border-purple-500/50 transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                                        <Upload className="w-5 h-5 text-purple-300" />
                                    </div>
                                    <div className="text-center">
                                        <div className="font-medium text-white text-sm">Photo to Video</div>
                                        <div className="text-[10px] text-white/40 mt-1">GenAI Memories</div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-medium">Select Photos</div>
                                </button>

                                <button className="flex flex-col items-center justify-center gap-3 bg-black/20 border border-white/10 rounded-2xl p-4 hover:bg-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                        <VideoIcon className="w-5 h-5 text-blue-300" />
                                    </div>
                                    <div className="text-center">
                                        <div className="font-medium text-white text-sm">Upload Video</div>
                                        <div className="text-[10px] text-white/40 mt-1">Existing Clips</div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-medium">Select Video</div>
                                </button>
                            </div>
                        </Card>

                        {/* Empty logical col 2 spacer or extended content */}
                        <div className="hidden md:block" />

                        {/* Life Story - Col 3 */}
                        <Card title="Life Story" icon={FileText}>
                            <div className="h-full">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs uppercase text-white/40 font-semibold tracking-wider">Biography & Core Memories</span>
                                    <button className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white bg-white/10 px-2 py-1 rounded-full border border-white/5">
                                        <Upload className="w-3 h-3" /> Upload Text File
                                    </button>
                                </div>
                                <textarea
                                    className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none leading-relaxed"
                                    placeholder="Paste a biography, key memories, childhood stories, or important life events here..."
                                />
                                <div className="flex justify-end mt-4">
                                    <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full shadow-lg hover:bg-white/90">Save Configuration</button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {activeSubTab === "monitoring" && (
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
                    <Card title="Live Transcript" icon={FileText} className="h-full">
                        <div className="h-full bg-black/20 rounded-xl border border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                Awaiting conversation...
                            </div>
                        </div>
                    </Card>
                    <Card title="Intervention" icon={Shield} className="h-full">
                        <div className="space-y-6">
                            <button className="w-full py-4 bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors">
                                <Shield className="w-5 h-5" />
                                Emergency Pause
                            </button>

                            <div>
                                <label className="text-xs uppercase text-white/40 font-semibold tracking-wider mb-2 block">Schedule Manager</label>
                                <div className="h-24 bg-black/20 rounded-xl border border-white/10" />
                            </div>

                            <div>
                                <label className="text-xs uppercase text-white/40 font-semibold tracking-wider mb-2 block">Core Memory Input</label>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="e.g. Wedding 1960" className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30" />
                                    <button className="px-4 py-2 bg-white/10 rounded-lg text-white/80 hover:bg-white/20">Add</button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeSubTab === "analytics" && (
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Row 1 */}
                    <Card title="Lexical Diversity" icon={FileText} className="h-64">
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">0.72</div>
                                <div className="text-sm text-white/60">Ratio</div>
                                <div className="text-xs text-green-400 mt-1">Stable</div>
                            </div>
                            <div className="w-full h-24 relative mt-4">
                                {/* Blue line chart */}
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <path d="M0,35 L10,35 L20,34 L30,35 L40,34 L50,33 L60,33 L70,32 L80,32 L90,31 L100,32"
                                        fill="none" stroke="#60a5fa" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                                <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                            </div>
                        </div>
                    </Card>

                    <Card title="Semantic Coherence" icon={Brain} className="h-64">
                        <div className="flex flex-col h-full">
                            <div className="text-3xl font-bold text-white mb-1">92%</div>
                            <div className="text-sm text-white/60">Logical Flow</div>
                        </div>
                    </Card>

                    <Card title="Processing Speed" icon={Zap} className="h-64">
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">1.8s</div>
                                <div className="text-sm text-white/60">Avg Delay</div>
                                <div className="text-xs text-orange-400 mt-1">↑ Slower</div>
                            </div>
                            <div className="w-full h-24 relative mt-4">
                                {/* Yellow rising trend line */}
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <line x1="0" y1="40" x2="100" y2="10" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    {/* Row 2 */}
                    <Card title="Emotional Valence" icon={Heart} className="h-64">
                        <div className="flex flex-col h-full relative">
                            <div className="mb-4">
                                <div className="text-2xl font-bold text-white mb-1">Calm</div>
                                <div className="text-xs text-white/60">Positive</div>
                            </div>
                            {/* Scatter plot / Quadrants */}
                            <div className="flex-1 relative border-l border-b border-white/20">
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                                {/* Dots */}
                                <div className="absolute top-[40%] left-[60%] w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
                                <div className="absolute top-[30%] left-[55%] w-2 h-2 rounded-full bg-purple-400/50" />
                                <div className="absolute top-[50%] left-[45%] w-2 h-2 rounded-full bg-purple-400/50" />
                                <div className="absolute top-[45%] left-[70%] w-2 h-2 rounded-full bg-purple-400/30" />
                            </div>
                        </div>
                    </Card>

                    <Card title="Short-Term Recall" icon={Clock} className="h-64">
                        <div className="flex flex-col h-full items-center justify-center relative">
                            <div className="absolute top-0 left-0">
                                <div className="text-2xl font-bold text-white">3/5</div>
                                <div className="text-xs text-white/60">Prompts</div>
                            </div>

                            {/* Circular Progress */}
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="100.48" strokeLinecap="round" />
                                </svg>
                                <div className="absolute text-3xl font-bold text-white">60%</div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Confusion Episodes" icon={Activity} className="h-64">
                        <div className="flex flex-col h-full">
                            <div className="text-3xl font-bold text-white mb-1">4</div>
                            <div className="text-sm text-white/60">Events Today</div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

function Card({ title, icon: Icon, children, className }: { title: string; icon: any; children: React.ReactNode, className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("bg-stone-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden", className)}
        >
            <div className="flex items-center gap-2 mb-6 text-white/90">
                <Icon className="w-5 h-5" />
                <h3 className="text-lg font-serif font-medium">{title}</h3>
            </div>
            {children}
        </motion.div>
    )
}

function Input({ placeholder }: { placeholder: string }) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 mb-2 transition-colors"
        />
    )
}

const VideoIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;
