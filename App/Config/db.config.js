module.exports = {
  HOST: 'localhost',
  USER: 'bloo',
  PASSWORD: '123456',
  DB: 'gwentdb',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
