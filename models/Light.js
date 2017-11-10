var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LightSchema = new Schema({
	name: String,
	channel: String,
	state: String
});

module.exports = mongoose.model('Light', LightSchema);