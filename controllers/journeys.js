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

router.get('/all', function(req, res) {
    Journey.find(function(err, objs) {
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

router.post('/removePassenger', function(req, res){
    Vehicle.findOne({_id:req.body.vehicleId}).exec(function(err, v){
        if (err) return console.error(err);
        v.passengers.forEach(function(p,index,array){
            if (p == req.body.personId){
                array.splice(index, 1);
                Person.findOneAndUpdate({_id:req.body.personId},{$set: {isPas: false}}).exec();
            }
        });
        v.save();
    });
    res.status(201);
    res.send('success');
});

router.post('/updatePassengers', function(req, res){
    Vehicle.findOne({_id:req.body.vehicleId}).exec(function(err, v){
        if (err) return console.error(err)
        if (v.passengers.length > req.body.passengers.length){
            v.passengers.forEach(function(pas){
                if (req.body.passengers.indexOf(pas) === -1){
                    Person.findOneAndUpdate({_id:pas},{$set: {isPas: false}}).exec();
                }
            });
        }

        if (v.passengers.length < req.body.passengers.length){
            req.body.passengers.forEach(function(pas){
                if (v.passengers.indexOf(pas) === -1){
                    Person.findOneAndUpdate({_id:pas},{$set: {isPas: true}}).exec();
                }
            });
        }
        //v.passengers.forEach(function(pas){
        //    Person.findOneAndUpdate({_id:pas},{$set: {isPas: false}}).exec();
        //});
        //req.body.passengers.forEach(function(pas){
        //    Person.findOneAndUpdate({_id:pas},{$set: {isPas: true}}).exec();
        //});

        v.passengers = req.body.passengers;
        v.distance = req.body.distance;
        v.duration = req.body.duration;
        v.save();
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

router.post('/importVehicles', function(req, res){
    Journey.findOne({_id:req.body.currentJourneyId}).deepPopulate('vehicles persons vehicles.owner').exec(function(err, cj){
        if (err) return console.error(err);
        Journey.findOne({_id:req.body.importJourneyId}).deepPopulate('vehicles vehicles.owner').exec(function(error, ij){
            if (error) return console.error(error);
            ij.vehicles.forEach(function(v){
                if (cj.vehicles.map(function (e) {
                        return e.licenceplate
                    }).indexOf(v.licenceplate) === -1){
                    var teller = 0;
                    v.passengers = [];

                    cj.persons.forEach(function(p){
                        if (p.firstname == v.owner.firstname && p.lastname == v.owner.lastname && p.street == v.owner.street && p.streetnumber == v.owner.streetnumber){
                            teller++;
                            v.owner = p;
                        }
                    });
                    if (teller !== 0){
                        v.owner = null;
                    }

                    var vehicle = new Vehicle();
                    vehicle.licenceplate = v.licenceplate;
                    vehicle.passengersNr = v.passengersNr;
                    vehicle.type = v.type;
                    vehicle.merk = v.merk;
                    vehicle.save(function(somerr){
                        if (somerr) return console.error(somerr);
                    });

                    cj.vehicles.push(vehicle);
                }
            });
            cj.save(function(){
                res.status(201);
                res.send('success');
            });
        });

    });

});

module.exports = router;