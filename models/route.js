var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var routeVehicleSchema = require('routeVehicle').routeVehicleSchema;
var routeSchema = Schema({
    name: String,
    startDate:Date,
    endDate:Date,
    routeVehicles: [routeVehicleSchema]
    });

var Route = mongoose.model('Route', routeSchema);

module.exports = {
    Route: Route
};