const path = require('path');
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, './env/.env') });
const fs = require('fs/promises');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const logger = require('../log/logger');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.resolve(__dirname, '../env/token.json');
const CREDENTIALS_PATH = path.resolve(__dirname, '../env/credentials.json');

const loadSavedCredentials = async () => {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (error) {
		return null;
	};
};

const saveCredentials = async (client) => {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: 'authorized_user',
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
};

const authorizeGoogle = async () => {
	let client = await loadSavedCredentials();
	if (client) {
		return client;
	};
	client = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (client.credentials) {
		await saveCredentials(client);
	};
	return client;
};

const fetchGoogleSheetsValue = async (auth, spreadsheetId, range) => {
	const sheets = google.sheets({ version: 'v4', auth });
	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: spreadsheetId,
			range: range,
		});
		return response;
	} catch (error) {
		//TODO: handling exception
		logger.error(error.message);
		throw error;
	};
};

const addGoogleSheetsValue = async (auth, row, value) => {
	const sheets = google.sheets({ version: 'v4', auth})
	const targetCell = `Договора 2023!AF${row}`;
	try {
		response = await sheets.spreadsheets.values.update({
			spreadsheetId: process.env.CONTRACTS_SPREADSHEET,
			range: targetCell,
			valueInputOption: 'USER_ENTERED',
			resource: {
				values: [[value]]
			},
			includeValuesInResponse: true,
		});
		logger.info(`Link recorded in ${response.data.updatedRange}`);
		return response;
	} catch (error) {
		logger.error('Error recording link', error)
	}
};

const sendGmailMessage = async (src, dst, sub, msg, callback) => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'login',
			user: process.env.GMAIL_USER,
			pass: process.env.GMAIL_PASS,
		},
		tls: {
			rejectUnauthorized: false,
		}
	});

	const mailOptions = {
		from: `Баланс-Информ <${src}>`,
		to: dst,
		subject: sub,
		html: msg
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		logger.info('Email sent:', info.response)
		if (typeof callback === 'function') {
			callback();
		};
	} catch (error) {
		logger.error('Error sending email:', error);
	};
};

module.exports = { authorizeGoogle, fetchGoogleSheetsValue, sendGmailMessage, addGoogleSheetsValue };