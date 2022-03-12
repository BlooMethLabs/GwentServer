const db = require('../Models');
const config = require('../Config/auth.config');
const User = db.user;
const Op = db.Sequelize.Op;

exports.getUser = async (req, res, next) => {
  try {
    let user = await User.findByPk(req.userId);
    req.user = user;
    next();
  } catch (err) {
    console.log(`Caught exception trying to get user ${req.userId}: ${err}`);
    return next({ status: 500, error: 'Failed to get user.' });
  }
};

exports.getUserIncludingDecks = async (req, res, next) => {
  console.log('get user inc decks');
  try {
    let user = await User.findByPk(req.userId, { include: ['decks'] });
    req.user = user;
    next();
  } catch (err) {
    console.log(
      `Caught exception trying to get user including decks ${req.userId}: ${err}`,
    );
    return next({ status: 500, error: 'Failed to get user.' });
  }
};

exports.getUserIncludingGames = async (req, res, next) => {
  console.log('get user inc games');
  try {
    let user = await User.findByPk(req.userId, { include: ['games'] });
    req.user = user;
    next();
  } catch (err) {
    console.log(
      `Caught exception trying to get user including decks ${req.userId}: ${err}`,
    );
    return next({ status: 500, error: 'Failed to get user.' });
  }
};
