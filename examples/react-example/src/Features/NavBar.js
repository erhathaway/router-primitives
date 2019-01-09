import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  height: 50px;
  width: 100%;
  // background-color: black;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
`;

const Name = styled.div`
  font-size: 15px;
  width: 300px;
  text-align: center;
  // color: white;
  letter-spacing: 1.5px;
`;

const NavButtonsContainer = styled.div`
  width: 400px;
  display: flex;
  justify-content: flex-end;
`;

const NavButton = styled.button`
  border: none;
  cursor: pointer;
  outline: inherit;
  color: inherit;
  height: 30px;
  margin: 20px;
  font-size: 14px;
  letter-spacing: 1.5px;
  border-radius: 1px;
`;

export default () =>
  <Container>
    <Name>{ "Ramen Router" }</Name>
    <NavButtonsContainer>
      <NavButton>Documentation</NavButton>
      <NavButton>Playground</NavButton>
    </NavButtonsContainer>
  </Container>
