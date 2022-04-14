import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

import App from "./App";
import React from "react";
import RoomGame from "./roomGame";

const Routes = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/:idGame" component={RoomGame} />
      </Switch>
    </Router>
  );
};

Route.displayName = "Routes";

export default Routes;
