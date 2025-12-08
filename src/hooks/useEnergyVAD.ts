import { useState, useRef, useEffect, useCallback } from 'react';

interface UseEnergyVADOptions {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audioFloat32: Float32Array) => void;
    positiveSpeechThreshold?: number; // 0.0 to 1.0 (Volume)
    minSpeechDuration?: number; // ms
    silenceTimeout?: number; // ms
}

export function useEnergyVAD({
    onSpeechStart,
    onSpeechEnd,
    positiveSpeechThreshold = 0.1,
    minSpeechDuration = 200,
    silenceTimeout = 1000,
}: UseEnergyVADOptions) {
    const [isListening, setIsListening] = useState(false);
    const [isTalking, setIsTalking] = useState(false);

    // Refs for state that updates frequently/internal logic
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioChunksRef = useRef<Float32Array[]>([]);

    const speechStartTimeRef = useRef<number>(0);
    const silenceStartTimeRef = useRef<number | null>(null);
    const isTalkingRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    const start = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 1. Setup Audio Context
            const audioContext = new AudioContext({ sampleRate: 16000 }); // Force 16kHz for Gemini efficiency
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);

            // 2. Setup Analyser (Energy Detection)
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);
            analyserRef.current = analyser;

            // 3. Setup ScriptProcessor (Raw Recording)
            // BufferSize 4096 gives ~0.25s latency at 16kHz
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Only record if we are "talking" (or slightly before/after for buffering? 
                // For simplicity, we record everything while "talking" state is active, 
                // or maybe we just ring-buffer? 
                // Let's record *everything* into a temporary buffer but only COMMIT it when talking.)

                if (isTalkingRef.current) {
                    // Clone the data because the buffer is reused
                    const chunk = new Float32Array(inputData);
                    audioChunksRef.current.push(chunk);
                }
            };

            // Needs to be connected to destination for Chrome to fire it (even if we don't hear it)
            // But connecting to destination causes feedback loop if not careful? 
            // Usually connecting source -> processor -> destination (muted) works.
            // Actually, we process Raw input.
            source.connect(processor);
            processor.connect(audioContext.destination);
            // Note: ScriptProcessor output is silence by default unless we copy input to output.
            // We DON'T copy input to output, so no feedback.

            setIsListening(true);
            detectEnergy();

        } catch (error) {
            console.error("VAD Start Error:", error);
            throw error;
        }
    }, [positiveSpeechThreshold, silenceTimeout, minSpeechDuration]);

    const stop = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setIsListening(false);
        setIsTalking(false);
        isTalkingRef.current = false;
        silenceStartTimeRef.current = null;
        audioChunksRef.current = [];
    }, []);

    const detectEnergy = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate Volume (RMS-like average)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const volume = average / 255; // 0.0 to 1.0

        const now = Date.now();

        if (volume > positiveSpeechThreshold) {
            // SPEECH DETECTED
            silenceStartTimeRef.current = null; // Reset silence timer

            if (!isTalkingRef.current) {
                // START OF SPEECH
                isTalkingRef.current = true;
                setIsTalking(true);
                speechStartTimeRef.current = now;
                audioChunksRef.current = []; // Clear buffer and start fresh

                if (onSpeechStart) onSpeechStart();
            }
        } else {
            // SILENCE
            if (isTalkingRef.current) {
                if (silenceStartTimeRef.current === null) {
                    silenceStartTimeRef.current = now;
                }

                // Check if silence has exceeded timeout
                const silenceDuration = now - silenceStartTimeRef.current;

                if (silenceDuration > silenceTimeout) {
                    // SPEECH ENDED
                    const speechDuration = now - speechStartTimeRef.current;

                    if (speechDuration > minSpeechDuration) {
                        // VALID SPEECH
                        // Merge Chunks
                        const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
                        const fullAudio = new Float32Array(totalLength);
                        let offset = 0;
                        for (const chunk of audioChunksRef.current) {
                            fullAudio.set(chunk, offset);
                            offset += chunk.length;
                        }

                        if (onSpeechEnd) onSpeechEnd(fullAudio);
                    }

                    // Reset State
                    isTalkingRef.current = false;
                    setIsTalking(false);
                    silenceStartTimeRef.current = null;
                    audioChunksRef.current = [];
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(detectEnergy);
    };

    return {
        start,
        stop,
        listening: isListening,
        userSpeaking: isTalking
    };
}
