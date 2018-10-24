import React from 'react';
import styled from 'styled-components';
import { Provider } from 'mobx-react';

import PlaygroundConsole from '../Features/PlaygroundConsole';
import PlaygroundRoutes from '../Features/PlaygroundRoutes';

import consoleInput from '../state/PlaygroundConsoleInput';

const Container = styled.div`
  // height: calc(100% - 50px);
  height: 100%;
  // top: 50px;
  width: 100%;
  display: flex;
  // flex-direction: column;
  // background-color: yellow;
  position: fixed;
`;

export default () => (
  <Provider consoleInput={consoleInput}>
    <Container>
      <PlaygroundConsole />
      <PlaygroundRoutes />
    </Container>
  </Provider>
);
