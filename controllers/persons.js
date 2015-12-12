var express = require('express');
var router = express.Router();
var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();
var XLSX = require('xlsx');
var fs = require('fs');
var GoogleMapsAPI = require('googlemaps');

// google api

var publicConfig = {
    key: 'AIzaSyCJOLfo5eFbcn_lBz9i7YNzvgwTazgLdMU',
    stagger_time:       1000, // for elevationPath
    encode_polylines:   false,
    secure:             true // use https
};
var gmAPI = new GoogleMapsAPI(publicConfig);

// import models
var Person = require("../models/person").Person;
var Vehicle = require("../models/vehicle").Vehicle;
var Journey = require("../models/journey").Journey;

// journeys

router.get('/location', function(req, res) {
    var aantal = 0;
    var teller = 0;
    var timeout = 200;



    function getPersonGeo(person){
        setTimeout(function(){
            var geocodeParams = {
                "address": person.address,
                "language": "en"
            };
            gmAPI.geocode(geocodeParams, function (err, result) {
                if (typeof(result) !== 'undefined') {
                    var location = result.results[0].geometry.location;
                    person.location.lat = location.lat;
                    person.location.lng = location.lng;
                    person.save();
                    teller++;
                    console.log(teller);

                }else {
                    console.log(person.fullname);
                }
            });

        }, timeout);
        timeout += 200;
    }

    Person.find(function (err, persons) {
        if (err) return console.error(err);
        aantal = persons.length;
        persons.forEach(function(person){
            getPersonGeo(person);
        });

    });
  res.end();
});

router.get('/all', function(req, res) {
    Person.find(function (err, persons) {
    if (err) return console.error(err);
    res.json(persons);

    });
});

router.put('/:id', function(req, res){
    Person.findOne({_id:req.params.id},function(err, p){
        p.firstname = req.body.firstname;
        p.lastname = req.body.lastname;
        p.postalcode = req.body.postalcode;
        p.city = req.body.city;
        p.street = req.body.street;
        p.streetnumber = req.body.streetnumber;
        p.telephone = req.body.telephone;
        p.province = req.body.province;
        p.canDrive = req.body.canDrive;
        if (p.postalcode !== req.body.postalcode || p.street !== req.body.street || p.streetnumber !== req.body.streetnumber){
            
            var geocodeParams = {
                "address": p.address,
                "language": "en"
            };

            gmAPI.geocode(geocodeParams, function (err, result) {
                if (result.status === 'OK') {
                    var location = result.results[0].geometry.location;
                    p.location.lat = location.lat;
                    p.location.lng = location.lng;
                    p.save();                    
                }else {
                    console.log(p.fullname);
                }
            });
        }

        p.save();

    });

    res.status(201);
    res.send('success');
});

router.post('/', function(req, res){
    var person = new Person();
    person.firstname = req.body.firstname;
    person.lastname = req.body.lastname;
    person.postalcode = req.body.postalcode;
    person.city = req.body.city;
    person.street = req.body.street;
    person.streetnumber = req.body.streetnumber;
    person.telephone = req.body.telephone;
    person.province = req.body.province;
    person.canDrive = req.body.canDrive;

    var geocodeParams = {
        "address": person.address,
        "language": "en"
    };

    gmAPI.geocode(geocodeParams, function (err, result) {
        if (result.status === 'OK') {
            var location = result.results[0].geometry.location;
            person.location.lat = location.lat;
            person.location.lng = location.lng;            
            
        }else {
            console.log(person.fullname);
        }
    });

    person.save();
    res.json(person);

    Journey.findOne({_id:req.body.journeyId}).exec(function(err, obj){
        if (err) return console.error(err);
        obj.persons.push(person);
        obj.save();
    });
    

});

router.put('/remark/:id', function(req, res){
    Person.findOneAndUpdate({_id:req.params.id},{$set: {remark: req.body.remark}}).exec();
    res.status(201);
    res.send('success');
});

router.post('/excel/upload', multipartyMiddleware, function(req, res){
    var timeout = 200;
    var teller = 0;
    var journey;
    var max = 0;
    var minMax = 5;

    function updateJourney(){
        journey.save();
    };

    Journey.findOne({_id:req.body.id}).populate('persons').exec(function(err, obj){
        if (err) return console.error(err);
        journey = obj;
    });

    function getPersonGeo(person){
        setTimeout(function(){
            var geocodeParams = {
                "address": person.address,
                "language": "en"
            };
            gmAPI.geocode(geocodeParams, function (err, result) {
                if (result.status === 'OK') {
                    var location = result.results[0].geometry.location;
                    person.location.lat = location.lat;
                    person.location.lng = location.lng;
                    person.save();
                    journey.persons.push(person);
                    console.log(teller);
                }else {
                    console.log(person.fullname);
                }
                teller++;
                if (teller == (max - minMax)){
                    updateJourney();
                }
            });

        }, timeout);
        timeout += 200;
    }

  var file = req.files.file;
    try {
        var workbook = XLSX.readFile(file.path);
        var first_sheet_name = workbook.SheetNames[0];
        var sheet = workbook.Sheets[first_sheet_name];

        for (z in sheet) {
            /* all keys that do not begin with "!" correspond to cell addresses */
            if (z[0] === '!') continue;
            var rowcount = Number(z.substr(1, z.length - 1));
            if (rowcount > max) {
                max = rowcount;
            }
        }
        res.json(max - minMax);
        for (var i = 6; i <= max; i++) {
            if (sheet['B' + i] !== undefined) {
                var person = new Person();
                person.lastname = sheet['B' + i].v;
                person.firstname = sheet['C' + i].v;
                person.province = sheet['D' + i].v;
                person.city = sheet['E' + i].v;
                person.postalcode = sheet['F' + i].v;
                person.street = sheet['G' + i].v;
                person.streetnumber = sheet['H' + i].v;
                person.telephone = sheet['I' + i].v;

                var canDrive = sheet['J' + i];

                if (canDrive !== undefined && canDrive.v.toLowerCase().indexOf('b') !== -1) {
                    person.canDrive = true;
                }

                //var licence = sheet['I' + i];
                //var passengers = sheet['J' + i];
                //
                //if (licence !== undefined && passengers !== undefined && licence.v !== '' && passengers.v != '') {
                //    var vehicle = new Vehicle();
                //    vehicle.owner = person;
                //    vehicle.licenceplate = licence.v;
                //    vehicle.passengers = passengers.v;
                //
                //    vehicle.save(function (err) {
                //        if (err) return console.error(err);
                //    });
                //
                //    person.vehicle = vehicle;
                //} else {
                //    person.vehicle = null;
                //}

                getPersonGeo(person);

            }
        }

        console.log(file.name);
        console.log(file.path);
        fs.unlinkSync(file.path);
    }catch(err){
        res.json(-1);
    }
});

module.exports = router;
