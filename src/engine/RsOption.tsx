import {  ItemRenderer } from "@blueprintjs/select";
import { MenuItem } from '@blueprintjs/core';
import { RsData } from './chartResultSet';

export default class RsOption {

    static  fromRsData(rsdata:RsData) : Array<RsOption> {
        return rsdata.tbl.data.map((r) => new RsOption(Object.values(r)));
    }

    constructor(readonly rowVal:Array<any>) {}

    getKey() : string { return this.get(0);  }
    getText() : string { return this.get(1, this.getKey());  }
    getLabel() : string { return this.get(2);  }
    get(index:number, fallback:string="") : string {
        return this.rowVal.length > index ? ""+this.rowVal[index] : fallback;
    }

    containsQuery(query:string):boolean {
        let f = (s:string) => s?.toLowerCase().lastIndexOf(query) > -1;
        return f(this.getKey()) || f(this.getText()) || f(this.getLabel());
    }

    static renderOption:ItemRenderer<RsOption> = (opt, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) { return null; }
        return (<MenuItem key={opt.getKey()} active={modifiers.active} onClick={handleClick} text={opt.getText()} label={opt.getLabel()} />
        );
    };
}
