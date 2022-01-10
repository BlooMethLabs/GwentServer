const addon = require('../../GwentAddon');
const fs = require('fs');
const db = require('../Models');
const Deck = db.deck;
const User = db.user;
const userController = require('./user.controller');

const defaultDecks = {
  1: JSON.parse(fs.readFileSync('App/Game/Decks/MonstersDeck.json')),
  2: JSON.parse(fs.readFileSync('App/Game/Decks/ScoiataelDeck.json')),
  3: JSON.parse(fs.readFileSync('App/Game/Decks/NilfgaardDeck.json')),
  4: JSON.parse(fs.readFileSync('App/Game/Decks/NorRealmsDeck.json')),
};

const monsterCards = JSON.parse(
  fs.readFileSync('App/Game/Decks/MonstersCards.json'),
);
const neutralCards = JSON.parse(
  fs.readFileSync('App/Game/Decks/NeutralCards.json'),
);
console.log(`Monster cards: ${JSON.stringify(monsterCards)}`);
console.log(`Neutral cards: ${JSON.stringify(neutralCards)}`);

function getFactionCards(faction) {
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
  let encodedDeck = {
    name: name,
    faction: deck.Faction,
    leader: deck.Leader.Name,
    userId: userId,
  };
  let cards = deck.Cards.map((card) => card.Name);
  // console.log(`Cards: ${JSON.stringify(cards)}`)
  encodedDeck.cards = JSON.stringify(cards);
  return encodedDeck;
}

function decodeDeck(deck) {
  let factionCards = null;
  if (deck.faction === 'Monsters') {
    factionCards = monsterCards;
  }
  let availableCards = [...factionCards, ...neutralCards];
  let decodedDeck = { Faction: deck.faction };
  decodedDeck.Cards = deck.cards.map((card) => {
    let c = availableCards.find((c) => c.Name === card);
    if (!c) {
      throw new Error(`Card ${card} not found in available cards.`);
    }
    return c;
  });
  decodedDeck.Leader = availableCards.find((c) => c.Name === deck.leader);
  console.log(`Decoded deck: ${decodedDeck}`);

  return decodedDeck;
}

exports.getFactionCards = (req, res) => {
  console.log('Get faction cards.');
  try {
    console.log('Get faction cards');
    let faction = parseInt(req.query.Faction);
    let cards = getFactionCards(faction);
    res.send({ cards: cards });
  } catch (err) {
    console.log(`Caught exception trying to get faction cards: ${err}`);
    return next({ status: 500, error: 'Failed to get faction cards.' });
  }
};

exports.getUserDecks = async (req, res, next) => {
  console.log('Get user decks.');
  try {
    console.log(`Get user decks for ${req.userId}`);
    let decks = [];
    if (req.user.decks) {
      decks = req.user.decks.map((d) => {
        return { id: d.id, name: d.name, default: false };
      });
    }
    req.decks = decks;
    return next();
  } catch (err) {
    console.log(
      `Caught exception trying to get decks for user ${req.userId}: ${err}`,
    );
    return next({ status: 500, error: 'Failed to get decks' });
  }
};

exports.sendDecks = (req, res) => {
  console.log('Send decks');
  res.send({ decks: req.decks });
};

exports.handleGetDeckParams = (req, res, next) => {
  console.log('Handle get deck params');
  if ((!req || !req.query || !req.query.deckId, !!!req.query.default)) {
    return next({ status: 401, error: 'Incorrect params for get user deck' });
  }
  req.gwent = {
    deckId: req.query.deckId,
    default: req.query.default === 'true',
  };
  console.log(`Get deck params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.getDefaultDeck = async (req, res, next) => {
  console.log('Get default deck.');
  try {
    if (req.gwent.default) {
      req.deck = defaultDecks[req.gwent.deckId];
    }
    return next();
  } catch (err) {
    console.log(`Caught exception trying to get default deck: ${err}`);
    return next({ status: 500, error: 'Failed to get default deck' });
  }
};

exports.getUserDeck = async (req, res, next) => {
  console.log('Get user deck');
  try {
    if (req.deck) return next();
    let deckId = req.gwent.deckId;
    console.log(`Get deck: ${deckId}`);

    let deck = req.user.decks.find((d) => d.id == deckId);
    deck.cards = JSON.parse(deck.cards);
    console.log(
      `Deck id: ${deck.id} name: ${deck.name} faction: ${deck.faction} leader: ${deck.leader} cards: ${deck.cards}`,
    );
    req.deck = deck;
    return next();
  } catch (err) {
    console.log(
      `Caught exception trying to get deck for user ${req.userId}: ${err}`,
    );
    return next({ status: 500, error: 'Failed to get deck.' });
  }
};

exports.sendDeck = (req, res) => {
  console.log('Send deck');
  res.send({ deck: req.decodedDeck });
};

exports.handleSaveDeckParams = (req, res, next) => {
  console.log('Handle save deck params');
  if (!req || !req.body || !req.body.name || !req.body.deck) {
    return next({
      status: 400,
      error: 'Username or password param missing.',
    });
  }
  req.gwent = { name: req.body.name, deck: req.body.deck };
  console.log(`Save deck params: ${JSON.stringify(req.gwent)}`);
  return next();
};

exports.checkDeckValid = (req, res, next) => {
  console.log('Check deck valid');
  try {
    let deck = JSON.stringify(req.gwent.deck);
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
  console.log('Encode deck');
  try {
    let userId = req.userId;
    let encodedDeck = encodeDeck(req.gwent.name, req.gwent.deck, userId);
    console.log('Converted deck: ' + JSON.stringify(encodedDeck));
    req.encodedDeck = encodedDeck;
    return next();
  } catch (err) {
    console.log(`Caught exception while encoding deck: ${err}`);
    return next({ status: 500, error: 'Failed to encode deck.' });
  }
};

exports.decodeDeck = (req, res, next) => {
  console.log('Decode deck');
  try {
    console.log(`Deck: ${JSON.stringify(req.deck)}`);
    let decodedDeck = decodeDeck(req.deck);
    // console.log(decodedDeck);
    req.decodedDeck = decodedDeck;
    return next();
  } catch (err) {
    console.log(`Caught exception while decoding deck: ${err}`);
    return next({ status: 500, error: 'Failed to decode deck.' });
  }
};

exports.confirmDeckBelongsToUser = async (req, res, next) => {
  console.log('Confirm deck belongs to user');
  try {
    if (!req.gwent.deckId) {
      return next();
    }
    let user = req.user;
    console.log(`user: ${user}`);
    let deck = user.decks.find((d) => d.id == req.gwent.deckId);
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
      `userId: ${req.userId} Name: ${req.gwent.name} Deck: ${JSON.stringify(
        req.encodedDeck,
      )}`,
    );

    if (req.existingDeck) {
      await req.existingDeck.destroy();
    }

    let newDeck = await Deck.create(req.encodedDeck);
    console.log(`Saved new deck with deck ID: ${newDeck.id}`);
    req.newDeckId = newDeck.id;
    return next();
  } catch (err) {
    console.log(`Caught exception while saving deck: ${err}`);
    return next({ status: 500, error: 'Failed to update decks' });
  }
};

exports.sendDeckId = (req, res) => {
  console.log('Send deck ID');
  res.send({ deckId: req.newDeckId });
};
