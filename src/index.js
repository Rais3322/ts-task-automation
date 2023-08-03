const path = require('path');
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, './env/.env') });
const parse = require('./helpers/parse_helper');
const logger = require('./log/logger');
const { authorizeGoogle, fetchGoogleSheetsValue } = require('./helpers/google_helper');

const PARSE_TS_CONTRACTS = 'parseTSContracts';

const parseData = async (rawResponse, parseType) => {
	const rawValues = rawResponse.data.values;
	const parsedValues = [];
	for (const rawValue of rawValues) {
		const parsedValue = await parse[parseType](rawValue);
		parsedValues.push(parsedValue);
	};

	return parsedValues;
};

const filterContracts = async (contracts) => {
	const filtered = contracts.filter((contract) => {
		const { system, project, district, orgName, ITN, contractNumber, deadline, taskLink } = contract
		const isTSContract = project === 'ТП СЗИ';
		const hasRequiredFields = (system && district && orgName && ITN && contractNumber && deadline);
		const isMissingTask = !taskLink;

		return isTSContract && hasRequiredFields && isMissingTask;
	});

	return filtered;
};

const main = async () => {
	const googleClient = await authorizeGoogle();

	const fetchedContracts = await fetchGoogleSheetsValue(
		googleClient,
		process.env.CONTRACTS_SPREADSHEET,
		process.env.CONTRACTS_RANGE,
	)

	const parsedContracts = await parseData(fetchedContracts, PARSE_TS_CONTRACTS);
	
	const TSContracts = await filterContracts(parsedContracts);

	console.log(TSContracts);
};

main();