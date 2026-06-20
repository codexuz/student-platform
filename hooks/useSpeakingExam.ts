"use client";

// Real-time IELTS Speaking exam client.
//
// Connects to the backend /ielts-speaking Socket.IO namespace, streams mic
// audio (PCM16 mono 24kHz, base64) to the AI examiner, plays the examiner's
// voice back gaplessly, and surfaces the exam state (phase, Part 2 timers,
// live transcript, and the end-of-exam band feedback).

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "https://backend.impulselc.uz";
const SAMPLE_RATE = 24000;

export type ExamPhase =
  | "idle"
  | "connecting"
  | "live" // Part 1 / Part 3 free conversation
  | "prep" // Part 2 preparation (mic muted, examiner silent)
  | "speaking" // Part 2 long turn
  | "ended"
  | "error";

export interface TranscriptTurn {
  role: "examiner" | "candidate";
  text: string;
}

export interface BandFeedback {
  overall_band: number;
  criteria: {
    fluency_coherence: number;
    lexical_resource: number;
    grammatical_range_accuracy: number;
    pronunciation: number;
  };
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface TimerState {
  label: string;
  total: number;
  secondsLeft: number;
}

export interface SpeakingExamState {
  phase: ExamPhase;
  sessionId: string | null;
  title: string | null;
  transcript: TranscriptTurn[];
  aiPartial: string;
  timer: TimerState | null;
  feedback: BandFeedback | null;
  error: string | null;
  muted: boolean;
  examinerSpeaking: boolean;
}

// ── PCM <-> base64 helpers ────────────────────────────────────────────────

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToFloat32(b64: string): Float32Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;
  return float32;
}

export function useSpeakingExam(speakingId: string) {
  const [state, setState] = useState<SpeakingExamState>({
    phase: "idle",
    sessionId: null,
    title: null,
    transcript: [],
    aiPartial: "",
    timer: null,
    feedback: null,
    error: null,
    muted: false,
    examinerSpeaking: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const mutedRef = useRef(false);

  // Audio plumbing
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playHeadRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Timer ticking
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patch = useCallback((p: Partial<SpeakingExamState>) => {
    setState((prev) => ({ ...prev, ...p }));
  }, []);

  const stopPlayback = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    sourcesRef.current.clear();
    playHeadRef.current = 0;
  }, []);

  const playChunk = useCallback((b64: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    const f32 = base64ToFloat32(b64);
    if (f32.length === 0) return;
    const buffer = ctx.createBuffer(1, f32.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    if (playHeadRef.current < now) playHeadRef.current = now;
    src.start(playHeadRef.current);
    playHeadRef.current += buffer.duration;
    sourcesRef.current.add(src);
    src.onended = () => sourcesRef.current.delete(src);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }, []);

  const startTimer = useCallback(
    (label: string, seconds: number) => {
      clearTimer();
      patch({ timer: { label, total: seconds, secondsLeft: seconds } });
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => {
          if (!prev.timer) return prev;
          const secondsLeft = prev.timer.secondsLeft - 1;
          if (secondsLeft <= 0) {
            return { ...prev, timer: { ...prev.timer, secondsLeft: 0 } };
          }
          return { ...prev, timer: { ...prev.timer, secondsLeft } };
        });
      }, 1000);
    },
    [clearTimer, patch],
  );

  const startMic = useCallback(async () => {
    if (inputCtxRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStreamRef.current = stream;
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    inputCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    processor.onaudioprocess = (e) => {
      if (mutedRef.current) return;
      const socket = socketRef.current;
      const sessionId = sessionIdRef.current;
      if (!socket || !sessionId) return;
      const input = e.inputBuffer.getChannelData(0);
      const b64 = arrayBufferToBase64(floatTo16BitPCM(input));
      socket.emit("speaking:audio", { session_id: sessionId, audio: b64 });
    };
    source.connect(processor);
    // ScriptProcessor needs a destination to run; route through a muted gain
    // so the mic isn't echoed back to the speakers.
    const sink = ctx.createGain();
    sink.gain.value = 0;
    processor.connect(sink);
    sink.connect(ctx.destination);
  }, []);

  const teardownAudio = useCallback(() => {
    stopPlayback();
    clearTimer();
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    inputCtxRef.current?.close().catch(() => {});
    inputCtxRef.current = null;
    outputCtxRef.current?.close().catch(() => {});
    outputCtxRef.current = null;
  }, [stopPlayback, clearTimer]);

  const start = useCallback(async () => {
    if (socketRef.current) return;
    patch({ phase: "connecting", error: null });

    // Prepare playback context up front (created from a user gesture).
    outputCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });

    const token =
      typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

    const socket = io(`${SOCKET_URL}/ielts-speaking`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("speaking:start", { speaking_id: speakingId });
    });

    socket.on("speaking:started", async (d: { session_id: string; title?: string }) => {
      sessionIdRef.current = d.session_id;
      patch({ phase: "live", sessionId: d.session_id, title: d.title ?? null });
      try {
        await startMic();
      } catch {
        patch({
          phase: "error",
          error: "Microphone access is required to take the speaking test.",
        });
      }
    });

    socket.on("speaking:audio", (d: { audio: string }) => {
      patch({ examinerSpeaking: true });
      playChunk(d.audio);
    });

    socket.on("speaking:ai-transcript", (d: { text: string }) => {
      setState((prev) => ({ ...prev, aiPartial: prev.aiPartial + d.text }));
    });

    socket.on("speaking:user-transcript", (d: { text: string }) => {
      const text = (d.text || "").trim();
      if (!text) return;
      setState((prev) => ({
        ...prev,
        transcript: [...prev.transcript, { role: "candidate", text }],
      }));
    });

    socket.on("speaking:response-done", () => {
      setState((prev) => {
        const text = prev.aiPartial.trim();
        return {
          ...prev,
          aiPartial: "",
          examinerSpeaking: false,
          transcript: text
            ? [...prev.transcript, { role: "examiner", text }]
            : prev.transcript,
        };
      });
    });

    socket.on("speaking:speech-started", () => {
      // Barge-in: drop any queued examiner audio for snappy turn-taking.
      stopPlayback();
      patch({ examinerSpeaking: false });
    });

    socket.on("speaking:prep-started", (d: { seconds: number }) => {
      patch({ phase: "prep" });
      startTimer("Preparation", d.seconds);
    });

    socket.on("speaking:speaking-started", (d: { seconds: number }) => {
      patch({ phase: "speaking" });
      startTimer("Speaking", d.seconds);
    });

    socket.on("speaking:speaking-ended", () => {
      clearTimer();
      patch({ phase: "live", timer: null });
    });

    socket.on("speaking:feedback", (d: { feedback: BandFeedback }) => {
      patch({ feedback: d.feedback });
    });

    socket.on("speaking:ended", (d: { reason?: string }) => {
      clearTimer();
      patch({ phase: "ended", timer: null, examinerSpeaking: false });
      teardownAudio();
      void d;
    });

    socket.on("speaking:error", (d: { message?: string }) => {
      patch({ phase: "error", error: d.message ?? "Speaking session error" });
    });

    socket.on("connect_error", (e) => {
      patch({ phase: "error", error: e.message || "Connection failed" });
    });
  }, [
    speakingId,
    patch,
    startMic,
    playChunk,
    stopPlayback,
    startTimer,
    clearTimer,
    teardownAudio,
  ]);

  const end = useCallback(() => {
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;
    if (socket && sessionId) {
      socket.emit("speaking:end", { session_id: sessionId });
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    patch({ muted: next });
    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;
    if (socket && sessionId) {
      socket.emit("speaking:mute", { session_id: sessionId, muted: next });
    }
  }, [patch]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      const sessionId = sessionIdRef.current;
      if (socket && sessionId) {
        socket.emit("speaking:end", { session_id: sessionId });
      }
      socket?.disconnect();
      socketRef.current = null;
      teardownAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, start, end, toggleMute };
}
