import React from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import brace from 'brace';
import 'brace/mode/javascript';
import 'brace/ext/searchbox';
import 'brace/ext/language_tools';
import 'brace/snippets/javascript';
import 'brace/theme/kuroir';

import ConsoleInput from '../state/PlaygroundConsoleInput';

const Container = styled.div`
  height: calc(100% - 50px);
  width: 500px;
  // background-color: blue;
  display: flex;
  position: relative;
`;

const Inner = styled.div`
  height: calc(100% - 40px);
  width: calc(100% - 40px);
  margin: 20px;
  background-color: red;
  display: flex;
`;

export default () => (
  <Container>
  <Inner>
    <AceEditor
      mode="javascript"
      theme="kuroir"
      defaultValue={ConsoleInput.input}
      onChange={(change) => { ConsoleInput.hi; ConsoleInput.input = change }}
      name="UNIQUE_ID_OF_DIV"
      showGutter={false}
      height={'100%'}
      fontSize="16px"
      editorProps={{$blockScrolling: true}}
      enableBasicAutocompletion={true}
      enableLiveAutocompletion
      tabSize={2}
      highlightActiveLine={true}
    />
  </Inner>
  </Container>
);
