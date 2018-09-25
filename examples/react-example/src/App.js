import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Router, { registerRouter } from 'recursive-router';

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

const root = new Router({
  name: 'root',
  routeKey: 'home',
  routers: {
    stack: [doc, intro],
    switch: [view],
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
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title"  onClick={navB}>Welcome to React</h1>
        </header>
        <p className="App-intro" onClick={navA}>
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
