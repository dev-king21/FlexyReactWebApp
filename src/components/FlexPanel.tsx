import React, { Component, createRef, ReactNode, RefObject } from 'react';
import FlexLayout, { Action, TabNode, Layout, TabSetNode, BorderNode, Model } from "flexlayout-react";
import { Button, Menu, MenuDivider, MenuItem, Popover, Position } from "@blueprintjs/core";
// import {Popover2} from '@blueprintjs/popover2';
import Counter from './Counter';
import { ADateInput, ADropdown, AMultiSelect } from './FormComponents';
import AIFrame from './AIFrame';
import { desktop, WorkspaceContext } from '../context';
import ChartFactory from './ChartFactory';
import axios from "axios";
import { convertDash, convertToDashR, Dash, DashR, DashRecord } from "./DashPage";
import { SERVER } from "../engine/queryEngine";
import { debounce } from 'lodash';
import { isDEBUG } from '../App';
import { workspaceModel } from "./Workspace";

import { FlexContainer } from '../styledComponents';


const defaultJson = {
    global: { tabEnableClose: true, tabEnableFloat: true, tabSetAutoSelectTab: true },
    layout: {
        "type": "row", "weight": 100,
        "children": [{ "type": "tab", "name": "One", "component": "text" },
        {
            "type": "tabset",
            "children": [
                { "type": "tab", "name": "Two", "component": "text" },
                { "type": "tab", "name": "Three", "component": "text" }
            ]
        }
        ]
    }
};

interface FlexPanelState {
    selectedId: string,
    model: Model | null,
    dash: Dash | null,
    selectedChart: boolean
}
export default class FlexPanel extends Component<{ dashId: number }, FlexPanelState> {
    state: FlexPanelState = {
        selectedId: "",
        model: null,
        dash: null,
        selectedChart: false
    }
    static contextType = WorkspaceContext;
    // declare context: React.ContextType<typeof WorkspaceContext>;

    private layoutRef: RefObject<Layout> = createRef<Layout>();

    loadDashAndServers = async (id: number) => {
        let model = undefined;
        // debugg to allow testing react without java
        if (isDEBUG()) {
            model = FlexLayout.Model.fromJson(defaultJson);
            let dash = { id: 0, dateCreated: new Date(), dateUpdated: new Date(), name: "debugg dash", data: undefined };
            this.setState({ dash, model });
        } else {
            const r = await axios.get<DashR>(SERVER + "/dashboard/" + id);
            let dash = convertDash(DashRecord.check(r.data));
            if (dash.data) {
                model = FlexLayout.Model.fromJson(dash.data);
            } else {
                model = FlexLayout.Model.fromJson(defaultJson);
            }
            this.setState({ dash, model });
        }
    };

    constructor(props: { dashId: number }) {
        super(props);
        this.layoutRef = React.createRef();
        // let config = this.props.node.getConfig();

        // // save state in flexlayout node tree
        // this.props.node.setEventListener("save", (p) => {
        //      config.subject = this.subject;
        // };
    }

    componentDidMount() {
        this.loadDashAndServers(this.props.dashId);
    }

    factory(node: TabNode) {
        var component = node.getComponent() ?? "";
        const selected = this.state.selectedId === node.getId();
        if (component === "text") {
            return (<div className="panel">{node.getName()}</div>);
        } if (component === "counter") {
            return (<Counter value={3} />);
        } if (component === "dateinput") {
            return (<ADateInput />);
        } if (component === "iframe") {
            return (<AIFrame selected={selected} />);
        } if (component === "dropdown") {
            return (<ADropdown />);
        } if (component === "multiselect") {
            return (<AMultiSelect />);
        }
        const clear = () => {
            this.setState({
                selectedId: "",
                selectedChart: false
            })
        };

        const clearTap = () => {
            this.setState({
                selectedChart: false
            })
        }
        // {this.state.selectedChart}
        return ChartFactory.getIfExists(component, node, selected, clear, clearTap);
    }

    handleAddWidget = (name: string) => {
        var jsonChild = { component: name, name: name, config: { text: "i was added" } };
        this.layoutRef.current!.addTabWithDragAndDropIndirect("Drag this panel<br>to your desired location", jsonChild);
        // l.addTabToActiveTabSet(jsonChild);
    }

    render() {
        const { model } = this.state;
        return (
            <div>
                <TopMenu addWidget={this.handleAddWidget} />
                <FlexContainer isSelected={this.state.selectedChart}>
                    {/* <div id="flexContainer"> */}
                    {model && <FlexLayout.Layout ref={this.layoutRef} model={model} factory={this.factory.bind(this)}
                        onAction={this.handleAction} onRenderTabSet={this.onRenderTabSet} onModelChange={debounce(this.saveDashboard, 5000)}
                    />}

                </FlexContainer>
                <div id="footer">
                    <div id="editor2"></div>
                    <NavvvBar />
                </div>
            </div>);
    }

    handleAction = (action: Action): (Action | undefined) => {
        if (action.type === "FlexLayout_SelectTab") {
            let nodeId: string = action.data['tabNode'];
            this.setState({ selectedId: nodeId, selectedChart: true });
        }
        return action;
    }


    onRenderTabSet(tabSetNode: TabSetNode | BorderNode, renderValues: { headerContent?: ReactNode; buttons: ReactNode[]; }): void {
        const node = tabSetNode.getSelectedNode()
        if (node) {
            const id = 'tab_settings_popover_' + tabSetNode.getId();
            renderValues.buttons.push(<button key={id}>test</button>)
        }
    }

    saveDashboard = () => {
        console.debug("saving FlexPanel layout");
        const jsonStr = JSON.stringify(this.state.model!.toJson(), null, "\t") as string;
        if (this.state.dash) {
            let d: DashR = { ...convertToDashR(this.state.dash), ...{ data: jsonStr } };
            axios.put<Dash>(SERVER + "/dashboard", d)
                .then(r => {
                    console.log("saved successfully");
                }).catch((e) => {
                    console.log("save FAILED");
                });
            // localStorage.setItem("bobby", jsonStr);
        }
    }

}

interface TopMenuProps {
    addWidget: (name: string) => void;
}

class NavvvBar extends Component {

    componentDidMount() { desktop.addListener(this); }
    componentWillUnmount() { desktop.removeListener(this); }

    workspaceSelected(workspace: workspaceModel) { this.forceUpdate(); };
    configChanged() { this.forceUpdate(); };

    render() {
        return <><ul>
            {desktop.getWorkspaces().map((e, i) => (
                <Button key={i} active={e === desktop.selectedWorkspace} onClick={() => desktop.selectedWorkspace = e}
                    onDoubleClick={() => { let n = prompt("new name?", e.title); if (n !== null) { desktop.renameWorkspace(e, n); } }}>
                    {e.title}
                </Button>
            ))}
            <Button onClick={() => desktop.addWorkspace("bob")} icon="new-layer"></Button>
            <Button onClick={() => desktop.removeWorkspace(desktop.selectedWorkspace)} icon="cross"></Button>
        </ul></>
    }
}

class TopMenu extends Component<TopMenuProps> {

    render() {
        const { addWidget } = this.props;

        return (

            <div className="TopMenu">
                <Button onClick={() => addWidget("grid")} icon="th">Table</Button>

                <Popover
                    content={
                        <Menu>
                            <MenuItem onClick={() => addWidget("grid")} icon="th" text="Table" />
                            <MenuItem onClick={() => addWidget("timeseries")} icon="series-add" text="Time Series" />
                            <MenuItem onClick={() => addWidget("timeseries")} icon="step-chart" text="Step Plot" />
                            <MenuDivider />
                            <MenuItem onClick={() => addWidget("bar")} icon="timeline-bar-chart" text="Bar" />
                            <MenuItem onClick={() => addWidget("bar")} icon="horizontal-bar-chart" text="Bar Horizontal" />
                            <MenuItem onClick={() => addWidget("stack")} icon="stacked-chart" text="Bar Stacked" />
                            <MenuDivider />
                            <MenuItem onClick={() => addWidget("line")} icon="timeline-line-chart" text="Line" />
                            <MenuItem onClick={() => addWidget("area")} icon="timeline-area-chart" text="Area" />
                            <MenuItem onClick={() => addWidget("pie")} icon="pie-chart" text="Pie" />
                            <MenuItem onClick={() => addWidget("bubble")} icon="scatter-plot" text="Bubble" />
                        </Menu>
                    }
                    position={Position.BOTTOM}
                    minimal>
                    <Button icon="series-add">Add Chart</Button>
                </Popover>
                <Popover
                    content={
                        <Menu>
                            <MenuItem onClick={() => addWidget("dateinput")} icon="calendar" text="DateInput" />
                            <MenuItem onClick={() => addWidget("dropdown")} icon="property" text="DropDown" />
                            <MenuItem onClick={() => addWidget("multiselect")} icon="properties" text="MultiSelect" />
                        </Menu>
                    }
                    position={Position.BOTTOM}
                    minimal>
                    <Button icon="form">Add Input</Button>
                </Popover>
                <Popover
                    content={
                        <Menu>
                            <MenuItem onClick={() => addWidget("iframe")} icon="globe" text="IFrame" />
                            <MenuItem icon="console" text="Console" />
                            <MenuItem icon="new-text-box" text="Text" />
                            <MenuItem icon="cloud-upload" text="Upload" />
                            <MenuItem icon="envelope" text="Email" />
                            <MenuItem icon="media" text="Image" />
                            <MenuItem icon="volume-up" text="Audio Alert" />
                        </Menu>
                    }
                    position={Position.BOTTOM}
                    minimal>
                    <Button icon="add">Add Other</Button>
                </Popover>
            </div>
        )
    };
}