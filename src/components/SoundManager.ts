import { useGameStore } from '../store/gameStore';

// Initialize AudioContext lazily
let audioCtx: AudioContext | null = null;
const tg = (window as any).Telegram?.WebApp;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

export const SoundManager = {
    playShoot: () => {
        if (useGameStore.getState().isMuted) return;

        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);

            // Haptics
            tg?.HapticFeedback.impactOccurred('light');
        } catch (e) { }
    },

    playHit: () => {
        if (useGameStore.getState().isMuted) return;

        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { }
    },

    playMerge: () => {
        const isMuted = useGameStore.getState().isMuted;
        try {
            if (!isMuted) {
                const ctx = getCtx();
                const now = ctx.currentTime;

                [440, 554, 659, 880].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    const t = now + i * 0.05;
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(t);
                    osc.stop(t + 0.3);
                });
            }

            tg?.HapticFeedback.notificationOccurred('success');
        } catch (e) { }
    },

    playBuy: () => {
        const isMuted = useGameStore.getState().isMuted;
        try {
            if (!isMuted) {
                const ctx = getCtx();
                const now = ctx.currentTime;

                // High ping
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.frequency.setValueAtTime(1200, now);
                gain1.gain.setValueAtTime(0.1, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                // Second ping
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.frequency.setValueAtTime(1600, now + 0.1);
                gain2.gain.setValueAtTime(0.1, now + 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                osc1.connect(gain1); gain1.connect(ctx.destination);
                osc2.connect(gain2); gain2.connect(ctx.destination);

                osc1.start(now); osc1.stop(now + 0.4);
                osc2.start(now + 0.1); osc2.stop(now + 0.5);
            }
            tg?.HapticFeedback.notificationOccurred('success');
        } catch (e) { }
    },

    playPowerup: () => {
        playTone(400, 0.1, 'sine');
        setTimeout(() => playTone(600, 0.1, 'sine'), 100);
        setTimeout(() => playTone(800, 0.3, 'sine'), 200);
    },
};

// Helper for simple tones 
// (Move playTone inside SoundManager or make it a helper function in file scope)
const playTone = (freq: number, dur: number, type: OscillatorType) => {
    if (useGameStore.getState().isMuted) return;
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    } catch (e) { }
};
