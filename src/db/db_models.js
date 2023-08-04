const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const TSSchema = new Schema({
	id: ObjectId,
	uniqueField: { type: String, unique: true },
	system: String,
	project: String,
	district: String,
	orgName: String,
	ITN: Number,
	contractNumber: String,
	deadline: Date,
	taskLink: String,
});

const TSContract = mongoose.model("TSContract", TSSchema);

module.exports = { TSContract };