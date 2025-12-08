import { useState, useRef, useEffect, useCallback } from 'react';

interface UseEnergyVADOptions {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audioBlob: Blob) => void;
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
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const speechStartTimeRef = useRef<number>(0);
    const silenceStartTimeRef = useRef<number | null>(null);
    const isTalkingRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    const start = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 1. Setup Analysis (The "Green Bar" Logic)
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);
            analyserRef.current = analyser;

            // 2. Setup Recording (Standard Browser Recorder)
            // Try standard MIME types
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4'; // Safari
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

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
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setIsListening(false);
        setIsTalking(false);
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
                audioChunksRef.current = []; // Clear buffer

                // Start Recording
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
                    mediaRecorderRef.current.start();
                }

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
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                            mediaRecorderRef.current.requestData(); // Flush
                            mediaRecorderRef.current.stop();

                            // Wait for dataavailable to fire on stop
                            setTimeout(() => {
                                const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType });
                                if (onSpeechEnd) onSpeechEnd(blob);
                            }, 100);
                        }
                    } else {
                        // IGNORE (Too short, likely noise click)
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                            mediaRecorderRef.current.stop();
                        }
                    }

                    // Reset State
                    isTalkingRef.current = false;
                    setIsTalking(false);
                    silenceStartTimeRef.current = null;
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
