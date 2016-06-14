var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var irc = require("tmi.js");
var http = require('http');
var toHex = require('colornames');
var request = require('request');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 3000;

var effects = process.env.effects.split(",");


console.log(port, effects);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    
});

var statsHP = 0;
var statsAMMO = 0;
app.post('/csgo', function (req, res) {
    if(req.body.hasOwnProperty("player") && req.body.player.hasOwnProperty("state")){
        if(statsHP <> req.body.player.state.health){
            statsHP = req.body.player.state.health;
            console.log("health", req.body.player.state.health);

        }
    }

    res.render('index', { title: 'Express' });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(port);

var options = {
     options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: process.env.username,
        password: process.env.password
    },
    channels: ["#" + process.env.channels]
};

var client = new irc.client(options);
// Connect the client to the server..
client.connect();

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

client.on('chat', function (channel, user, message, self) {
    var msg = message.toLowerCase();
    var args = msg.split(" ");
    
    if(msg.indexOf("!led") === 0){
        if(effects.indexOf(args[1]) >= 0){
            request.post({url:'https://api.particle.io/v1/devices/' + process.env.devices + '/color', form: {access_token: process.env.access_token, arg: args[1].toLowerCase()}}, function(err,httpResponse,body){
                if(err){
                    console.log(err);
                }
            });
        }else{
            if(args[1] != null && args[1].trim() !== ''){
                var hex = toHex(args[1].trim());
                if(hex != null){
                    request.post({url:'https://api.particle.io/v1/devices/' + process.env.devices + '/setColor', form: {access_token: process.env.access_token, arg: hex}}, function(err,httpResponse,body){
                        if(err){
                            console.log(err);
                        }
                    });
                }else{
                    client.say(process.env.channels, "Sorry i don´t have the color " + args[1].trim());
                }
            }
        }
    }
});

client.on("subscription", function (channel, username) {
    //console.log(username);
});

io.on('connection', function (socket) {
    client.on('chat', function (channel, user, message, self) {
        var msg = message.toLowerCase();

        if(msg.indexOf("!led") !== 0 && msg.indexOf("sorry i don´t have the color") == -1){
            socket.emit('chat', { user: user, message: message });
        }
    });
});

    /*
    if(req.body.player.hasOwnProperty("weapons")){
        //console.log(req.body.player.weapons);
        var weapons = _.where(req.body.player.weapons, {state: "active"});

        var p = 0;

        if(weapons[0].hasOwnProperty("ammo_clip")){
            var p = (weapons[0].ammo_clip / weapons[0].ammo_clip_max ) * 100;
            if(statsAMMO <> p){
                statsAMMO = p;
                request.post({url:'https://api.particle.io/v1/devices/' + process.env.devices + '/setAMMO', form: {access_token: process.env.access_token, arg: p.toFixed(0)}}, function(err,httpResponse,body){
                    if(err){
                        console.log(err);
                    }
                    console.log("HP", p.toFixed(0));
                });
            }
        }
    }
    */