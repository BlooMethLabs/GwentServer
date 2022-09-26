const controller = require("../../Controllers/auth.controller");
const { verifySignUp } = require('../../Middleware');

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept',
    );
    next();
  });

  app.post(
    '/api/auth/signup',
    [
      verifySignUp.checkParams,
      verifySignUp.checkDuplicateUsernameOrEmail,
    ],
    controller.signup,
  );

  app.post('/api/auth/signin', verifySignUp.checkParams, controller.signin);
};
