#!/usr/bin/node

const videiDir = 'vide-i/';
const fs = require('fs');
const ffmpeg = require("fluent-ffmpeg");
const MersenneTwister = require("mersenne-twister");
const exec = require('child_process').exec;

if (process.argv.length != 3) {
    console.log("Podaj mi stevilo trejlerja kot argument (samo eno.)");
    process.exit(1);
}

/****
     Parametri za generiranje!
     */
const dolzinaT = 30; // Dolzina celega trejlerja v sekundah
const kaderMin = 2; // Dolzina kadra (min)
const kaderMax = 7; // Dolzina kadra (max)
/*************************************************************************/

const stTrejlerja = parseInt(process.argv[2]);

function toHHMMSS(cas) {
    var dec = parseFloat((cas % 1).toFixed(2));
    var sec_num = parseInt(cas - dec, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+(seconds+dec);}

    return hours+':'+minutes+':'+seconds;
}

console.log("generiram!...");
console.log(stTrejlerja);

let najava = './nepovedi/najava' + stTrejlerja;
fs.closeSync(fs.openSync(najava, 'w'));

const generator = new MersenneTwister(stTrejlerja);
let videi = [];
let stevec = 0;

fs.readdirSync(videiDir).map(file => {
    ffmpeg.ffprobe(videiDir + file, (err, metadata) => {
        videi.push({
            name: file.substr(0, file.length - 3),
            path: videiDir + file,
            length: metadata.streams[0].duration
        });

        if (videi.length === stevec) {
            razsekaj(videi);
        }
    });

    stevec += 1;
});

function imeKosa(st) {
    return stTrejlerja + '_' + st + '.webm';
}


let dolzina = 0;
let stKosov = 1;
function razsekaj(videi) {
    // Najprej posortiram, da so predvidljivi trejlerji
    videi.sort((a, b) => a.name.localeCompare(b.name));

    let stKoncanih = 0;
    while(dolzina < dolzinaT) {
        let trenutniV = videi[generator.random_int() % videi.length];
        let zacetek = parseFloat((generator.random() * trenutniV.length).toFixed(2));
        let trajanje = parseFloat((kaderMin + (generator.random() * (kaderMax - kaderMin))).toFixed(2));
        let konec = zacetek + trajanje;

        if (konec > trenutniV.length) {
            trajanje = parseFloat((trenutniV.length - zacetek).toFixed(2));
        }

        let cmd = "ffmpeg -y -ss " + toHHMMSS(zacetek) + " -i " + trenutniV.path.replace(/([\s()&])/g, "\\$1") + " -t " + toHHMMSS(trajanje) + " -vcodec libvpx -cpu-used -5 -deadline realtime -acodec libvorbis  -max_muxing_queue_size 400 ./kosi/" + imeKosa(stKosov);
        exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                console.log("Napaka!", error);
                console.log(stderr);
                process.exit(1);
            }

            stKoncanih += 1;

            if ((dolzina > dolzinaT) && (stKoncanih === (stKosov - 1))) {
                console.log("konvertirani vsi.");
                console.log("polna dolzina: " + dolzina);
                console.log("dajmo jih zlepit. (" + (stKosov - 1) + ")");
                zlepi();
            }
        });

        dolzina += trajanje;
        stKosov += 1;
    }
}

function zlepi() {
    let cmd = 'mkvmerge -o ./nepovedi/' + stTrejlerja + '.webm ./kosi/' + imeKosa(1);
    for (let i = 2; i < stKosov; i++) {
        cmd += ' + ./kosi/' + imeKosa(i);
    }

    exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            console.log("problem pri lepljenju.");
            console.log(error);
            console.log(stdout);
            console.log(stderr);
            process.exit(1);
        }

        console.log("Koncano!");

        for(let j = 1; j < stKosov; j++) {
            //fs.unlinkSync('./kosi/' + imeKosa(j));
        }
        fs.unlinkSync(najava);

        process.exit(0);
    });
}
