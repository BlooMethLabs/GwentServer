const controller = require('../../Controllers/game.controller');
const deckController = require('../../Controllers/deck.controller');
const userController = require('../../Controllers/user.controller');
const { authJwt } = require('../../Middleware');

module.exports = function (app) {
  app.post(
    '/api/game/createNewGame',
    authJwt.verifyToken,
    controller.handleCreateNewGameParams,
    // Should check if deck valid?
    deckController.getDefaultDeck,
    userController.getUserIncludingDecks,
    // get deck from example deck
    deckController.getUserDeck,
    controller.createNewGame,
    controller.addGameToUser,
    controller.sendNewGameId,
    // create new game with user and deck
  );

  app.get(
    '/api/game/getGameStatus',
    authJwt.verifyToken,
    controller.handleGetGameStatusParams,
    controller.getGame,
    controller.sendGameStatus,
  );

  app.get(
    '/api/game/getGameState',
    authJwt.verifyToken,
    controller.handleGetGameStateParams,
    controller.getGame,
    controller.checkAuth,
    controller.getGameState,
    controller.removeOtherPlayerFromState,
    controller.sendGameState,
  );

  app.post(
    '/api/game/joinGame',
    authJwt.verifyToken,
    controller.handleJoinGameParams,
    controller.getGame,
    deckController.getDefaultDeck,
    userController.getUserIncludingDecks,
    deckController.getUserDeck,
    controller.addGameToUser,
    controller.addBluePlayerToGame,
    deckController.decodeRedAndBlueDecks,
    controller.startGame,
    // controller.sendJoinGameRes,
  );

  app.post(
    '/api/game/takeAction',
    authJwt.verifyToken,
    controller.handleTakeActionParams,
    controller.getGame,
    controller.checkAuth,
    controller.takeAction,
    controller.removeOtherPlayerFromState,
    controller.sendTakeActionRes,
  );
};
