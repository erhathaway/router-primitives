import React, { Component } from 'react';
import { observer } from 'mobx-react';

import { root } from './router';

import logo from './logo.svg';
import './App.css';

import {
  RouterScene,
  RouterCard,
  RouterFeature,
} from './Visualizer';

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


const calcCoordinates = (row, column) => {
  return ({
    top: row * 150,
    left: column * 170,
  })
}

const generateStyle = (coordinates) => {
  return ({
    position: 'absolute',
    ...coordinates,
  })
}

const addPiece = (pieces, row, column, router) => {
  pieces.push({
    style: generateStyle(calcCoordinates(row, column)),
    router,
  });
}

const addChildRoutersToPieces = (pieces, row, column, childRouters) => {
  let newChildRouters = [];
  const types = Object.keys(childRouters)
  types.forEach(type => {
    const routers = childRouters[type];
    if (Array.isArray(routers)) {
      routers.forEach(r => {
        addPiece(pieces, row, column, r);
        if (r.routers) {
          newChildRouters.push(r.routers);
        }
        column += 1;
      })
    } else {
      addPiece(pieces, row, column, routers);
      if (routers.routers) {
        newChildRouters.push(routers.routers);
      }
      column += 1;
    }
  })

  let newRow = row + 1;
  let newColumn = 0;
  newChildRouters.forEach(c => {
    addChildRoutersToPieces(pieces, newRow, newColumn, c)
    if (Array.isArray(c)) {
      newColumn += c.length;
    } else {
      newColumn += 1;
    }
  })
}

const generateRouterDiagram = (router) => {
  let row = 0;
  let column = 0;
  const pieces = [];
  addPiece(pieces, row, column, router);
  row += 1;
  addChildRoutersToPieces(pieces, row, column, router.routers)
  return pieces.map((p, i) => {
    // if (p.router.type === 'stack') {
      return <RouterCard key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
    // }
  })
  // return pieces;
}

const p = generateRouterDiagram(root)
console.log('!!!!!!', p)

class App extends Component {
  render() {
    const routerStyles = {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      position: 'absolute',
      left: '20%'
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
          { generateRouterDiagram(root) }
        </div>
      </div>
    );
  }
}

export default App;
