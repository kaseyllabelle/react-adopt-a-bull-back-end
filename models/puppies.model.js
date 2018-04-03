'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const puppiesSchema = mongoose.Schema({
  created: {
    type: Date, default: Date.now
  },
  photo: String,
  name: String,
  gender: String,
  age: String,
  size: String,
  training: String,
  characteristics: [{type: String}],
  compatibility: [{type: String}],
  biography: String,
  adoptionFee: String,
  shelterId: {
  	type: mongoose.Schema.ObjectId, ref: 'Shelter'
  },
  distance: String
});

const Puppies = mongoose.model('Puppy', puppiesSchema);

module.exports = {Puppies};