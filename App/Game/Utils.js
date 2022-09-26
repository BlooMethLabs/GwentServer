const _ = require('lodash');

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

module.exports = {
  removeOtherPlayer,
};
