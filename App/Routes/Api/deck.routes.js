const controller = require('../../Controllers/deck.controller');
const userController = require('../../Controllers/user.controller');
const { authJwt } = require('../../Middleware');

module.exports = function (app) {
  app.get('/api/deck/getFactionCards', controller.getFactionCards);

  app.get(
    '/api/deck/getUserDecks',
    authJwt.verifyToken,
    userController.getUserIncludingDecks,
    controller.getUserDecks,
    controller.sendDecks,
  );

  app.get(
    '/api/deck/getUserDeck',
    authJwt.verifyToken,
    controller.checkGetUserDeckParams,
    userController.getUserIncludingDecks,
    controller.getUserDeck,
    controller.decodeDeck,
    controller.sendDeck,
  );

  app.post(
    '/api/deck/saveDeck',
    authJwt.verifyToken,
    controller.checkSaveDeckParams,
    controller.checkDeckValid,
    controller.encodeDeck,
    userController.getUserIncludingDecks,
    controller.confirmDeckBelongsToUser,
    controller.saveDeck,
    controller.sendDeckId,
  );
};
