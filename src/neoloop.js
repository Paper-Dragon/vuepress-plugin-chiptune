let isPlaying = false;
let context, buffer, source;
let baseSeed = "", currentParams = {}, midiData = [];
let originalMotif = [], visualStep = 0;
let canvas, ctx2d;
let seedInput, scaleSelect, lengthSelect, chaos, chaosValue, bpmSlider, bpmOutput, togglePlay;
let useLead, useLead2, useBass, useDrums, useFx, useReverb, useDelay, useChorus;

function initDOMReferences() {
    canvas = document.getElementById("pianoRoll");
    if (!canvas) {
        console.error("Piano roll canvas not found!");
        return false;
    }
    ctx2d = canvas.getContext("2d");
    seedInput = document.getElementById("seedInput");
    scaleSelect = document.getElementById("scaleSelect");
    lengthSelect = document.getElementById("lengthSelect");
    chaos = document.getElementById("chaos");
    chaosValue = document.getElementById("chaosValue");
    bpmSlider = document.getElementById("bpmSlider");
    bpmOutput = document.getElementById("bpmOutput");
    togglePlay = document.getElementById("togglePlay");
    useLead = document.getElementById("useLead");
    useLead2 = document.getElementById("useLead2");
    useBass = document.getElementById("useBass");
    useDrums = document.getElementById("useDrums");
    useFx = document.getElementById("useFx");
    useReverb = document.getElementById("useReverb");
    useDelay = document.getElementById("useDelay");
    useChorus = document.getElementById("useChorus");
    return true;
}


function fullSeed() {
  return (
    (seedInput.value || "random") +
    "_" + scaleSelect.value +
    "_" + lengthSelect.value
  );
}

function clearRoll() {
  ctx2d.fillStyle = "#111";
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRoll(motif) {
  clearRoll();
  const steps = parseInt(lengthSelect.value);
  motif.forEach((step, i) => {
    if (step.note) {
      const x = (i / steps) * canvas.width;
      const y = canvas.height - (Math.log2(step.note) - 5) * 30;
      ctx2d.fillStyle = "#00ffcc";
      ctx2d.fillRect(x, y, step.dur * 20, 6);
    }
  });
}

function updateRollPlayback(stepIndex) {
  visualStep = stepIndex;
  drawRoll(originalMotif);
  const steps = parseInt(lengthSelect.value);
  const x = (stepIndex / steps) * canvas.width;
  ctx2d.fillStyle = "#ff3366";
  ctx2d.fillRect(x, 0, 2, canvas.height);
}

function hashSeed(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return hash >>> 0;
}

function pseudoRandom(seed) {
  let value = hashSeed(seed);
  return () => {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function generateMotif(scale, rand, complexity, steps = 32) {
  const motif = [];
  let note = scale[Math.floor(rand() * scale.length)];
  while (motif.length < steps) {
    const shift = Math.floor(rand() * 5) - 2;
    const newIndex = Math.max(0, Math.min(scale.length - 1, scale.indexOf(note) + shift));
    note = scale[newIndex];
    const dur = rand() < 0.3 ? 2 : 1;
    motif.push({ note, dur });
    if (rand() < 0.05 * complexity) motif.push({ note: null, dur: 1 }); // dropout
  }
  return motif;
}

export function triggerRandom() {
  const randomSeed = Math.floor(Math.random() * 1e9).toString(36);
  seedInput.value = randomSeed;
  const scaleOptions = scaleSelect.options;
  const styleOptions = document.getElementById("styleSelect").options;
  scaleOptions.selectedIndex = Math.floor(Math.random() * scaleOptions.length);
  styleOptions.selectedIndex = Math.floor(Math.random() * styleOptions.length);
  chaos.value = Math.floor(Math.random() * 101);
  chaosValue.textContent = chaos.value;
  bpmSlider.value = 80 + Math.floor(Math.random() * 100);
  bpmOutput.textContent = bpmSlider.value;
  generateLoop();
}

function getScale(root = 261.63, mode = "major") {
  const modes = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9]
  };
  return (modes[mode] || modes.major).map(i => root * Math.pow(2, i / 12));
}

function getStyleParams(style, rand, modulated = false) {
  const chaosVal = parseInt(chaos.value) / 100;

  function commonParams(base) {
    if (!modulated) {
      return {
        ...base,
        detune: 0,
        attack: 0.01,
        panOffset: 0
      };
    }
    return {
      ...base,
      detune: (rand() - 0.5) * 30,
      attack: 0.01 + rand() * 0.04,
      panOffset: (rand() - 0.5) * 0.6
    };
  }

  switch (style) {
    case "pulsewave":
      return {
        lead: commonParams({ type: "square", volume: 0.06, decay: 0.3 }),
        lead2: commonParams({ type: "square", volume: 0.04 }),
        bass: commonParams({ type: "square", volume: 0.05, decay: 0.4 }),
        filterHz: 2500
      };
    case "dreamchip":
      return {
        lead: commonParams({ type: "triangle", volume: 0.05, decay: 0.4 }),
        lead2: commonParams({ type: "sine", volume: 0.03 }),
        bass: commonParams({ type: "triangle", volume: 0.03, decay: 0.5 }),
        filterHz: 2000
      };
    case "darkgrid":
      return {
        lead: commonParams({ type: "sawtooth", volume: 0.07, decay: 0.25 }),
        lead2: commonParams({ type: "square", volume: 0.035 }),
        bass: commonParams({ type: "triangle", volume: 0.04, decay: 0.3 }),
        filterHz: 1500
      };
    case "arcadegen":
      return {
        lead: commonParams({ type: "square", volume: 0.065, decay: 0.25 }),
        lead2: commonParams({ type: "triangle", volume: 0.035 }),
        bass: commonParams({ type: "sawtooth", volume: 0.05, decay: 0.45 }),
        filterHz: 2800
      };
    case "crystal":
      return {
        lead: commonParams({ type: "sine", volume: 0.045, decay: 0.45 }),
        lead2: commonParams({ type: "sine", volume: 0.03 }),
        bass: commonParams({ type: "triangle", volume: 0.035, decay: 0.6 }),
        filterHz: 2200
      };
    default:
      return {
        lead: commonParams({ type: "square", volume: 0.06, decay: 0.3 }),
        lead2: commonParams({ type: "square", volume: 0.03 }),
        bass: commonParams({ type: "triangle", volume: 0.04, decay: 0.4 }),
        filterHz: 2400
      };
  }
}

function getChord(root, mode = "major") {
  const intervals = (mode === "minor") ? [0, 3, 7] : [0, 4, 7];
  return intervals.map(i => root * Math.pow(2, i / 12));
}

export async function generateLoop() {
  stopMusic();
  const full = fullSeed();
  baseSeed = full;
  const chaosVal = parseInt(chaos.value);
  const randParams = pseudoRandom(full + "_params_" + chaosVal);
  const randMelody = pseudoRandom(full + "_melody");
  const style = document.getElementById("styleSelect").value;
  const scale = scaleSelect.value;
  const steps = parseInt(lengthSelect.value);

  const scaleObj = getScale(261.63, scale);
  currentParams = getStyleParams(style, randParams, false);
  originalMotif = generateMotif(scaleObj, randMelody, 1.25, steps);

  drawRoll(originalMotif);
  buffer = await renderAudio(full, scale, style, currentParams, originalMotif, steps);
  playMusic();
}

export function modifySounds() {
  const style = document.getElementById("styleSelect").value;
  const scale = scaleSelect.value;
  const steps = parseInt(lengthSelect.value);
  const chaosVal = parseInt(chaos.value);
  const modSeed = baseSeed + "_mod_" + Date.now();
  const rand = pseudoRandom(modSeed + "_params_" + chaosVal);
  currentParams = getStyleParams(style, rand, true);
  renderAudio(modSeed, scale, style, currentParams, originalMotif, steps).then(b => {
    buffer = b;
    stopMusic();
    playMusic();
  });
}

export function remixLoop() {
  const base = fullSeed() + "_remix_" + Date.now();
  const randMelody = pseudoRandom(base + "_melody");
  const scale = scaleSelect.value;
  const style = document.getElementById("styleSelect").value;
  const steps = parseInt(lengthSelect.value);
  const scaleObj = getScale(261.63, scale);
  originalMotif = generateMotif(scaleObj, randMelody, 1.25, steps);
  drawRoll(originalMotif);
  const randParams = pseudoRandom(base + "_params");
  currentParams = getStyleParams(style, randParams);
  renderAudio(base, scale, style, currentParams, originalMotif, steps).then(b => {
    buffer = b;
    stopMusic();
    playMusic();
  });
}

function fxTypeForScale(scaleMode) {
  const mapping = {
    major:       [0, 1, 3, 5, 6],
    minor:       [2, 3, 4, 5, 6],
    dorian:      [0, 1, 3, 6],
    phrygian:    [2, 4, 5],
    mixolydian:  [0, 1, 3, 6],
    pentatonic:  [1, 3, 5, 6]
  };
  return mapping[scaleMode] || [0, 1, 2, 3, 4, 5, 6];
}

function injectFX(ctx, t, rand, scale, scaleMode, master) {
  const fxList = fxTypeForScale(scaleMode);
  const fxType = fxList[Math.floor(rand() * fxList.length)];

  switch (fxType) {
    case 0: // Laser ping
      for (let j = 0; j < 4; j++) {
        playOsc(ctx, t + j * 0.05, 1200 - j * 100 + rand() * 30, 0.08, "square", 0.04, 0.3 - j * 0.2, master, {
          attack: 0.01, detune: rand() * 20, panOffset: rand() - 0.5
        });
      }
      break;
    case 1: // Glissando Rise
      for (let j = 0; j < 5; j++) {
        playOsc(ctx, t + j * 0.06, 300 + j * 100, 0.1, "triangle", 0.03, -0.4 + j * 0.2, master, {
          attack: 0.01, detune: 0, panOffset: 0
        });
      }
      break;
    case 2: // Bass Drop chord
      const dropChord = getChord(scale[0], scaleMode);
      for (let j = 0; j < dropChord.length; j++) {
        playOsc(ctx, t + j * 0.1, dropChord[j] / 2, 0.5, "sawtooth", 0.05, -0.3 + j * 0.3, master, {
          attack: 0.02, detune: 0, panOffset: 0
        });
      }
      break;
    case 3: // Arpeggio
      for (let j = 0; j < 6; j++) {
        const n = scale[j % scale.length];
        playOsc(ctx, t + j * 0.06, n, 0.08, "triangle", 0.04, -0.2 + j * 0.1, master, {
          attack: 0.01, detune: 0, panOffset: 0
        });
      }
      break;
    case 4: // Distorted noise burst
      playNoise(ctx, t, 0.2, 0.1, master);
      break;
    case 5: // Echo bell
      for (let j = 0; j < 4; j++) {
        playOsc(ctx, t + j * 0.15, 800 + j * 60, 0.12, "sine", 0.03, j % 2 === 0 ? -0.5 : 0.5, master, {
          attack: 0.01, detune: 0, panOffset: 0
        });
      }
      break;
    case 6: // Chord pulse
      const chordPulse = getChord(scale[3 % scale.length], scaleMode);
      chordPulse.forEach((freq, idx) => {
        playOsc(ctx, t + idx * 0.04, freq, 0.1, "square", 0.04, -0.3 + idx * 0.3, master, {
          attack: 0.01, detune: 0, panOffset: 0
        });
      });
      break;
  }
}

async function renderAudio(seed, scaleMode, style, params, motif, steps) {
  const rand = pseudoRandom(seed);
  const bpm = parseInt(bpmSlider.value);
  const beat = 60 / bpm / 2;
  const ctx = new OfflineAudioContext(1, 44100 * steps * beat, 44100);

  const useLeadChecked = useLead.checked;
  const useLead2Checked = useLead2.checked;
  const useBassChecked = useBass.checked;
  const useDrumsChecked = useDrums.checked;
  const useFxChecked = useFx.checked;
  const useReverbChecked = useReverb.checked;
  const useDelayChecked = useDelay.checked;
  const useChorusChecked = useChorus.checked;

  let output = ctx.createGain();
  const master = ctx.createGain();

  if (useReverbChecked) {
    const convolver = ctx.createConvolver();
    const impulse = ctx.createBuffer(1, 1.0 * ctx.sampleRate, ctx.sampleRate);
    const data = impulse.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    convolver.buffer = impulse;
    master.connect(convolver).connect(output);
  }

  if (useDelayChecked) {
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.25 + (bpm - 60) * (0.25 / 60);
    const feedback = ctx.createGain();
    feedback.gain.value = 0.2;
    delay.connect(feedback).connect(delay);
    master.connect(delay).connect(output);
  }

  if (useChorusChecked) {
    const chorus = ctx.createDelay();
    chorus.delayTime.value = 0.025;
    master.connect(chorus).connect(output);
  }

  master.connect(output);
  output.connect(ctx.destination);

  const scale = getScale(261.63, scaleMode);
  const chords = [scale[0], scale[3], scale[4], scale[0]].map(root => getChord(root, scaleMode));
  midiData = [];

  let t = 0;
  let motifIndex = 0;

  for (let i = 0; i < steps;) {
    const chord = chords[Math.floor(i / 8) % chords.length];
    const step = motif[motifIndex % motif.length];
    updateRollPlayback(i);
    const dur = step.dur * beat;

    if (step.note) {
      if (useLeadChecked) {
        playOsc(ctx, t, step.note, dur, params.lead.type, params.lead.volume, -0.3, master, params.lead);
      }
      if (useLead2Checked) {
        playOsc(ctx, t + 0.04, step.note, dur * 0.9, params.lead2.type, params.lead2.volume, 0.3, master, params.lead2);
      }
      midiData.push({ t, note: step.note, dur: step.dur, type: "lead" });
    }

    if (i % 4 === 0 && useBassChecked) {
      const bass = chord[0] / 2;
      playOsc(ctx, t, bass, params.bass.decay, params.bass.type, params.bass.volume, 0, master, params.bass);
      midiData.push({ t, note: bass, dur: 1, type: "bass" });
    }

    if (useDrumsChecked) {
      const drumMultiplier = style === "crystal" || "dreamchip" ? 0.4 : 1.0;
      if (i % 8 === 0) playNoise(ctx, t, 0.05, 0.1 * drumMultiplier, master);
      if (i % 8 === 4) playNoise(ctx, t, 0.04, 0.08 * drumMultiplier, master);
      if (i % 2 === 0) playNoise(ctx, t, 0.03, 0.04 * drumMultiplier, master);
    }
    if (useFxChecked && i % 8 === 0 && rand() < 0.5) {
      injectFX(ctx, t, rand, scale, scaleMode, master);
    }

    t += step.dur * beat;
    i += step.dur;
    motifIndex++;
  }

  return ctx.startRendering();
}

function playOsc(ctx, time, freq, dur, type, gainVal, pan, dest, options = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  const attack = options.attack || 0.01;
  const decay = dur;
  const detune = options.detune || 0;
  const panOffset = options.panOffset || 0;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  osc.detune.setValueAtTime(detune, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(gainVal, time + attack);
  gain.gain.linearRampToValueAtTime(0.0001, time + decay);

  panner.pan.setValueAtTime(pan + panOffset, time);

  osc.connect(gain).connect(panner).connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

function playNoise(ctx, time, dur, gainVal, dest) {
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, time);

  src.connect(gain).connect(dest);
  src.start(time);
}

function playMusic() {
  context = new AudioContext();
  source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(context.destination);
  source.start();

  const bpm = parseInt(bpmSlider.value);
  const beat = 60 / bpm / 2;
  const steps = parseInt(lengthSelect.value);
  let index = 0;
  const interval = setInterval(() => {
    updateRollPlayback(index);
    index = (index + 1) % steps;
  }, beat * 1000);

  source.onended = () => clearInterval(interval);
  source._interval = interval;

  isPlaying = true;
  togglePlay.textContent = "Stop";
}

export function stopMusic() {
  if (source) {
    source.stop();
    if (source._interval) clearInterval(source._interval);
  }
  if (context) context.close();
  source = null;
  context = null;
  isPlaying = false;
  if (togglePlay) togglePlay.textContent = "Play";
}

export function togglePlayPause() {
  if (isPlaying) {
    stopMusic();
  } else if (buffer) {
    playMusic();
  }
}

export function downloadWav() {
  if (!buffer) return;

  const length = buffer.length * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  let offset = 0;
  writeStr(offset, 'RIFF'); offset += 4;
  view.setUint32(offset, length - 8, true); offset += 4;
  writeStr(offset, 'WAVE'); offset += 4;
  writeStr(offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint32(offset, 44100, true); offset += 4;
  view.setUint32(offset, 44100 * 2, true); offset += 4;
  view.setUint16(offset, 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeStr(offset, 'data'); offset += 4;
  view.setUint32(offset, buffer.length * 2, true); offset += 4;

  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s * 0x7FFF, true);
    offset += 2;
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'loop.wav';
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMIDI() {
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // header length
    0x00, 0x00,             // format type
    0x00, 0x01,             // one track
    0x01, 0xe0              // 480 ticks per quarter note
  ];

  const track = [0x4d, 0x54, 0x72, 0x6b]; // "MTrk"
  const events = [];

  midiData.forEach(({ t, note, dur }) => {
    const midiNote = Math.floor(69 + 12 * Math.log2(note / 440));
    const startTick = Math.floor(t * 480);
    const endTick = Math.floor((t + dur) * 480);

    events.push([startTick, 0x90, midiNote, 100]); // Note on
    events.push([endTick, 0x80, midiNote, 0]);     // Note off
  });

  events.sort((a, b) => a[0] - b[0]); // Sort by time

  let lastTick = 0;
  const trackData = [];

  for (const [tick, cmd, note, vel] of events) {
    const delta = tick - lastTick;
    lastTick = tick;

    let bytes = [];
    let value = delta;
    do {
      let byte = value & 0x7F;
      value >>= 7;
      if (value > 0) byte |= 0x80;
      bytes.unshift(byte);
    } while (value > 0);

    trackData.push(...bytes, cmd, note, vel);
  }

  trackData.push(0x00, 0xFF, 0x2F, 0x00);

  const trackLength = trackData.length;
  const lengthBytes = [
    (trackLength >> 24) & 0xFF,
    (trackLength >> 16) & 0xFF,
    (trackLength >> 8) & 0xFF,
    trackLength & 0xFF
  ];

  const midiBytes = new Uint8Array([
    ...header,
    ...track,
    ...lengthBytes,
    ...trackData
  ]);

  const blob = new Blob([midiBytes], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'loop.mid';
  a.click();
  URL.revokeObjectURL(url);
}

export function init() {
    if (initDOMReferences()) {
        // Add event listeners
        chaos.addEventListener('input', () => chaosValue.textContent = chaos.value);
        bpmSlider.addEventListener('input', () => bpmOutput.textContent = bpmSlider.value);
    }
}