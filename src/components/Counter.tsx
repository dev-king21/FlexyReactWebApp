import React, { Component } from 'react';


type CounterState = {  value:number }

export default class Counter extends Component<CounterState> {
    state : CounterState = { value: this.props.value };
    static defaultProps = { value:100 };

    render() { 
        return <div>
                <h1>Counter: hello world {this.formatCount()}</h1>
                <button onClick={() => this.handleInc(1) } >Inc</button>
                <button onClick={() => this.handleInc(-2)} >Dec</button>
            </div>
    }
    
    handleInc = (n:number):void => {
        this.setState({ value: this.state.value + n })
    }

    formatCount() {
        return this.state.value === 0 ? "zero" : this.state.value;
    }
}