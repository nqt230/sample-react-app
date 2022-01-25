import App from './App';
import store from './app/store';
import { Provider } from 'react-redux';
import { CookiesProvider } from 'react-cookie';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

ReactDOM.render(
    <React.StrictMode>
        <CookiesProvider>
            <Provider store={store}>
                <App />
            </Provider>
        </CookiesProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);
