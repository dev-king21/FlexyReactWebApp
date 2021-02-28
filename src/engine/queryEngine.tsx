import { EmptyRsData, RsData, SmartRs } from "./chartResultSet";
import axios from 'axios';
import { ExampleTestCases } from "./ViewStrategy";


export default class QueryEngine {

	private notifyListeners(queryable: Queryable, srs: SmartRs | null, err: string = "") {
		console.debug("QE: notify " + this.listeners.length + " Listeners(" + queryable.query + "," + srs?.count() + " rows)");
		this.listeners.forEach(l => {
			try {
				srs === null ? l.queryError(queryable, err) : l.tabChanged(queryable, srs);
			} catch (error) {
				console.error("Error notifying listener" + error);
			}
		});
	}

	private intervalID: NodeJS.Timeout | null = null;
	private listeners: Array<QueryEngineListener> = [];
	public queryables: Array<Queryable> = [];
	private queryLastResultCache: { [s: string]: any } = {};

	constructor(readonly name = "bob") {
		this.intervalID = setInterval(() => this.runQueries(), 5000);
	}

	shutDown() {
		this.listeners = [];
		clearInterval(this.intervalID!);
	}

	addListener(listener: QueryEngineListener) { this.listeners.push(listener); }
	addQueryable(queryable: Queryable) { this.queryables.push(queryable); }

	removeListener(listener: QueryEngineListener) {
		this.listeners = this.listeners.filter(ql => ql !== listener);
	}
	removeQueryable(queryable: Queryable) {
		this.queryables = this.queryables.filter(ql => ql !== queryable);
	}

	private runQueries() {
		console.debug("QE: runQueries " + this.queryables.length);
		this.queryables.map(q => this.sendQuery(this, q)); // @TODO smart prioritization
	}



	sendQuery = (thisq: QueryEngine, queryable: Queryable, forced = false) => {
		// Special cases for demos etc.
		// sqldashboards-demo-dataset:timeseries
		const DEMO = "// sqldashboards-demo-dataset:";
		const n = 100;

		if (queryable.query.startsWith(DEMO)) {
			const tbl = queryable.query.replace(DEMO, "").split("\n", 1)[0].trim();
			let srs = ExampleTestCases.COUNTRY_STATS.srs;
			if (tbl === "timeseries") {
				let rsdata: RsData = EmptyRsData;
				rsdata.tbl.types = { "v": "Date", "a": "number", "fl": "number" };
				const today = new Date();
				const DAY = 1000 * 60 * 60 * 24;
				const data = Array(n).fill({}).map((e, i) => { return { v: new Date(today.valueOf() + (i * DAY)).valueOf(), a: i, f: i + Math.random() * (n / 2) }; })
				rsdata.tbl.data = data;
				srs = new SmartRs(rsdata);
			}
			thisq.notifyListeners(queryable, srs);
			return;
		}

		var qry = SERVER + '/a.json?server=' + encodeURIComponent(queryable.serverName) + '&query=' + encodeURIComponent(queryable.query);
		axios.get<RsData>(qry)
			.then(axiosR => {
				let rsdata = axiosR.data;
				if (typeof rsdata === "string") {
					thisq.notifyListeners(queryable, null, rsdata as string);
					return;
				}
				if (!forced && isEqual(queryLastResultCache[qry], rsdata)) {
					console.debug("Not refreshing UI for: " + qry);
					return;
				} else {
					let srs = new SmartRs(rsdata);
					thisq.notifyListeners(queryable, srs);
					queryLastResultCache[qry] = rsdata;
					if (Object.keys(queryLastResultCache).length > 1000) {
						queryLastResultCache = {};
					}
				}
			}).catch(err => {
				thisq.notifyListeners(queryable, null, err.message);
			});
	}
}

export function isSameQuery(p: Queryable, q: Queryable): boolean {
	return p.serverName === q.serverName && p.query === q.query;
}

export class Queryable {
	constructor(readonly serverName: string, readonly query: string, readonly queryPeriod: number) { }

}
export const EmptyQueryable = new Queryable("", "", 0);

export interface QueryEngineListener {
	tabChanged(queryable: Queryable, qTab: SmartRs): void;
	queryError(queryable: Queryable, exception: string): void;
}


export const SERVER = 'http://localhost:8080';

export interface Tbl {
	update(srs: SmartRs): void;
}
var queryLastResultCache: { [s: string]: RsData } = {};

function isEqual(arg1: any, arg2: any): boolean {
	if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)) {
		if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]') {
			if (Object.keys(arg1).length !== Object.keys(arg2).length) {
				return false;
			}
			return (Object.keys(arg1).every(function (key) {
				return isEqual(arg1[key], arg2[key]);
			}));
		}
		return (arg1 === arg2);
	}
	return false;
}



