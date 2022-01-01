const db = require('../Models');
const config = require('../Config/auth.config');
const User = db.user;
const Op = db.Sequelize.Op;

exports.getUser = async (userId) => {
  try {
    let user = await User.findByPk(userId);
    return user;
  } catch(err) {
    console.log(`Caught exception: ${err}`)
    return false;
  }
}

exports.getUserIncludingDecks = async (userId) => {
  console.log('get user');
  try {
    let user = await User.findByPk(userId, { include: ['decks'] })
    return user;
  } catch(err) {
    console.log(`Caught exception: ${err}`)
    return false;
  }
}