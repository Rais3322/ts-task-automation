const mongoose = require('mongoose');
const logger = require('../log/logger');

const connectDB = async (db_path) => {
	try {
		mongoose.connect(db_path, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		logger.info('DB connected');
	} catch (error) {
		logger.error('Error connecting DB:', error);
	};
};

const disconnectDB = async () => {
	try {
		mongoose.disconnect();
		logger.info('DB disconnected');
	} catch (error) {
		logger.error('Error disconnecting DB:', error);
	};
};

const addRecord = async (model, record, key, callback) => {
	if (key !== undefined) {
		const existingRecord = await model.findOne({ [key]: record[key] });
		if (!existingRecord) {
			if (typeof callback === 'function') {
				callback();
			};
			await model.create(record);
		};
	} else {
		const existingRecord = await model.findOne(record);
		if (!existingRecord) {
			if (typeof callback === 'function') {
				callback();
			};
			await model.create(record);
		};
	};
};

const updateRecord = async (model, record, key) => {
	await model.updateOne({ [key]: record[key] }, { $set: record });
};

const retrieveRecord = async (model, key, criteria) => {
	let result;
	if ((key !== undefined) && (criteria !== undefined)) {
		result = await model.find({ [key]: [criteria] })
	} else {
		result = await model.find();
	};
	return result;
};

module.exports = { connectDB, disconnectDB, addRecord, updateRecord, retrieveRecord };