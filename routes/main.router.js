'use strict';

const express = require('express');
const router = express.Router();
const {Adopters} = require('../models/adopters.model');
const {Puppies} = require('../models/puppies.model');
const {Shelters} = require('../models/shelters.model');
const {Users} = require('../models/users.model');

router.get('/:id', (req, res) => {
	Users
	.findById(req.params.id)
	.populate('shelterId')
	// .populate('adoptabullPuppies')
	.populate('adopterId')
	// .populate('favoritePuppies')
	.exec()
	.then(data => {
		console.log(data);
		res.status(200).json(data);
	});
})

router.post('/adoptabull', (req, res) => {
	Users
	.findByIdAndUpdate(req.body.shelterId, {
		$push:{
			'adoptabullPuppies' : req.body.puppyId
		}
	})
})

module.exports = router;