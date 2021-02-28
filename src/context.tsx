import React from "react";
import QueryEngine from "./engine/queryEngine";
import desktopModel from './components/Workspace';

export const queryEngine = new QueryEngine("foo");
export const desktop = new desktopModel("foo");
export const WorkspaceContext = React.createContext({queryEngine:queryEngine, desktop:desktop, selectedNode:""});