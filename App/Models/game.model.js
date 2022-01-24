module.exports = (sequelize, Sequelize) => {
  const Game = sequelize.define('game', {
    status: {
      type: Sequelize.STRING,
    },
    state: {
      type: Sequelize.JSON,
    },
    redPlayer: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    bluePlayer: {
      type: Sequelize.INTEGER,
    },
    redDeck: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    blueDeck: {
      type: Sequelize.JSON,
    },
  });

  return Game;
};