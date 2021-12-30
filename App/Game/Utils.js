const _ = require('lodash');
const fs = require('fs');
const deckNames = {
  1: 'App/Game/Decks/MonstersDeck.json',
  2: 'App/Game/Decks/ScoiataelDeck.json',
  3: 'App/Game/Decks/NilfgaardDeck.json',
  4: 'App/Game/Decks/NorRealmsDeck.json',
};

function removeOtherPlayer(game, side) {
  console.log(game);
  let remSide = _.toLower(side) === 'red' ? 'Blue' : 'Red';
  console.log(game[remSide + ' Player'].Hand.Cards.length);
  game[remSide + ' Player'].Hand.Size =
    game[remSide + ' Player'].Hand.Cards.length;
  game[remSide + ' Player'].Hand.Cards = [];
  game[remSide + ' Player'].Deck.Size =
    game[remSide + ' Player'].Deck.Cards.length;
  game[remSide + ' Player'].Deck.Cards = [];
  return game;
}

function getDeckName(id) {
  if (!(id > 0 && id < 5)) return null;
  return deckNames[id];
}

function getFactionCards(faction) {
  console.log('getFactionCards');
  switch (faction) {
    case 1:
      let monsterCards = JSON.parse(
        fs.readFileSync('App/Game/Decks/MonstersCards.json'),
      );
      let neutralCards = JSON.parse(
        fs.readFileSync('App/Game/Decks/NeutralCards.json'),
      );
      console.log(monsterCards);
      console.log(neutralCards);
      return [...monsterCards, ...neutralCards];
    // case 2:
    //   console.log("sco");
    //   return JSON.parse(fs.readFileSync("../Decks/Creation/Monsters.json"));
    default:
      return { error: 'No collection with that ID.' };
  }
}

function isDeckValid(deck) {
  return true;
}

function convertDeckToDbFormat(name, deck, userId) {
  let convertedDeck = {
    name: name,
    faction: deck.Faction,
    leader: deck.Leader.Name,
    userId: userId
  };
  let cards = deck.Cards.map((card) => card.Name);
  // console.log(`Cards: ${JSON.stringify(cards)}`)
  convertedDeck.cards = JSON.stringify(cards);
  return convertedDeck;
}

function convertDeckFromDbFormat(deck) {
  // let convertedDeck = {name: name, faction: deck.Faction, leader: deck.Leader.Name};
  // let cards = deck.Cards.map(card => card.Name);
  let neutralCards = JSON.parse(fs.readFileSync('Decks/Creation/Neutral.json'));
  console.log(neutralCards);
  let factionCards = null;
  console.log(deck.faction);
  if (deck.faction === 'Monsters') {
    factionCards = JSON.parse(fs.readFileSync('Decks/Creation/Monsters.json'));
    console.log(factionCards);
  }
  let availableCards = [...factionCards, ...neutralCards];
  let convertedDeck = { Faction: deck.faction };
  convertedDeck.Cards = deck.cards.map((card) =>
    availableCards.find((c) => c.Name === card),
  );
  convertedDeck.Leader = availableCards.find((c) => c.Name === deck.leader);

  // todo: other factions
  return convertedDeck;
}

module.exports = {
  removeOtherPlayer,
  getDeckName,
  getFactionCards,
  isDeckValid,
  convertDeckToDbFormat,
  convertDeckFromDbFormat,
};
