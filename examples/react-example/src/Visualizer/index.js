import React from 'react';
import { observer } from 'mobx-react';

import Attribute from './views/Attribute';
import RouterType from './views/Base';
import Method from './views/Method';
import RouterName from './views/Name';

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

const MethodContainer = ({ children }) => {
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
    <MethodContainer>
      <Method key={`${name}-show`} isVisible={!router.visible} name="show" onClick={router.show} />
      <Method key={`${name}-hide`} isVisible={router.visible} name="hide" onClick={router.hide} />
    </MethodContainer>
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
    <MethodContainer>
      <Method key={`${name}-show`} isVisible={!router.visible} name="show" onClick={router.show} />
      <Method key={`${name}-hide`} isVisible={router.visible} name="hide" onClick={router.hide} />
    </MethodContainer>
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
    <MethodContainer>
      <Method key={`${name}-show`} isVisible={!router.visible} name="show" onClick={router.show} />
      <Method key={`${name}-hide`} isVisible={router.visible} name="hide" onClick={router.hide} />
    </MethodContainer>
  </RouterType>
))

export {
  RouterScene,
  RouterCard,
  RouterFeature,
}
