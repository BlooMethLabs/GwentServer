const controller = require('../../Controllers/deck.controller');
const { authJwt } = require('../../Middleware');

module.exports = function (app) {
  app.get('/api/deck/getFactionCards', controller.getFactionCards);
  // function (req, res) {
  //   let request = JSON.parse(req.query.req);
  //   let faction = parseInt(request.Faction);
  //   console.log(faction);
  //   let cards = getFactionCards(faction);
  //   res.send({ Cards: cards });
  // });

  app.get(
    '/api/deck/getUserDecks',
    authJwt.verifyToken,
    controller.getUserDecks,
  );

  app.get(
    '/api/deck/getUserDeck',
    authJwt.verifyToken,
    controller.checkGetUserDeckParams,
    controller.getUserDeck,
  );

  app.post(
    '/api/deck/saveDeck',
    authJwt.verifyToken,
    controller.checkSaveDeckParams,
    controller.checkDeckValid,
    controller.encodeDeck,
    controller.confirmDeckBelongsToUser,
    controller.saveDeck,
  );
};
