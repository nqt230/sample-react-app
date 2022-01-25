import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import AccountSettings from './pages/AccountSettings';
import Error from './pages/Error';
import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useCookies } from 'react-cookie';

const theme = createTheme({
    palette: {
        primary: {
            main: '#eccdc7',
        },
        secondary: {
            main: '#329ba8',
        },
    },
});

const App: React.FC = () => {
    const [cookies, setCookie, removeCookie] = useCookies();

    return (
        <div className="App">
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Login setCookie={setCookie} />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route
                            path="/dashboard"
                            element={
                                cookies['uid'] === undefined ? (
                                    <Navigate to="/error" />
                                ) : (
                                    <Dashboard cookies={cookies} removeCookie={removeCookie} />
                                )
                            }
                        />
                        <Route
                            path="/accountsettings"
                            element={
                                cookies['uid'] === undefined ? (
                                    <Navigate to="/error" />
                                ) : (
                                    <AccountSettings cookies={cookies} removeCookie={removeCookie} />
                                )
                            }
                        />
                        <Route path="/error" element={<Error />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </div>
    );
};

export default App;
