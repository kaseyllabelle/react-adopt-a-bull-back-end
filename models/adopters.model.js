'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const adoptersSchema = mongoose.Schema({
  location: String,
  discoverySettings: {
  	distance: String,
  	gender: String,
  	age: String,
  	size: String
  },
  _creator: {
    type: mongoose.Schema.ObjectId, 
    ref: 'User', 
    required: true
  },
  favoritePuppies: [{
  	type: mongoose.Schema.ObjectId, ref: 'Puppy'
  }]
});

const Adopters = mongoose.model('Adopter', adoptersSchema);

module.exports = {Adopters};