import React, { useState, useEffect, FunctionComponent } from 'react';
import { Alignment, AnchorButton, Button, Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from '@blueprintjs/core';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import ConnectionsPage from './components/ConnectionsPage';
import DashPage from './components/DashPage';
import DashboardPage from './components/DashboardPage';
import './App.css';

export const LanguageContext = React.createContext({ lang: 'en', setLang: () => { } });


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar className="bp3-dark" >
          <NavbarGroup align={Alignment.LEFT}>
            <Link to="/"><NavbarHeading>SQLDashboards</NavbarHeading></Link>
            <NavbarDivider />
            {/* <AnchorButton
              href="/"
              text="Home"
              minimal
              icon="home"
            />
            <AnchorButton
              href="/dash"
              text="Dashboards"
              minimal
              icon="dashboard"
            />
            <AnchorButton
              href="/connections"
              text="Data Connections"
              minimal
              icon="cog"
            /> */}

            <Link to="/"><Button icon="home" text="Home" minimal={true} /></Link>
            <Link to="/dash"><Button icon="dashboard" text="Dashboards" minimal={true} /></Link>
            <Link to="/connections"><Button icon="cog" minimal={true} text="Data Connections" /></Link>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <NavbarDivider />
            <Button icon="user" minimal={true} />
            <Button icon="notifications" minimal={true} />
          </NavbarGroup>
        </Navbar>
        <div id="appPage">
          <Switch>
            <Route path="/connections">  <div className="page"><ConnectionsPage /> </div></Route>
            <Route path="/dash" exact={true}>  <div className="page"><DashPage />  </div></Route>
            <Route path="/dash/:id" children={<DashboardPage />} />
            <Route path="/" exact={true}>
              <Functer initial={200} />
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;

export let isDEBUG = () => window.location.search.toLowerCase().indexOf("debugg");

const Functer: FunctionComponent<{ initial?: number }> = ({ initial = 10 }) => {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    document.title = "county " + count;
    const l = () => { console.debug("resizing") };
    window.addEventListener('resize', l);
    return () => {
      window.removeEventListener("resize", l);
    };
  });
  return <span><p>Hello Functer {count}</p><button onClick={() => setCount(count + 3)}>+++</button></span>
}
