import React from 'react';

export default ({ name, value }) => {
  const style = {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0px',
    paddingTop: '3px',
  }

  const nameStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '4px',
    paddingLeft: '8px',
  }

  const valueStyle = {
    color: 'blue',
    padding: '4px',
    paddingLeft: '6px',
    paddingRight: '6px',
    backgroundColor: 'aqua',
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
