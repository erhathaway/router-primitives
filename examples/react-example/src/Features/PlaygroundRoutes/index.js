import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import Router, { registerRouter, initalizeRouter } from 'recursive-router';
import styled from 'styled-components';
import { SteppedLineTo } from 'react-lineto';
import Graph from './Graph';

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


const routerComponent = (router, i, style = {}) => {
  switch(router.type) {
    case 'scene':
      return <RouterScene id={i} key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    case 'stack':
      return <RouterCard id={i} key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    case 'feature':
      return <RouterFeature id={i} key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    case 'data':
      return <RouterData id={i} key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    default:
      return <RouterScene id={i} key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
  }
}

const RouterParentContainer = styled.div`
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  position: relative;
  background-color: rgba(0,0,255,0.1);
  padding: 8px;
  padding-top: 10px;
  z-index: 0;
`;

const RouterTypeContainer = styled.div`
  display; flex;
  flex-direction: row;
  flex-grow: 1;
  top: 0;
  left: 0;
  position: relative;
`;

const RouterChildrenContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  top: 0;
  left: 0;
  position: relative;
`;

const RouterChildTypeContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  top: 0;
  left: 0;
  position: relative;
  // background-color: rgba(0,0,255,0.04);
  padding: 8px;
  padding-top: 10px;
  z-index: 0;
`;

const TypeHeader = styled.div`
  margin-left: 20px;
  margin-top: 5px;
  margin-bottom: 5px;
  letter-spacing: 2px;
  z-index: 100;
`;

const TypeContent = styled.div`
display: flex;
flex-direction: row;
flex-grow: 1;
top: 0;
left: 0;
`;

const generateRouterDiagram = (router, parentID = undefined) => {
  const childrenTypes = Object.keys(router.routers).filter(t => router.routers[t].length > 0)
  const childID = `router-${router.name}`;

   // Record pairings of children with parents via their class names
  const pairings = [];
  if (parentID) {
    pairings.push({ to: childID, from: parentID });
  }
  const graph = (
    <RouterParentContainer>
      <RouterTypeContainer>
      { /* generate router visualized component with class name */ }
      { routerComponent(router, childID) }
      </RouterTypeContainer>
      <RouterChildrenContainer>
      { childrenTypes.map(type =>
        <RouterChildTypeContainer>
          <TypeHeader>
            { type }
          </TypeHeader>
          <TypeContent>
          { router.routers[type].map(r => {
            const { graph, pairings: childPairings } = generateRouterDiagram(r, childID)
            pairings.push(...childPairings)
            return graph;
          })}
          </TypeContent>
        </RouterChildTypeContainer>
      )}

      </RouterChildrenContainer>
    </RouterParentContainer>
  )

  return { graph, pairings }
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
    const { graph, pairings } = generateRouterDiagram(this.state.rootRouter);
    // console.log('pairings', pairings)
    return (
      <Container className="playground-routes" input={this.props.consoleInput.config}>
        <Content>
          { graph }
          <Graph edges={pairings} />
        </Content>
      </Container>
    )
  }
}

export default inject('consoleInput')(observer(Visualizer))
