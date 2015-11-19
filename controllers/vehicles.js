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

module.exports = router;