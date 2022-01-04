const controller = require('../../Controllers/game.controller');
const deckController = require('../../Controllers/deck.controller');
const userController = require('../../Controllers/user.controller');
const { authJwt } = require('../../Middleware');

module.exports = function (app) {
  app.post(
    '/api/game/createNewGame',
    authJwt.verifyToken,
    controller.checkCreateNewGameParams,
    // Should check if deck valid?
    // deckController.getDefaultDeck,
    userController.getUserIncludingDecks,
    // get deck from example deck
    deckController.getUserDeck,
    controller.createNewGame,
    controller.sendNewGameId,
    // create new game with user and deck
  );

  app.get(
    '/api/game/getGameState',
    authJwt.verifyToken,
    controller.checkGetGameStateParams,
    controller.getGame,
    controller.hasGameStarted,
    // controller.findPlayer,
    // controller.removeOtherPlayerCards,
    // controller.sendGameState,
  );

  app.post(
    '/api/game/joinGame',
    authJwt.verifyToken,
    controller.checkJoinGameParams,
    controller.getGame,
    deckController.getDefaultDeck,
    userController.getUserIncludingDecks,
    deckController.getUserDeck,
    deckController.decodeDeck,
    // controller.addUserToGame,
    // controller.addDeckToGame,
    // controller.updateGameState,
    // controller.sendJoinGameResponse,
  );
};
