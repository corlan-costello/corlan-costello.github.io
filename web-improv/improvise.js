function root2midi(note) {
    if ("EbE#FbF#GbG#AbA#BbB#".indexOf(note) >= 0) {
        return Tone.Frequency(note+"3").toMidi();
    }
    else {
        return Tone.Frequency(note+"4").toMidi();
    }
}

const Chord = class {
    /*
    static root2midi = {
        "Eb":51,
        "F":53,
        "Ab":56,
        "Bb":58
    };
    */

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
        var deltas = Chord.chordQuality2delta[this.quality];
        const midiRoot = root2midi(this.root);
        for (const d of deltas) {
            var noteMidi = d+midiRoot;
            this.notes.push(Tone.Frequency(noteMidi,"midi").toNote());
        }
        console.log(this.midi);
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

var vol = new Tone.Volume(-12).toMaster();
var polySynth = new Tone.PolySynth(8, Tone.FMSynth);
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

polySynth.connect(vol);
p1.connect(vol);

var seq;
var tempo = 300;
function go() {
    eval(editor.getValue());
    console.log(chordInput);
    var numEighths = 0;
    var hits = [];
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
    seq = new Tone.Sequence(function(time, idx)
    {
        for (let i=0; i < chordInput.length; i++) {
            if (hits[i] === idx) {
                console.log(hits[i]);
                console.log(`${root2midi(chordInput[i].root)} still don't see it?!`);
                console.log(chordInput[i].notes);
                console.log(chordInput[i].midi);
                const chordNotes = chordInput[i].notes
                const now = Tone.now();
                for (let j = 0; j < chordNotes.length; j++) {
                    polySynth.triggerAttackRelease(chordNotes[j],'2n');
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
