const Chord = class {
    static root2midi = {
        "Eb":51,
        "F":53,
        "Ab":56,
        "Bb":58
    };

    static chordQuality2delta = {
        "min7":[0,3,7,10],
        "7":[0,4,7,10],
        "maj7":[0,4,7,11]
    };

    constructor(root, quality, numMeasures) {
        this.root = root;
        this.quality = quality;
        this.numMeasures = numMeasures;
        this.notes = [];
        this.midi = [];
        var deltas = Chord.chordQuality2delta[this.quality];
        for (let index in deltas) {
            var noteMidi = deltas[index]+Chord.root2midi[this.root]
            this.midi.push(noteMidi);
            this.notes.push(Tone.Frequency(noteMidi,"midi").toNote());
        }
    }
};




function improvise(userInput) {
    /*
    if (chordIndex >= 0)
    {
        polySynth.triggerAttackRelease(chords[chordIndex][0],'16n');
        polySynth.triggerAttackRelease(chords[chordIndex][1],'16n','+8n');
        polySynth.triggerAttackRelease(chords[chordIndex][2],'16n','+4n');
    }
    */
    // idea: make comping part have inversions
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
function go() {
    //polySynth.triggerAttackRelease('C4','16n')
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
    Tone.Transport.bpm.value = 120;
    seq = new Tone.Sequence(function(time, idx)
    {
        for (let i=0; i < chordInput.length; i++) {
            if (hits[i] === idx) {
                for (let n = 0; n < chordInput[i].numMeasures; n++) {
                    console.log(hits[i]);
                    console.log(chordInput[i].notes);
                    console.log(chordInput[i].midi);
                    const chordNotes = chordInput[i].notes
                    const now = Tone.now();
                    for (let j = 0; j < chordNotes.length; j++) {
                        polySynth.triggerAttackRelease(chordNotes[j],'1n');
                    }
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
