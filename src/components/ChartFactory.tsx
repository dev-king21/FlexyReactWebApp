import React, { Component, createRef, RefObject, useCallback, useEffect } from 'react';
import { QueryEngineListener, Queryable, isSameQuery } from '../engine/queryEngine';
import { ErrorBoundary, MyModal } from './CommonComponents';
import { Line, Bar, Pie, Scatter, Bubble } from 'react-chartjs-2';
import 'chartjs-plugin-colorschemes';
import ChartResultSet, { EmptySmartRs, SmartRs } from '../engine/chartResultSet';
import { WorkspaceContext, queryEngine } from '../context';
import { AgGridReact } from 'ag-grid-react/lib/agGridReact';
import Dygraph from 'dygraphs';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import { Button, FormGroup, NonIdealState } from '@blueprintjs/core';
import { useState } from 'react';
import { fetchProcessServers } from './ConnectionsPage';
import { TabNode } from 'flexlayout-react';
import { isDEBUG } from '../App';
import { ChartWrapper } from '../styledComponents';
require('codemirror/mode/sql/sql');
require('codemirror/mode/q/q');

export enum ChartType { timeseries = "Time Series", area = "Area", line = "Line", bar = "Bar", stack = "Stack", pie = "Pie", scatter = "Scatter", bubble = "Bubble", grid = "Grid" }


export default class ChartFactory {
    static getIfExists(type: string, tabNode: TabNode, selected: boolean, clearSelected: () => void, resizeTap: () => void): (JSX.Element | null) {
        var chartType: ChartType = ChartType[type as keyof typeof ChartType];
        return chartType === null ? null : React.createElement(MyUpdatingChart, { chartType, tabNode, selected, clearSelected, resizeTap });
    }
}


function toChartJsData(chartrs: ChartResultSet, filled = false): { labels: Array<string>, datasets: Array<object> } {
    return {
        labels: chartrs.rowLabels,
        datasets: chartrs.numericColumns.map(nc => ({ label: nc.name, fill: filled, data: nc.vals }))
    };
}


function toOption(chartrs: ChartResultSet, stacked = false) {
    let yLabel = chartrs.numericColumns.length === 1 ? (chartrs.numericColumns[0]).name : "";
    let options = {
        responsive: true,
        showScale: false,
        maintainAspectRatio: false,
        title: { display: false },
        tooltips: { mode: 'index', },
        hover: { mode: 'index' },
        // scales: {
        //     xAxes: [{ stacked: stacked, scaleLabel: { display: chartrs.rowTitle.length > 0, labelString: chartrs.rowTitle } }],
        //     yAxes: [{ stacked: stacked, scaleLabel: { display: yLabel.length > 0, labelString: yLabel } }]
        // },
        legend: { display: chartrs.numericColumns.length > 1, position: "bottom" },
        plugins: { colorschemes: { scheme: 'tableau.Tableau10' } }
    };
    return options;
}


interface UpdatingChartState<T> {
    config: undefined | T;
    chartType: ChartType;
    srs: SmartRs,
    queryable: Queryable,
    selected: boolean,
    exception: string | undefined,
}
interface MyMyProps {
    tabNode: TabNode
};
export abstract class UpdatingChart<P = MyMyProps, T = any> extends Component<P, UpdatingChartState<T>> implements QueryEngineListener {

    tabChanged(queryable: Queryable, srs: SmartRs): void {
        if (isSameQuery(this.state.queryable, queryable)) {
            this.setState({ srs, exception: undefined });
            this.update(srs);
        }
    }
    queryError(queryable: Queryable, exception: string): void {
        if (isSameQuery(this.state.queryable, queryable)) {
            this.setState({ srs: EmptySmartRs, exception });
            this.update(EmptySmartRs);
        }
    }

    static contextType = WorkspaceContext;
    // declare context: React.ContextType<typeof WorkspaceContext>;

    /**
     * This method will be called when new data arrives, it is ONLY required to override this
     * if the render() function alone can't handle maintaining an updated view.
     */
    update(srs: SmartRs): void { }

    state: UpdatingChartState<T> = {
        config: undefined,
        chartType: ChartType.area,
        srs: EmptySmartRs,
        selected: false,
        queryable: new Queryable("", this.getDefaultQuery(), 5000),
        exception: "",
    };

    getDefaultQuery() { return "// sqldashboards-demo-dataset:"; }
    abstract render(): JSX.Element;

    componentDidMount() {
        queryEngine.addListener(this);
        queryEngine.addQueryable(this.state.queryable);
    }

    componentWillUnmount() {
        queryEngine.removeListener(this);
        queryEngine.removeQueryable(this.state.queryable);
    }

}

function toScatterData(chartrs: ChartResultSet): { labels: Array<string>, datasets: Array<object> } {
    if (chartrs.numericColumns.length < 2) {
        return { labels: [], datasets: [] };
    }
    let nc0 = chartrs.numericColumns[0];
    let ds = [];
    for (let n = 1; n < chartrs.numericColumns.length; n++) {
        let nc1 = chartrs.numericColumns[n];
        let a = [];
        for (let i = 0; i < nc1.vals.length; i++) {
            a.push({ x: nc0.vals[i], y: nc1.vals[i], r: nc1.vals[i] });
        }
        ds.push({ label: nc1.name, data: a });
    }
    return {
        labels: ['Scatter'],
        datasets: ds
    };
}

function toBubbleData(chartrs: ChartResultSet): { labels: Array<string>, datasets: Array<object> } {
    if (chartrs.numericColumns.length < 2) {
        return { labels: [], datasets: [] };
    }
    let nc = chartrs.numericColumns;
    let a = [];
    for (let i = 0; i < nc[0].vals.length; i++) {
        a.push({ x: nc[0].vals[i], y: nc[1].vals[i], r: nc.length >= 3 ? nc[2].vals[i] : 5 });
    }
    return {
        labels: ['Scatter'],
        datasets: [{ label: "", data: a }]
    };
}

interface MyChartProps {
    chartType: ChartType,
    selected: boolean,
    clearSelected: () => void,
    tabNode: TabNode,
    resizeTap: () => void
};
class MyUpdatingChart extends UpdatingChart<MyChartProps, null> {

    private dirtyQuery: string = "";

    handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const chartType: ChartType = ChartType[e.target.value as keyof typeof ChartType];
        this.setState({ chartType: chartType });
    }

    constructor(props: MyChartProps) {
        super(props);
        var config = this.props.tabNode.getConfig();
        let ds = config.dashstate ?? {};
        this.state = { ...this.state, ...ds, ...props };

        // save state in flexlayout node tree
        this.props.tabNode.setEventListener("save", (p) => {
            const savedState = (({ chartType, queryable, config }) => ({ chartType, queryable, config }))(this.state);
            config.dashstate = savedState;
        });

        this.props.tabNode.setEventListener("close", (p) => {
            this.props.resizeTap();
        });
    }

    saveQry = (queryable: Queryable) => {
        let o = this.state.queryable;
        queryEngine.removeQueryable(o);
        let n = { ...o, ...queryable };
        let q = new Queryable(n.serverName, n.query, n.queryPeriod);
        this.setState({ queryable: q });
        queryEngine.addQueryable(q);
    }

    saveSqlQuery = () => { this.saveQry({ query: this.dirtyQuery } as Queryable) };

    render() {
        const { srs, queryable, exception } = this.state;
        const { chartRS } = srs;
        let ct = this.state.chartType;

        let Display: JSX.Element | null = <div>Error!</div>;
        try {
            if (exception) {
                Display = <NonIdealState icon="error" title="Error Generating Visualization" description={exception}
                    action={<div>Try changing a query setting in the editor</div>} />
            } else {
                Display = this.getChart(ct, chartRS, srs);
            }
        } catch (error) {
            console.error(error);
        }

        return <ChartWrapper>
            <ErrorBoundary>{Display}</ErrorBoundary>
            {this.props.selected &&
                <MyModal title="MyEditor:" isOpen={true} handleClose={this.props.clearSelected}>
                    <fieldset>
                        <legend>Personalia:</legend>
                        <FormGroup label="Display:" labelFor="editorChartSelect" inline>
                            <select id="editorChartSelect" onChange={this.handleSelect} >
                                {Object.keys(ChartType).map(key => (
                                    <option key={key} value={key} selected={key === ct}>
                                        {ChartType[key as keyof typeof ChartType]}
                                    </option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup label="Server:" labelFor="editorChartSelect" inline>
                            <ServerSelect selectedServer={this.state.queryable.serverName} onSelect={e => { this.saveQry({ serverName: e } as Queryable) }} />
                        </FormGroup>
                        <Button icon="arrow-right" intent="success" style={{ marginBottom: 5 }} onClick={this.saveSqlQuery}>Save Query</Button>
                        <br style={{ clear: "left" }} />
                        <ReactCodeMirror
                            value={queryable.query}
                            options={{ mode: 'q', lineNumbers: true, extraKeys: { "Ctrl-S": this.saveSqlQuery, } }}
                            onChange={(editor, data, value) => { this.dirtyQuery = value }}
                        />
                    </fieldset>
                </MyModal>}
        </ChartWrapper>;
    }

    private getChart(ct: ChartType | undefined, chartRS: ChartResultSet, srs: SmartRs): JSX.Element | null {
        switch (ct) {
            // case ChartType.area: return (<ChartWrapper><Line data={toChartJsData(chartRS, true)} options={toOption(chartRS)} /></ChartWrapper>);
            // case ChartType.line: return (<ChartWrapper><Line data={toChartJsData(chartRS)} options={toOption(chartRS)} /></ChartWrapper>);
            // case ChartType.bar: return (<ChartWrapper selected={this.props.selected}><Bar data={toChartJsData(chartRS)} options={toOption(chartRS)} /></ChartWrapper>);
            // case ChartType.stack: return (<ChartWrapper><Bar data={toChartJsData(chartRS)} options={toOption(chartRS, true)} /></ChartWrapper>);
            // case ChartType.pie: return (<ChartWrapper><Pie data={toChartJsData(chartRS)} options={toOption(chartRS, true)} /></ChartWrapper>);
            // case ChartType.scatter: return (<Scatter data={toScatterData(chartRS)} options={toOption(chartRS)} />);
            // case ChartType.bubble: return (<ChartWrapper><Bubble data={toBubbleData(chartRS)} options={toOption(chartRS)} /></ChartWrapper>);
            // case ChartType.grid: return (<AGrid srs={srs} />);
            // case ChartType.timeseries: return (<ChartWrapper><ATimeSeries srs={srs} /></ChartWrapper>);
            case ChartType.area: return (<Line data={toChartJsData(chartRS, true)} options={toOption(chartRS)} />);
            case ChartType.line: return (<Line data={toChartJsData(chartRS)} options={toOption(chartRS)} />);
            case ChartType.bar: return (<Bar data={toChartJsData(chartRS)} options={toOption(chartRS)} />);
            case ChartType.stack: return (<Bar data={toChartJsData(chartRS)} options={toOption(chartRS, true)} />);
            case ChartType.pie: return (<Pie data={toChartJsData(chartRS)} options={toOption(chartRS, true)} />);
            case ChartType.scatter: return (<Scatter data={toScatterData(chartRS)} options={toOption(chartRS)} />);
            case ChartType.bubble: return (<Bubble data={toBubbleData(chartRS)} options={toOption(chartRS)} />);
            case ChartType.grid: return (<AGrid srs={srs} />);
            case ChartType.timeseries: return (<ATimeSeries srs={srs} />);
            case undefined:
            default:
                return null;
        }
    }
}



function ServerSelect(props: { selectedServer: string, onSelect: (serverName: string) => void }) {

    const [options, setOptions] = useState<string[]>([]);

    function onlyUnique(value: any, index: number, self: any) {
        return self.indexOf(value) === index;
    }

    // Always shows the selected even if it dissapeared to prevent invalid flicker
    // Refreshes server list after user clicks button to ensure it's up to date from multiple tabs.
    const refreshData = useCallback(() => {
        fetchProcessServers(s => setOptions([props.selectedServer, ...s.map(sc => sc.name)].filter(onlyUnique)));
    }, [props.selectedServer]);

    useEffect(() => {
        setOptions([props.selectedServer]);
        if (!isDEBUG()) {
            refreshData();
        }
    }, [props.selectedServer, refreshData]);

    return (<><div>
        <select onClick={() => refreshData()} onChange={e => { props.onSelect(e.currentTarget.value) }}>
            {options.map(s => <option selected={s === props.selectedServer} key={s}>{s}</option>)}
        </select>
    </div></>);
}



class AGrid extends Component<{ srs: SmartRs }> {

    getDefaultQuery() { return "q)([] v:2011.01.01+til 99; a:til 99; fl:asc 99?80)"; }

    render() {
        const srs = this.props.srs;
        let colDefs: Array<object> = [];
        if (srs.rsdata.tbl.data.length > 0) {
            colDefs = Object.keys(srs.rsdata.tbl.data[0]).map(e => ({ headerName: e, field: e }));
        }

        return (
            <div
                className="ag-theme-balham"
                style={{ height: '100%', width: '100%' }}
            >
                <AgGridReact
                    columnDefs={colDefs}
                    rowData={srs.rsdata.tbl.data}
                    defaultColDef={{ resizable: true }}
                    domLayout="autoHeight"
                >
                </AgGridReact>
            </div>
        );
    }
}


class ATimeSeries extends Component<{ srs: SmartRs }> {

    private layoutRef: RefObject<any> = createRef<any>();
    private g: Dygraph | null = null;

    getDefaultQuery() { return "// sqldashboards-demo-dataset:timeseries"; }

    componentDidMount() {
        const options: any = {
            legend: 'always', connectSeparatedPoints: true, digitsAfterDecimal: 4,
            stepPlot: true, drawPoints: true, pointSize: 0
        };
        this.g = new Dygraph(this.layoutRef.current,
            `Date,A,B
        2016/01/01,10,20
        `, options);
    }

    render() {
        const srs = this.props.srs;
        var labels = Object.keys(srs.rsdata.tbl.types);
        var data = srs.rsdata.tbl.data.map(e => Object.values(e));
        // @ts-ignore
        this.g?.updateOptions({ labels: labels, file: data });
        this.g?.resize();
        return (<div className="charty" ref={this.layoutRef} ></div>);
    }
}