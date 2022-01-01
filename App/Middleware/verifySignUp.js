const db = require('../Models');
// const ROLES = db.ROLES;
const User = db.user;

checkParams = (req, res, next) => {
  console.log('check params');
  if (!req || !req.body || !req.body.username || !req.body.password) {
    console.log('check params error');
    return next({
      status: 400,
      error: 'Username or password param missing.',
    });
  }
  next();
}

checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  User.findOne({
    where: {
      username: req.body.username,
    },
  }).then((user) => {
    console.log(user);
    if (user) {
      return next({
        status: 400,
        error: 'Failed! Username is already in use!',
      });
    }
    next();
  });
};

const verifySignUp = {
  checkParams: checkParams,
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
};

module.exports = verifySignUp;
