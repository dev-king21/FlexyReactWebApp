import React, { Component } from 'react';

export default class Clock extends Component {

    state = { time:new Date().toLocaleString() };
    intervalID: NodeJS.Timeout | null = null;

    componentDidMount() { this.intervalID = setInterval(() => this.setState({ time:new Date().toLocaleString() }),1000); }

    componentWillUnmount() { clearInterval(this.intervalID!); }

    render() {  return <div className="clock"><p>The time is {this.state.time}.</p></div> }
}