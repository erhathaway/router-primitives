import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  height: 100%;
  width: 300px;
  background-color: blue;
  display: flex;
  position: relative;
`;

const Inner = styled.div`
  height: calc(100% - 40px);
  width: 100%;
  margin: 20px;
  background-color: red;
  display: flex;
`;

export default () => (
  <Container>
    <Inner />
  </Container>
);
