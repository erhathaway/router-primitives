import React from 'react';
import ReactDOM from 'react-dom';
import Scenes from './Scenes';

import './index.css';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Scenes />, document.getElementById('root'));
registerServiceWorker();
