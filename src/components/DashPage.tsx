import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Number, String, Array, Record, Static, Undefined } from 'runtypes';
import { Button, H1 } from '@blueprintjs/core';
import { SERVER } from '../engine/queryEngine';
import { Link } from 'react-router-dom';

export const DashRecord = Record({
    id: Number,
    name: String,
    dateCreated: Number,
    dateUpdated: Number,
    data: String.Or(Undefined),
});
export type DashR = Static<typeof DashRecord>;

export type Dash = {
    id: number,
    name: string,
    dateCreated: Date,
    dateUpdated: Date,
    data: object | undefined,
}

export function convertDash(dr: DashR): Dash {
    let dateCreated = fromEpoch(dr.dateCreated as unknown as number);
    let dateUpdated = fromEpoch(dr.dateUpdated as unknown as number);
    let data = dr.data ? JSON.parse(dr.data) : undefined;
    return { ...dr, ...{ dateCreated, dateUpdated, data } };
}


function fromEpoch(n: number): Date {
    return new Date(1000 * (n));
}

function toEpoch(d: Date): number {
    return (d.getTime() - d.getMilliseconds()) / 1000;
}

export function convertToDashR(d: Dash): DashR {
    let dateCreated = toEpoch(d.dateCreated);
    let dateUpdated = toEpoch(d.dateUpdated);
    let data = d.data ? JSON.stringify(d.data) : undefined;
    return { ...d, ...{ dateCreated, dateUpdated, data } };
}

export default function DashPage() {
    const [data, setData] = useState<Dash[]>([]);

    const refreshData = async () => {
        const r = await axios.get<DashR[]>(SERVER + "/dashboard");
        Array(DashRecord).check(r.data)
        let dashes = (r.data as unknown as DashR[]).map(d => convertDash(d));
        setData(dashes);
    };

    const addItem = async () => {
        await axios.post<Dash>(SERVER + "/dashboard");
        refreshData();
    };


    useEffect(() => { refreshData(); }, []);

    return <><div>
        <H1>Dashboards</H1>
        <Button icon="add" small intent="success" onClick={addItem} >Add Dashboard</Button>
        <br style={{ clear: "left" }} />
        {data.map(d => (<div className="floatbox" key={d.id}>
            <h4><Link to={"/dash/" + d.id + "/" + d.name}>{d.name}</Link></h4>
            <svg width="80" height="80" data-jdenticon-value={d.name}></svg>
            <p>{prettyDate(d.dateUpdated)}</p>
        </div>))}
        <br style={{ clear: "left" }} />
    </div></>
}

function prettyDate(time: Date): string {
    var date = new Date(time),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
    var year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();

    if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
        return (
            year.toString() + '-'
            + ((month < 10) ? '0' + month.toString() : month.toString()) + '-'
            + ((day < 10) ? '0' + day.toString() : day.toString())
        );

    var r =
        (
            (
                day_diff === 0 &&
                (
                    (diff < 60 && "just now")
                    || (diff < 120 && "1 minute ago")
                    || (diff < 3600 && Math.floor(diff / 60) + " minutes ago")
                    || (diff < 7200 && "1 hour ago")
                    || (diff < 86400 && Math.floor(diff / 3600) + " hours ago")
                )
            )
            || (day_diff === 1 && "Yesterday")
            || (day_diff < 7 && day_diff + " days ago")
            || (day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago")
        );
    return r ? r : date.toDateString();
}