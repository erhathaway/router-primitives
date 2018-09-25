import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Router, { registerRouter } from 'recursive-router';

// const root = new Router('root');
const modal = new Router('modal');

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

// const root = () => ({
//   name: 'root',
//   stack: [doc, intro],
//   switch: [view],
// });

const doc = () => ({
  stack: [{ name: 'docMenu' }],
  page: [{ name: 'docPage', pageRender: () => {} }],
})

const docMenu = () => ({

})

const docPage = () => ({
  stack: [modal]
})

const intro = () => ({

})

const view = () => ({

})



// initializeRouter(rootSubject, window);

// console.log(root)

// console.log(new Router())

const navA = () => {
  const pathname = 'home';
  const search = 'a@';
  const url = `${pathname}?${search}`;
  const state = {};
  window.history.pushState(state, 'Cell AF', url)
  console.log(window.location)
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
