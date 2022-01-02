const controller = require('../../Controllers/game.controller');
const deckController = require('../../Controllers/deck.controller');
const { authJwt } = require('../../Middleware');

module.exports = function (app) {
  app.post(
    '/api/game/createNewGame',
    authJwt.verifyToken,
    controller.checkCreateNewGameParams,
    controller.
    // controller.checkSaveDeckParams,
    // controller.checkDeckValid,
    // controller.encodeDeck,
    // controller.confirmDeckBelongsToUser,
    // controller.saveDeck,
  );
};
