const addon = require('../../GwentAddon');
const fs = require('fs');
const db = require('../Models');
const Deck = db.deck;
const User = db.user;
const Game = db.game;
const userController = require('./user.controller');
const deckController = require('./deck.controller');
const { user } = require('../Models');
const gameConfig = require('../Config/game.config.js');
const _ = require('lodash');

exports.handleCreateNewGameParams = (req, res, next) => {
  console.log('Handle create new game params.');
  if (!req || !req.body || !req.body.deckId) {
    return next({
      status: 401,
      error: 'Incorrect params for create new game.',
    });
  }
  req.gwent = {
    deckId: req.body.deckId,
    default: req.body.default,
  };
  console.log(`Create new game params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.createNewGame = async (req, res, next) => {
  console.log('Create new game');
  try {
    let newGame = await Game.create({
      redPlayer: req.userId,
      redDeck: req.deck,
      status: gameConfig.statuses[1],
    });
    console.log(`New game: ${newGame}`);
    req.game = newGame;
    return next();
  } catch (err) {
    console.log(`Caught exception trying to create new game: ${err}`);
    return next({ status: 500, error: 'Failed to create new game.' });
  }
};

exports.addGameToUser = async (req, res, next) => {
  console.log('Add game to user.');
  try {
    await req.user.addGame(req.game);
    console.log(`Added game[${req.game.id}] to user [${req.user.id}]`);
    next();
  } catch (err) {
    console.log(`Caught exception trying to add game to user: ${err}`);
    return next({ status: 500, error: 'Failed to add game to user.' });
  }
};

exports.addBluePlayerToGame = async (req, res, next) => {
  console.log('Add blue player to game.');
  try {
    req.game.bluePlayer = req.user.id;
    req.game.blueDeck = req.deck;
    await req.game.save();
    console.log(`Added user [${req.user.id}] to game[${req.game.id}]`);
    next();
  } catch (err) {
    console.log(`Caught exception trying to add game to user: ${err}`);
    return next({ status: 500, error: 'Failed to add game to user.' });
  }
};

exports.sendNewGameId = (req, res) => {
  console.log('Send new game ID');
  res.send({ newGameId: req.game.id });
};

exports.getUserGamesDetails = async (req, res, next) => {
  try {
    req.games = await Promise.all(
      req.user.games.map(async (game) => {
        const redPlayerName = await userController.getUserName(game.redPlayer);
        const bluePlayerName = await userController.getUserName(
          game.bluePlayer,
        );

        const redFaction = game.redDeck.faction;
        const blueFaction = game.blueDeck ? game.blueDeck.faction : null;

        return {
          id: game.id,
          status: game.status,
          redPlayerId: game.redPlayer,
          bluePlayer: game.bluePlayer,
          redPlayerName: redPlayerName,
          bluePlayerName: bluePlayerName,
          redFaction: redFaction,
          blueFaction: blueFaction,
          winner: game.state && game.state.Winner ? game.state.Winner : null,
        };
      }),
    );
    next();
  } catch (err) {
    console.log(`Caught exception trying to get user details: ${err}`);
    return next({ status: 500, error: 'Failed to retrieve user games.' });
  }
};

exports.sendUserGames = async (req, res, next) => {
  try {
    const games = req.games;
    res.send({ games: games });
  } catch (err) {
    console.log(`Caught exception trying to send user games: ${err}`);
    return next({ status: 500, error: 'Failed to retrieve user games.' });
  }
};

exports.handleGetGameStatusParams = (req, res, next) => {
  console.log('Handle get game status params.');
  if (!req || !req.query || !req.query.gameId) {
    return next({ status: 401, error: 'Incorrect params for get game status' });
  }
  req.gwent = { gameId: req.query.gameId, side: req.query.side };
  console.log(`Get game status params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.handleGetGameStateParams = (req, res, next) => {
  console.log('Handle get game state params.');
  if (!req || !req.query || !req.query.gameId || !req.query.side) {
    return next({ state: 401, error: 'Incorrect params for get game state' });
  }
  req.gwent = { gameId: req.query.gameId, side: req.query.side };
  console.log(`Get game state params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.checkAuth = (req, res, next) => {
  console.log('Check user authorised.');
  try {
    let requestSide =
      _.toLower(req.gwent.side) === 'red' ? 'redPlayer' : 'bluePlayer';
    let userId = req.userId;
    if (userId !== req.game[requestSide]) {
      return next({
        status: 402,
        error: `User with ID ${userId} not authorised to access game with ID ${req.game.id} and side ${req.gwent.side}.`,
      });
    }
    next();
  } catch (err) {
    console.log(`Caught exception trying to confirm authorisation: ${err}`);
    return next({ status: 500, error: 'Failed to authorise.' });
  }
};

exports.getGame = async (req, res, next) => {
  console.log('Get game');
  try {
    let game = await Game.findByPk(req.gwent.gameId);
    req.game = game;
    console.log(
      `Got game with ID [${req.gwent.gameId}]: ${JSON.stringify(game)}`,
    );
    next();
  } catch (err) {
    console.log(`Caught exception trying to get game: ${err}`);
    return next({ status: 500, error: 'Failed to get game.' });
  }
};

exports.getGameState = async (req, res, next) => {
  console.log('Get game state');
  try {
    req.gameState = req.game.state;
    next();
  } catch (err) {
    console.log(`Caught exception trying to get game state: ${err}`);
    return next({ status: 500, error: 'Failed to get game state.' });
  }
};

exports.checkGameHasStarted = async (req, res, next) => {
  console.log('Has game started');
  try {
    if (!req.game.status === gameConfig.statuses[1]) {
      return next({ status: 500, error: 'Game has not started' });
    }
    next();
  } catch (err) {
    console.log(`Caught exception trying to find if game has started: ${err}`);
    return next({ status: 500, error: 'Failed to find if game has started.' });
  }
};

exports.sendGameStatus = async (req, res, next) => {
  console.log('Send game status');
  try {
    let status = req.game.status;
    console.log(`Game status: ${status}`);
    res.send({ status: status });
  } catch (err) {
    console.log(`Caught exception trying to find game status: ${err}`);
    return next({ status: 500, error: 'Failed to find game status.' });
  }
};

exports.sendGameState = async (req, res, next) => {
  console.log('Send game state');
  try {
    let state = req.gameState;
    if (typeof state !== 'string') {
      state = JSON.stringify(state);
    }
    console.log(`Game state: ${state}`);
    res.send({ state: state });
  } catch (err) {
    console.log(`Caught exception trying to find game state: ${err}`);
    return next({ state: 500, error: 'Failed to find game state.' });
  }
};

exports.handleJoinGameParams = (req, res, next) => {
  console.log('Handle join game params');
  if (!req || !req.body || !req.body.gameId || !req.body.deckId) {
    return next({ status: 401, error: 'Incorrect params for join game' });
  }
  req.gwent = {
    gameId: req.body.gameId,
    default: req.body.default,
    deckId: req.body.deckId,
  };
  console.log(`Join game params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.startGame = async (req, res, next) => {
  console.log('Start game');
  try {
    let redDeck = req.decodedRedDeck;
    let blueDeck = req.decodedBlueDeck;
    let newGameState = addon.createGameWithDecks(
      JSON.stringify(blueDeck),
      JSON.stringify(redDeck),
    );
    console.log(newGameState);
    req.game.state = JSON.parse(newGameState);
    if (req.game.state['Error']) {
      throw req.game.state['Error'];
    }
    req.game.status = gameConfig.statuses[2];
    await req.game.save();
    return res.send({ GameId: req.game.id });
  } catch (err) {
    console.log(`Caught exception trying to start game: ${err}`);
    return next({ status: 500, error: 'Failed to start game.' });
  }
};

exports.handleGetGameUserSideParams = (req, res, next) => {
  console.log('Handle get game user side params');
  console.log(req.body);
  if (!req || !req.query || !req.query.gameId) {
    return next({
      status: 401,
      error: 'Incorrect params for get game user side',
    });
  }
  req.gwent = {
    gameId: req.query.gameId,
  };
  console.log(`Get game user side params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.handleTakeActionParams = (req, res, next) => {
  console.log('Handle take action params');
  console.log(req.body);
  if (!req || !req.body || !req.body.gameId || !req.body.action) {
    return next({ status: 401, error: 'Incorrect params for take action' });
  }
  req.gwent = {
    gameId: req.body.gameId,
    action: req.body.action,
    side: req.body.action.Side,
  };
  if (typeof req.gwent.action !== 'object') {
    req.gwent.action = JSON.parse(action);
  }
  console.log(`Take action params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.sendGetGameUserSideRes = async (req, res, next) => {
  console.log('Send get game user side res');
  try {
    let side;
    if (req.game.redPlayer === req.userId) {
      side = 'Red';
    } else if (req.game.bluePlayer === req.userId) {
      side = 'Blue';
    } else {
      return next({
        status: 402,
        error: `User with ID ${req.userId} not authorised to access game with ID ${req.game.id}.`,
      });
    }
    return res.send({ side: side });
  } catch (err) {
    console.log(`Caught exception trying to send user side res: ${err}`);
    return next({
      status: 500,
      error: 'Failed to send get game user side res.',
    });
  }
};

exports.takeAction = async (req, res, next) => {
  console.log('Take action');
  try {
    let action = req.gwent.action;
    if (typeof action !== 'string') {
      action = JSON.stringify(action);
    }
    let gameState = req.game.state;
    if (typeof gameState !== 'string') {
      gameState = JSON.stringify(gameState);
    }
    let newGameState = addon.takeAction(gameState, action);
    console.log(`New game state: ${newGameState}`);
    newGameState = JSON.parse(newGameState);
    if ('Error' in newGameState) {
      console.log('Error: New game: ', newGameState);
      return next({ status: 500, error: newGameState.Error });
    }
    req.gameState = newGameState;
    req.game.state = newGameState;
    if (newGameState['Game Over']) {
      req.game.status = 'gameOver';
    }
    await req.game.save();
    return next();
  } catch (err) {
    console.log(`Caught exception trying to take action: ${err}`);
    return next({ status: 500, error: 'Failed to take action.' });
  }
};

exports.removeOtherPlayerFromState = async (req, res, next) => {
  console.log('Remove other player');
  try {
    let game = req.gameState;
    let remSide =
      _.toLower(req.gwent.side) === 'red' ? 'Blue Player' : 'Red Player';
    console.log(typeof game);
    console.log(`Side to remove: ${remSide}`);
    console.log(game['Red Player']);
    console.log(game[remSide].Hand.Cards.length);
    game[remSide].Hand.Size = game[remSide].Hand.Cards.length;
    game[remSide].Hand.Cards = [];
    game[remSide].Deck.Size = game[remSide].Deck.Cards.length;
    game[remSide].Deck.Cards = [];
    req.gameState = game;
    return next();
  } catch (err) {
    console.log(`Caught exception trying to remove other player: ${err}`);
    return next({ status: 500, error: 'Failed to remove other player.' });
  }
};

exports.sendTakeActionRes = async (req, res, next) => {
  console.log('Send take action res');
  try {
    return res.send({ newGameState: req.gameState });
  } catch (err) {
    console.log(`Caught exception trying to send take action res: ${err}`);
    return next({ status: 500, error: 'Failed to send take action res.' });
  }
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
