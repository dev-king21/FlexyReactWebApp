import React from 'react';
import { Component } from 'react';
import { Modal } from './CommonComponents';

type AIFrameState = {  url:string }
type AIFrameProps = {  selected:boolean }

export default class AIFrame extends Component<AIFrameProps,AIFrameState> {
    state : AIFrameState = { url: "https://en.wikipedia.org/wiki/Main_Page" };
    static defaultProps = { selected:false };

    render() {  
        return <div><iframe src={this.state.url} title="iframe" className="iframey" scrolling="no" frameBorder="no" />
        {this.props.selected ? <Modal>
        <label>url:<input type="text" name="name" value={this.state.url} onChange={(e) => this.setState({url:e.target.value})}/></label></Modal> : null}
        </div> 
    }
}
