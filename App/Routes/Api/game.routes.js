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
    // return game ID
  );
};
