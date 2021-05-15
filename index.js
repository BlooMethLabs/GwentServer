//jshint esversion:6
import { removeOtherPlayer, getDeckName, getFactionCards } from './Game/Utils';
const addon = require('./GwentAddon');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const _ = require('lodash');

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

app.post('/startGame', function (req, res) {
  console.log('Deck IDs: ', req.body.RedDeckId, req.body.BlueDeckId);
  let redDeckName = getDeckName(req.body.RedDeckId);
  let blueDeckName = getDeckName(req.body.BlueDeckId);
  let redDeck = JSON.parse(fs.readFileSync(redDeckName));
  let blueDeck = JSON.parse(fs.readFileSync(blueDeckName));
  let redDeckStr = JSON.stringify(redDeck);
  let blueDeckStr = JSON.stringify(blueDeck);

  let newGameState = null;
  newGameState = addon.createGameWithDecks(blueDeckStr, redDeckStr);
  // newGameState = addon.createGame();
  let newGameStateObj = JSON.parse(newGameState);
  game = newGameStateObj;
  gameId = 1;
  res.send({ GameId: 1 });
});

app.get('/getGameState', function (req, res) {
  let request = JSON.parse(req.query.req);
  let side = request.Side;
  console.log(req.query);
  console.log(side);
  let g = _.cloneDeep(game);
  if (side) {
    g = removeOtherPlayer(g, side);
  }
  res.send(g);
});

app.post('/takeAction', function (req, res) {
  console.log('Action req: ', req.body.Action);
  let action = JSON.stringify(req.body.Action);
  let gameStr = JSON.stringify(game);

  let newGameState = null;
  newGameState = addon.takeAction(gameStr, action);
  let newGameStateObj = JSON.parse(newGameState);
  let g = _.cloneDeep(newGameStateObj);
  g = removeOtherPlayer(g, req.body.Action.Side);
  if ('Error' in newGameStateObj) {
    console.log('New game: ', newGameStateObj);
    res.status(500, newGameStateObj.Error);
    res.send(newGameStateObj);
    return;
  }
  game = newGameStateObj;
  res.send(g);
});

app.get('/getFactionCards', function (req, res) {
  let request = JSON.parse(req.query.req);
  let faction = parseInt(request.Faction);
  console.log(faction);
  let cards = getFactionCards(faction);
  res.send({Cards: cards});
});

app.listen(3001, '0.0.0.0', function () {
  console.log('Listening on port 3001');
});
