'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const usersSchema = mongoose.Schema({
  created: {
  	type: Date, default: Date.now
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  shelterId: {
  	type: mongoose.Schema.ObjectId, ref: 'Shelter'
  },
  adopterId: {
  	type: mongoose.Schema.ObjectId, ref: 'Adopter'
  }, 
  active: {
    type: Boolean,
    default: true
  }
});

usersSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

usersSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const Users = mongoose.model('User', usersSchema);

module.exports = {Users};