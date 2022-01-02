const db = require('../Models');
const config = require('../Config/auth.config');
const User = db.user;
const Op = db.Sequelize.Op;
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

exports.signup = (req, res, next) => {
  console.log('Signing up');
  // Save User to Database
  User.create({
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, 8),
  })
    .then((user) => {
      res.send({ message: 'User was registered successfully!' });
    })
    .catch((err) => {
      console.log(`Caught exception: ${err}`);
      return next({ status: 500, error: 'Failed to register user.' });
    });
};

exports.signin = (req, res, next) => {
  console.log('Signing in');
  User.findOne({
    where: {
      username: req.body.username,
    },
  })
    .then((user) => {
      if (!user) {
        return next({ status: 500, error: 'User Not found.' });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password,
      );

      if (!passwordIsValid) {
        return next({ status: 401, error: 'Invalid password!' });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400, // 24 hours
      });

      res.status(200).send({
        id: user.id,
        username: user.username,
        accessToken: token,
      });
    })
    .catch((err) => {
      console.log(`Caught exception: ${err}`);
      return next({ status: 500, error: 'Failed to sign in.' });
    });
};
