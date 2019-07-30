import React from 'react';

const App = _ => {
  return (
    <>
      <div className='box'>
        <button id='start'>Start</button>
        <button id='stop'>Stop</button>
      </div>

      <video autoPlay className='video' />

      <div className='mes'>
        <input type='text' id='txt' autoFocus />
        <button id='submit'>Submit</button>
        <ul id='ul' />
      </div>
    </>
  );
};

export default App;
// import Button from '@material-ui/core/Button';
