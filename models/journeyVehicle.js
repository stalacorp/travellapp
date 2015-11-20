var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var personSchema = require('person').personSchema;
var journeyVehicleSchema = Schema({
    vehicle: {type: Schema.Types.ObjectId, ref: 'Vehicle'},
    driver: {type: Schema.Types.ObjectId, ref: 'Person'},
    passengers: [personSchema]
    });

var JourneyVehicle = mongoose.model('JourneyVehicle', journeyVehicleSchema);

module.exports = {
    journeyVehicleSchema: journeyVehicleSchema
};

module.exports = {
    JourneyVehicle: JourneyVehicle
};