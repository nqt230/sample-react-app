import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import Error from './pages/Error';
import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';

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
    const uid = useSelector((state: RootState) => state.user.uid);

    return (
        <div className="App">
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route path="/dashboard" element={uid === 0 ? <Navigate to="/error" /> : <Dashboard />} />
                        <Route path="/error" element={<Error />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </div>
    );
};

export default App;
