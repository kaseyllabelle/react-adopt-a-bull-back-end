'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const passport = require('passport');

const router = express.Router();

const {Users} = require('../models/users.model');
const {Adopters} = require('../models/adopters.model');
const {Shelters} = require('../models/shelters.model');
const {JWT_SECRET, JWT_EXPIRY} = require('../config');

// add user
router.post('/', (req, res) => {
  const newUser = {
  	email: req.body.email,
  	password: req.body.password,
    shelterId: (req.body['user-type'] === 'shelter') ? new mongoose.Types.ObjectId() : null,
    adopterId: (req.body['user-type'] === 'adopter') ? new mongoose.Types.ObjectId() : null
  };
  console.log(newUser);
  return Users.find({email: newUser.email})
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'account already exists',
          location: 'email'
        });
      }
      return Users.hashPassword(newUser.password);
    })
    .then(hash => {
      return Users.create({
        email: newUser.email,
        password: hash,
        shelterId: newUser.shelterId,
        adopterId: newUser.adopterId
      });
    })
    .then(user => {
      if(newUser.shelterId){
        Shelters.create({_id:newUser.shelterId, _creator: user._id});
      }
      else{
        Adopters.create({_id:newUser.adopterId, _creator: user._id});
      }
      return res.sendStatus(201);
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: err});
    });
});

const createAuthToken = function(user) {
  console.log(user);
  return jwt.sign({user}, JWT_SECRET, {
    subject: user,
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', {session: false});

console.log(localAuth);
console.log(passport.authenticate);

router.post('/sign-in/', (req, res) => {
  console.log(req.body);
  let user;
  Users.findOne({email: req.body.email})
  .then(_user => {
    user = _user;
    if (!user) {
      return Promise.reject({
        reason: 'LoginError',
        message: 'Incorrect email or password'
      });
    }
    return user.validatePassword(req.body.password);
  })
  .then(isValid => {
    if (!isValid) {
      return Promise.reject({
        reason: 'LoginError',
        message: 'Incorrect email or password'
      });
    }
    const authToken = createAuthToken(req.body.email);
    console.log(authToken);
    res.json({authToken, user});
  })
  .catch(err => {
    if (err.reason === 'LoginError') {
      console.log(null, false, err);
      res.sendStatus(403);
      // update error messaging
    }
    return console.log(err, false);
  });
});

const jwtAuth = passport.authenticate('jwt', {session: false});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

// get user
router.get('/:userId', (req, res) => {
  Users.findById(req.params.userId).exec().then(userData => {
    res.status(200).json(userData);
  });
});

// reset password
router.patch('/:userId', (req, res) => {
  console.log(req.params.userId, req.body);
  Users.findById(req.params.userId).exec()
  .then(_user => {
    console.log(_user);
    const user = _user;
    if (!user) {
      return Promise.reject({
        reason: 'LoginError',
        message: 'Incorrect email or password'
      });
    }
    return user.validatePassword(req.body.oldPassword);
  }).then(userData => {    
    return Users.hashPassword(req.body.newPassword);
  }).then(hash => {
    return Users.findByIdAndUpdate(req.params.userId, {password: hash}).exec()
    .then(() => {
      res.sendStatus(200);
    });
  }).catch(error => {
    console.log(error);
  })
});

// deactivate account
router.delete('/:userId', (req, res) => {
  return Users.findById(req.params.userId).remove().then(userData => {
    res.sendStatus(200);
  });
});

module.exports = router;