'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const puppiesSchema = mongoose.Schema({
  created: {
    type: Date, default: Date.now
  },
  photo: {
    type: String, 
    required: true
  },
  name: {
    type: String, 
    required: true
  },
  gender: String,
  age: String,
  size: String,
  training: String,
  characteristics: String,
  compatibility: String,
  biography: String,
  adoptionFee: String,
  shelterId: {
  	type: mongoose.Schema.ObjectId, ref: 'Shelter'
  },
  distance: String
});

const Puppies = mongoose.model('Puppy', puppiesSchema);

module.exports = {Puppies};