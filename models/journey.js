var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var deepPopulate = require('mongoose-deep-populate')(mongoose);
var journeySchema = Schema({
    name: String,
    startDate:Date,
    endDate:Date,
    journeyVehicles: [{ type: Schema.Types.ObjectId, ref: 'JourneyVehicle' }],
    persons: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    vehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }]
    });
journeySchema.plugin(deepPopulate);

var Journey = mongoose.model('Journey', journeySchema);

module.exports = {
    Journey: Journey
};