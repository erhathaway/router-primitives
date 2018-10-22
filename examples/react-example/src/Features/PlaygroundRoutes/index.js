import React, { Component } from 'react';
import { observer } from 'mobx-react';
import styled from 'styled-components';

import { root } from './router';

import {
  RouterScene,
  RouterCard,
  RouterFeature,
  RouterData,
} from './Visualizer';

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
    switch(p.router.type) {
      case 'scene':
        return <RouterScene key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
      case 'stack':
        return <RouterCard key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
      case 'feature':
        return <RouterFeature key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
      case 'data':
        return <RouterData key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
      default:
        return <RouterScene key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
    }
  });
}

const Container = styled.div`
  height: calc(100% - 50px);
  width: 100%;
  background-color: orange;
  display: flex;
  position: relative;
`;

const Content = styled.div`
  height: calc(100%);
  width: 100%;
  background-color: green;
  display: flex;
  bottom: 0px;
  position: absolute;
  overflow-x: auto;
`;


export default () =>
  <Container>
    <Content>
    { generateRouterDiagram(root) }
    </Content>
  </Container>
