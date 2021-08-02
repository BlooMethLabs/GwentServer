require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;

const withAuth = function (req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).send({ message: 'Unauthorized: No token provided' });
  } else {
    console.log(token);
    jwt.verify(token, secret, function (err, decoded) {
      if (err) {
        res.status(401).send({ message: 'Unauthorized: Invalid token' });
      } else {
        req.username = decoded.username;
        next();
      }
    });
  }
};

module.exports = withAuth;
