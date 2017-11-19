const app = require('express')();
const http = require('http').Server(app);
const fs = require('fs');
const exec = require('child_process').exec;

app.get('/nepovednik', function(req, res) {
    res.sendFile(__dirname + '/izberi.html');
});

app.get('/nepovednik/nepovid/:id', function (req, res) {
    let st = parseInt(req.params.id);
    if (st < 1 || st > 1000) {
        res.status(404);
    }

    let nejm = 'nepovedi/' + st + '.webm';
    if (fs.existsSync(nejm)) {
        res.sendFile(__dirname + '/' + nejm);
    }
});

app.get('/nepovednik/nepoved/:ime', function (req, res) {
    let st = parseInt(req.params.ime);
    if (st < 1 || st > 1000) {
        res.status(404);
    }

    let nejm = 'nepovedi/' + st + '.webm';
    if (fs.existsSync(nejm)) {
        res.send('/nepovid/' + st);
    } else if (fs.existsSync('nepovedi/najava' + st)) {
        res.send("cakaj");
    } else {
        exec('node nepovednik.js ' + st);
        res.send("zacetek");
    }
});

http.listen(5000, function() {
    console.log('listening on *:5000');
});
