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

// const generateRouterDiagram = (router) => {
//   let row = 0;
//   let column = 0;
//   const pieces = [];
//   addPiece(pieces, row, column, router);
//   row += 1;
//   addChildRoutersToPieces(pieces, row, column, router.routers)
//   return pieces.map((p, i) => {
//     switch(p.router.type) {
//       case 'scene':
//         return <RouterScene key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
//       case 'stack':
//         return <RouterCard key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
//       case 'feature':
//         return <RouterFeature key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
//       case 'data':
//         return <RouterData key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
//       default:
//         return <RouterScene key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
//     }
//   });
// }

const routerComponent = (router, i, style = {}) => {
  switch(router.type) {
    case 'scene':
      return <RouterScene key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    case 'stack':
      return <RouterCard key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    case 'feature':
      return <RouterFeature key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    case 'data':
      return <RouterData key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
    default:
      return <RouterScene key={`${router.name}-${i}`} style={style} name={router.name} router={router} />
  }
}


// <div>
//   <div> Name </name>
//   <Router>
//   <ChildContainer>
//     <ChildTypeContainer>
//       { repeat...}
//     </ChildTypeContainer>
//     <ChildTypeContainer>
//       { repeat...}
//     </ChildTypeContainer>
//   </ChildContainer>
// </div>
// const generateRouterDiagram = (router, type = 'root') => {
//   const childRouters = router.routers || {};
//   const childRouterTypes = Object.keys(childRouters);
//
//   const childRouterComponents = childRouterTypes.map(type => {
//     const children = childRouters[type];
//     return children.map(child => generateRouterDiagram(child, type));
//   })
//   return (
//     <div>
//       <div> { type } </div>
//       { routerComponent(router) }
//
//       { router.routers.mapgenerateRouterDiagram(router)}
//     </div>
//   )
// }

const RouterParentContainer = styled.div`
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  position: relative;
  background-color: rgba(0,0,255,0.1);
  padding: 8px;
  padding-top: 10px;
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
  background-color: rgba(0,0,255,0.1);
  padding: 8px;
  padding-top: 10px;
`;

const TypeHeader = styled.div`

`;

const TypeContent = styled.div`
display: flex;
flex-direction: row;
flex-grow: 1;
top: 0;
left: 0;
`;

const generateRouterDiagram = (router, i = 0) => {
  const childrenTypes = Object.keys(router.routers).filter(t => router.routers[t].length > 0)

  return (
    <RouterParentContainer className='parent-container'>
      <RouterTypeContainer className='type-container'>
      { routerComponent(router, i) }
      </RouterTypeContainer>
      <RouterChildrenContainer className='child-container'>
      { childrenTypes.map(type =>
        <RouterChildTypeContainer className='child-type-container'>
          <TypeHeader>
            { type }
          </TypeHeader>
          <TypeContent>
          { router.routers[type].map((r, i) => generateRouterDiagram(r, i)) }
          </TypeContent>
        </RouterChildTypeContainer>
      )}
      </RouterChildrenContainer>
    </RouterParentContainer>
  )
  // let row = 0;
  // let column = 0;
  // const pieces = [];
  // addPiece(pieces, row, column, router);
  // // row += 1;
  // addChildRoutersToPieces(pieces, row, column, router.routers)
  // return pieces.map((p, i) => {
  //   switch(p.router.type) {
  //     case 'scene':
  //       return <RouterScene key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
  //     case 'stack':
  //       return <RouterCard key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
  //     case 'feature':
  //       return <RouterFeature key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
  //     case 'data':
  //       return <RouterData key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
  //     default:
  //       return <RouterScene key={`${router.name}-${i}`} style={p.style} name={p.router.name} router={p.router} />
  //   }
  // });
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
    // console.log('here', this.state.rootRouter)
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
