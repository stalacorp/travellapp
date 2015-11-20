var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var journeyVehicleSchema = Schema({
    vehicle: {type: Schema.Types.ObjectId, ref: 'Vehicle'},
    driver: {type: Schema.Types.ObjectId, ref: 'Person'},
    passengers: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
    });

var JourneyVehicle = mongoose.model('JourneyVehicle', journeyVehicleSchema);

module.exports = {
    JourneyVehicle: JourneyVehicle
};