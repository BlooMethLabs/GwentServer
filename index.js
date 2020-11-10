//jshint esversion:6
const addon = require('./GwentAddon');
const express = require('express');
const app = express();

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  // res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  );

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type',
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.get('/', function (req, res) {
  const game = addon.createGame();
  res.send(game);
});

app.get('/startGame', function (req, res) {
  const game = addon.createGame();
  res.send(game);
});

app.get('/takeAction', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.listen(3001, '127.0.0.1', function () {
  console.log('Listening on port 3001');
});
