const path = require('path');
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, './env/.env') });
const parse = require('./helpers/parse_helper');
const logger = require('./log/logger');
const { TSContract } = require('./db/db_models');
const { authorizeGoogle, fetchGoogleSheetsValue, addGoogleSheetsValue } = require('./helpers/google_helper');
const { connectDB, disconnectDB, addRecord, updateRecord, retrieveRecord } = require('./helpers/db_helper');
const { authorizeNotion, createNotionPage } = require('./helpers/notion_helper');

const UNIQUE_FIELD = 'uniqueField';
const RECORD_CREATED = 'recordCreated';
const PARSE_TS_CONTRACTS = 'parseTSContracts';
const createdFlag = {
	recordCreated: true
}

const parseData = async (rawResponse, parseType) => {
	const rawValues = rawResponse.data.values;
	const parsedValues = [];
	for (const rawValue of rawValues) {
		if (rawValue[4]) {
			const parsedValue = await parse[parseType](rawValue);
			parsedValues.push(parsedValue);
		}
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

const handleTSContracts = async (googleClient, notionClient, contracts, contractsTable) => {
	for (const contract of contracts) {
		await addRecord(TSContract, contract, UNIQUE_FIELD, async () => {
			logger.info(`Contract № ${contract.contractNumber} added to DB`);
			contract.taskLink = await createNotionPage(notionClient, contract, async (taskLink) => {
				const contractRow = await findContractPosition(contractsTable, contract);
				await updateRecord(TSContract, createdFlag, RECORD_CREATED)
				const response = await addGoogleSheetsValue(googleClient, contractRow, taskLink);
			});
		});
	}
};

const postErrorHandling = async (googleClient, notionClient, contractsTable) => {
	const contracts = await retrieveRecord(TSContract)
	for (const contract of contracts) {
		if (contract[RECORD_CREATED] === false) {
			contract.taskLink = await createNotionPage(notionClient, contract, async (taskLink) => {
				const contractRow = await findContractPosition(contractsTable, contract);
				await updateRecord(TSContract, createdFlag, RECORD_CREATED)
				const response = await addGoogleSheetsValue(googleClient, contractRow, taskLink);
			});
		};
	};
}

const findContractPosition = async (rawValues, currentContract) => {
	let values = rawValues.data.values;
	for (let rowNumber = 0; rowNumber < values.length; rowNumber++) {
		const row = values[rowNumber];
		if (row[4]) {
			const hasCorrectSystem = row[0] === currentContract.system;
			const hasCorrectProject = row[1] === currentContract.project;
			const hasCorrectDistrict = row[2] === currentContract.district;
			const hasCorrectOrgName = row[3] === currentContract.orgName;
			const hasCorrectITN = row[4].slice(0, 10) === currentContract.ITN;
			const hasCorrectContractNumber = row[10] === currentContract.contractNumber;
			if (hasCorrectSystem && hasCorrectProject && hasCorrectDistrict && hasCorrectOrgName && hasCorrectITN && hasCorrectContractNumber) {
				return (rowNumber + 5);
			}
		}
	}
}

const main = async () => {
	const googleClient = await authorizeGoogle();
	const notionClient = await authorizeNotion();

	const fetchedContracts = await fetchGoogleSheetsValue(
		googleClient,
		process.env.CONTRACTS_SPREADSHEET,
		process.env.CONTRACTS_RANGE,
	);

	const parsedContracts = await parseData(fetchedContracts, PARSE_TS_CONTRACTS);

	const TSContracts = await filterContracts(parsedContracts);

	await connectDB(process.env.DB_PATH);

	await handleTSContracts(googleClient, notionClient, TSContracts, fetchedContracts);

	await postErrorHandling(googleClient, notionClient, fetchedContracts);

	await disconnectDB();
};

main();