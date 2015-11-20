var express = require('express');
var router = express.Router();
var Journey = require("../models/journey").Journey;


router.get('/allActive', function(req, res) {

    Journey.find({startdate: {$gt: new Date()}}, function(err, objs) {
        if (err) return console.error(err);
        res.json(objs);
    });
});

router.get('/allHistory', function(req, res) {
    Journey.find({startdate: {$lt: new Date()}}, function(err, objs) {
        if (err) return console.error(err);
        res.json(objs);
    });
});

module.exports = router;