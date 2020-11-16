//jshint esversion:6
const addon = require('./GwentAddon');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json()); // <--- Here
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  // res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  );

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type',
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

let game = null;
let gameId = null;
app.get('/startGame', function (req, res) {
  game = JSON.parse(addon.createGame());
  gameId = 1;
  res.send({ GameId: 1 });
});

app.get('/getGameState', function (req, res) {
  res.send(game);
});

app.post('/takeAction', function (req, res) {
  let action = JSON.stringify(req.body.Action);
  let gameStr = JSON.stringify(game);
  let newGameState = null;
  newGameState = addon.takeAction(gameStr, action);
  newGameStateObj = JSON.parse(newGameState);
  if ('Error' in newGameStateObj) {
    res.status(500, newGameStateObj.Error);
    res.send(newGameStateObj);
    return;
  }
  game = newGameStateObj;
  res.send(game);
});

app.listen(3001, '127.0.0.1', function () {
  console.log('Listening on port 3001');
});
