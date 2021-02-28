import React, { Component, ReactNode } from 'react';
import { DateInput, IDateFormatProps } from "@blueprintjs/datetime";
import moment from "moment";
import { ItemPredicate, MultiSelect, Select } from "@blueprintjs/select";
import { Button, Label } from '@blueprintjs/core';
import RsOption from '../engine/RsOption';
import { RsData } from '../engine/chartResultSet';
import { UpdatingChart } from './ChartFactory';

export class AMultiSelect extends UpdatingChart<{},RsOption[]> {

    constructor() {
        super({});
        this.state.config = [];
    }

    itemPredicate: ItemPredicate<RsOption> = (query:string, rsOption:RsOption) => {
        return query.length < 1 ? true : rsOption.containsQuery(query);
    };

    handleRemoveTag = (value: ReactNode, index: number) : void => {
        this.setState({config:this.state.config?.filter((val, i) => i !== index)});
    };

    getDefaultQuery() { return  "q)select country:v,txt:v,label:til count[i] from ([] v:`a`b`c`d`e`f`g`h`i`kk`jj`hh`gg)"; }

    render() { 
        const { srs } = this.state;
        const selected = this.state.config ?? [];
        const clearButton = selected.length > 0 ? <Button icon="cross" minimal={true} onClick={() => this.setState({config:[]})} /> : undefined;

        const Sel = MultiSelect.ofType<RsOption>();
        const items = RsOption.fromRsData(srs.rsdata);
        return (<div className="ADropdown">
        <Sel items={items} itemRenderer={RsOption.renderOption}
                onItemSelect={(rsopt) => {this.setState({config:selected.concat(rsopt)})}} 
                itemPredicate={this.itemPredicate} tagRenderer={(rsopt) => rsopt.getText()} selectedItems={selected} itemsEqual={(a,b) => a === b}
                tagInputProps={{
                    onRemove: this.handleRemoveTag,
                    rightElement: clearButton,
                }}
                >
            <Button text="Choose" rightIcon="caret-down" /></Sel>
        </div>); 
    }

}


export class ADropdown extends UpdatingChart<{},RsOption> {

    itemPredicate: ItemPredicate<RsOption> = (query:string, rsOption:RsOption) => {
        return query.length < 1 ? true : rsOption.containsQuery(query);
    };
    getDefaultQuery() { return "q)select country:v,txt:v,label:count[i]?9 from ([] v:`a`b`c`d`e`f`g`h`i`kk`jj`hh`gg)"; }

    render() { 
        const Sel = Select.ofType<RsOption>();
        const { srs,config } = this.state;

        return (<div className="ADropdown">
            <Label className="bp3-inline" >{ADropdown.getLabel(srs.rsdata)}
        <Sel items={RsOption.fromRsData(srs.rsdata)} itemRenderer={RsOption.renderOption} onItemSelect={(rsopt) => {this.setState({config:rsopt})}} 
                filterable={srs.rsdata.tbl.data.length > 10} itemPredicate={this.itemPredicate} >
            <Button text={config?.get(0) ?? "Choose"} rightIcon="caret-down" />
        </Sel>
        </Label>
        </div>); 
    }

    static getLabel(rsdata:RsData) : string {
        if(rsdata.tbl.data.length > 0) {
            let k = Object.keys(rsdata.tbl.data[0]);
            if(k.length > 0) {
                return k[0];
            }
        }
        return "";
    }
}



export class ADateInput extends Component {
    
    render() { 
        function getMomentFormatter(format: string): IDateFormatProps {
            return {
                formatDate: (date, locale) => moment(date).format(format),
                parseDate: (str, locale) => moment(str, format).toDate(),
                placeholder: format
            }
        };

        return (<div><span>Date: </span><DateInput fill={false} { ...getMomentFormatter("YYYY-MM-DD") }/></div>); 
    }
}