import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import Router, { registerRouter, initalizeRouter } from 'recursive-router';
import styled from 'styled-components';

import {
  RouterScene,
  RouterCard,
  RouterFeature,
  RouterData,
} from './Visualizer';

const Container = styled.div`
  height: calc(100% - 50px);
  // width: 100%;
  // background-color: orange;
  display: flex;
  position: relative;
  border-radius: 5px;
  flex-grow: 1;

`;

const Content = styled.div`
  height: calc(100% - 40px);
  width: calc(100% - 20px);
  background-color: #e8e8e8;
  display: flex;
  bottom: 0px;
  position: absolute;
  overflow-x: auto;
  margin: 20px;
  margin-left: 0px;
  border-radius: 6px;
`;


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


class Visualizer extends React.Component {
  constructor() {
    super();
    this.state = {
      rootRouter: undefined,
      config: undefined,
    };
  }

  componentDidMount() {
    this.checkRouterConfig();
  }
  componentDidUpdate(prevProps) {
    this.checkRouterConfig();
  }

  checkRouterConfig() {
    const newConfig = toJS(this.props.consoleInput.config);
    const newConfigString = JSON.stringify(newConfig);

    if (newConfigString !== this.state.config) {
      this.setRouterConfig(newConfig, newConfigString);
    }
  }

  setRouterConfig(config, newConfigString) {
    const routers = initalizeRouter(config);
    const rootRouter = routers['root'];
    registerRouter(rootRouter);
    this.setState({ rootRouter, config: newConfigString });
  }

  render() {
    if (this.state.rootRouter === undefined) return null;

    return (
      <Container input={this.props.consoleInput.config}>
        <Content>
          { generateRouterDiagram(this.state.rootRouter) }
        </Content>
      </Container>
    )
  }
}

export default inject('consoleInput')(observer(Visualizer))
