var express = require('express');
var router = express.Router();
var Journey = require("../models/journey").Journey;
var Person = require("../models/person").Person;
var Vehicle = require("../models/vehicle").Vehicle;

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
    Journey.findOne({_id:req.params.id}).deepPopulate('vehicles.owner vehicles.passengers persons').exec(function(err, obj){
        if (err) return console.error(err);
        res.json(obj);
    });
});

router.post('/updateVehicle', function(req, res){
    Vehicle.findOne({_id:req.body._id}).exec(function(err, veh){
        if (err) return console.error(err);
        if (veh.owner != null){
            Person.findOne({_id:veh.owner}).exec(function(err, pers){
                if (err) return console.error(err);
                pers.vehicle = null;
                pers.save();
            });
        }

        veh.owner = req.body.owner;
        veh.save();

    });
    Person.findOne({_id:req.body.owner}).exec(function(err, pers){
        pers.vehicle = req.body._id;
        pers.save();
    });
    res.status(201);
    res.send('success');
});

router.post('/addPassenger', function(req, res){
    Person.findOne({_id:req.body._id}).exec(function(err, pers){
        if (err) return console.error(err);
        pers.isPas = true;
        pers.save();
        Vehicle.findOne({_id:req.body.vehicle}).exec(function(err, veh){
            if (err) return console.error(err);
            veh.passengers.push(pers);
            veh.save();
        });
    });
    res.status(201);
    res.send('success');
});

router.post('/addVehicle', function(req, res){
    Journey.findOne({_id:req.body.journeyId}).populate('vehicles').exec(function(err, journey){
        if (err) return console.error(err);
        var vehicle = new Vehicle;

        vehicle.licenceplate = req.body.licenceplate;
        vehicle.passengersNr = req.body.passengersNr;
        vehicle.type = req.body.type;
        vehicle.merk = req.body.merk;
        vehicle.save(function (err, obj) {
            if (err) return console.error(err);
            res.json(obj);
        });

        journey.vehicles.push(vehicle);
        journey.save();

    });

});

module.exports = router;