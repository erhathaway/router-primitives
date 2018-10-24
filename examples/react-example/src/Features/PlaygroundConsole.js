import React from 'react';
import styled from 'styled-components';
import { inject, observer } from 'mobx-react';
import AceEditor from 'react-ace';
import brace from 'brace';
import 'brace/mode/javascript';
import 'brace/ext/searchbox';
import 'brace/ext/language_tools';
import 'brace/snippets/javascript';
import 'brace/theme/kuroir';


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

const PlaygroundConsoleInput = ({ consoleInput }) => (
  <Container>
  <Inner>
    <AceEditor
      mode="javascript"
      theme="kuroir"
      defaultValue={consoleInput.input}
      onChange={(change) => { consoleInput.hi; consoleInput.input = change }}
      name="playground-console-input"
      showGutter={false}
      height={'100%'}
      fontSize="16px"
      editorProps={{$blockScrolling: true}}
      enableBasicAutocompletion={false}
      enableLiveAutocompletion={false}
      // enableEmmet
      tabSize={2}
      highlightActiveLine={true}
    />
  </Inner>
  </Container>
);

export default inject('consoleInput')(PlaygroundConsoleInput)
