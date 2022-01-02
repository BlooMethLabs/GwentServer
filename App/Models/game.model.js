module.exports = (sequelize, Sequelize) => {
  // const gameSchema = new mongoose.Schema({
  //   gameState: { type: String },
  //   redPlayer: {type: userSchema, required: true},
  //   bluePlayer: userSchema,
  //   redDeck: {type: deckSchema, required:true},
  //   blueDeck: deckSchema,
  //   actions: [{ type: String }],
  // });

  const Game = sequelize.define('game', {
    gameState: {
      type: Sequelize.BLOB,
    },
    redPlayer: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    bluePlayer: {
      type: Sequelize.INTEGER,
    },
    redDeck: {
      type: Sequelize.BLOB,
      allowNull: false,
    },
    blueDeck: {
      type: Sequelize.BLOB,
    },
    // TODO: list of actions taken
  });

  return Game;
};
