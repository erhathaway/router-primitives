import React from 'react';

export default ({ id, children, style }) => {
  const defaultStyle = {
    width: '165px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '5px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    backgroundColor: 'white',
    zIndex: 100,
  }

  return (
    <div id={id} style={{ ...defaultStyle, ...style }}>
      { children }
    </div>
  )
}
