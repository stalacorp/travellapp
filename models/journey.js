var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var journeyVehicleSchema = require('journeyVehicle').journeyVehicleSchema;
var personSchema = require('person').personSchema;
var journeySchema = Schema({
    name: String,
    startDate:Date,
    endDate:Date,
    journeyVehicles: [journeyVehicleSchema],
    persons: [personSchema]
    });

var Journey = mongoose.model('Journey', journeySchema);

module.exports = {
    Journey: Journey
};