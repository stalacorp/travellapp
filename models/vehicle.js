var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var vehicleSchema = Schema({
    licenceplate: {type: String, index: {unique:true, dropDups: true}} ,
    passengers: Number,
    owner: {type: Schema.Types.ObjectId, ref: 'Person'}
    });


var Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = {
    Vehicle: Vehicle
};