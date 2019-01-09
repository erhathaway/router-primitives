import React from 'react';
import Router, { registerRouter, initalizeRouter } from 'recursive-router';
import styled from 'styled-components';

import Playground from './Playground';
import Documentation from './Documentation';
import NavBar from '../Features/NavBar';

const Container = styled.div`
  height: calc(100vh - 50px);
  top: 50px;
  width: 100vw;
  position: fixed;
  display: flex;
  flex-direction: column;
  position: relative;
`;

// const config =
//   { name: 'root',
//     routers: {
//       scene: [
//         { name: 'documentation' },
//         { name: 'playground', default: { visible: true } },
//       ],
//     },
//   }
//
// const routers = initalizeRouter(config);
// const root = routers['root'];
// registerRouter(root);
// { routers.documentation.visible && <Documentation /> }
// { routers.playground.visible && <Playground /> }

export default () => {
  return (
    <React.Fragment>
      <NavBar />
      <Container>
        <Playground />
      </Container>
    </React.Fragment>
  )
};
