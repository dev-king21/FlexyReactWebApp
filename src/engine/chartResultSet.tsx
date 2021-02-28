import assert from "assert";

/**
 * Decorates a resultSet to provide a data structure easier to access for charting.
 * <ul>
 * <li>Charts recognise only three types of columns: strings / numbers / dates</li>
 * <li>Number columns are all converted to {@link NumericCol} / double[]'s</li>
 * <li>Non-Number columns are all converted to {@link StringyCol}</li>
 * <li>Only the first date/time column is converted to {@link TimeCol}</li>
 * <li>The order of the columns is maintained within each column type </li>
 * </ul>
 */
export default class ChartResultSet {
    readonly numericColumns:Array<Col<number>>;
    readonly stringyColumns:Array<Col<string>>;
    readonly rowLabels:Array<string>;
    //private final TimeCol timeCol;
    readonly rowTitle:string;

    constructor(rsdata:RsData) {
        this.numericColumns = [];
        this.stringyColumns = [];
        this.rowLabels = [];
        this.rowTitle = "";

        let d = rsdata.tbl.data;
        if(d.length === 0) {
            return;
        }
        let colNames = Object.keys(d[0]);
        for(let c = 0; c < colNames.length; c++) {
            let cn = colNames[c];
            if(typeof((d[0])[cn]) === "number") {
                let nums:Array<number> = [];
                for(let r = 0; r < d.length; r++) {
                    nums.push((d[r])[cn] as number);
                }
                this.numericColumns.push(new Col(cn, nums));
            } else if(typeof((d[0])[cn]) === "string") {
                this.rowTitle += (this.rowTitle === "" ? "" : " - ") + cn;
                let strs:Array<string> = [];
                for(let r = 0; r < d.length; r++) {
                    strs.push((d[r])[cn] as string);
                }
                this.stringyColumns.push(new Col(cn, strs));
            }
        }

        this.rowLabels = ChartResultSet.generateRowLabels(this.stringyColumns);
    }

    private static generateRowLabels(stringyColumns:Array<Col<string>>):Array<string> {
        if(stringyColumns.length === 0) {
            return [];
        }
        let res:Array<string> = [];
        let rows = (stringyColumns[0]).vals.length;
        for(let r=0; r<rows; r++) {
            let s = "";
            for(let sc of stringyColumns) {
                s += (s === "" ? "" : " - ") + sc.vals[r];
            }
            res.push(s);
        }
        return res;
    }
}


export interface RsData { 
    tbl:{
        data:Array<{[key:string] : number | string | Date}>,
        types:{[s:string]:"Date" | "number" | "string" | string},
    }
}
export const EmptyRsData:RsData = { tbl: { data:[], types: {} }}


export class SmartRs { 
    d = () => this.rsdata.tbl.data;
    rsdata: RsData;
    chartRS:ChartResultSet;
    
    constructor(rsdata:RsData){   
        for (const [key, value] of Object.entries(rsdata.tbl.types)) {
            if(value === 'Date') {
                for (var i = 0; i < rsdata.tbl.data.length; i++) {
                    rsdata.tbl.data[i][key] = new Date(rsdata.tbl.data[i][key]);
                } 
            }
        }
        this.rsdata = rsdata;
        this.chartRS = new ChartResultSet(rsdata);
    }

    count():number { return this.d().length; }
}

export const EmptySmartRs = new SmartRs(EmptyRsData);




/** Abstract class intended for reuse */
class Col<T> {
    constructor(readonly name:string, readonly vals:Array<T>){}
}

export function getSmartRs(colNames:string[], colValues:(string[] | number[] | Date[])[]):SmartRs {
    assert(colNames.length === colValues.length, "same number columns");
    if(colValues.length === 0) {
        return EmptySmartRs;
    }
    for(let c of colValues) {
        assert(colValues[0].length === c.length, "All rows equal length");
    }
    let types:{[key:string] : string} = {};
    for(let c = 0; c < colValues.length; c++) {
        types[colNames[c]] = typeof colValues[c][0];
    }
    let data:Array<{[key:string] : number | string | Date}> = new Array(colValues[0].length);
    for(let r = 0; r < colValues[0].length; r++) {
        data[r] = {};
    }
    for(let c = 0; c < colValues.length; c++) {
        for(let r = 0; r < colValues[0].length; r++) {
            data[r][colNames[c]] = colValues[c][r];
        }
    }
    let rsdata:RsData = { tbl: { data:data, types:types }};

    return new SmartRs(rsdata);
}
