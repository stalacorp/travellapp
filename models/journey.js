var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var journeySchema = Schema({
    name: String,
    startDate:Date,
    endDate:Date,
    journeyVehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],
    persons: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
    });

var Journey = mongoose.model('Journey', journeySchema);

module.exports = {
    Journey: Journey
};