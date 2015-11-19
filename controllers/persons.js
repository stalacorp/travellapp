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

// routes

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

router.post('/excel/upload', multipartyMiddleware, function(req, res){
    var timeout = 200;
    var teller = 0;
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

  var file = req.files.file;
  var workbook = XLSX.readFile(file.path);
    var first_sheet_name = workbook.SheetNames[0];
    var sheet = workbook.Sheets[first_sheet_name] ;
    var max = 0;
    for (z in sheet) {
        /* all keys that do not begin with "!" correspond to cell addresses */
        if(z[0] === '!') continue;
        var rowcount = Number(z.substr(1, z.length - 1));
        if (rowcount > max){
            max = rowcount;
        }
    }

    for (var i=3;i<= max;i++) {
        if (sheet['B' + i] !== undefined) {
            var person = new Person();
            person.lastname = sheet['B' + i].v;
            person.firstname = sheet['C' + i].v;
            person.city = sheet['D' + i].v;
            person.postalcode = sheet['E' + i].v;
            person.street = sheet['F' + i].v;
            person.streetnumber = sheet['G' + i].v;

            var canDrive = sheet['H' + i];

            if (canDrive !== undefined && canDrive.v.toLowerCase() === 'x') {
                person.canDrive = true;
            }

            var licence = sheet['I' + i];
            var passengers = sheet['J' + i];

            if (licence !== undefined && passengers !== undefined && licence.v !== '' && passengers.v != '') {
                var vehicle = new Vehicle();
                vehicle.owner = person;
                vehicle.licenceplate = licence.v;
                vehicle.passengers = passengers.v;

                vehicle.save(function (err) {
                    if (err) return console.error(err);
                });

                person.vehicle = vehicle;
            } else {
                person.vehicle = null;
            }

            getPersonGeo(person);


        }
    }

  console.log(file.name);
  console.log(file.path);
  fs.unlinkSync(file.path);
});

module.exports = router;
