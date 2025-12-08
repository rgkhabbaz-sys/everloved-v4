"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Upload, User, Save, FileText, Check, Shield, Image as ImageIcon, Sparkles, Activity, Clock, Brain, AlertTriangle, Play, Pause, List, Calendar, Video, Mic } from "lucide-react";
import { PersonaProfile as BaseProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { WellnessDashboard } from "./caregiver/WellnessDashboard";
import { NewScience } from "./caregiver/NewScience";
import { cn } from "@/lib/utils";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// Extended locally to avoid modifying types.ts
interface PersonaProfile extends BaseProfile {
    conversationTone: string;
    videoSample: string;
}

const DEFAULT_PROFILE: PersonaProfile = {
    name: "",
    relation: "",
    gender: "female",
    lifeStory: "",
    blockTravel: true,
    blockAliveClaims: true,
    redirectConfusion: true,
    customBoundaries: "",
    avatarPhoto: "",
    backgroundPhotos: ["", "", "", ""],
    activeBackgroundIndex: 0,
    conversationTone: "Warm & Gentle",
    videoSample: ""
};

export function CaregiverView({ tab }: { tab: "caregiver" | "science" | "wellness" }) {
    if (tab === "wellness") return <WellnessDashboard />;
    if (tab === "science") return <NewScience />;

    return <AdminDashboard />;
}

type SubTab = "config" | "monitoring" | "analytics";

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<SubTab>("config");

    return (
        <div className="w-full h-screen flex flex-col bg-transparent text-white relative">
            {/* Background Atmosphere */}
            {/* Background Atmosphere removed to allow global dynamic layer to show through */}

            {/* Sub-Navigation */}
            <div className="pt-24 pb-8 px-8 flex justify-center z-20 relative">
                <div className="flex p-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                    {[
                        { id: "config", label: "Avatar Configuration" },
                        { id: "monitoring", label: "Monitoring Dashboard" },
                        { id: "analytics", label: "Cognitive Analytics" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SubTab)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-48 px-4 md:px-8 relative z-10 scrollbar-hide">
                <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === "config" && <AvatarConfiguration />}
                            {activeTab === "monitoring" && <MonitoringDashboard />}
                            {activeTab === "analytics" && <CognitiveAnalytics />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// VIEW A: AVATAR CONFIGURATION
// ----------------------------------------------------------------------------
function AvatarConfiguration() {
    const [profile, setProfile] = useState<PersonaProfile>(DEFAULT_PROFILE);
    const [isSaving, setIsSaving] = useState(false);

    // Refs
    const bioInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const bgInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("everloved_profile");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setProfile({ ...DEFAULT_PROFILE, ...parsed });
            } catch (e) {
                console.error("Failed to parse profile", e);
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem("everloved_profile", JSON.stringify(profile));
        setTimeout(() => setIsSaving(false), 800);
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, field: "avatar" | "background" | "video", index?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;

            if (field === "avatar") {
                setProfile(prev => ({ ...prev, avatarPhoto: result }));
            } else if (field === "video") {
                setProfile(prev => ({ ...prev, videoSample: result }));
            } else if (field === "background" && typeof index === "number") {
                setProfile(prev => {
                    const newPhotos = [...prev.backgroundPhotos];
                    newPhotos[index] = result;
                    return { ...prev, backgroundPhotos: newPhotos };
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleBioUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setProfile(prev => ({ ...prev, lifeStory: event.target?.result as string || "" }));
        };
        reader.readAsText(file);
    };

    const toggleBoolean = (field: keyof Pick<PersonaProfile, 'blockTravel' | 'blockAliveClaims' | 'redirectConfusion'>) => {
        setProfile(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* COLUMN 1: IDENTITY & SAFETY */}
                <div className="space-y-8">
                    <GlassCard title="Identity Configuration" icon={User}>
                        <div className="space-y-5">
                            <InputGroup label="Patient Name">
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-colors font-light placeholder:text-white/20"
                                    placeholder="e.g. Martha"
                                />
                            </InputGroup>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Relationship">
                                    <input
                                        type="text"
                                        value={profile.relation}
                                        onChange={e => setProfile({ ...profile, relation: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-colors font-light placeholder:text-white/20"
                                        placeholder="e.g. Mother"
                                    />
                                </InputGroup>
                                <InputGroup label="Voice Gender">
                                    <div className="relative">
                                        <select
                                            value={profile.gender}
                                            onChange={e => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-colors appearance-none font-light"
                                        >
                                            <option value="female" className="bg-stone-900">Female (Warm)</option>
                                            <option value="male" className="bg-stone-900">Male (Calm)</option>
                                        </select>
                                    </div>
                                </InputGroup>
                            </div>
                            <InputGroup label="Conversation Tone">
                                <div className="relative">
                                    <select
                                        value={profile.conversationTone}
                                        onChange={e => setProfile({ ...profile, conversationTone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-colors appearance-none font-light"
                                    >
                                        <option value="Warm & Gentle" className="bg-stone-900">Warm & Gentle</option>
                                        <option value="Cheerful & Energetic" className="bg-stone-900">Cheerful & Energetic</option>
                                        <option value="Calm & Soothing" className="bg-stone-900">Calm & Soothing</option>
                                        <option value="Matter-of-Fact" className="bg-stone-900">Matter-of-Fact</option>
                                    </select>
                                </div>
                            </InputGroup>
                        </div>
                    </GlassCard>

                    <GlassCard title="Safety & Boundaries" icon={Shield} className="bg-gradient-to-br from-white/5 to-white/0">
                        <div className="space-y-6">
                            <p className="text-xs text-white/50 font-medium tracking-wide uppercase border-b border-white/5 pb-2">Active Restrictions</p>
                            <div className="space-y-3">
                                <ToggleItem label="Block travel promises" description="Prevent promises of trips/going home" checked={profile.blockTravel} onChange={() => toggleBoolean('blockTravel')} />
                                <ToggleItem label="Block 'being alive' claims" description="Prevent mentioning deceased persons" checked={profile.blockAliveClaims} onChange={() => toggleBoolean('blockAliveClaims')} />
                                <ToggleItem label="Redirect confusion" description="Auto-pivot to happy memories" checked={profile.redirectConfusion} onChange={() => toggleBoolean('redirectConfusion')} />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* COLUMN 2: CONTEXT & VISUALS */}
                <div className="space-y-8">
                    <GlassCard title="Deep Context" icon={FileText} action={
                        <button onClick={() => bioInputRef.current?.click()} className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-white/80 transition-colors flex items-center gap-1.5">
                            <Upload className="w-3 h-3" /> Upload .txt
                        </button>
                    }>
                        <div className="relative group">
                            <textarea
                                value={profile.lifeStory}
                                onChange={e => setProfile({ ...profile, lifeStory: e.target.value })}
                                className="w-full min-h-[140px] bg-black/20 border border-white/5 rounded-xl p-4 text-white/80 leading-relaxed focus:outline-none focus:border-green-500/30 resize-y font-light placeholder:text-white/20 text-sm"
                                placeholder="Paste biography, key memories, and important life events..."
                            />
                            <input type="file" ref={bioInputRef} hidden accept=".txt" onChange={handleBioUpload} />
                        </div>
                    </GlassCard>

                    <GlassCard title="Visual Studio" icon={ImageIcon}>
                        <div className="space-y-8">
                            {/* Avatar */}
                            <div className="flex gap-6">
                                <div onClick={() => avatarInputRef.current?.click()} className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-green-500/40 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group flex-shrink-0">
                                    {profile.avatarPhoto ? (
                                        <img src={profile.avatarPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-white/40 group-hover:text-white/80 transition-colors">
                                            <User className="w-8 h-8" />
                                            <span className="text-[10px] font-medium uppercase">Avatar</span>
                                        </div>
                                    )}
                                    <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, "avatar")} />
                                </div>
                                <div className="flex-1 space-y-2 pt-2">
                                    <h4 className="text-white font-medium">Avatar Photo</h4>
                                    <p className="text-sm text-white/50 leading-relaxed">Upload a clear, front-facing photo for the AI avatar generation. Neutral lighting works best.</p>
                                </div>
                            </div>

                            {/* Video Upload */}
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest block">Voice/Video Sample</label>
                                <div onClick={() => videoInputRef.current?.click()} className="w-full h-24 rounded-2xl border-2 border-dashed border-white/10 hover:border-green-500/40 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center gap-4 group">
                                    {profile.videoSample ? (
                                        <div className="flex items-center gap-3 text-green-400">
                                            <Check className="w-5 h-5" />
                                            <span className="font-medium text-sm">Video Sample Uploaded</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                                                <Video className="w-5 h-5 text-white/60" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-white/80">Upload Video Clip</p>
                                                <p className="text-xs text-white/40">Supports .mp4, .mov</p>
                                            </div>
                                        </>
                                    )}
                                    <input type="file" ref={videoInputRef} hidden accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
                                </div>
                            </div>

                            {/* Environment Gallery */}
                            <div>
                                <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 block">Environment Gallery</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[0, 1, 2, 3].map((index) => (
                                        <div key={index} className="space-y-2 group">
                                            <div
                                                onClick={() => !profile.backgroundPhotos[index] && bgInputRefs.current[index]?.click()}
                                                className={cn("aspect-square rounded-lg border relative overflow-hidden transition-all cursor-pointer", profile.activeBackgroundIndex === index ? "border-green-500 ring-2 ring-green-500/20" : "border-white/10 hover:border-white/30")}
                                            >
                                                {profile.backgroundPhotos[index] ? (
                                                    <img src={profile.backgroundPhotos[index]} alt="Bg" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/10 hover:text-white/30"><ImageIcon className="w-4 h-4" /></div>
                                                )}
                                                {/* Hidden upload for replacement logic could go here, staying simple for now */}
                                                <input type="file" hidden accept="image/*" ref={el => { bgInputRefs.current[index] = el; }} onChange={(e) => handleFileUpload(e, "background", index)} />
                                            </div>
                                            <button onClick={() => setProfile({ ...profile, activeBackgroundIndex: index })} className="w-full flex justify-center">
                                                <div className={cn("w-2 h-2 rounded-full transition-colors", profile.activeBackgroundIndex === index ? "bg-green-500" : "bg-white/10 group-hover:bg-white/30")} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <FloatingActionBar onSave={handleSave} isSaving={isSaving} />
        </div>
    );
}

// ----------------------------------------------------------------------------
// VIEW B: MONITORING DASHBOARD
// ----------------------------------------------------------------------------
const agitationData = [
    { name: '08:00', scale: 2 },
    { name: '10:00', scale: 3 },
    { name: '12:00', scale: 5 },
    { name: '14:00', scale: 4 },
    { name: '16:00', scale: 2 },
    { name: '18:00', scale: 3 },
    { name: '20:00', scale: 1 },
];

function MonitoringDashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <GlassCard title="Agitation Levels" icon={Activity}>
                    <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agitationData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Bar dataKey="scale" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30}>
                                    {agitationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.scale > 4 ? '#ef4444' : '#22c55e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard title="Recent Logs" icon={List}>
                    <div className="space-y-4">
                        {[
                            { time: "10:42 AM", event: "Conversation about gardening", type: "Positive" },
                            { time: "12:15 PM", event: "Exhibited mild confusion regarding lunch", type: "Neutral" },
                            { time: "02:30 PM", event: "Asked for 'Mother', redirected successfully", type: "Action" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <span className="text-xs font-mono text-white/40">{log.time}</span>
                                <div className="flex-1 text-sm text-white/80">{log.event}</div>
                                <span className={cn("text-[10px] uppercase font-bold px-2 py-1 rounded",
                                    log.type === "Positive" ? "bg-green-500/10 text-green-400" :
                                        log.type === "Action" ? "bg-blue-500/10 text-blue-400" : "bg-white/10 text-white/50"
                                )}>{log.type}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-8">
                <GlassCard title="Real-Time Status" icon={Activity} className="bg-gradient-to-br from-green-900/10 to-transparent">
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse" />
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                        </div>
                        <h3 className="mt-6 text-2xl font-serif text-white">Active & Calm</h3>
                        <p className="text-white/40 text-sm mt-2">Last update: Just now</p>
                    </div>
                </GlassCard>

                <GlassCard title="Schedule" icon={Calendar}>
                    <div className="space-y-4 mt-2">
                        <div className="flex items-center gap-3 opacity-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            <span className="text-sm text-white/50 line-through">09:00 AM Breakfast</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-sm text-white font-medium">02:00 PM Medication</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            <span className="text-sm text-white/60">06:00 PM Evening Call</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// VIEW C: COGNITIVE ANALYTICS
// ----------------------------------------------------------------------------
const memoryData = [
    { day: 'M', score: 65 },
    { day: 'T', score: 59 },
    { day: 'W', score: 80 },
    { day: 'T', score: 81 },
    { day: 'F', score: 56 },
    { day: 'S', score: 55 },
    { day: 'S', score: 40 },
];

function CognitiveAnalytics() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="col-span-1 lg:col-span-1 flex flex-col justify-center items-center py-10 bg-gradient-to-b from-white/5 to-transparent">
                <div className="p-4 rounded-full bg-white/5 mb-4 border border-white/5">
                    <Brain className="w-8 h-8 text-white/80" />
                </div>
                <h2 className="text-4xl font-serif text-white mb-2">Stable</h2>
                <p className="text-sm text-white/40 uppercase tracking-widest font-bold">Cognitive State</p>
            </GlassCard>

            <GlassCard title="Memory Retention" icon={Brain} className="col-span-1 lg:col-span-3">
                <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={memoryData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <GlassCard title="Confusion Frequency" icon={AlertTriangle} className="col-span-1 lg:col-span-2">
                <div className="flex items-end gap-2 mt-4">
                    <span className="text-5xl font-serif text-white">4</span>
                    <span className="text-sm text-white/40 mb-2">episodes this week</span>
                </div>
                <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[30%] bg-red-500 rounded-full" />
                </div>
                <p className="text-xs text-white/30 mt-2 text-right">-12% vs last week</p>
            </GlassCard>

            <GlassCard title="Word Recall" icon={List} className="col-span-1 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-2xl font-serif text-white">85%</div>
                        <div className="text-[10px] text-white/40 uppercase mt-1">Nouns</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-2xl font-serif text-white">62%</div>
                        <div className="text-[10px] text-white/40 uppercase mt-1">Names</div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

// ----------------------------------------------------------------------------
// UTILS & COMPONENTS
// ----------------------------------------------------------------------------

function GlassCard({ children, title, icon: Icon, action, className }: { children: React.ReactNode, title?: string, icon?: any, action?: React.ReactNode, className?: string }) {
    return (
        <div className={cn("bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl", className)}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    {title && (
                        <h3 className="text-lg font-medium text-white/90 flex items-center gap-3">
                            {Icon && <Icon className="w-5 h-5 text-white/50" />}
                            {title}
                        </h3>
                    )}
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}

function FloatingActionBar({ onSave, isSaving }: { onSave: () => void, isSaving: boolean }) {
    return (
        <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="bg-white text-black font-serif text-lg px-12 py-3 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" /> Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest ml-1">{label}</label>
            {children}
        </div>
    );
}

function ToggleItem({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) {
    return (
        <div onClick={onChange} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
            <div className={cn("w-10 h-6 rounded-full relative transition-colors flex items-center", checked ? "bg-green-500" : "bg-white/10")}>
                <div className={cn("w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ml-1", checked ? "translate-x-4" : "")} />
            </div>
            <div className="flex-1">
                <p className={cn("text-sm font-medium transition-colors", checked ? "text-white" : "text-white/70")}>{label}</p>
                <p className="text-xs text-white/30 font-light">{description}</p>
            </div>
        </div>
    );
}
