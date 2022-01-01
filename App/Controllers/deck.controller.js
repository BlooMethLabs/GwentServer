const addon = require('../../GwentAddon');
const fs = require('fs');
const db = require('../Models');
const Deck = db.deck;
const User = db.user;
const userController = require('./user.controller');

const deckNames = {
  1: 'App/Game/Decks/MonstersDeck.json',
  2: 'App/Game/Decks/ScoiataelDeck.json',
  3: 'App/Game/Decks/NilfgaardDeck.json',
  4: 'App/Game/Decks/NorRealmsDeck.json',
};

const monsterCards = JSON.parse(
  fs.readFileSync('App/Game/Decks/MonstersCards.json'),
);
const neutralCards = JSON.parse(
  fs.readFileSync('App/Game/Decks/NeutralCards.json'),
);
console.log(`Monster cards: ${JSON.stringify(monsterCards)}`);
console.log(`Neutral cards: ${JSON.stringify(neutralCards)}`);

function getDeckName(id) {
  if (!(id > 0 && id < 5)) return null;
  return deckNames[id];
}

function getFactionCards(faction) {
  console.log('getFactionCards');
  switch (faction) {
    case 1:
      return [...monsterCards, ...neutralCards];
    // case 2:
    //   console.log("sco");
    //   return JSON.parse(fs.readFileSync("../Decks/Creation/Monsters.json"));
    default:
      return { error: 'No collection with that ID.' };
  }
}

function encodeDeck(name, deck, userId) {
  let convertedDeck = {
    name: name,
    faction: deck.Faction,
    leader: deck.Leader.Name,
    userId: userId,
  };
  let cards = deck.Cards.map((card) => card.Name);
  // console.log(`Cards: ${JSON.stringify(cards)}`)
  convertedDeck.cards = JSON.stringify(cards);
  return convertedDeck;
}

function decodeDeck(deck) {
  let factionCards = null;
  if (deck.faction === 'Monsters') {
    factionCards = monsterCards;
  }
  let availableCards = [...factionCards, ...neutralCards];

  deck.cards = JSON.parse(deck.cards);
  let convertedDeck = { Faction: deck.faction };
  convertedDeck.Cards = deck.cards.map((card) => {
    let c = availableCards.find((c) => c.Name === card);
    if (!c) {
      throw new Error(`Card ${card} not found in available cards.`);
    }
    return c;
  });
  convertedDeck.Leader = availableCards.find((c) => c.Name === deck.leader);

  return convertedDeck;
}

exports.getFactionCards = (req, res) => {
  try {
    console.log('Get faction cards');
    let faction = parseInt(req.query.Faction);
    let cards = getFactionCards(faction);
    res.send({ Cards: cards });
  } catch (err) {
    console.log(`Caught exception trying to get faction cards: ${err}`);
    return next({ status: 500, error: 'Failed to get faction cards.' });
  }
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

    res.send({ Decks: decks });
  } catch (err) {
    console.log(
      `Caught exception trying to get decks for user ${req.userId}: ${err}`,
    );
    return next({ status: 500, error: 'Failed to get decks' });
  }
};

exports.checkGetUserDeckParams = (req, res, next) => {
  if (!req || !req.query || !req.query.deckId) {
    return next({ status: 401, error: 'Incorrect params for get user deck' });
  }
  return next();
};

exports.getUserDeck = async (req, res, next) => {
  try {
    let deckId = req.query.deckId;
    console.log(`Get deck: ${deckId}`);

    let user = await userController.getUserIncludingDecks(req.userId);

    let deck = user.decks.find((d) => d.id == deckId);
    console.log(
      `Deck id: ${deck.id} name: ${deck.name} faction: ${deck.faction} leader: ${deck.leader} cards: ${deck.cards}`,
    );
    let convertedDeck = decodeDeck(deck);
    console.log(convertedDeck);
    res.send({ Deck: convertedDeck });
  } catch (err) {
    console.log(
      `Caught exception trying to get deck for user ${req.userId}: ${err}`,
    );
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
  return next();
};

exports.checkDeckValid = (req, res, next) => {
  try {
    let deck = JSON.stringify(req.body.deck);
    let valid = addon.isDeckValid(deck);
    if (!valid) {
      return next({ status: 400, error: 'Deck not valid' });
    }
    return next();
  } catch (err) {
    console.log(`Caught exception while checking deck is valid: ${err}`);
    return next({ status: 500, error: 'Failed to check if deck is valid.' });
  }
};

exports.encodeDeck = (req, res, next) => {
  try {
    let userId = req.userId;
    let encodedDeck = encodeDeck(req.body.name, req.body.deck, userId);
    console.log('Converted deck: ' + JSON.stringify(encodedDeck));
    req.encodedDeck = encodedDeck;
    return next();
  } catch (err) {
    console.log(`Caught exception while encoding deck: ${err}`);
    return next({ status: 500, error: 'Failed to encode deck.' });
  }
};

exports.confirmDeckBelongsToUser = async (req, res, next) => {
  console.log('confirm');
  try {
    console.log(req.body);
    if (!req.body.deckId) {
      return next();
    }
    console.log('here');
    let user = await userController.getUserIncludingDecks(req.userId);
    console.log(`user: ${user}`);
    let deck = user.decks.find((d) => d.id == req.body.deckId);
    if (!deck) {
      return next({ status: 401, error: 'Deck does not belong to user.' });
    }
    req.existingDeck = deck;
    return next();
  } catch (err) {
    console.log(
      `Caught exception while confirming deck belongs to user: ${err}`,
    );
    return next({
      status: 500,
      error: 'Failed to confirm deck belonged to user.',
    });
  }
};

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
    console.log(`Caught exception while saving deck: ${err}`);
    return next({ status: 500, error: 'Failed to update decks' });
  }
};
