var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
var personSchema = Schema({
    firstname: String ,
    lastname: String,
    streetnumber: String,
    street: String,
    city: String,
    postalcode: String,
    province: String,
    telephone: {type: String, default:''},
    location: {lat: Number, lng: Number},
    canDrive: {type: Boolean, default:false},
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', default:null },
    remark: {type: String, default:''},
    isPas: {type: Boolean, default:false},
    isValid: {type: Boolean, default:true}
});

var virtual = personSchema.virtual('fullname');
virtual.get(function () {
    return this.firstname + ' ' + this.lastname;
});

var virtual = personSchema.virtual('address');
virtual.get(function () {
    return this.street + " " + this.streetnumber + ", " + this.postalcode + " , Poland";
});

var Person = mongoose.model('Person', personSchema);

module.exports = {
    Person: Person
};