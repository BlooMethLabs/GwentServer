//jshint esversion:6
// const addon = require('./NodeAddon/build/Debug/GwentAddon');
const addon = require('./GwentAddon');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');

app.use(bodyParser.json()); // <--- Here
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  let blueDeck = JSON.parse(fs.readFileSync('Decks/Scoiatael.json'));
  let redDeck = JSON.parse(fs.readFileSync('Decks/NorRealms.json'));
  let redDeckStr = JSON.stringify(redDeck);
  let blueDeckStr = JSON.stringify(blueDeck);

  let newGameState = null;
  newGameState = addon.createGameWithDecks(blueDeckStr, redDeckStr);
  // newGameState = addon.createGame();
  newGameStateObj = JSON.parse(newGameState);
  game = newGameStateObj;
  gameId = 1;
  res.send({ GameId: 1 });
});

app.get('/getGameState', function (req, res) {
  res.send(game);
});

app.post('/takeAction', function (req, res) {
  console.log('Action req: ', req.body.Action);
  let action = JSON.stringify(req.body.Action);
  let gameStr = JSON.stringify(game);

  let newGameState = null;
  newGameState = addon.takeAction(gameStr, action);
  newGameStateObj = JSON.parse(newGameState);
  if ('Error' in newGameStateObj) {
    console.log('New game: ', newGameStateObj);
    res.status(500, newGameStateObj.Error);
    res.send(newGameStateObj);
    return;
  }
  game = newGameStateObj;
  res.send(game);
});

app.listen(3001, '0.0.0.0', function () {
  console.log('Listening on port 3001');
});
