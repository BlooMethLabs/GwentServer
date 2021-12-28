//jshint esversion:6
require('dotenv').config();
const SSL_OP_EPHEMERAL_RSA = require('constants');
const {
  removeOtherPlayer,
  getDeckName,
  getFactionCards,
  isDeckValid,
  convertDeckToDbFormat,
  convertDeckFromDbFormat,
} = require('./Game/Utils');
// const removeOtherPlayer = require("./Game/Utils");

const addon = require('./GwentAddon');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const _ = require('lodash');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const secret = process.env.SECRET;
const withAuth = require('./middleware');
const {authJwt} = require('./App/Middleware');

const app = express();

var corsOptions = {
  origin: 'https://localhost:8081'
};

// const deckSchema = new mongoose.Schema({
//   name: String,
//   faction: String,
//   leader: String,
//   cards: [String],
// });

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   decks: [deckSchema],
// });

// userSchema.pre('save', function (next) {
//   // Check if document is new or a new password has been set
//   if (this.isNew || this.isModified('password')) {
//     // Saving reference to this because of changing scopes
//     const document = this;
//     bcrypt.hash(document.password, saltRounds, function (err, hashedPassword) {
//       if (err) {
//         return next({ status: 500, error: err });
//       } else {
//         document.password = hashedPassword;
//         return next();
//       }
//     });
//   } else {
//     return next();
//   }
// });

// userSchema.methods.isCorrectPassword = function (password, callback) {
//   bcrypt.compare(password, this.password, function (err, same) {
//     if (err) {
//       callback(err);
//     } else {
//       callback(err, same);
//     }
//   });
// };

// const gameSchema = new mongoose.Schema({
//   gameState: { type: String },
//   redPlayer: {type: userSchema, required: true},
//   bluePlayer: userSchema,
//   redDeck: {type: deckSchema, required:true},
//   blueDeck: deckSchema,
//   actions: [{ type: String }],
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const db = require('./App/Models');
db.sequelize.sync();
// db.sequelize.sync({force: true}).then(() => {
// const Role = db.role;
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and resync DB');
//   initial();
// })

// function initial() {
// // TODO: Add commands to run when initialising DB in testing mode
// }

// app.use(cookieParser());

// app.use(function (req, res, next) {
//   // Website you wish to allow to connect
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   // res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');

//   // Request methods you wish to allow
//   res.setHeader(
//     'Access-Control-Allow-Methods',
//     'GET, POST, OPTIONS, PUT, PATCH, DELETE',
//   );

//   // Request headers you wish to allow
//   res.setHeader(
//     'Access-Control-Allow-Headers',
//     'X-Requested-With,content-type',
//   );

//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader('Access-Control-Allow-Credentials', true);

//   // Pass to next layer of middleware
//   next();
// });

let game = null;
let gameId = null;

// routes
require('./App/Routes/Api/auth.routes')(app);
// require('./app/routes/user.routes')(app);

app.get('/api/home', function (req, res) {
  res.send('Welcome!');
});

app.get('/api/secret', authJwt.verifyToken, function (req, res) {
  console.log('secret');
  res.send('The password is potato');
});

app.get('/api/checkToken', withAuth, function (req, res) {
  res.sendStatus(200);
});

app.post('/api/authenticate', async function (req, res, next) {
  console.log("Authenticate");
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ username }, function (err, user) {
    if (err) {
      console.error(err);
      next({ status: 500, error: 'Internal error' });
    } else if (!user) {
      next({ status: 401, error: 'Incorrect username or password' });
    } else {
      user.isCorrectPassword(password, function (err, same) {
        if (err) {
          console.log(err);
          next({ status: 500, error: 'Internal error please try again' });
        } else if (!same) {
          next({ status: 401, error: 'Incorrect username or password' });
        } else {
          // Issue token
          const payload = { username };
          const token = jwt.sign(payload, secret, {
            expiresIn: '1d',
          });
          console.log('Logged in ', username);
          res
            .cookie('token', token, { httpOnly: true })
            .send({ username: username, name: user.name });
        }
      });
    }
  });
});

app.post('/api/register', async function (req, res, next) {
  try {
    const username = req.body.username;
    const password = req.body.password;
    console.log('Registering ', username);
    const newUser = new User({
      username: username,
      password: password,
    });
    const ret = await newUser.save();
    console.log(ret);
    res.send(JSON.stringify({ message: 'Successfully created user.' }));
  } catch (err) {
    if (err.code === 11000) {
      return next({
        status: 500,
        error: 'A user with that username already exists.',
      });
    } else {
      return next({ status: 500, error: err.message });
    }
  }
});

function getDeckFromUser(deckId, user) {
  let deck = user.decks.find((d) => {
    console.log(d._id);
    return d._id == deckId;
  });
  return JSON.stringify(convertDeckFromDbFormat(deck));
}

async function createNewGame(redDeck, blueDeck) {
  // TODO: Handle errors
  let newGameState = addon.createGameWithDecks(blueDeck, redDeck);
  let newGameStateObj = JSON.parse(newGameState);
  let newGame = new Game({
    gameState: JSON.stringify(newGameStateObj)
  });
  await newGame.save().catch(err => {
    console.log(err);
    return Promise.reject(`Error saving new game ${err}`);
  });
  console.log(newGameStateObj);
  game = newGameStateObj;
  gameId = 1;
  return 1;
}

app.post('/api/startGame', withAuth, async function (req, res, next) {
  try {
    let redDeck = null;
    let blueDeck = null;
    let redDeckId = req.body.RedDeckId;
    let blueDeckId = req.body.BlueDeckId;
    let redDeckName = getDeckName(redDeckId);
    let blueDeckName = getDeckName(blueDeckId);

    if (redDeckName) {
      redDeck = JSON.stringify(JSON.parse(fs.readFileSync(redDeckName)));
    }
    if (blueDeckName) {
      blueDeck = JSON.stringify(JSON.parse(fs.readFileSync(blueDeckName)));
    }

    if (redDeck && blueDeck) {
      let newGameId = await createNewGame(redDeck, blueDeck).catch((err) => {
        console.log(err);
        return next({ status: 500, error: `Error while creating new game: ${err}` });
      });
      res.send({ GameId: newGameId });
      return;
    }

    let user = await User.findOne({ username: req.username });
    if (!user) {
      return next({
        status: 500,
        error: `No user found with username ${username}`,
      });
    }
    if (!redDeck) {
      redDeck = getDeckFromUser(redDeckId, user);
    }
    if (!blueDeck) {
      blueDeck = getDeckFromUser(blueDeckId, user);
    }
    let newGameId = await createNewGame(redDeck, blueDeck).catch(err => {
      console.log(err);
      return next({ status: 500, error: `Error while creating new game: ${err}` });
    });
    res.send({ GameId: newGameId });
  } catch(err) {
    console.log(err);
    return next({ status: 500, error: err });
  }
});

app.post('/api/createNewGame', withAuth, async function (req, res, next) {
  try {
    let username = req.username;
    let user = await User.findOne({ username: req.username });
    if (!user) {
      return next({
        status: 500,
        error: `No user found with username ${username}`,
      });
    }

    let redDeck;
    let redDeckId = req.body.RedDeckId;

    // Try to get deck from the pre-made decks
    let redDeckName = getDeckName(redDeckId);
    if (redDeckName) {
      let d = JSON.parse(fs.readFileSync(redDeckName));
      redDeck = new Deck({
        faction: d.Faction,
        leader: d.Leader,
        cards: d.Cards,
        name: redDeckName
      });
      await redDeck.save();
    } else {
      redDeck = user.decks.find((d) => {
        console.log(d._id);
        return d._id == redDeckId;
      });
    }

    let newGame = new Game({
      redPlayer: user,
      redDeck: redDeck
    });
    await newGame.save();
    res.send({ GameId: newGame._id });
  } catch(err) {
    console.log(err);
    return next({ status: 500, error: err });
  }
});

app.get('/api/getGameState', withAuth, async function (req, res, next) {
  try {
    console.log(req.query);
    console.log(req.username);
    let gameId = req.query.gameId;
    let side = req.query.side;

    let game = await Game.findById(gameId);
    console.log(game);

    let isRedPlayer = false;
    if (side === 'Red' && req.username === game.redPlayer.username) {
      isRedPlayer = true;
    }

    if (!game.bluePlayer && isRedPlayer) {
      res.send(JSON.stringify({ Status: 'Awaiting Blue Deck' }));
      return;
    }
    if (!game.bluePlayer && !isRedPlayer) {
      res.send(JSON.stringify({ Status: 'Game Joinable' }));
      return;
    }
    if (
      (side === 'Red' && req.username !== game.redPlayer.username) ||
      (side === 'Blue' && game.bluePlayer && req.username !== game.bluePlayer.username)
    ) {
      console.log("Unauthed");
      next({ status: 401, error: 'Unauthorised' });
    }
    // if (side) {
    //   g = removeOtherPlayer(g, side);
    // }
    // res.send(g);
  } catch (err) {
    console.log(err);
    next({ status: 500, error: `Error getting game state: ${err}` });
  }
});

app.post('/api/joinGame', withAuth, async function (req, res, next) {
  console.log(`Body: ${JSON.stringify(req.body)}`);
  try {
    if (!req.username || !req.body.gameId || !req.body.deckId) {
      return next({
        status: 400,
        error: 'Incomplete request, requires username, game ID and deck ID',
      });
    }
    let username = req.username;
    let gameId = req.body.gameId;
    let deckId = req.body.deckId;
    console.log(`Username: ${username} game ID: ${gameId} deck ID: ${deckId}`);
    // Get user from username
    let user = await User.findOne({ username: req.username });
    if (!user) {
      return next({status: 400, error: `Couldn't find user with username ${username}.`});
    }
    console.log(user);
    // Get deck from user
    let deck = user.decks.find((d) => {
      return d._id == deckId;
    });
    console.log(deck);
    if (!deck) {
      return next({status: 400, error: `Couldn't find deck with ID ${deckId}.`});
    }
    // Get game from game ID
    let game = await Game.findById(gameId);
    if (!game) {
      return next({status: 400, error: `Couldn't find game with ID ${gameId}.`});
    }
    if (game.bluePlayer) {
      return next({status: 400, error: `Blue player already exists`});
    }
    console.log(game);
    // Add user and deck to game
    await Game.findByIdAndUpdate(gameId, { blueDeck: deck, bluePlayer: user  });
    // Return success
    res.sendStatus(200);
  } catch(err) {
    next({ status: 500, error: `Error joining game: ${err}` });
  }
})

app.post('/api/takeAction', async function (req, res, next) {
  try {
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
      return next({ status: 500, error: newGameStateObj.Error });
    }
    game = newGameStateObj;
    res.send(g);
  } catch (err) {
    return next({ status: 500, error: err });
  }
});

app.get('/api/getFactionCards', function (req, res) {
  let request = JSON.parse(req.query.req);
  let faction = parseInt(request.Faction);
  console.log(faction);
  let cards = getFactionCards(faction);
  res.send({ Cards: cards });
});

app.get('/api/getUserDecks', withAuth, async function (req, res, next) {
  // let request = JSON.parse(req.query.req);
  // console.log(request);
  // todo: get id from request and find decks from DB. Plus validation.
  try {
    let p = await User.findOne({ username: req.username });
    if (p) {
      console.log(p);
      if (p.decks !== null) {
        let decks = p.decks.map((d) => {
          console.log(d);
          return { id: d._id, name: d.name };
        });
        console.log(decks);
        res.send({ Decks: decks });
      } else {
        console.log('sending empty');
        res.send({ Decks: [] });
      }
    } else {
      console.log('Error');
      return next({status: 400,  error: `No user with ID ${userId} found` });
    }
  } catch (err) {
    console.log(err);
    return next({ status: 500, error: 'Failed to get decks from DB.' });
  }
});

app.get('/api/getUserDeck', withAuth, async function (req, res, next) {
  try {
    let deckId = req.query.deckId;
    if (!deckId) {
      return next({ status: 400, error: 'No deck ID in query.' });
    }
    let u = await User.findOne({ username: req.username });
    if (u) {
      let deck = u.decks.find((d) => {
        return d._id == deckId;
      });
      if (!deck) {
        return next({status: 400, error: `Couldn't find deck with ID ${deckId}.`});
      }
      let convertedDeck = convertDeckFromDbFormat(deck);
      res.send({ Deck: convertedDeck });
    } else {
      return next({ status: 500, error: `No user found with username ${username}` });
    }
  } catch(err) {
    console.log(err);
    return next({ status: 500, error: 'Failed to get decks from DB.' });
  }
});

app.post('/api/saveDeck', withAuth, async function (req, res) {
  try {
    if (!req.username || !req.body.name || !req.body.deck) {
      return next({
        status: 400,
        error: 'Incomplete request, requires username, deck name and deck',
      });
    }
    console.log(
      `Username: ${req.username} Name: ${req.body.name} Deck: ${JSON.stringify(
        req.body.deck,
      )}`,
    );
    let username = req.username;
    let deckId = req.body.deckId;
    let deck = JSON.stringify(req.body.deck);
    let valid = addon.isDeckValid(deck);
    console.log('Deck: ' + valid);
    if (!valid) {
      return next({ status: 400, error: 'Deck not valid' });
    }
    let convertedDeck = convertDeckToDbFormat(req.body.name, req.body.deck);
    let convertedDeckObject = new Deck(convertedDeck);
    console.log('Converted deck: ' + convertedDeckObject);

    await User.findOneAndUpdate(
      { username: username },
      {
        $push: { decks: convertedDeckObject },
      },
    );
    console.log('Updated');
    if (deckId) {
      await User.findOneAndUpdate(
        { username: username },
        {
          $pull: { decks: { _id: deckId } },
        },
      );
      console.log('Removed old');
    }
    res.send({ deckId: convertedDeckObject.id });
  } catch (err) {
    return next({ status: 500, error: 'Failed to update decks' });
  }
});

app.get('/api/test', function (req, res) {
  res.send({ Test: 'Test' });
});

app.use(function (err, req, res, next) {
  res.status(err.status).send({ error: err.error });
});

app.listen(8080, function () {
  console.log('Listening on port 8080');
});
