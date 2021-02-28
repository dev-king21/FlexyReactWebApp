import React, { Component } from "react";
import { queryEngine, desktop, WorkspaceContext } from '../context';
import 'flexlayout-react/style/light.css'
import FlexPanel from './FlexPanel';
import { Button } from '@blueprintjs/core';
import { workspaceModel } from "./Workspace";
import { useParams } from "react-router-dom";

export default function DashboardPage() {
  let { id } = useParams<{ id: string | undefined }>();

  return (
    <div>
      <WorkspaceContext.Provider value={{ queryEngine: queryEngine, desktop: desktop, selectedNode: "" }}>
        {id && <FlexPanel dashId={parseInt(id)} />}
      </WorkspaceContext.Provider>
      {/* <div id="footer">
        <div id="editor2"></div>
        <NavvvBar />
      </div> */}
    </div>
  );
}


// class NavvvBar extends Component {

//   componentDidMount() { desktop.addListener(this); }
//   componentWillUnmount() { desktop.removeListener(this); }

//   workspaceSelected(workspace: workspaceModel) { this.forceUpdate(); };
//   configChanged() { this.forceUpdate(); };

//   render() {
//     return <><ul>
//       {desktop.getWorkspaces().map((e, i) => (
//         <Button key={i} active={e === desktop.selectedWorkspace} onClick={() => desktop.selectedWorkspace = e}
//           onDoubleClick={() => { let n = prompt("new name?", e.title); if (n !== null) { desktop.renameWorkspace(e, n); } }}>
//           {e.title}
//         </Button>
//       ))}
//       <Button onClick={() => desktop.addWorkspace("bob")} icon="new-layer"></Button>
//       <Button onClick={() => desktop.removeWorkspace(desktop.selectedWorkspace)} icon="cross"></Button>
//     </ul></>
//   }
// }