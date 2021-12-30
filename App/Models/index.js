const config = require("../Config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  operatorsAliases: false,

  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../Models/user.model.js")(sequelize, Sequelize);
db.deck = require("../Models/deck.model.js")(sequelize, Sequelize);

db.user.hasMany(db.deck, { as: 'decks' });
db.deck.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user',
});


module.exports = db;
