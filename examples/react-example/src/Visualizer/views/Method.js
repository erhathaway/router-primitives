import React from 'react';

export default ({ name, onClick, isVisible }) => {
  const style = (isVisible) => ({
    width: '60px',
    height: '20px',
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
