//jshint esversion:6
import { SSL_OP_EPHEMERAL_RSA } from 'constants';
import {
  removeOtherPlayer,
  getDeckName,
  getFactionCards,
  isDeckValid,
  convertDeckToDbFormat,
  convertDeckFromDbFormat,
} from './Game/Utils';
const addon = require('./GwentAddon');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const _ = require('lodash');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.connect('mongodb://localhost:27017/gwentDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const deckSchema = new mongoose.Schema({
  name: String,
  faction: String,
  leader: String,
  cards: [String],
});

const playerSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  decks: [deckSchema],
});

const secret = 'Thisisourlittlesecret.';

playerSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

const Deck = mongoose.model('Deck', deckSchema);
const Player = mongoose.model('Player', playerSchema);

var player = null;
var playerId = null;
Player.findOne({ name: 'Tester' }, (err, p) => {
  if (err || !p) {
    console.log('Creating tester user');
    player = new Player({
      name: 'Tester',
      email: 'test@test.com',
      password: 'test',
    });
    player.save();
  } else {
    console.log('p: ', p);
    player = p;
  }
  console.log('player: ', player);
  playerId = player._id;
  console.log('ID: ', playerId);
});

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

app.post('/register', function(req, res, next){
  const name = req.body.Name;
  const email = req.body.Email;
  const password = req.body.Password;
  Player.findOne({ email: email }, (err, p) => {
    if (err) {
      console.log(err);
      next(err);
    } else if (p) {
      console.log('p: ', p);
      next({message: 'User with that email already exists.'});
    } else {
      const newPlayer = new Player({
        name: name,
        email: email,
        password: password,
      });
      newPlayer.save(function (err) {
        if (err) {
          next(err);
        } else {
          res.send('OK');
        }
      });
    }
  });
});

app.post('/login', function(req, res, next){
  const email = req.body.Email;
  const password = req.body.Password;

  Player.findOne({ email: email }, (err, p) => {
    if (err || !p) {
      if (err) {
        console.log(err);
        next(err);
      } else {
        next({message: 'No user with that email registered'})
      }
    } else {
      if (p.password === password) {
        res.send('OK');
      } else {
        next({message: 'Wrong email or password.'});
      }
    }
  })
});

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
  res.send({ Cards: cards });
});

app.get('/getUserDecks', function (req, res) {
  let request = JSON.parse(req.query.req);
  console.log(request);
  // todo: get id from request and find decks from DB. Plus validation.
  Player.findById(playerId, (err, p) => {
    if (err) {
      console.log(err);
      res.send({ error: { message: 'Failed to get decks from DB.' } });
    } else {
      if (p) {
        let decks = p.decks.map((d) => {
          return { id: d._id, name: d.name };
        });
        res.send({ Decks: decks });
      } else {
        console.log('Error');
        res.send({ error: { message: 'No user with ID ${playerId} found' } });
      }
    }
  });
});

app.get('/getUserDeck', function (req, res) {
  let request = JSON.parse(req.query.req);
  console.log(request);
  // todo: get id from request and find deck from DB. Plus validation.
  Player.findById(playerId, (err, p) => {
    if (err) {
      console.log(err);
      res.send({ error: { message: 'Failed to get deck from DB.' } });
    } else {
      if (p) {
        let deck = p.decks.find((d) => {
          console.log('Player deck ID: ', d._id);
          return d._id == request.deckId;
        });
        console.log('Deck: ', deck);
        let convertedDeck = convertDeckFromDbFormat(deck);
        res.send({ Deck: convertedDeck });
      } else {
        console.log('Error');
        res.send({ error: { message: 'No user with ID ${playerId} found' } });
      }
    }
  });
});

app.post('/saveDeck', function (req, res) {
  console.log(
    'Name: ' + req.body.Name + ' Deck: ' + JSON.stringify(req.body.Deck),
  );
  let deck = JSON.stringify(req.body.Deck);
  let valid = addon.isDeckValid(deck);
  console.log('Deck: ' + valid);
  let convertedDeck = convertDeckToDbFormat(req.body.Name, req.body.Deck);
  let convertedDeckObject = new Deck(convertedDeck);

  Player.findByIdAndUpdate(
    playerId,
    {
      $push: { decks: convertedDeckObject },
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Updated');
      }
    },
  );
  res.send({ Updated: 'True' });
});

app.get('/test', function (req, res) {
  res.send({ Test: 'Test' });
});

app.use(function(err, req, res, next) {
  console.log("Here");
  console.error(err);
  res.status(500).send(err);
});

app.listen(3001, '0.0.0.0', function () {
  console.log('Listening on port 3001');
});
