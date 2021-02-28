import { Button, Drawer, FormGroup, HTMLSelect, InputGroup } from "@blueprintjs/core";
import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import ReactDOM from "react-dom";
import _uniqueId from 'lodash/uniqueId';
import { isObject } from "lodash";


export class Modal extends Component {
  el: Element;
  modalRoot: Element | null;
  constructor(props: any) {
    super(props);
    this.modalRoot = document.getElementById('editor2');
    this.el = document.createElement('div');
  }

  componentDidMount() {
    this.modalRoot?.appendChild(this.el);
  }

  componentWillUnmount() {
    this.modalRoot?.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(
      this.props.children,
      this.modalRoot!,
    );
  }
}


export function MyModal(props: { isOpen: boolean, handleClose: () => void, title: string, children?: React.ReactNode }) {
  return <>
    <Modal>
      <div className="mydrawer">
        <h2><Button icon="arrow-left" minimal onClick={props.handleClose} />&nbsp;{props.title}
          <Button className="drawerClose" intent="danger" icon="cross" minimal onClick={props.handleClose} />
        </h2>
        <div className="drawerFormWrapper">
          <div className="drawerForm">{props.children} </div>
        </div>
      </div>
    </Modal>
  </>
}

export function MyDrawer(props: { isOpen: boolean, handleClose: () => void, title: string, children?: React.ReactNode }) {
  return <>
    <Drawer position="bottom" size={Drawer.SIZE_STANDARD} canEscapeKeyClose
      canOutsideClickClose hasBackdrop={false} isOpen={props.isOpen} onClose={props.handleClose}>
      <div className="mydrawer">
        <h2><Button icon="arrow-left" minimal onClick={props.handleClose} />&nbsp;{props.title}
          <Button className="drawerClose" intent="danger" icon="cross" minimal onClick={props.handleClose} />
        </h2>
        <div className="drawerForm">{props.children} </div>
      </div>
    </Drawer>
  </>
}

interface ErState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode, message?: string }, ErState> {
  public state: ErState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Sorry.. there was an error</h1>;
    }
    return this.props.children;
  }
}




export function MyInput(props: { name: string, label: string, value: string | undefined, placeholder?: string, onChange: (e: React.FormEvent<HTMLInputElement>) => void, type?: string }) {
  const [id] = useState(_uniqueId('pfx-'));
  const { name, label, value, placeholder, onChange, type } = props;
  return <FormGroup label={label} labelFor={id} inline>  <InputGroup id={id} name={name} value={value ? value : ""} placeholder={placeholder} onChange={onChange} type={type} />  </FormGroup>;
}

export function JdbcSelect(props: { jdbcTypeSelected?: string, onChange: (e: React.FormEvent<HTMLSelectElement>) => void }) {
  const types = { "KDB": "Kdb", "POSTGRES": "Postgres", "CLICKHOUSE": "Clickhouse", "MSSERVER": "Microsoft SQL Server", "H2": "H2", "MYSQL": "MySQL", "CUSTOM": "Custom JDBC URL" };
  return <>
    <FormGroup label="Type:" labelFor="connType" inline>
      <HTMLSelect onChangeCapture={props.onChange}>
        {Object.entries(types).map(e => <option value={e[0]} selected={e[0] === props.jdbcTypeSelected}>{e[1]}</option>)}
      </HTMLSelect>
    </FormGroup>
  </>
}