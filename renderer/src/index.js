import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './index.css';
import CssBaseline from '@material-ui/core/CssBaseline';
ReactDOM.render(
  <>
    <CssBaseline />
    <App />
  </>,
  document.getElementById('root')
);

serviceWorker.unregister();
if (module.hot && process.env.NODE_ENV !== 'production') {
  module.hot.accept();
}
