'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const characteristicsSchema = mongoose.Schema({
  type: String, // radio, checkbox, or input
  characteristic: String,
  values: [{type: String}] // array of strings
});

const Characteristics = mongoose.model('Characteristic', characteristicsSchema);

module.exports = {Characteristics};