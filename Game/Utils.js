const _ = require('lodash');
const fs = require('fs');
const deckNames = {
  1: 'Decks/Monsters.json',
  2: 'Decks/Scoiatael.json',
  3: 'Decks/Nilfgaard.json',
  4: 'Decks/NorRealms.json',
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
  return deckNames[id];
}

function getFactionCards(faction) {
  switch(faction) {
    case 1:
      return JSON.parse(fs.readFileSync("Decks/Creation/Monsters.json"));
    // case 2:
    //   console.log("sco");
    //   return JSON.parse(fs.readFileSync("../Decks/Creation/Monsters.json"));
    default:
      return {error: "No collection with that ID."};
  }
}

function isDeckValid(deck) {
  return true;
}

export { removeOtherPlayer, getDeckName, getFactionCards, isDeckValid };
