var express = require('express');
var router = express.Router();
var Vehicle = require("../models/vehicle").Vehicle;
var Person = require("../models/person").Person;

router.get('/all', function(req, res) {

    Person.find({isActive: true}, {_id: 1}, function(err, docs) {

        var ids = docs.map(function(doc) { return doc._id; });

        Vehicle.find({owner: {$in: ids}}, function(err, vehicles) {
            if (err) return console.error(err);
            res.json(vehicles);
        });
    });
});
router.put('/:id', function(req, res){
    Vehicle.findOneAndUpdate({_id:req.params.id},{$set: {licenceplate: req.body.licenceplate, type: req.body.type, brand: req.body.brand, passengersNr:req.body.passengersNr}}).exec();
    res.status(201);
});

router.delete('/:id', function(req, res){
    Vehicle.findOne({_id:req.params.id}).remove().exec();
    Person.findOneAndUpdate({vehicle: req.params.id},{$set: {vehicle:null}}).exec();
    res.status(201);
});

module.exports = router;