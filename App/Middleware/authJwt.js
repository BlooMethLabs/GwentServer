const jwt = require("jsonwebtoken");
const config = require("../Config/auth.config");
const db = require("../Models");
const User = db.user;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    // TODO: check if user exists
    next();
  });
};

const authJwt = {
  verifyToken: verifyToken
};
module.exports = authJwt;
