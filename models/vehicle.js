var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var vehicleSchema = Schema({
    licenceplate: {type: String, index: {unique:true, dropDups: true}} ,
    passengersNr: Number,
    owner: {type: Schema.Types.ObjectId, ref: 'Person', default:null},
    passengers: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    brand: {type: String, default:'Renault'},
    type: {type: String, default:'Diesel'},
    duration: {type:Number, default:0},
    distance: {type:Number, default:0}
    });

var Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = {
    Vehicle: Vehicle
};