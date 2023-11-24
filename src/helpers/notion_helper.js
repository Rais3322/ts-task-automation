const path = require('path');
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, './env/.env') });
const { format } = require('date-fns');
const { Client } = require('@notionhq/client');
const logger = require('../log/logger');

const authorizeNotion = async () => {
	const notion = new Client({
		auth: process.env.NOTION_API_KEY
	});

	return notion;
};

const createNotionPage = async (client, contract, callback) => {
	const { system, project, district, orgName, ITN, contractNumber, commentary, deadline, taskLink } = contract;
	const pageName = `${system} ${project} ${district} ${orgName} ${ITN}`;
	const formattedDeadline = format(new Date(deadline), 'yyyy-MM-dd')
	try {
		const response = await client.pages.create({
			parent: {
				type: "database_id",
				database_id: process.env.NOTION_FRESHDESK_DB_ID
			},
			properties: {
				"Name": {
					title: [
						{
							text: {
								content: pageName
							}
						}
					]
				},
				"Ответственный": {
					people: [
						{
							id: process.env.NOTION_FRESHDESK_COORDINATOR_ID
						}
					]
				},
				"Срок исполнения": {
					date: {
						start: formattedDeadline
					}
				},
				"Описание": {
					rich_text: [
						{
							plain_text: commentary
						}
					]
				},
				"Отдел": {
					select: {
						name: "Технический отдел"
					}
				},
				"Статус": {
					select: {
						name: "Не разобрано"
					}
				},
				"Группа": {
					select: {
						name: "Защита"
					}
				},
				"Проект": {
					select: {
						name: project
					}
				},
				"Район": {
					select: {
						name: district
					}
				},
			}
		});
		logger.info(`Page for contract № ${contractNumber} created`);
		contract.taskLink = response.url;
		if (typeof callback === 'function') {
			callback(contract.taskLink);
		};
		return contract.taskLink;
	} catch (error) {
		logger.error(`Error creating page for contract № ${contractNumber}`, error);
	};
};

module.exports = { authorizeNotion, createNotionPage };
