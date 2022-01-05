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
    '/api/game/getGameState',
    authJwt.verifyToken,
    controller.handleGetGameStateParams,
    controller.getGame,
    controller.hasGameStarted,
    // controller.findPlayer,
    // controller.removeOtherPlayerCards,
    // controller.sendGameState,
  );

  app.post(
    '/api/game/joinGame',
    authJwt.verifyToken,
    controller.handleJoinGameParams,
    controller.getGame,
    deckController.getDefaultDeck,
    userController.getUserIncludingDecks,
    deckController.getUserDeck,
    deckController.decodeDeck,
    controller.addGameToUser,
    // controller.addUserToGame,
    // controller.addDeckToGame,
    // controller.sendJoinGameRes,
    // controller.updateGameState,
    // controller.sendJoinGameResponse,
  );
};
