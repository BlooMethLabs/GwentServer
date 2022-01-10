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
    state: {
      type: Sequelize.STRING,
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
      get() {
        return JSON.parse(this.getDataValue('redDeck'));
      },
      set(value) {
        this.setDataValue('redDeck', JSON.stringify(value));
      },
    },
    blueDeck: {
      type: Sequelize.BLOB,
      get() {
        return JSON.parse(this.getDataValue('blueDeck'));
      },
      set(value) {
        this.setDataValue('blueDeck', JSON.stringify(value));
      },
    },
    // TODO: list of actions taken
  });

  return Game;
};
