'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const {Adopters} = require('../models/adopters.model');
const {Puppies} = require('../models/puppies.model');
const {Shelters} = require('../models/shelters.model');
const {Users} = require('../models/users.model');


// ADOPTERS

// find adopters
router.get('/adopters', (req, res) => {
	Adopters.find().then(_Adopters => res.json(
		_Adopters.map(adopter => adopter)
	))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'})
	});
});

// find adopter by id
router.get('/adopters/:id', (req, res) => {
	return Users
	.findById(req.params.id)
	.exec().then(data => {
		Adopters
		.findById(data.adopterId)
		.populate('favoritePuppies')
		.then(adopter =>res.json(adopter))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'})
		});
	});
});

// create adopter
router.post('/adopters', (req, res) => {
	const requiredFields = ['location', 'discoverySettings', 'favoritePuppies'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`
			console.error(message);
			return res.status(400).send(message);
		}
	}
	Adopters.create({
		name: req.body.name,
		location: req.body.location,
		discoverySettings: req.body.discoverySettings,
		favoritePuppies: req.body.favoritePuppies
	})
	.then(adopter => res.status(201).json(adopter))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'});
	});
});

// update adopter by id
router.put('/adopters/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = (
			`Request path id (${req.params.id}) and request body id ` +
			`(${req.body.id}) must match`);
		console.error(message);
		return res.status(400).json({message: message});
	}
	const toUpdate = {};
	const updateableFields = ['location', 'discoverySettings', 'favoritePuppies'];
	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	Adopters.findByIdAndUpdate(req.params.id, {$set: toUpdate})
	.then(adopter => res.status(204).send(adopter))
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// delete adopter by id
router.delete('/adopters/:id', (req, res) => {
	Adopters.findByIdAndRemove(req.params.id)
	.then(() => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});


// PUPPIES

// get initial puppies
router.get('/puppies/:userId/:position', (req, res) => { 
	const allOfThePuppies = Puppies.find().count().exec();
	return Adopters.findById(req.params.userId).exec()
	.then((favoritedPuppies) => {
		return Puppies
		.find()
		.populate('shelterId')
		.limit(~~req.params.position === 0 ? 2 : 1)
		.skip(~~req.params.position)
		.exec()
		.then(data => {
			if(!data[0]) {
				return res.status(416).json({});
			}
			for(let i=0; i<favoritedPuppies.favoritePuppies.length; i++){
				if(String(favoritedPuppies.favoritePuppies[i]) == String(data[0]._id)){
					return res.status(303).json(data);
				}
			}
			data.push({nextPosition: ~~req.params.position + (~~req.params.position === 0) ? 2 : 1});
			return res.status(203).json(data);
		});	
	});
});

// load hidden puppy
router.post('/puppies/:position', (req, res) => {
	Puppies.find().count().exec().then(data => {
		console.log(data);
		
		const allOfThePuppies = data;

		let currentPosition = ~~req.params.position;
		console.log(currentPosition, allOfThePuppies);
		if(currentPosition >= allOfThePuppies -1){
			currentPosition = 0;
		}
		return Puppies
		.find()
		.populate('shelterId')
		.limit(1)
		.skip(currentPosition)
		.exec()
		.then(newData => {
			let data = [req.body, newData[0], {nextPosition: ++ currentPosition}];
			console.log(data);
			return res.status(203).json(data);
		});
	});
});

// favorite puppy
router.post('/favorite', (req, res) => {
	return Users
	.findById(req.body.userId)
	.exec().then(data => {
		Adopters
		.findByIdAndUpdate(data.adopterId, 
		{ 
			$addToSet:{'favoritePuppies' : req.body.puppyId}
		}, 
		{
			safe: true, 
			upsert: true, 
			new : true
		})
		.exec()
		.then(data => {
			res.status(206).json(data);
		});
	});
})

// find puppy by value
router.get('/puppies', (req, res) => {
	const filters = {};
	const queryableFields = ['gender', 'age', 'size', 'distance'];
	queryableFields.forEach(field => {
		if (req.query[field]) {
			filters[field] = req.query[field];
		}
	});
	Puppies.find(filters)
	.then(_Puppies => res.json(_Puppies.map(puppy => puppy)))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'})
	});
});

// create puppy
router.post('/puppies', (req, res) => {
	Puppies.create({
		photo: req.body.puppyJSON.photo,
		name: req.body.puppyJSON.name,
		gender: req.body.puppyJSON.gender,
		age: req.body.puppyJSON.age,
		size: req.body.puppyJSON.size,
		training: req.body.puppyJSON.training,
		characteristics: req.body.puppyJSON.characteristics,
		compatibility: req.body.puppyJSON.compatibility,
		biography: req.body.puppyJSON.biography,
		adoptionFee: req.body.puppyJSON.adoptionFee,
		shelterId: req.body.shelterId,
		distance: req.body.distance
	})
	.then(puppy => {
		return Shelters.findByIdAndUpdate(req.body.shelterId, 
		{ 
			$addToSet:{'adoptabullPuppies': puppy._id}
		}, 
		{
			safe: true, 
			upsert: true, 
			new : true
		}).exec().then(() => {
			return res.status(201).json(puppy)
		});
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'});
	});
});

// update puppy by id
router.put('/puppies/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = (
			`Request path id (${req.params.id}) and request body id ` +
			`(${req.body.id}) must match`);
		console.error(message);
		return res.status(400).json({message: message});
	}
	const toUpdate = {};
	const updateableFields = ['photo', 'name', 'gender', 'age', 'size', 'training', 'characteristics', 'compatibility', 'biography', 'adoptionFee', 'distance'];
	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	Puppies.findByIdAndUpdate(req.params.id, {$set: toUpdate})
	.then(puppy => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// delete puppy by id
router.delete('/puppies/:id', (req, res) => {
	Puppies.findByIdAndRemove(req.params.id)
	.then(() => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});


// SHELTERS

// find shelters
router.get('/shelters', (req, res) => {
	Shelters.find().then(_Shelters => res.json(
		_Shelters.map(shelter => shelter)
	))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'})
	});
});

// find shelter by id
router.get('/shelters/:id', (req, res) => {
	return Shelters
	.findById(req.params.id)
	.populate('adoptabullPuppies')
	.exec()
	.then(shelter => {
		return res.status(200).json(shelter)
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'})
	});
});

// find shelter by value
router.get('/shelters', (req, res) => {
	const filters = {};
	const queryableFields = ['zipcode'];
	queryableFields.forEach(field => {
		if (req.query[field]) {
			filters[field] = req.query[field];
		}
	});
	Shelters.find(filters)
	.then(_Shelters => res.json(_Shelters.map(shelter => shelter)))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'})
	});
});

// create shelter
router.post('/shelters', (req, res) => {
	// const requiredFields = ['name', 'address', 'phone', 'email'];
	// for (let i=0; i<requiredFields.length; i++) {
	// 	const field = requiredFields[i];
	// 	if (!(field in req.body)) {
	// 		const message = `Missing \`${field}\` in request body`
	// 		console.error(message);
	// 		return res.status(400).send(message);
	// 	}
	// }
	console.log(req.body);
	Shelters.create({
		name: req.body.name,
		address: {
			number: req.body.number,
			street: req.body.street,
			city: req.body.city,
			state: req.body.state,
			zipcode: req.body.zipcode
		},
		phone: req.body.phone,
		email: req.body.email
	})
	.then(shelter => res.status(201).json(shelter))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'});
	});
});

// update shelter by id
router.put('/shelters/:id', (req, res) => {
	let toUpdate = { address: {} };
	const updateableFields = ['name', 'number', 'street', 'city', 'state', 'zipcode', 'phone', 'email', 'adoptabullPuppies'];
	updateableFields.forEach(field => {
		if (field in req.body.shelterProfileJSON) {
			toUpdate[field] = req.body.shelterProfileJSON[field];
			toUpdate.address[field] = req.body.shelterProfileJSON[field];
		}
	});
	Shelters.findByIdAndUpdate(req.params.id, {$set: toUpdate})
	.exec()
	.then(shelter => {
		return res.status(201).json(shelter)
	})
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// delete shelter by id
router.delete('/shelters/:id', (req, res) => {
	Shelters.findByIdAndRemove(req.params.id)
	.then(() => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});

module.exports = router;