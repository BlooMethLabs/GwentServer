const addon = require('../../GwentAddon');
const { application } = require('express');
const db = require('../Models');
const Deck = db.deck;
const User = db.user;
const {
  getDeckName,
  getFactionCards,
  isDeckValid,
  convertDeckToDbFormat,
  convertDeckFromDbFormat,
} = require('../Game/Utils');

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
  // let request = JSON.parse(req.query.req);
  try {
    console.log(`Get user decks ${req.userId}`);
    let user = await User.findByPk(req.userId, { include: ['decks'] })
      .then((user) => {
        return user
      })
      .catch((err) => {
        console.log('Could not find user', err);
      });
    console.log(JSON.stringify(user.decks, null, 2));

    let decks = [];
    if (user.decks) {
      decks = user.decks.map((d) => {return {id: d.id, "name": d.name};});
    }

    console.log(decks);

    res.send({ Decks: decks });
  } catch(err) {
    return next({ status: 500, error: 'Failed to update decks' });
  }
}

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
        return user
      })
      .catch((err) => {
        console.log('Could not find user', err);
      });

    let deck = user.decks.find((d) => d.id == deckId);
    console.log(`Deck id: ${deck.id} name: ${deck.name} faction: ${deck.faction} leader: ${deck.leader} cards: ${deck.cards}`);
    let convertedDeck = convertDeckFromDbFormat(deck);
    console.log(convertedDeck);
    res.send({Deck: convertedDeck});
  } catch(err) {
    console.log(err);
    return next({ status: 500, error: 'Failed to get deck.' });
  }
}

exports.saveDeck = (req, res, next) => {
  console.log('Save deck');
  try {
    console.log(req.body);
    if (!req.userId || !req.body.name || !req.body.deck) {
      return next({
        status: 400,
        error: 'Incomplete request, requires username, deck name and deck',
      });
    }
    console.log(
      `userId: ${req.userId} Name: ${
        req.body.name
      } Deck: ${JSON.stringify(req.body.deck)}`,
    );
    let userId = req.userId;
    let deckId = req.body.deckId;
    let deck = JSON.stringify(req.body.deck);
    console.log('Checking deck is valid');
    let valid = addon.isDeckValid(deck);
    console.log('Deck: ' + valid);
    if (!valid) {
      return next({ status: 400, error: 'Deck not valid' });
    }
    let convertedDeck = convertDeckToDbFormat(req.body.name, req.body.deck, userId);
    console.log('Converted deck: ' + JSON.stringify(convertedDeck));
    // let convertedDeckObject = new Deck(convertedDeck);

    Deck.create(convertedDeck);
    res.send({ deckId: 1 });
  } catch (err) {
    return next({ status: 500, error: 'Failed to update decks' });
  }
}