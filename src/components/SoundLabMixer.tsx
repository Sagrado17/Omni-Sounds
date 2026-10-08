import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, Radio, Music, Cpu, Flame, Sliders } from 'lucide-react';
import { motion } from 'motion/react';

export default function SoundLabMixer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [volumes, setVolumes] = useState({
    drums: 0.8,
    bass: 0.7,
    melody: 0.6,
    fx: 0.4
  });
  const [mutes, setMutes] = useState({
    drums: false,
    bass: false,
    melody: false,
    fx: false
  });

  // Web Audio Context & Synthesizer State
  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0.0);
  const stepRef = useRef<number>(0);

  // Mixer Gain Nodes
  const gainsRef = useRef<{ [key: string]: GainNode }>({});

  const handleVolumeChange = (track: 'drums' | 'bass' | 'melody' | 'fx', val: number) => {
    setVolumes(prev => ({ ...prev, [track]: val }));
    if (gainsRef.current[track] && !mutes[track]) {
      gainsRef.current[track].gain.setValueAtTime(val, audioCtxRef.current?.currentTime || 0);
    }
  };

  const toggleMute = (track: 'drums' | 'bass' | 'melody' | 'fx') => {
    setMutes(prev => {
      const updated = { ...prev, [track]: !prev[track] };
      if (gainsRef.current[track]) {
        const val = updated[track] ? 0 : volumes[track];
        gainsRef.current[track].gain.setValueAtTime(val, audioCtxRef.current?.currentTime || 0);
      }
      return updated;
    });
  };

  // Synthesize instruments on the fly
  const playKick = (time: number, gainNode: GainNode) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.connect(gain);
    gain.connect(gainNode);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playHiHat = (time: number, gainNode: GainNode) => {
    if (!audioCtxRef.current) return;
    const bufferSize = audioCtxRef.current.sampleRate * 0.05;
    const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtxRef.current.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtxRef.current.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = audioCtxRef.current.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);

    noise.start(time);
    noise.stop(time + 0.05);
  };

  const playBass = (time: number, noteFreq: number, duration: number, gainNode: GainNode) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(noteFreq, time);

    // Apply simple lowpass filter to make the bass warm
    const filter = audioCtxRef.current.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);

    osc.start(time);
    osc.stop(time + duration);
  };

  const playMelody = (time: number, noteFreq: number, duration: number, gainNode: GainNode) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    const delay = audioCtxRef.current.createDelay();
    const feedback = audioCtxRef.current.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteFreq, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    // Simple delay echo effect
    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.4;

    osc.connect(gain);
    gain.connect(gainNode);

    // Feed to delay
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(gainNode);

    osc.start(time);
    osc.stop(time + duration);
  };

  const scheduler = () => {
    if (!audioCtxRef.current) return;
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
      scheduleNote(stepRef.current, nextNoteTimeRef.current);
      advanceNote();
    }
    schedulerTimerRef.current = window.setTimeout(scheduler, 25.0);
  };

  const advanceNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    // We are running 16th notes
    const sixteenthNoteDuration = 0.25 * secondsPerBeat;
    nextNoteTimeRef.current += sixteenthNoteDuration;
    stepRef.current = (stepRef.current + 1) % 16;
  };

  const scheduleNote = (step: number, time: number) => {
    // 1. Drums
    if (step % 4 === 0) {
      playKick(time, gainsRef.current.drums);
    }
    if (step % 2 === 0 || Math.random() > 0.6) {
      playHiHat(time, gainsRef.current.drums);
    }

    // 2. Bass (A-minor chord progression over 16 steps)
    // A1 = 55Hz, G1 = 49Hz, F1 = 43.6Hz, E1 = 41.2Hz
    const bassNotes = [55.0, 55.0, 55.0, 55.0, 49.0, 49.0, 49.0, 49.0, 43.6, 43.6, 43.6, 43.6, 41.2, 41.2, 41.2, 41.2];
    if (step % 2 === 0) {
      playBass(time, bassNotes[step], 0.2, gainsRef.current.bass);
    }

    // 3. Melody (Cool pentatonic synth line)
    // Notes in A minor pentatonic: A4 (440Hz), C5 (523.25Hz), D5 (587.33Hz), E5 (659.25Hz), G5 (783.99Hz)
    const melodyPattern = [440.0, 0, 523.25, 587.33, 0, 659.25, 0, 783.99, 587.33, 0, 523.25, 440.0, 0, 659.25, 783.99, 0];
    const freq = melodyPattern[step];
    if (freq > 0 && Math.random() > 0.1) {
      playMelody(time, freq, 0.15, gainsRef.current.melody);
    }
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      // Create and start AudioContext if not exists
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
        
        // Setup individual track gains
        const ctx = audioCtxRef.current;
        const mainDestination = ctx.destination;

        // Initialize channels
        const tracks: ('drums' | 'bass' | 'melody' | 'fx')[] = ['drums', 'bass', 'melody', 'fx'];
        tracks.forEach(t => {
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(mutes[t] ? 0 : volumes[t], ctx.currentTime);
          gainNode.connect(mainDestination);
          gainsRef.current[t] = gainNode;
        });
      }

      // Resume context if suspended (browser security)
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      nextNoteTimeRef.current = audioCtxRef.current.currentTime;
      stepRef.current = 0;
      scheduler();
      setIsPlaying(true);
    } else {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
      }
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
      }
    };
  }, []);

  return (
    <div id="sound-mixer" className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-neutral-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-xs uppercase font-semibold text-amber-500/80 tracking-widest font-mono">SOUND LAB LABORATORY</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight font-sans">
            Mesa de Mixagem Interativa
          </h3>
          <p className="text-zinc-400 text-sm mt-1 max-w-lg">
            Crie seu próprio legado musical. Regule os canais de áudio sintetizados em tempo real pelo estúdio Omni Sounds.
          </p>
        </div>

        {/* Master Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl border border-zinc-800/80 justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">BPM</span>
            <input
              type="range"
              min="80"
              max="160"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-24 accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-amber-500 min-w-[28px] text-right">{bpm}</span>
          </div>

          <div className="h-6 w-px bg-zinc-800 hidden md:block" />

          <button
            onClick={togglePlayback}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md ${
              isPlaying
                ? 'bg-amber-500 text-black hover:bg-amber-400 font-bold scale-[1.02]'
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Parar Loop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Loop</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visualizer bars placeholder that moves when playing */}
      <div className="mb-8 h-20 bg-black/60 rounded-xl border border-zinc-900/80 p-3 flex items-end justify-between overflow-hidden gap-1">
        {Array.from({ length: 48 }).map((_, idx) => {
          // Dynamic heights based on music step if playing
          const randomFactor = isPlaying ? Math.sin((idx + stepRef.current) * 0.5) * 0.5 + 0.5 : 0.05;
          const peakHeight = isPlaying ? Math.random() * 90 + 10 : 8;
          const finalHeight = isPlaying ? `${Math.floor(randomFactor * peakHeight)}%` : '8px';
          
          return (
            <motion.div
              key={idx}
              className={`w-full rounded-t transition-all duration-75 ${
                isPlaying 
                  ? idx % 6 === 0 
                    ? 'bg-amber-400' 
                    : 'bg-gradient-to-t from-amber-600 to-amber-500/80' 
                  : 'bg-zinc-800'
              }`}
              style={{ height: finalHeight }}
              animate={{ height: finalHeight }}
            />
          );
        })}
      </div>

      {/* Channels Mix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Track Drums */}
        <div className="bg-black/30 p-5 rounded-xl border border-zinc-800/40 relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-zinc-200">Bateria (Kick/HH)</span>
            </div>
            <button
              onClick={() => toggleMute('drums')}
              className={`p-1.5 rounded-md transition-colors ${mutes.drums ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {mutes.drums ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Fader</span>
              <span>{mutes.drums ? 'MUTE' : `${Math.round(volumes.drums * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.drums}
              onChange={(e) => handleVolumeChange('drums', Number(e.target.value))}
              disabled={mutes.drums}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>

        {/* Track Bass */}
        <div className="bg-black/30 p-5 rounded-xl border border-zinc-800/40 relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-zinc-200">Sub-Baixo (Saw)</span>
            </div>
            <button
              onClick={() => toggleMute('bass')}
              className={`p-1.5 rounded-md transition-colors ${mutes.bass ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {mutes.bass ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Fader</span>
              <span>{mutes.bass ? 'MUTE' : `${Math.round(volumes.bass * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.bass}
              onChange={(e) => handleVolumeChange('bass', Number(e.target.value))}
              disabled={mutes.bass}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>

        {/* Track Melody */}
        <div className="bg-black/30 p-5 rounded-xl border border-zinc-800/40 relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-zinc-200">Melodia Synth</span>
            </div>
            <button
              onClick={() => toggleMute('melody')}
              className={`p-1.5 rounded-md transition-colors ${mutes.melody ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {mutes.melody ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Fader</span>
              <span>{mutes.melody ? 'MUTE' : `${Math.round(volumes.melody * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.melody}
              onChange={(e) => handleVolumeChange('melody', Number(e.target.value))}
              disabled={mutes.melody}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>

        {/* Track FX */}
        <div className="bg-black/30 p-5 rounded-xl border border-zinc-800/40 relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-zinc-200">Eco / Delay</span>
            </div>
            <button
              onClick={() => toggleMute('fx')}
              className={`p-1.5 rounded-md transition-colors ${mutes.fx ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {mutes.fx ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Fader</span>
              <span>{mutes.fx ? 'MUTE' : `${Math.round(volumes.fx * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.fx}
              onChange={(e) => handleVolumeChange('fx', Number(e.target.value))}
              disabled={mutes.fx}
              className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-[11px] text-zinc-500 font-mono">
        💡 Use fones de ouvido para apreciar melhor as frequências baixas e os delays espaciais sintetizados.
      </div>
    </div>
  );
}
