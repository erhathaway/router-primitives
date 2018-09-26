import React, { Component } from 'react';
import Router, { registerRouter } from 'recursive-router';
import { observer } from 'mobx-react';

import logo from './logo.svg';
import './App.css';

import {
  RouterScene,
  RouterCard,
  RouterFeature,
} from './Visualizer';

const docModal = new Router({
  name: 'docModal',
  routeKey: 'docModal',
})

const docPage = new Router({
  name: 'docPage',
  routeKey: 'docPage',
  routers: {
    stack: [docModal],
  },
})

const docMenu = new Router({
  name: 'docMenu',
  routeKey: 'docMenu',
})

const doc = new Router({
  name: 'doc',
  routeKey: 'doc',
  routers: {
    stack: [docMenu],
    page: [docPage],
  },
})




const intro = new Router({
  name: 'intro',
  routeKey: 'intro',
})

const share = new Router({
  name: 'share',
  routeKey: 'share',
})

const view = new Router({
  name: 'view',
  routeKey: 'view',
  routers: {
    feature: [share]
  }
})


const home = new Router({
  name: 'home',
  routeKey: 'home',
})

const root = new Router({
  name: 'root',
  routeKey: 'home',
  routers: {
    stack: [doc, intro],
    switch: [view, home],
    feature: [],
    page: [],
  },
  // defaultRouters: {
  //   stack: doc,
  //   switch: view,
  // },
  hooks: {
    before: [() => console.log('before hook hit')],
    after: [(loc, ctx) => console.log('after hook hit', loc, ctx)],
  },
  error: [],
})

// { name: 'root', routers: {
//   stack: [
//     { name: 'doc' routers: {
//       stack: [],
//       page: [],
//     }},
//     { name: 'intro' }
//   ],
//   switch: [
//     { name: 'view' routers: {
//       feature: [
//         { name: 'share' }
//       ]
//     }}
//   ],
// }}

console.log('root', root)

registerRouter(root)

const navA = () => {
  const pathname = 'home';
  const search = 'a@';
  const url = `${pathname}?${search}`;
  const state = {};
  window.history.pushState(state, 'Cell AF', url)
  // console.log(window.location)
}

const navB = () => {
  const pathname = 'nothome';
  const search = 'b';
  const url = `${pathname}?${search}`;
  const state = {};

  window.history.pushState(state, 'Cell AF', url)
}




class App extends Component {
  render() {
    const routerStyles = {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
    }

    return (
      <div className="App">
        <header className="App-header">
          <div className="App-logo">{ "🍜" }</div>
          <h1 className="App-title" onClick={navB}>Ramen Router</h1>
        </header>
        <p className="App-intro" onClick={navA}>
          An opinionated, reactive, and super simple router. Used on a daily basis, Ramen Router is delicious!
        </p>
        <div style={routerStyles}>
          {"Scenes"}
          <RouterScene name={'view'} router={view}/>
          <RouterScene name={'home'} router={home}/>
          {"Cards"}
          <RouterCard name={'view'} router={view}/>
          <RouterCard name={'home'} router={home}/>
          {"Features"}
          <RouterFeature name={'view'} router={view}/>
          <RouterFeature name={'home'} router={home}/>
        </div>
      </div>
    );
  }
}

export default App;
