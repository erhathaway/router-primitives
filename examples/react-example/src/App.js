import React, { Component } from 'react';
import Router, { registerRouter } from 'recursive-router';
import { observer } from 'mobx-react';

import logo from './logo.svg';
import './App.css';

const docModal = new Router({
  name: 'docModal',
  routeKey: 'docModal',
})

const docPage = new Router({
  name: 'docPage',
  routeKey: 'docPage',
  routers: {
    stack: [docModal],
  },
})

const docMenu = new Router({
  name: 'docMenu',
  routeKey: 'docMenu',
})

const doc = new Router({
  name: 'doc',
  routeKey: 'doc',
  routers: {
    stack: [docMenu],
    page: [docPage],
  },
})




const intro = new Router({
  name: 'intro',
  routeKey: 'intro',
})

const share = new Router({
  name: 'share',
  routeKey: 'share',
})

const view = new Router({
  name: 'view',
  routeKey: 'view',
  routers: {
    feature: [share]
  }
})


const home = new Router({
  name: 'home',
  routeKey: 'home',
})

const root = new Router({
  name: 'root',
  routeKey: 'home',
  routers: {
    stack: [doc, intro],
    switch: [view, home],
    feature: [],
    page: [],
  },
  // defaultRouters: {
  //   stack: doc,
  //   switch: view,
  // },
  hooks: {
    before: [() => console.log('before hook hit')],
    after: [(loc, ctx) => console.log('after hook hit', loc, ctx)],
  },
  error: [],
})

// { name: 'root', routers: {
//   stack: [
//     { name: 'doc' routers: {
//       stack: [],
//       page: [],
//     }},
//     { name: 'intro' }
//   ],
//   switch: [
//     { name: 'view' routers: {
//       feature: [
//         { name: 'share' }
//       ]
//     }}
//   ],
// }}

console.log('root', root)

registerRouter(root)

const navA = () => {
  const pathname = 'home';
  const search = 'a@';
  const url = `${pathname}?${search}`;
  const state = {};
  window.history.pushState(state, 'Cell AF', url)
  // console.log(window.location)
}

const navB = () => {
  const pathname = 'nothome';
  const search = 'b';
  const url = `${pathname}?${search}`;
  const state = {};

  window.history.pushState(state, 'Cell AF', url)
}

const Button = ({ name, onClick, isVisible }) => {
  const style = (isVisible) => ({
    width: '50px',
    height: '25px',
    backgroundColor: 'green',
    margin: '5px',
    borderRadius: '4px',
    color: 'white',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isVisible ? 1 : 0.5,
    border: '1px solid #cccccc',

  })

  return (
    <div style={style(isVisible)} onClick={onClick}>
      { name }
    </div>
  )
}

const RouterType = ({ children }) => {
  const style = {
    // border: '1px solid #c7c7c7',
    width: '150px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '5px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    backgroundColor: 'white',
  }

  return (
    <div style={style}>
      { children }
    </div>
  )
}

const RouterName = ({ children }) => {
  const style = {
    backgroundColor: '#ffffea',
    width: '100%',
    height: '30px',
    paddingTop: '5px',
    paddingBottom: '5px',
    // width: '100px',
    borderBottom: '1px solid #c7c7c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
  }

  return (
    <div style={style}>
      { children }
    </div>
  )
}

const Attribute = ({ name, value }) => {
  const style = {
    // height: '25px',
    display: 'flex',
    alignItems: 'center',
    // justifyContent: 'center',
    // borderRadius: '3px',
    // margin: '15px',
    // paddingBottom: '7px',
    marginTop: '0px',
    // border: '1px solid #cccccc',
    paddingTop: '3px',
  }

  const nameStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    // flexGrow: 1,
    padding: '4px',
    paddingLeft: '8px',
    // color: 'black',
    // height: '100%',
    // backgroundColor: 'gray',
    // borderBottomLeftRadius: '3px',
    // borderTopLeftRadius: '3px',
  }

  const valueStyle = {
    color: 'blue',
    padding: '4px',
    paddingLeft: '6px',
    paddingRight: '6px',
    backgroundColor: 'aqua',
    // borderBottomRightRadius: '3px',
    // borderTopRightRadius: '3px',
    borderRadius: '5px',
    marginRight: '3px',
    width: '100px',
  }

  return (
    <div style={style}>
      <div style={nameStyle}>
      { name }:
      </div>
      <div style={valueStyle}>
      { value }
      </div>
    </div>
  )
}

const AttributeContainer = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  }

  return (
    <div style={style}>
      { children }
    </div>
  )
}

const ButtonContainer = ({ children }) => {
  const style = {
    display: 'flex',
  }

  return (
    <div style={style}>
      { children }
    </div>
  )
}

const RouterScene = observer(({ name, router }) => (
  <RouterType>
    <RouterName>
      { name.toUpperCase() }
    </RouterName>
    <AttributeContainer>
      <Attribute name={'visible'} value={router.visible.toString()} />
    </AttributeContainer>
    <ButtonContainer>
      <Button key={`${name}-show`} isVisible={!router.visible} name="show" onClick={router.show} />
      <Button key={`${name}-hide`} isVisible={router.visible} name="hide" onClick={router.hide} />
    </ButtonContainer>
  </RouterType>
))

const RouterCard = observer(({ name, router }) => (
  <RouterType>
    <RouterName>
      { name.toUpperCase() }
    </RouterName>
    <AttributeContainer>
      <Attribute name={'visible'} value={router.visible.toString()} />
      <Attribute name={'order'} value={router.order ? router.order.toString() : '0'} />
    </AttributeContainer>
    <ButtonContainer>
      <Button key={`${name}-show`} isVisible={!router.visible} name="show" onClick={router.show} />
      <Button key={`${name}-hide`} isVisible={router.visible} name="hide" onClick={router.hide} />
    </ButtonContainer>
  </RouterType>
))

const RouterFeature = observer(({ name, router }) => (
  <RouterType>
    <RouterName>
      { name.toUpperCase() }
    </RouterName>
    <AttributeContainer>
      <Attribute name={'visible'} value={router.visible.toString()} />
    </AttributeContainer>
    <ButtonContainer>
      <Button key={`${name}-show`} isVisible={!router.visible} name="show" onClick={router.show} />
      <Button key={`${name}-hide`} isVisible={router.visible} name="hide" onClick={router.hide} />
    </ButtonContainer>
  </RouterType>
))

class App extends Component {
  render() {
    const routerStyles = {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title"  onClick={navB}>Welcome to React</h1>
        </header>
        <p className="App-intro" onClick={navA}>
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <div style={routerStyles}>
          {"Scenes"}
          <RouterScene name={'view'} router={view}/>
          <RouterScene name={'home'} router={home}/>
          {"Cards"}
          <RouterCard name={'view'} router={view}/>
          <RouterCard name={'home'} router={home}/>
          {"Features"}
          <RouterFeature name={'view'} router={view}/>
          <RouterFeature name={'home'} router={home}/>
        </div>
      </div>
    );
  }
}

export default App;
