export interface DbLog {
	id: number;
	timestamp: Date;
	data: string;
	source: string;
	hostname: string;
	appname: string;
	isindexed: boolean;

}
