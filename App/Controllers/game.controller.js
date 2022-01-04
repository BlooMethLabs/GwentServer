const addon = require('../../GwentAddon');
const fs = require('fs');
const db = require('../Models');
const Deck = db.deck;
const User = db.user;
const Game = db.game;
const userController = require('./user.controller');
const deckController = require('./deck.controller');
const { user } = require('../Models');

exports.checkCreateNewGameParams = (req, res, next) => {
  if (!req || !req.body || !req.body.deckId) {
    return next({
      status: 401,
      error: 'Incorrect params for create new game.',
    });
  }
  return next();
};

exports.createNewGame = async (req, res, next) => {
  try {
    let newGame = await Game.create({
      redPlayer: req.userId,
      redDeck: req.deck,
    });
    req.newGame = newGame;
    return next();
  } catch (err) {
    console.log(`Caught exception trying to create new game: ${err}`);
    return next({ status: 500, error: 'Failed to create new game.' });
  }
};

exports.sendNewGameId = (req, res) => {
  res.send({ newGameId: req.newGame.id });
};

exports.checkGetGameStateParams = (req, res, next) => {
  console.log('check');
  if (!req || !req.query || !req.query.gameId || !req.query.side) {
    return next({ status: 401, error: 'Incorrect params for get game state' });
  }
  return next();
};

exports.getGame = async (req, res, next) => {
  console.log('get game');
  try {
    let game = await Game.findByPk(req.query.gameId);
    console.log(game);
    req.game = game;
    next();
  } catch (err) {
    console.log(`Caught exception trying to get game: ${err}`);
    return next({ status: 500, error: 'Failed to get game.' });
  }
};

exports.hasGameStarted = async (req, res, next) => {
  try {
    if (!req.game.bluePlayer) {
      return res.send({ status: 'Awaiting Blue Deck' });
    }
    next();
  } catch (err) {
    console.log(`Caught exception trying to find if game has started: ${err}`);
    return next({ status: 500, error: 'Failed to find if game has started.' });
  }
};

exports.checkJoinGameParams = (req, res, next) => {
  console.log('check');
  if (!req || !req.body || !req.body.gameId || !req.body.deckId) {
    return next({ status: 401, error: 'Incorrect params for join game' });
  }
  return next();
};

/*
async function createNewGame(redDeck, blueDeck) {
  // TODO: Handle errors
  let newGameState = addon.createGameWithDecks(blueDeck, redDeck);
  let newGameStateObj = JSON.parse(newGameState);
  let newGame = new Game({
    gameState: JSON.stringify(newGameStateObj),
  });
  await newGame.save().catch((err) => {
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
        return next({
          status: 500,
          error: `Error while creating new game: ${err}`,
        });
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
    let newGameId = await createNewGame(redDeck, blueDeck).catch((err) => {
      console.log(err);
      return next({
        status: 500,
        error: `Error while creating new game: ${err}`,
      });
    });
    res.send({ GameId: newGameId });
  } catch (err) {
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
        name: redDeckName,
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
      redDeck: redDeck,
    });
    await newGame.save();
    res.send({ GameId: newGame._id });
  } catch (err) {
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
      (side === 'Blue' &&
        game.bluePlayer &&
        req.username !== game.bluePlayer.username)
    ) {
      console.log('Unauthed');
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
      return next({
        status: 400,
        error: `Couldn't find user with username ${username}.`,
      });
    }
    console.log(user);
    // Get deck from user
    let deck = user.decks.find((d) => {
      return d._id == deckId;
    });
    console.log(deck);
    if (!deck) {
      return next({
        status: 400,
        error: `Couldn't find deck with ID ${deckId}.`,
      });
    }
    // Get game from game ID
    let game = await Game.findById(gameId);
    if (!game) {
      return next({
        status: 400,
        error: `Couldn't find game with ID ${gameId}.`,
      });
    }
    if (game.bluePlayer) {
      return next({ status: 400, error: `Blue player already exists` });
    }
    console.log(game);
    // Add user and deck to game
    await Game.findByIdAndUpdate(gameId, { blueDeck: deck, bluePlayer: user });
    // Return success
    res.sendStatus(200);
  } catch (err) {
    next({ status: 500, error: `Error joining game: ${err}` });
  }
});

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
*/
