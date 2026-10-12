/* Original procedural score for this portfolio. No samples or third-party music.
 * Run: node articles/morisot/assets/audio/render-gallery-music.cjs
 * 64 BPM, 16 bars, 60-second stereo loop, PCM16 / 24 kHz.
 */
const fs = require('fs');
const path = require('path');
const rate = 24000, seconds = 60, count = rate * seconds;
const left = new Float64Array(count), right = new Float64Array(count);
const tau = Math.PI * 2, beat = 60 / 64, bar = beat * 4;
const hz = note => 440 * 2 ** ((note - 69) / 12);
const add = (i, value, pan) => {
  const p = ((i % count) + count) % count;
  left[p] += value * Math.cos((pan + 1) * Math.PI / 4);
  right[p] += value * Math.sin((pan + 1) * Math.PI / 4);
};
function piano(start, note, strength, pan) {
  const f = hz(note), length = 5.2;
  for (let i = 0; i < rate * length; i++) {
    const t = i / rate;
    const attack = 1 - Math.exp(-t * 150);
    const fundamental = Math.sin(tau * f * t) * Math.exp(-t / 1.7);
    const body = .28 * Math.sin(tau * f * 2.001 * t) * Math.exp(-t / .85)
      + .09 * Math.sin(tau * f * 3.004 * t) * Math.exp(-t / .48)
      + .035 * Math.sin(tau * f * 4.009 * t) * Math.exp(-t / .25);
    const v = (fundamental + body) * attack * strength;
    add(Math.floor(start * rate) + i, v, pan);
  }
}
function pad(start, notes) {
  const length = bar * 2 + 2;
  notes.forEach((note, voice) => {
    const f = hz(note), pan = (voice - 1.5) * .36;
    for (let i = 0; i < rate * length; i++) {
      const t = i / rate;
      const envelope = Math.sin(Math.PI * t / length) ** 2;
      const wave = Math.sin(tau * f * t + .11 * Math.sin(tau * .18 * t))
        + .3 * Math.sin(tau * f * 1.0017 * t);
      add(Math.floor(start * rate) + i, wave * envelope * .016, pan);
    }
  });
}
// Dm9 — Bbmaj9 — Fmaj9 — Cadd9. Sparse upper motifs leave room for reading.
const chords = [
  {bass:38, notes:[50,57,60,64], melody:[69,72,76,72]},
  {bass:34, notes:[53,57,60,62], melody:[69,65,72,69]},
  {bass:41, notes:[53,57,60,67], melody:[67,69,72,76]},
  {bass:36, notes:[52,55,60,62], melody:[74,72,67,64]}
];
for (let b = 0; b < 16; b++) {
  const chord = chords[Math.floor(b / 2) % 4], time = b * bar;
  if (b % 2 === 0) {
    piano(time, chord.bass, .105, -.15);
    pad(time, chord.notes);
  }
  const pattern = b % 2 ? [2,1,3,1] : [0,2,1,3];
  pattern.forEach((index, step) => piano(time + beat * step + .06,
    chord.notes[index] + 12, .083 + (step === 0 ? .012 : 0), step % 2 ? .3 : -.3));
  if (b % 2) {
    piano(time + beat * .5, chord.melody[(b >> 1) % 4] + 12, .068, .12);
    piano(time + beat * 2.5, chord.melody[((b >> 1) + 1) % 4] + 12, .055, -.12);
  }
}
// Wrapped stereo reflections: the tail at the end continues at the start.
const dryL = left.slice(), dryR = right.slice();
[[.073,.17],[.131,.14],[.211,.12],[.347,.10],[.557,.08],[.863,.06],[1.307,.04]]
  .forEach(([delay, gain], tap) => {
    const offset = Math.floor(delay * rate);
    for (let i = 0; i < count; i++) {
      const p = (i + offset) % count;
      left[p] += (tap % 2 ? dryR[i] : dryL[i]) * gain;
      right[p] += (tap % 2 ? dryL[i] : dryR[i]) * gain;
    }
  });
let peak = 0, energy = 0;
for (let i = 0; i < count; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const scale = .78 / peak;
const out = Buffer.alloc(44 + count * 4);
out.write('RIFF'); out.writeUInt32LE(out.length - 8,4); out.write('WAVEfmt ',8);
out.writeUInt32LE(16,16); out.writeUInt16LE(1,20); out.writeUInt16LE(2,22);
out.writeUInt32LE(rate,24); out.writeUInt32LE(rate * 4,28);
out.writeUInt16LE(4,32); out.writeUInt16LE(16,34);
out.write('data',36); out.writeUInt32LE(count * 4,40);
for (let i = 0; i < count; i++) {
  const l = left[i] * scale, r = right[i] * scale;
  out.writeInt16LE(Math.round(l * 32767),44 + i * 4);
  out.writeInt16LE(Math.round(r * 32767),46 + i * 4);
  energy += (l * l + r * r) / 2;
}
fs.writeFileSync(path.join(__dirname,'gallery-reverie.wav'),out);
console.log(JSON.stringify({file:'gallery-reverie.wav',seconds,rate,channels:2,
  bytes:out.length,peak:.78,rms:Math.sqrt(energy / count)},null,2));
