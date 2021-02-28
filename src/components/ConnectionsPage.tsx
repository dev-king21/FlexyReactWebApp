
import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
import { Number, String, Array, Record, Static, Undefined } from 'runtypes';
import { Alert, Button, FormGroup, H1, HTMLTable, InputGroup, Intent, Spinner } from '@blueprintjs/core';
import { SERVER } from '../engine/queryEngine';
import { JdbcSelect, MyDrawer, MyInput } from './CommonComponents';


const newServerConfig: ServerConfig = { id: -1, name: "", host: "localhost", port: 5000, jdbcType: "KDB", database: "", username: "", password: "", url: undefined };

const ServerConfigR = Record({
    id: Number,
    name: String,
    host: String,
    port: Number,
    jdbcType: String,
    database: String.Or(Undefined),
    url: String.Or(Undefined),
    username: String.Or(Undefined),
    password: String.Or(Undefined),
});
type ServerConfig = Static<typeof ServerConfigR>;


export async function fetchProcessServers(process: (s: ServerConfig[]) => void) {
    const r = await axios.get<ServerConfig[]>(SERVER + "/dbserver");
    process(Array(ServerConfigR).check(r.data));
};


function ConnectionsPage() {
    const [data, setData] = useState<ServerConfig[]>([]);
    const [deleteId, setDeleteId] = useState<ServerConfig>();
    const [editId, setEditId] = useState<ServerConfig>();

    const deleteItem = async (id: number) => {
        await axios.delete<ServerConfig[]>(SERVER + "/dbserver/" + id);
        fetchProcessServers(setData);
    };

    useEffect(() => { fetchProcessServers(setData); }, []);
    const clearSelection = () => {
        setEditId(undefined);
        fetchProcessServers(setData);
    }

    return <><div>
        <H1>Connections</H1>
        <Button icon="add" small onClick={() => { setEditId(newServerConfig) }} intent="success">Add Data Connection</Button>
        <HTMLTable condensed striped bordered interactive>
            <thead><tr><th>name</th><th>type</th><th>host:port</th><th>database</th><th>credentials</th><th>edit</th><th>delete</th></tr></thead>
            <tbody>
                {data.map(sc => (<tr key={sc.id}><td>{sc.name}</td><td>{sc.jdbcType}</td><td>{sc.host}:{sc.port}</td><td>{sc.database}</td><td>{sc.username}</td>
                    <td><Button icon="edit" small onClick={() => { setEditId(sc) }} /></td>
                    <td><Button icon="delete" intent={Intent.DANGER} small onClick={() => { setDeleteId(sc); }} /></td>
                </tr>))}

                <Alert
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    icon="trash"
                    intent={Intent.DANGER}
                    isOpen={deleteId?.id ? true : false}
                    onCancel={() => setDeleteId({} as ServerConfig)}
                    onConfirm={() => { deleteId?.id && deleteItem(deleteId.id); setDeleteId({} as ServerConfig) }}
                    canEscapeKeyCancel={true}
                    canOutsideClickCancel={true}
                >
                    <p>
                        Are you sure you want to delete this connection.
                        This will cause any users references to that connection to break.
                </p>
                </Alert>
            </tbody>
        </HTMLTable>

        <MyDrawer isOpen={editId ? true : false} handleClose={clearSelection} title={(editId?.id === -1 ? "Add" : "Edit") + " Data Connection"}>
            <ConnectionsEditor serverConfig={editId!} clearSelection={clearSelection} />
        </MyDrawer>

    </div></>
}
export default ConnectionsPage;

interface EditorProps {
    serverConfig: ServerConfig | undefined;
    clearSelection: () => void;
}

interface AjaxResult {
    state: "running" | "failed" | "succeeded" | "";
    msg?: string;
}

interface ConnectionsEditorState {
    serverConfig: ServerConfig,
    testState: AjaxResult,
    saveState: AjaxResult,
}
class ConnectionsEditor extends Component<EditorProps, ConnectionsEditorState> {

    constructor(props: EditorProps) {
        super(props);
        let sc = this.props.serverConfig ?
            this.props.serverConfig :
            newServerConfig;
        this.state = { serverConfig: sc, testState: { state: "" }, saveState: { state: "" } };
    }

    testConn = () => {
        this.setState({ testState: { state: "running" } });
        const run = async () => {
            axios.post<string>(SERVER + "/dbserver/test", this.state.serverConfig)
                .then(r => {
                    this.setState({ testState: { state: r.data === "success" ? "succeeded" : "failed", msg: r.data } });
                }).catch((e) => {
                    this.setState({ testState: { state: "failed", msg: e.message } });
                });
        };
        run();
    }

    saveConn = () => {
        let sc = this.state.serverConfig;
        const isAdd = sc.id === -1;
        this.setState({ saveState: { state: "running" } });

        const run = async () => {
            let upsert = isAdd ? axios.post : axios.put;
            upsert<ServerConfig>(SERVER + "/dbserver", sc)
                .then(r => {
                    ServerConfigR.check(r.data);
                    this.setState({ saveState: { state: "succeeded" } });
                    this.props.clearSelection();
                }).catch((e) => {
                    this.setState({ saveState: { state: "failed", msg: e.message } });
                });
        };
        run();
    }

    render() {
        let sc = this.state.serverConfig;
        const isAdd = sc.id === -1;

        const setMerged = (name: string, val: any) => {
            let sc = { ...this.state.serverConfig, ...{ [name]: val } as unknown as ServerConfig };
            this.setState({ serverConfig: sc, testState: { state: "" } });
        }

        const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
            setMerged(e.currentTarget.name, e.currentTarget.value);
        };

        return <>
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); this.saveConn(); }}>
                <MyInput label="Name:" value={sc.name} name="name" onChange={handleChange} placeholder={sc.name.length > 0 ? sc.name : (sc.host + ":" + sc.port)} />
                <JdbcSelect jdbcTypeSelected={sc.jdbcType} onChange={e => { setMerged("jdbcType", e.currentTarget.value) }} />
                <MyInput label="Host:" value={sc.host} name="host" onChange={handleChange} placeholder="localhost or server.com" />
                <MyInput label="Port:" value={sc.port ? "" + sc.port : ""} name="port" onChange={e => { setMerged("port", parseInt(e.currentTarget.value)) }} placeholder="3306" />
                {(sc.jdbcType !== "KDB") && <MyInput label="Database:" value={sc.database} name="database" onChange={handleChange} />}
                <br />
                <FormGroup label="Username:" labelFor="connUser" inline labelInfo="(optional)" >
                    <InputGroup id="connUser" value={sc.username} name="username" onChange={handleChange} />
                </FormGroup>
                <FormGroup label="Password:" labelFor="connPass" inline labelInfo="(optional)">
                    <InputGroup id="connPass" value={sc.password} type="password" name="password" onChange={handleChange} /></FormGroup>
                <p className="bp3-text-muted">If the username/password is supplied it will be shared by all users.
                <br />If not supplied, each user will have to supply their database login details.</p>
                <Button intent="primary" type="submit" disabled={this.state.testState.state === "failed" || this.state.saveState.state === "running"}>{isAdd ? "Add" : "Save"}</Button>&nbsp;
                <Button intent="success" onClick={this.testConn}>Test</Button>
                <AjaxResButton mystate={this.state.testState} succeededMsg="Connected" />
                <AjaxResButton mystate={this.state.saveState} succeededMsg="Saved" />
                < br />
                < br />
            </form></>;
    }
}


function AjaxResButton(props: { mystate: AjaxResult, succeededMsg: string }) {
    const st = props.mystate.state;
    return <>{st === undefined ? null :
        st === "running" ? <Spinner size={Spinner.SIZE_SMALL} intent="primary" />
            : st === "succeeded" ? <Button icon="tick" minimal>{props.succeededMsg}</Button>
                : st === "failed" ? <div><Button icon="cross" minimal intent="danger">Failed</Button> {props.mystate.msg}</div>
                    : null}</>
        ;
}
