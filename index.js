//jshint esversion:6
require('dotenv').config();
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
const fs = require('fs');
const _ = require('lodash');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const secret = process.env.SECRET;
const withAuth = require('./middleware');

const app = express();

mongoose.connect('mongodb://localhost:27017/gwentDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const deckSchema = new mongoose.Schema({
  name: String,
  faction: String,
  leader: String,
  cards: [String],
});

const userSchema = new mongoose.Schema({
  name: String,
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  decks: [deckSchema],
});

userSchema.pre('save', function(next){
  // Check if document is new or a new password has been set
  if (this.isNew || this.isModified('password')) {
    // Saving reference to this because of changing scopes
    const document = this;
    bcrypt.hash(document.password, saltRounds, function (err, hashedPassword) {
      if (err) {
        next({status: 500, error: err});
      } else {
        document.password = hashedPassword;
        next();
      }
    });
  } else {
    next();
  }
})

userSchema.methods.isCorrectPassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(err, same) {
    if (err) {
      callback(err);
    } else {
      callback(err, same);
    }
  });
}

const Deck = mongoose.model('Deck', deckSchema);
const User = mongoose.model('User', userSchema);

var user = null;
var userId = null;
User.findOne({ email: 'Tester@test.com' }, (err, u) => {
  if (err || !u) {
    console.log('Creating tester user');
    user = new User({
      name: 'Tester',
      email: 'Tester@test.com',
      password: 'test',
    });
    user.save();
  } else {
    user = u;
  }
  userId = user._id;
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

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

app.get('/api/home', function(req, res) {
  res.send('Welcome!');
});

app.get('/api/secret', withAuth, function(req, res) {
  console.log('secret');
  res.send('The password is potato');
});

app.get('/api/checkToken', withAuth, function(req, res) {
  res.sendStatus(200);
})

app.post('/api/authenticate', function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }, function(err, user) {
    if (err) {
      console.error(err);
      next({status: 500, error: 'Internal error'});
    } else if (!user) {
      next({status: 401, error: 'Incorrect email or password'})
    } else {
      user.isCorrectPassword(password, function(err, same) {
        if (err) {
            next({status: 500, error: 'Internal error please try again'})
        } else if (!same) {
          next({status: 401, error: 'Incorrect email or password'})
        } else {
          // Issue token
          const payload = { email };
          const token = jwt.sign(payload, secret, {
            expiresIn: '1d'
          });
          console.log('Logged in ', email);
          res.cookie('token', token, { httpOnly: true }).send({email: email, name: user.name});
        }
      });
    }
  });
});

app.post('/api/register', function(req, res, next){
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  console.log("Registering ", email);
  const newUser = new User({
    name: name,
    email: email,
    password: password,
  });
  newUser.save(function (err) {
    if (err) {
      if (err.code === 11000){
        next({status: 500, error: 'A user with that email already exists.'});
      } else {
        next({status: 500, error: err.message});
      }
    } else {
      res.send(JSON.stringify({message: "Successfully created user."}));
    }
  });
});

app.post('/api/startGame', function (req, res) {
  try {
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
  } catch(err) {
    next({status: 500, error: err});
  }
});

app.get('/api/getGameState', function (req, res) {
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

app.post('/api/takeAction', function (req, res) {
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

app.get('/api/getFactionCards', function (req, res) {
  let request = JSON.parse(req.query.req);
  let faction = parseInt(request.Faction);
  console.log(faction);
  let cards = getFactionCards(faction);
  res.send({ Cards: cards });
});

app.get('/api/getUserDecks', function (req, res) {
  let request = JSON.parse(req.query.req);
  console.log(request);
  // todo: get id from request and find decks from DB. Plus validation.
  User.findById(userId, (err, p) => {
    if (err) {
      console.log(err);
      res.send({ error: 'Failed to get decks from DB.' });
    } else {
      if (p) {
        let decks = p.decks.map((d) => {
          return { id: d._id, name: d.name };
        });
        res.send({ Decks: decks });
      } else {
        console.log('Error');
        res.send({ error: `No user with ID ${userId} found` });
      }
    }
  });
});

app.get('/api/getUserDeck', function (req, res) {
  let request = JSON.parse(req.query.req);
  console.log(request);
  // todo: get id from request and find deck from DB. Plus validation.
  User.findById(userId, (err, p) => {
    if (err) {
      console.log(err);
      res.send({ error: 'Failed to get deck from DB.' });
    } else {
      if (p) {
        let deck = p.decks.find((d) => {
          console.log('User deck ID: ', d._id);
          return d._id == request.deckId;
        });
        console.log('Deck: ', deck);
        let convertedDeck = convertDeckFromDbFormat(deck);
        res.send({ Deck: convertedDeck });
      } else {
        console.log('Error');
        res.send({ error: `No user with ID ${userId} found` });
      }
    }
  });
});

app.post('/api/saveDeck', function (req, res) {
  console.log(
    'Name: ' + req.body.Name + ' Deck: ' + JSON.stringify(req.body.Deck),
  );
  let deck = JSON.stringify(req.body.Deck);
  let valid = addon.isDeckValid(deck);
  console.log('Deck: ' + valid);
  let convertedDeck = convertDeckToDbFormat(req.body.Name, req.body.Deck);
  let convertedDeckObject = new Deck(convertedDeck);

  User.findByIdAndUpdate(
    userId,
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

app.get('/api/test', function (req, res) {
  res.send({ Test: 'Test' });
});

app.use(function(err, req, res, next) {
  res.status(err.status).send({error: err.error});
});

app.listen(8080, function () {
  console.log('Listening on port 8080');
});
