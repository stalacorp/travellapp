var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var personSchema = require('person').personSchema;
var routeVehicleSchema = Schema({
    vehicle: {type: Schema.Types.ObjectId, ref: 'Vehicle'},
    driver: {type: Schema.Types.ObjectId, ref: 'Person'},
    passengers: [personSchema]
    });

var RouteVehicle = mongoose.model('RouteVehicle', routeVehicleSchema);

module.exports = {
    routeVehicleSchema: routeVehicleSchema
};

module.exports = {
    RouteVehicle: RouteVehicle
};