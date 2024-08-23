function root2midi(note) {
    if ("EbE#FbF#GbG#AbA#BbB#".indexOf(note) >= 0) {
        return Tone.Frequency(note+"3").toMidi();
    }
    else {
        return Tone.Frequency(note+"4").toMidi();
    }
}

const Melody = class {
    constructor(chords) {
        this.chords = chords;
    }
    
    static smooth_melody(midi) {
        for (let i = 0; i < midi.length-1; i++) {
            if (midi[i+1] - midi[i] > 12) {
                midi[i+1] -= 12;
            }
            else if (midi[i+1] - midi[i] < -12) {
                midi[i+1] += 12;
            }
            console.log(`delta: ${midi[i+1]-midi[i]}`);
        }
    }

    static midi2note(midi) {
        var notes = [];
        for (let m of midi) {
            notes.push(Tone.Frequency(m,"midi").toNote());
        }
        return notes;
    }

    create_melody() {
        var melodyMidi = [];
        for (let chord of this.chords) {
            var chordMidiMelody = chord.create_midi_melody();
            melodyMidi = melodyMidi.concat(chordMidiMelody);
        }
        Melody.smooth_melody(melodyMidi);
        return Melody.midi2note(melodyMidi);
    }
};

function random_choice(arr) {
    const rand = Math.floor(Math.random()*arr.length);
    return arr[rand];
}

const Chord = class {
    static chordQuality2delta = {
        "maj":[0,4,7],
        "min":[0,3,7],
        "dim":[0,3,6],
        "aug":[0,4,8],

        "min7":[0,3,7,10],
        "7":[0,4,7,10],
        "maj7":[0,4,7,11],
        "halfdim7":[0,3,6,10],
        "dim7":[0,3,6,9],
    };

    constructor(root, quality, numMeasures) {
        this.root = root;
        this.quality = quality;
        this.numMeasures = numMeasures;
        this.notes = [];
        this.midi = [];
        this.deltas = Chord.chordQuality2delta[this.quality];
        this.midiRoot = root2midi(this.root);
        for (const d of this.deltas) {
            var noteMidi = d+this.midiRoot;
            this.midi.push(noteMidi);
            this.notes.push(Tone.Frequency(noteMidi,"midi").toNote());
        }
    }

    jazzify() {
        let ninth;
        let thirteenth;
        var jazzyMidi = [...this.midi];
        if (this.quality == '7') {
            ninth = random_choice([this.midiRoot+1,this.midiRoot+2]);
            thirteenth = this.midiRoot+9;
            if (ninth == this.midiRoot+1) {
                thirteenth = random_choice([this.midiRoot+8,this.midiRoot+9]);
            }
            jazzyMidi.push(ninth);
            jazzyMidi.push(thirteenth);
        }
        else if (['maj7','min7'].includes(this.quality)) {
            jazzyMidi.push(this.midiRoot+2);
            //jazzyMidi.push(this.midiRoot+9);
        }
        jazzyMidi.sort();
        return jazzyMidi;
    }
    create_midi_melody() {
        var midiOctaves = [...this.jazzify()];
        for (let n of this.midi) {
            midiOctaves.push(n-12)
            midiOctaves.push(n+12);
            midiOctaves.push(n+24);
        }
        midiOctaves.sort();
        var melodyMidi = [];
        for (let i = 0; i < this.numMeasures*8; i++) {
            var midiNote = random_choice(midiOctaves);
            melodyMidi.push(midiNote);
        }
        return melodyMidi;
    }
};

function improvise(userInput) {
    /* 
    ideas: 
    - make comping part have inversions
    - complete root2midi and chordQuality2delta
    - try different instruments (other than synths) such as piano
    - port the python ideas into here
    - toggle button instead of one play button AND one stop button
    */
}
var editor = ace.edit('editor');
editor.setTheme('ace/theme/monokai');
editor.getSession().setMode('ace/mode/javascript');
editor.setOptions({fontSize: '20pt'});

var chordVol = new Tone.Volume(-15).toMaster();
var chordPlayer = new Tone.PolySynth(8, Tone.FMSynth);
var melodyVol = new Tone.Volume(-8).toMaster();
var melodyPlayer = new Tone.PolySynth(1, Tone.FMSynth);
/*
var reverb = new tone.Freeverb(0.4).connect(vol);
var vibrato = new Tone.Vibrato(3,0.3).connect(reverb);
*/
var p1 = new Tone.Players({
    'kick': 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/505/kick.mp3',
    'snare': 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/505/snare.mp3',
    'hihat': 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/505/hh.mp3'
}, function()
{
    // console.log('loaded');
});

chordPlayer.connect(chordVol);
melodyPlayer.connect(melodyVol);
// p1.connect(vol); note: vol is no longe defined

var seq;
var tempo = 300;
function go() {
    eval(editor.getValue());
    console.log(chordInput);
    var melody = new Melody(chordInput);
    var numEighths = 0;
    var hits = []; // on which 8th notes each chord should play
    for (let c of chordInput) {
        hits.push(numEighths);
        numEighths += c.numMeasures*8;
    }
    var eighths = [];
    for (let i = 0; i < numEighths; i++) {
        eighths.push(i);
    }

    Tone.context.latencyHint = 'fastest';
    Tone.Transport.bpm.value = tempo;
    var aTune;
    seq = new Tone.Sequence(function(time, idx)
    {
        if (idx == 0) {
            aTune = melody.create_melody();
            console.log(aTune);
        }
        melodyPlayer.triggerAttackRelease(aTune[idx],'8n');
        for (let i=0; i < chordInput.length; i++) {
            if (hits[i] === idx) {
                console.log(hits[i]);
                console.log(chordInput[i].notes);
                console.log(chordInput[i].midi);
                const chordNotes = chordInput[i].notes
                const now = Tone.now();
                for (let j = 0; j < chordNotes.length; j++) {
                    chordPlayer.triggerAttackRelease(chordNotes[j],'2n');
                }
            }
        }
    }, eighths, '8n');


    Tone.Transport.start('+0.2');
    seq.start();
}
function stop() {
    seq.stop();
}

/*
Giant Steps
    new Chord("B","maj7",0.5),
    new Chord("D","7",0.5),
    new Chord("G","maj7",0.5),
    new Chord("Bb","7",0.5),
    new Chord("Eb","maj7",1),
    new Chord("A","min7",0.5),
    new Chord("D","7",0.5),
    
    new Chord("G","maj7",0.5),
    new Chord("Bb","7",0.5),
    new Chord("Eb","maj7",0.5),
    new Chord("F#","7",0.5),
    new Chord("B","maj7",1),
    new Chord("F","min7",0.5),
    new Chord("Bb","7",0.5),
    
    new Chord("Eb","maj7",1),
    new Chord("A","min7",0.5),
    new Chord("D","7",0.5),
    new Chord("G","maj7",1),
    new Chord("C#","min7",0.5),
    new Chord("F#","7",0.5),
    new Chord("B","maj7",1),
    new Chord("F","min7",0.5),
    new Chord("Bb","7",0.5),
    new Chord("Eb","maj7",1),
    new Chord("C#","min7",0.5),
    new Chord("F#","7",0.5),

Autumn Leaves
    new Chord("C","min7",1),
    new Chord("F","7",1),
    new Chord("Bb","maj7",1),
    new Chord("Eb","maj7",1),
    new Chord("A","halfdim7",1),
    new Chord("D","7",1),
    new Chord("G","min7",2),

    new Chord("C","min7",1),
    new Chord("F","7",1),
    new Chord("Bb","maj7",1),
    new Chord("Eb","maj7",1),
    new Chord("A","halfdim7",1),
    new Chord("D","7",1),
    new Chord("G","min7",2),

    new Chord("A","halfdim7",1),
    new Chord("D","7",1),
    new Chord("G","min7",2),
    new Chord("C","min7",1),
    new Chord("F","7",1),
    new Chord("Bb","maj7",1),
    new Chord("Eb","maj7",1),
    new Chord("A","halfdim7",1),
    new Chord("D","7",1),
    new Chord("G","min7",2),
    new Chord("Eb","7",1),
    new Chord("D","7",1),
    new Chord("G","min7",2),
*/
