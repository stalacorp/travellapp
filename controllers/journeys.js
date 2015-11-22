var express = require('express');
var router = express.Router();
var Journey = require("../models/journey").Journey;
var Person = require("../models/person").Person;
var Vehicle = require("../models/vehicle").Vehicle;
var journey;

router.get('/allActive', function(req, res) {

    Journey.find({startDate: {$gt: new Date()}}, function(err, objs) {
        if (err) return console.error(err);
        res.json(objs);
    });
});

router.get('/allHistory', function(req, res) {
    Journey.find({startDate: {$lt: new Date()}}, function(err, objs) {
        if (err) return console.error(err);
        res.json(objs);
    });
});

router.post('/', function(req, res){
    var journey = new Journey();
    journey.name = req.body.name;
    journey.startDate = req.body.startDate;
    journey.endDate = req.body.endDate;
    journey.save(function (err) {
        if (err) return console.error(err);
    });
    res.json(journey);
});

router.get('/:id', function(req, res) {
    Journey.findOne({_id:req.params.id}).populate('vehicles').populate('owner').populate('persons').populate('vehicle').exec(function(err, obj){
        if (err) return console.error(err);
        res.json(obj);
        journey = obj;
    });
});

router.post('/', function(req, res){
    var vehicle = new Vehicle;
    vehicle.licenceplate = req.body.licenceplate;
    vehicle.passengers = req.body.passengers;
    vehicle.type = req.body.type;
    vehicle.merk = req.body.merk;
    vehicle.owner = req.body.ownerId;
    vehicle.save(function (err) {
        if (err) return console.error(err);
    });
    journey.vehicles.push(vehicle);
    journey.save(function (err) {
        if (err) return console.error(err);
    });
});

module.exports = router;