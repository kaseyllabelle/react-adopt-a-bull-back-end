require('dotenv').config();

'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');

const conf = require('./config');
const {localStrategy, jwtStrategy} = require('./config/auth-strategies');

const apiRouter = require('./routes/api.router');
const mainRouter = require('./routes/main.router');
const userRouter = require('./routes/user.router');

const app = express();

app.use(bodyParser.json({limit: 500000})); 
app.use(bodyParser.urlencoded({limit: 500000, extended: true}));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/user', userRouter);
app.use('/main', mainRouter);
app.use('/api', apiRouter);

let server;

mongoose.connect(conf.DATABASE_URL, (error) =>
{
  if(error)
  {
    console.error('Please make sure Mongodb is installed and running!', error); 
    throw error;
  }
  console.log('Mongo running at', conf.DATABASE_URL);
});

function runServer(){
  const port = conf.PORT;
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Your app is listening on port ${port}`);
      resolve(server);
    }).on('error', err => {
      reject(err)
    });
  });
}

function closeServer(){
  return new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      if (err){
        reject(err);
        return;
      }
      resolve();
    });
  });
}

if (require.main === module){
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};