import React from 'react';

export default ({ children }) => {
  const style = {
    backgroundColor: '#ffffea',
    width: '100%',
    height: '30px',
    paddingTop: '5px',
    paddingBottom: '5px',
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
