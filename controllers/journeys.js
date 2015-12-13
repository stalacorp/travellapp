var express = require('express');
var router = express.Router();
var Journey = require("../models/journey").Journey;
var Person = require("../models/person").Person;
var Vehicle = require("../models/vehicle").Vehicle;
var mongoose = require("mongoose");

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
                    fontSize: 19,
                    margin: [0, 0, 0, 10]
                },
                subHeader: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                subText: {
                    fontSize: 14,
                    bold: false,
                    margin: [0, 0, 0, 10]
                }
            }
        };


        journey.vehicles.forEach(function(v, index){
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

            // table
            var body = [[ '', { text: 'Nazwisko', style: 'tableHeader' }, { text: 'Adres', style: 'tableHeader' }, { text: 'Telefon', style: 'tableHeader' } ,{ text: 'Komentarz', style: 'tableHeader' }]];

            body.push([{text: 'Kierowca 1', style: 'tableHeader'}, v.owner.fullname, v.owner.street + ' ' + v.owner.streetnumber + ', ' + v.owner.city + ' ' + v.owner.postalcode, v.owner.telephone ,'' ]);

            v.passengers.forEach(function(p){                
                if (p.canDrive){
                    body.push([{text: 'Kierowca 2', style: 'tableHeader'}, p.fullname, p.street + ' ' + p.streetnumber + ', ' + p.city + ' ' + p.postalcode, p.telephone , p.remark ]);
                }else {
                    body.push([{text: 'Pasażer', style: 'tableHeader'}, p.fullname, p.street + ' ' + p.streetnumber + ', ' + p.city + ' ' + p.postalcode, p.telephone, p.remark ]);
                }

            });
            var pageBreak = 'after';
            if (index === journey.vehicles.length - 1){
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