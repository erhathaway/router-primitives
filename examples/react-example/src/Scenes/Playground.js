import React from 'react';
import styled from 'styled-components';

import PlaygroundConsole from '../Features/PlaygroundConsole';
import PlaygroundRoutes from '../Features/PlaygroundRoutes';

const Container = styled.div`
  // height: calc(100% - 50px);
  height: 100%;
  // top: 50px;
  width: 100%;
  display: flex;
  // flex-direction: column;
  background-color: yellow;
  position: fixed;
`;

export default () => (
  <Container>
    <PlaygroundConsole />
    <PlaygroundRoutes />
  </Container>
);
