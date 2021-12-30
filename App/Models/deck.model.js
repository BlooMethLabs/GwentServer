module.exports = (sequelize, Sequelize) => {
  const Deck = sequelize.define("decks", {
    name: {
      type: Sequelize.STRING
    },
    faction: {
      type: Sequelize.STRING
    },
    leader: {
      type: Sequelize.STRING
    },
    cards: {
      type: Sequelize.STRING(10000)
    },
  });

  return Deck;
};

