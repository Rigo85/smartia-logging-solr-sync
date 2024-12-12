import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as process from "node:process";
import { strict as assert } from "assert";

import { Logger } from "(src)/helpers/Logger";
import { getNonIndexed, updateIndexedLogs } from "(src)/services/dbService";
import { DbLog } from "(src)/helpers/headers";

const url = process.env.SOLR_URL;
assert.ok(url, "The environment variable 'SOLR_URL' is not defined.");
const username = process.env.SOLR_USERNAME;
assert.ok(username, "The environment variable 'SOLR_USERNAME' is not defined.");
const password = process.env.SOLR_PASSWORD;
assert.ok(password, "The environment variable 'SOLR_PASSWORD' is not defined.");

const logger = new Logger("Sync Service");

export async function synchronize() {
	logger.info("synchronization started.");

	try {
		const dbLogs = await getNonIndexed();

		if (!dbLogs?.length) {
			logger.info("synchronization ended: 'no documents to index'.");
			return;
		}

		// logger.info(`dbLogs length: ${dbLogs.length}`);
		// logger.info(JSON.stringify({...dbLogs[0], id: dbLogs[0].id.toString()}));

		const response = await indexDocsIntoSolr(dbLogs);
		if (response) {
			await updateIndexedLogs(dbLogs.map((log: DbLog) => log.id));
		} else {
			logger.info("Unsuccessfully synchronization, no calling 'updateIndexedLogs'.");
		}

		logger.info(`synchronization ended: "${response ? "successfully" : "unsuccessfully"}"`);
	} catch (error) {
		logger.error("synchronize", error);
	}
}

async function indexDocsIntoSolr(logs: DbLog[]): Promise<boolean> {
	const from = logs?.length ? logs[0]?.id : "<empty logs>";
	const to = logs?.length ? logs[logs.length - 1]?.id : "<empty logs>";
	logger.info(`indexDocsIntoSolr: indexing "${logs.length}" documents, from "${from}" to "${to}".`);

	try {
		const docs = logs.map((log: DbLog) => ({
			id: log.id.toString(),
			timestamp: log.timestamp.toISOString(),
			data: log.data,
			source: log.source,
			hostname: log.hostname,
			appname: log.appname
		}));

		const options: AxiosRequestConfig = {
			method: "POST",
			url,
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"Content-Type": "application/json"
			},
			data: JSON.stringify(docs),
			auth: {
				username,
				password
			},
			params: {
				wt: "json",
				commit: true
			}
		};

		const response = await axios(options);

		logger.info(`indexDocsIntoSolr: ended indexing "${logs.length}" documents, from "${from}" to "${to}". Response: "${JSON.stringify(response.data)}"`);

		return true;
	} catch (error) {
		logger.error("indexDocsIntoSolr", error.message);

		return false;
	}
}