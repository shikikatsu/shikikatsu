const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function createOrganNode(freq) {
    const now = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();

    // Rosicrucian Complex Harmonics: [1, 2, 3, 4, 1.5 (Perfect 5th)]
    const harmonics = [1, 2, 3, 4, 1.5];
    const gains = [0.4, 0.2, 0.1, 0.05, 0.08];

    harmonics.forEach((h, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * h, now);

        g.gain.setValueAtTime(gains[i], now);
        // Long graceful decay of 2.5s
        g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(now + 2.5);
    });

    return masterGain;
}

function play(freq) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const instrument = createOrganNode(freq);
    instrument.connect(audioCtx.destination);
}

// Attach listeners to all pads
document.querySelectorAll('.pad').forEach(pad => {
    const freq = parseFloat(pad.dataset.freq);

    const startSound = (e) => {
        if (e.type === 'touchstart') {
            e.preventDefault(); // Prevent ghost clicks
        }
        play(freq);
    };

    pad.addEventListener('mousedown', startSound);
    pad.addEventListener('touchstart', startSound, { passive: false });
});
