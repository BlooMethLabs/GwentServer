const _ = require("lodash");
const fs = require("fs");
const deckNames = {
  1: "Decks/Monsters.json",
  2: "Decks/Scoiatael.json",
  3: "Decks/Nilfgaard.json",
  4: "Decks/NorRealms.json",
};

function removeOtherPlayer(game, side) {
  console.log(game);
  let remSide = _.toLower(side) === "red" ? "Blue" : "Red";
  console.log(game[remSide + " Player"].Hand.Cards.length);
  game[remSide + " Player"].Hand.Size =
    game[remSide + " Player"].Hand.Cards.length;
  game[remSide + " Player"].Hand.Cards = [];
  game[remSide + " Player"].Deck.Size =
    game[remSide + " Player"].Deck.Cards.length;
  game[remSide + " Player"].Deck.Cards = [];
  return game;
}

function getDeckName(id) {
  return deckNames[id];
}

function getFactionCards(faction) {
  switch (faction) {
    case 1:
      let monsterCards = JSON.parse(
        fs.readFileSync("Decks/Creation/Monsters.json")
      );
      let neutralCards = JSON.parse(
        fs.readFileSync("Decks/Creation/Neutral.json")
      );
      return [...monsterCards, ...neutralCards];
    // case 2:
    //   console.log("sco");
    //   return JSON.parse(fs.readFileSync("../Decks/Creation/Monsters.json"));
    default:
      return { error: "No collection with that ID." };
  }
}

function isDeckValid(deck) {
  return true;
}

function convertDeckToDbFormat(name, deck) {
  let convertedDeck = {
    name: name,
    faction: deck.Faction,
    leader: deck.Leader.Name,
  };
  let cards = deck.Cards.map((card) => card.Name);
  convertedDeck.cards = cards;
  return convertedDeck;
}

function convertDeckFromDbFormat(deck) {
  // let convertedDeck = {name: name, faction: deck.Faction, leader: deck.Leader.Name};
  // let cards = deck.Cards.map(card => card.Name);
  let neutralCards = JSON.parse(fs.readFileSync("Decks/Creation/Neutral.json"));
  console.log(neutralCards);
  let factionCards = null;
  console.log(deck.faction);
  if (deck.faction === "Monsters") {
    factionCards = JSON.parse(fs.readFileSync("Decks/Creation/Monsters.json"));
    console.log(factionCards);
  }
  let availableCards = [...factionCards, ...neutralCards];
  let convertedDeck = { Faction: deck.faction };
  convertedDeck.Cards = deck.cards.map((card) =>
    availableCards.find((c) => c.Name === card)
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
