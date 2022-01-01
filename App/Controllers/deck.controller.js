const addon = require('../../GwentAddon');
const db = require('../Models');
const Deck = db.deck;
const User = db.user;
const {
  getDeckName,
  getFactionCards,
  isDeckValid,
  encodeDeck,
  convertDeckFromDbFormat,
} = require('../Game/Utils');
const userController = require('./user.controller');

exports.getFactionCards = (req, res) => {
  console.log('Get faction cards');
  console.log(req.query);
  // let request = JSON.parse(req.query);
  let faction = parseInt(req.query.Faction);
  console.log(faction);
  let cards = getFactionCards(faction);
  res.send({ Cards: cards });
};

exports.getUserDecks = async (req, res, next) => {
  try {
    console.log(`Get user decks for ${req.userId}`);
    let user = await userController.getUserIncludingDecks(req.userId);

    let decks = [];
    if (user.decks) {
      decks = user.decks.map((d) => {
        return { id: d.id, name: d.name };
      });
    }
    console.log(decks);

    res.send({ Decks: decks });
  } catch (err) {
    console.log(`Caught exception trying to get decks for user ${req.userId}: ${err}`);
    return next({ status: 500, error: 'Failed to get decks' });
  }
};

exports.getUserDeck = async (req, res, next) => {
  try {
    let deckId = req.query.deckId;
    if (!deckId) {
      return next({ status: 400, error: 'No deck ID in query.' });
    }
    console.log(deckId);

    let user = await User.findByPk(req.userId, { include: ['decks'] })
      // TODO remove .then?
      .then((user) => {
        return user;
      })
      .catch((err) => {
        console.log('Could not find user', err);
      });

    let deck = user.decks.find((d) => d.id == deckId);
    console.log(
      `Deck id: ${deck.id} name: ${deck.name} faction: ${deck.faction} leader: ${deck.leader} cards: ${deck.cards}`,
    );
    let convertedDeck = convertDeckFromDbFormat(deck);
    console.log(convertedDeck);
    res.send({ Deck: convertedDeck });
  } catch (err) {
    console.log(err);
    return next({ status: 500, error: 'Failed to get deck.' });
  }
};

exports.checkSaveDeckParams = (req, res, next) => {
  if (!req || !req.body || !req.body.name || !req.body.deck) {
    return next({
      status: 400,
      error: 'Username or password param missing.',
    });
  }
  next();
};

exports.checkDeckValid = (req, res, next) => {
  try {
    let deck = JSON.stringify(req.body.deck);
    let valid = addon.isDeckValid(deck);
    if (!valid) {
      return next({ status: 400, error: 'Deck not valid' });
    }
    next();
  } catch (err) {
    return next({ status: 500, error: 'Failed to check if deck is valid.' });
  }
};

exports.encodeDeck = (req, res, next) => {
  try {
    let userId = req.userId;
    let encodedDeck = encodeDeck(req.body.name, req.body.deck, userId);
    console.log('Converted deck: ' + JSON.stringify(encodedDeck));
    req.encodedDeck = encodedDeck;
    next();
  } catch (err) {
    return next({ status: 500, error: 'Failed to encode deck.' });
  }
};

exports.confirmDeckBelongsToUser = async (req, res, next) => {
  console.log('confirm');
  try {
    console.log(req.body);
    if (!req.body.deckId) {
      next();
    }
    console.log('here');
    let user = await userController.getUserIncludingDecks(req.userId);
    console.log(`user: ${user}`);
    let deck = user.decks.find((d) => d.id == req.body.deckId);
    if (!deck) {
      return next({ status: 401, error: 'Deck does not belong to user.' });
    }
    req.existingDeck = deck;
    next();
  } catch(err) {
    return next({ status: 500, error: 'Failed to confirm deck belonged to user.' });
  }
}

exports.saveDeck = async (req, res, next) => {
  console.log('Save deck');
  try {
    console.log(
      `userId: ${req.userId} Name: ${req.body.name} Deck: ${JSON.stringify(
        req.body.deck,
      )}`,
    );

    if (req.existingDeck) {
      await req.existingDeck.destroy();
    }

    let newDeck = await Deck.create(req.encodedDeck);
    console.log(newDeck.id);
    res.send({ deckId: newDeck.id });
  } catch (err) {
    return next({ status: 500, error: 'Failed to update decks' });
  }
};
