#!/usr/bin/env node

/**
 * Generates chiptune music tracks as WAV files for Moonlight: Pixel Run.
 * Run: node scripts/generate_music.js
 * Output: public/assets/audio/music_menu.mp3, music_las_americas.mp3, etc.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'audio');

// Note frequencies
const NOTE = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, Bb5: 932.33,
};

function square(phase) {
  return phase % (2 * Math.PI) < Math.PI ? 0.3 : -0.3;
}

function triangle(phase) {
  const p = (phase % (2 * Math.PI)) / (2 * Math.PI);
  return (p < 0.5 ? 4 * p - 1 : 3 - 4 * p) * 0.4;
}

function saw(phase) {
  const p = (phase % (2 * Math.PI)) / (2 * Math.PI);
  return (2 * p - 1) * 0.3;
}

function makeTrack(bpm, bars, renderSample) {
  const beatDuration = 60 / bpm;
  const totalBeats = bars * 4;
  const duration = totalBeats * beatDuration;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatDuration;
    const bar = Math.floor(beat / 4) % bars;
    const beatInBar = Math.floor(beat % 4);
    const eighthInBar = Math.floor((beat % 4) * 2);
    const beatFrac = beat % 1;

    let s = renderSample(t, beat, bar, beatInBar, eighthInBar, beatFrac);
    samples[i] = Math.max(-1, Math.min(1, s)) * 0.35;
  }

  return samples;
}

function samplesToWav(samples) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20);  // PCM
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(val * 32767), 44 + i * 2);
  }

  return buffer;
}

// ── Menu: Chill, mysterious (140 BPM, C minor) ──
function createMenuMusic() {
  const bpm = 140;
  const beatDur = 60 / bpm;

  const bass = [
    ['C3', '', 'C3', ''],
    ['Ab3', '', 'G3', ''],
    ['F3', '', 'F3', ''],
    ['G3', '', 'G3', ''],
    ['C3', '', 'Eb3', ''],
    ['Ab3', '', 'G3', ''],
    ['F3', '', 'Eb3', ''],
    ['G3', '', '', ''],
  ];

  const melody = [
    ['C5', '', 'Eb5', '', 'G5', '', '', ''],
    ['Ab4', '', 'G4', '', 'Eb4', '', 'G4', ''],
    ['F4', '', 'Ab4', '', 'C5', '', 'Ab4', ''],
    ['G4', '', 'Bb4', '', 'G4', '', '', ''],
    ['Eb5', '', 'C5', '', 'G4', '', 'Eb4', ''],
    ['Ab4', '', 'Bb4', '', 'C5', '', '', ''],
    ['F4', '', 'Eb4', '', 'C4', '', 'Eb4', ''],
    ['G4', '', '', '', '', '', '', ''],
  ];

  return makeTrack(bpm, 8, (t, beat, bar, beatInBar, eighthInBar, beatFrac) => {
    let s = 0;
    const bn = bass[bar][beatInBar];
    if (bn && NOTE[bn]) {
      const env = Math.max(0, 1 - (beat % 1) / 0.8);
      s += triangle(2 * Math.PI * NOTE[bn] * t) * env * 0.6;
    }
    const mn = melody[bar][eighthInBar];
    if (mn && NOTE[mn]) {
      const eighthStart = Math.floor(beat * 2) * (beatDur / 2);
      const noteT = t - eighthStart;
      const env = Math.max(0, 1 - noteT / (beatDur * 0.5));
      s += square(2 * Math.PI * NOTE[mn] * t) * env * 0.35;
    }
    if (beatFrac < 0.04) {
      s += (Math.random() * 2 - 1) * (1 - beatFrac / 0.04) * 0.1;
    }
    return s;
  });
}

// ── Las Américas: Night run, energetic (180 BPM, C minor penta) ──
function createLasAmericasMusic() {
  const bpm = 180;
  const beatDur = 60 / bpm;

  const bass = [
    ['C3', 'C3', 'Eb3', 'G3'],
    ['F3', 'F3', 'Eb3', 'F3'],
    ['G3', 'G3', 'F3', 'Eb3'],
    ['Eb3', 'G3', 'Bb3', 'G3'],
    ['C3', 'C3', 'Eb3', 'G3'],
    ['F3', 'F3', 'G3', 'F3'],
    ['Eb3', 'Eb3', 'F3', 'G3'],
    ['G3', 'Bb3', 'G3', 'C3'],
  ];

  const melody = [
    ['C5', '', 'Eb5', '', 'G5', '', 'Eb5', ''],
    ['F4', '', 'G4', '', 'Bb4', '', 'G4', ''],
    ['G4', '', 'Bb4', '', 'C5', '', 'Bb4', ''],
    ['Eb5', '', 'C5', '', 'G4', '', 'Eb4', ''],
    ['C5', '', 'G4', '', 'Eb5', '', 'C5', ''],
    ['F4', '', 'Bb4', '', 'G4', '', 'F4', ''],
    ['Eb4', '', 'G4', '', 'Bb4', '', 'C5', ''],
    ['G4', '', 'C5', '', 'G5', '', '', ''],
  ];

  return makeTrack(bpm, 8, (t, beat, bar, beatInBar, eighthInBar, beatFrac) => {
    let s = 0;
    const bn = bass[bar][beatInBar];
    if (bn && NOTE[bn]) {
      const env = Math.max(0, 1 - (beat % 1) / 0.9);
      s += triangle(2 * Math.PI * NOTE[bn] * t) * env;
    }
    const mn = melody[bar][eighthInBar];
    if (mn && NOTE[mn]) {
      const eighthStart = Math.floor(beat * 2) * (beatDur / 2);
      const noteT = t - eighthStart;
      const env = Math.max(0, 1 - noteT / (beatDur * 0.4));
      s += square(2 * Math.PI * NOTE[mn] * t) * env * 0.5;
    }
    if (beatInBar % 2 === 0 && beatFrac < 0.15) {
      const kT = beatFrac / 0.15;
      s += Math.sin(2 * Math.PI * 150 * (1 - kT * 0.7) * beatFrac) * (1 - kT) * 0.5;
    }
    if (beatInBar % 2 === 1 && beatFrac < 0.1) {
      s += (Math.random() * 2 - 1) * (1 - beatFrac / 0.1) * 0.3;
    }
    const ef = (beat * 2) % 1;
    if (ef < 0.05) {
      s += (Math.random() * 2 - 1) * 0.08 * (1 - ef / 0.05) * 2;
    }
    return s;
  });
}

// ── Hill Reps: Dark, heavy grind (160 BPM, E minor) ──
function createHillRepsMusic() {
  const bpm = 160;
  const beatDur = 60 / bpm;

  const bass = [
    ['E2', 'E2', 'G2', 'B2'],
    ['C3', 'C3', 'B2', 'A2'],
    ['D3', 'D3', 'E3', 'D3'],
    ['B2', 'A2', 'G2', 'E2'],
    ['E2', 'G2', 'B2', 'E3'],
    ['C3', 'D3', 'C3', 'B2'],
    ['A2', 'A2', 'B2', 'C3'],
    ['B2', 'G2', 'E2', 'E2'],
  ];

  const melody = [
    ['E4', '', 'G4', '', 'B4', '', 'E5', ''],
    ['C5', '', 'B4', '', 'A4', '', 'G4', ''],
    ['D5', '', 'E5', '', 'D5', '', 'B4', ''],
    ['A4', '', 'G4', '', 'E4', '', '', ''],
    ['B4', '', 'E5', '', 'G5', '', 'E5', ''],
    ['C5', '', 'D5', '', 'C5', '', 'B4', ''],
    ['A4', '', 'B4', '', 'C5', '', 'D5', ''],
    ['B4', '', 'G4', '', 'E4', '', '', ''],
  ];

  return makeTrack(bpm, 8, (t, beat, bar, beatInBar, eighthInBar, beatFrac) => {
    let s = 0;
    const bn = bass[bar][beatInBar];
    if (bn && NOTE[bn]) {
      const env = Math.max(0, 1 - (beat % 1) / 0.85);
      s += saw(2 * Math.PI * NOTE[bn] * t) * env * 0.8;
    }
    const mn = melody[bar][eighthInBar];
    if (mn && NOTE[mn]) {
      const eighthStart = Math.floor(beat * 2) * (beatDur / 2);
      const noteT = t - eighthStart;
      const env = Math.max(0, 1 - noteT / (beatDur * 0.35));
      s += square(2 * Math.PI * NOTE[mn] * t) * env * 0.45;
    }
    if (beatFrac < 0.12) {
      const kT = beatFrac / 0.12;
      s += Math.sin(2 * Math.PI * 80 * (1 - kT * 0.6) * beatFrac) * (1 - kT) * 0.6;
    }
    if (beatInBar % 2 === 1 && beatFrac < 0.08) {
      s += (Math.random() * 2 - 1) * (1 - beatFrac / 0.08) * 0.35;
    }
    const sf = (beat * 4) % 1;
    if (sf < 0.03) {
      s += (Math.random() * 2 - 1) * 0.06 * (1 - sf / 0.03) * 2;
    }
    return s;
  });
}

// ── Fondo VH: Bright, triumphant (180 BPM, C major) ──
function createFondoVHMusic() {
  const bpm = 180;
  const beatDur = 60 / bpm;

  const bass = [
    ['C3', 'E3', 'G3', 'C3'],
    ['F3', 'A3', 'F3', 'E3'],
    ['G3', 'B3', 'G3', 'F3'],
    ['C3', 'G3', 'E3', 'C3'],
    ['A2', 'C3', 'E3', 'A2'],
    ['F3', 'G3', 'A3', 'G3'],
    ['D3', 'F3', 'A3', 'D3'],
    ['G3', 'F3', 'E3', 'D3'],
  ];

  const melody = [
    ['E5', '', 'G5', '', 'C5', '', 'E5', ''],
    ['F5', '', 'A5', '', 'F5', '', 'E5', ''],
    ['G5', '', 'E5', '', 'D5', '', 'C5', ''],
    ['E5', '', 'C5', '', 'G4', '', '', ''],
    ['A4', '', 'C5', '', 'E5', '', 'A5', ''],
    ['F5', '', 'G5', '', 'A5', '', 'G5', ''],
    ['D5', '', 'F5', '', 'A5', '', 'D5', ''],
    ['G5', '', 'E5', '', 'C5', '', '', ''],
  ];

  const arpNotes = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4',
                    'F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4', 'A4'];

  return makeTrack(bpm, 8, (t, beat, bar, beatInBar, eighthInBar, beatFrac) => {
    let s = 0;
    const bn = bass[bar][beatInBar];
    if (bn && NOTE[bn]) {
      const env = Math.max(0, 1 - (beat % 1) / 0.9);
      s += triangle(2 * Math.PI * NOTE[bn] * t) * env * 0.9;
    }
    const mn = melody[bar][eighthInBar];
    if (mn && NOTE[mn]) {
      const eighthStart = Math.floor(beat * 2) * (beatDur / 2);
      const noteT = t - eighthStart;
      const env = Math.max(0, 1 - noteT / (beatDur * 0.45));
      s += square(2 * Math.PI * NOTE[mn] * t) * env * 0.5;
    }
    const sixteenthInBar = Math.floor((beat % 4) * 4);
    const arpNote = arpNotes[sixteenthInBar % arpNotes.length];
    if (arpNote && NOTE[arpNote]) {
      const sf = (beat * 4) % 1;
      const env = Math.max(0, 1 - sf / 0.5);
      s += square(2 * Math.PI * NOTE[arpNote] * t) * env * 0.15;
    }
    if (beatInBar % 2 === 0 && beatFrac < 0.12) {
      const kT = beatFrac / 0.12;
      s += Math.sin(2 * Math.PI * 150 * (1 - kT * 0.7) * beatFrac) * (1 - kT) * 0.45;
    }
    if (beatInBar % 2 === 1 && beatFrac < 0.08) {
      s += (Math.random() * 2 - 1) * (1 - beatFrac / 0.08) * 0.25;
    }
    const ef = (beat * 2) % 1;
    if (ef < 0.04) {
      s += (Math.random() * 2 - 1) * 0.07 * (1 - ef / 0.04) * 2;
    }
    return s;
  });
}

// ── Main ──
function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tracks = [
    { name: 'music_menu', fn: createMenuMusic },
    { name: 'music_las_americas', fn: createLasAmericasMusic },
    { name: 'music_hill_reps', fn: createHillRepsMusic },
    { name: 'music_fondo_vh', fn: createFondoVHMusic },
  ];

  // Check if ffmpeg is available for mp3 conversion
  let hasFFmpeg = false;
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    hasFFmpeg = true;
  } catch {
    console.log('ffmpeg not found, will output WAV files (Phaser supports WAV)');
  }

  for (const track of tracks) {
    console.log(`Generating ${track.name}...`);
    const samples = track.fn();
    const wavBuffer = samplesToWav(samples);

    const wavPath = path.join(OUTPUT_DIR, `${track.name}.wav`);
    fs.writeFileSync(wavPath, wavBuffer);

    if (hasFFmpeg) {
      const mp3Path = path.join(OUTPUT_DIR, `${track.name}.mp3`);
      try {
        execSync(`ffmpeg -y -i "${wavPath}" -b:a 128k "${mp3Path}" 2>/dev/null`);
        fs.unlinkSync(wavPath); // Remove WAV, keep MP3
        console.log(`  ✓ ${track.name}.mp3`);
      } catch {
        console.log(`  ✓ ${track.name}.wav (mp3 conversion failed)`);
      }
    } else {
      console.log(`  ✓ ${track.name}.wav`);
    }
  }

  console.log('\nDone! Audio files saved to public/assets/audio/');
}

main();
