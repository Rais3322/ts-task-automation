const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: path.resolve(__dirname, './error.log'), level: 'error' }),
		new winston.transports.File({ filename: path.resolve(__dirname, './combined.log') })
	],
});

module.exports = logger;