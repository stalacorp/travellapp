var express = require('express');
var router = express.Router();
var Journey = require("../models/journey").Journey;
var Person = require("../models/person").Person;
var Vehicle = require("../models/vehicle").Vehicle;
var mongoose = require("mongoose");

var GoogleMapsAPI = require('googlemaps');

// google api

var publicConfig = {
    key: 'AIzaSyCJOLfo5eFbcn_lBz9i7YNzvgwTazgLdMU',
    stagger_time:       1000, // for elevationPath
    encode_polylines:   false,
    secure:             true // use https
};
var gmAPI = new GoogleMapsAPI(publicConfig);

router.get('/allActive', function(req, res) {

    Journey.find({startDate: {$gt: new Date()}, isVisible:true}, function(err, objs) {
        if (err) return console.error(err);
        res.json(objs);
    });
});

router.get('/allHistory', function(req, res) {
    Journey.find({startDate: {$lt: new Date()}, isVisible:true}, function(err, objs) {
        if (err) return console.error(err);
        res.json(objs);
    });
});

router.put('/pdfText/:id', function(req, res){
    Journey.findOneAndUpdate({_id:req.params.id}, {$set: {pdfText: req.body.pdfText}}).exec();
    res.status(201);
    res.send('success');
});

router.put('/:id', function(req, res){
    Journey.findOneAndUpdate({_id:req.params.id}, {$set: {name: req.body.name, startDate: req.body.startDate}}).exec();
    res.status(201);
    res.send('success');
});

router.delete('/:id', function(req, res){
    Journey.findOneAndUpdate({_id:req.params.id}, {$set: {isVisible: false}}).exec();

    res.status(201);
    res.send('success');
});

router.get('/toPdf/:id', function(req, res) {

    Journey.findOne({_id:req.params.id}).deepPopulate('vehicles.owner vehicles.passengers persons').exec(function(err, journey){
        if (err) return console.error(err);

        var fonts = {
            Roboto: {
                normal: 'public/fonts/OpenSans-Regular.ttf',
                bold: 'public/fonts/OpenSans-Bold.ttf',
                italics: 'public/fonts/OpenSans-Italic.ttf',
                bolditalics: 'public/fonts/OpenSans-BoldItalic.ttf'
            }
        };

        var PdfPrinter = require('pdfmake/src/printer');
        var printer = new PdfPrinter(fonts);
        var fs = require('fs');

        var docDefinition = {
            content: [],
            pageOrientation: 'landscape',
            pageSize: 'A4',
            styles: {
                tableHeader: {
                    bold: true,
                    fontSize: 13,
                    color: 'black'
                },
                header: {
                    bold: true,
                    fontSize: 18,
                    margin: [0, 0, 0, 10]
                },
                subHeader: {
                    fontSize: 15,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                subText: {
                    fontSize: 14,
                    bold: false,
                    margin: [0, 0, 0, 10]
                },
                text: {
                    fontSize: 11,
                    bold: false,
                    margin: [0, 0, 0, 10]
                }
            }
        };

        var vehicles = journey.vehicles.filter(function(v){
            return v.owner;
        });


        vehicles.forEach(function(v, index){
            // header information

            var startDate = journey.startDate.getDate() + '-' + (journey.startDate.getMonth() + 1) + '-' + journey.startDate.getFullYear();
            //var endDate = journey.endDate.getDate() + '-' + (journey.endDate.getMonth() + 1) + '-' + journey.endDate.getFullYear();

            var date = new Date(v.duration * 1000);
            var hh = date.getUTCHours();
            var mm = date.getUTCMinutes();

            docDefinition.content.push({ text: journey.name + ' ' + startDate , style: 'header' });
            docDefinition.content.push({ text: v.licenceplate, style: 'subHeader' });
            docDefinition.content.push({ text: 'Marka: ' + v.brand, style: 'subText' });
            docDefinition.content.push({ text: 'Dystans: ' + (v.distance / 1000) + ' km', style: 'subText' });
            docDefinition.content.push({ text: 'Trwanie: ' + hh + ' h and ' + mm + ' min', style: 'subText' });

            docDefinition.content.push({ text: journey.pdfText, style: 'text' });

            // table
            var body = [[ '', { text: 'Nazwisko', style: 'tableHeader' }, { text: 'Adres', style: 'tableHeader' }, { text: 'Telefon', style: 'tableHeader' } ,{ text: 'Komentarz', style: 'tableHeader' }]];

            body.push([{text: 'Kierowca 1', style: 'tableHeader'}, v.owner.fullname, v.owner.street + ' ' + v.owner.streetnumber + ', ' + v.owner.city + ' ' + v.owner.postalcode, v.owner.telephone , v.owner.remark ]);

            v.passengers.forEach(function(p){
                if (p.canDrive){
                    body.push([{text: 'Kierowca backup', style: 'tableHeader'}, p.fullname, p.street + ' ' + p.streetnumber + ', ' + p.city + ' ' + p.postalcode, p.telephone , p.remark ]);
                }else {
                    body.push([{text: 'Pasażer', style: 'tableHeader'}, p.fullname, p.street + ' ' + p.streetnumber + ', ' + p.city + ' ' + p.postalcode, p.telephone, p.remark ]);
                }

            });
            var pageBreak = 'after';
            if (index === vehicles.length - 1){
                pageBreak = '';
            }
            docDefinition.content.push({table: {
                // headers are automatically repeated if the table spans over multiple pages
                // you can declare how many rows should be treated as headers
                headerRows: 1,
                widths: [ 100, 160, 200, 130 , '*' ],
                body: body
            },
                pageBreak:pageBreak});


        });


        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream('basics.pdf')).on('finish',function(){
            var file = fs.createReadStream('basics.pdf');
            var stat = fs.statSync('basics.pdf');
            var fileStartDate = journey.startDate.getDate() + '_' + (journey.startDate.getMonth() + 1) + '_' + journey.startDate.getFullYear();
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=' + journey.name + ' ' + fileStartDate + '.pdf');
            file.pipe(res);
        });
        pdfDoc.end();
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
    if (req.body.copyId !== 0){
        var persons = [];
        var vehicles = [];
        var personIds = [];

        Journey.findOne({_id:req.body.copyId}).deepPopulate('vehicles persons').exec(function(err, obj){
            if (err) return console.error(err);

            obj.persons.forEach(function(p, index, array){
                personIds.push(p._id);
                var person = new Person(p);
                person._id = mongoose.Types.ObjectId();
                person.isNew = true;
                person.save(function(err, pers){
                    if (err) return console.error(err);

                    if (index === array.length - 1) {
                        createVehicles();
                    }

                });
                persons.push(person);
            });

            function createVehicles(){
                obj.vehicles.forEach(function(v, theind, arr){

                    v.passengers.forEach(function(pas, index, array){

                        personIds.forEach(function(ps, ind){
                            if (ps.equals(pas)){
                                array[index] = persons[ind];

                            }
                        });

                    });


                    if (v.owner !== null){

                        personIds.forEach(function(ps, ind){
                            if (ps.equals(v.owner)){
                                v.owner = persons[ind];
                            }
                        });
                    }

                    var vehicle = new Vehicle(v);

                    vehicle._id = mongoose.Types.ObjectId();
                    vehicle.isNew = true;

                    vehicle.save(function(err, veh){
                        if (err) return console.error(err);

                        if (veh.owner !== null){
                            Person.findOne({_id:veh.owner}, function(err, p){
                                if (err) return console.error(err);

                                p.vehicle = veh._id;
                                p.save();
                            });
                        }


                        if (theind === arr.length - 1) {
                            createJourney();
                        }

                    });

                    vehicles.push(vehicle);

                });
            };

            function createJourney(){
                journey.persons = persons;
                journey.vehicles = vehicles;

                journey.name = req.body.name;
                journey.startDate = req.body.startDate;
                journey.save(function (err) {
                    if (err) return console.error(err);
                    res.json(journey);
                });

            }

        });

    }else {
        journey.name = req.body.name;
        journey.startDate = req.body.startDate;
        journey.save(function (err) {
            if (err) return console.error(err);
            res.json(journey);
        });
    }



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
        vehicle.brand = req.body.brand;
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
                    var vehicle = new Vehicle();
                    v.passengers = [];

                    cj.persons.forEach(function(p){
                        if (v.owner && p.firstname == v.owner.firstname && p.lastname == v.owner.lastname && p.street == v.owner.street && p.streetnumber == v.owner.streetnumber){
                            vehicle.owner = p;
                        }
                    });

                    vehicle.licenceplate = v.licenceplate;
                    vehicle.passengersNr = v.passengersNr;
                    vehicle.type = v.type;
                    vehicle.merk = v.merk;
                    vehicle.save(function(somerr, veh){
                        if (somerr) return console.error(somerr);
                        if (veh.owner){
                            Person.findOneAndUpdate({_id:veh.owner}, {$set: {vehicle: veh._id}}).exec();
                        }
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

router.get('/autoCalc/:id', function(req, res){

    var calcIndex = 0;

    Journey.findOne({_id:req.params.id}).deepPopulate('vehicles persons vehicles.owner').exec(function(err, journey) {
        if (err) return console.error(err);

        var vehicles = journey.vehicles.filter(function(v){
           return v.owner;
        });


        var interval = setInterval(function () {

            var v = vehicles[calcIndex];
            console.log(calcIndex);

            var directionsParams = {
                origin: {"lat": 50.9591399, "lng": 5.5050771},
                destination: {
                    lat: v.owner.location.lat,
                    lng: v.owner.location.lng
                },
                travelMode: "DRIVING"
            };
            gmAPI.directions(directionsParams, function (err, result) {
                console.log(err);
                console.log(result);
                if (result.status === "OK") {
                    var mocks = [];

                    result.results[0].routes[0].overview_path.forEach(function (path) {


                        journey.persons.forEach(function (p) {
                            if (!p.isPas && !p.vehicle) {

                                var distance = getDistanceFromLatLonInKm(path.lat(), path.lng(), p.location.lat, p.location.lng);

                                var mock = {};
                                mock.distance = distance;
                                mock.id = p._id;
                                if (distance < 70) {
                                    mocks.push(mock);
                                }

                            }

                        });
                    });


                    mocks.sort(by('distance'));

                    var uniques = [];
                    var teller = 0;
                    var drivers = 0;
                    var max = v.passengersNr - 2;
                    while (teller < max && teller < mocks.length) {
                        var mock = mocks[teller];
                        if (uniques.map(function (e) {
                                return e.id
                            }).indexOf(mock.id) === -1) {
                            var person = journey.persons[journey.persons.map(function (e) {
                                return e._id;
                            }).indexOf(mock.id)];

                            uniques.push(mock);
                        } else {
                            max++;
                        }
                        teller++;
                    }

                    var vehicleMock = {};
                    vehicleMock.passengers = [];

                    var points = [];
                    uniques.forEach(function (u) {
                        journey.persons.forEach(function (p, ind, arr) {
                            if (p._id === u.id) {

                                vehicleMock.passengers.push(p);
                                points.push({location: {lat: p.location.lat, lng: p.location.lng}, stopover: true});
                                arr[ind].isPas = true;
                                p.isPas = true;
                                p.save();
                            }
                        });
                    });

                    var directionsParams = {
                        origin: {lat: 50.9591399, lng: 5.5050771},
                        destination: {
                            lat: v.owner.location.lat,
                            lng: v.selectedVehicle.owner.location.lng
                        },
                        travelMode: "DRIVING",
                        waypoints: points,
                        optimizeWaypoints: true
                    };
                    gmAPI.directions(directionsParams, function (err, result) {

                        if (result.status === "OK") {

                            var distance = 0;
                            var seconds = 0;
                            result.results[0].routes[0].legs.forEach(function (l) {
                                distance += l.distance.value;
                                seconds += l.duration.value;
                            });

                            var newPassengers = [];
                            result.results[0].routes[0].waypoint_order.forEach(function (w) {
                                newPassengers.push(vehicleMock.passengers[w]);
                            });
                            vehicleMock.passengers = newPassengers;

                            var passengerIds = [];
                            vehicleMock.passengers.forEach(function (p) {
                                passengerIds.push(p._id);
                            });
                            var mock = {};


                            v.passengers = passengerIds;
                            v.duration = seconds;
                            v.distance = distance;


                            v.save(function(err, v){
                                if (calcIndex === journey.vehicles.length) {
                                    res.json('fak');
                                    clearInterval(interval);
                                }
                            });

                        }
                    });


                }
            });
            calcIndex++;

        }, 200);

    });

    var by = function (path, reverse, primer, then) {
        var get = function (obj, path) {
                if (path) {
                    path = path.split('.');
                    for (var i = 0, len = path.length - 1; i < len; i++) {
                        obj = obj[path[i]];
                    };
                    return obj[path[len]];
                }
                return obj;
            },
            prime = function (obj) {
                return primer ? primer(get(obj, path)) : get(obj, path);
            };

        return function (a, b) {
            var A = prime(a),
                B = prime(b);

            return (
                    (A < B) ? -1 :
                        (A > B) ?  1 :
                            (typeof then === 'function') ? then(a, b) : 0
                ) * [1,-1][+!!reverse];
        };
    };

    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

});


module.exports = router;