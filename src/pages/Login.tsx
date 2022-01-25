import background from '../img/bg_1.jpg';
import axios from 'axios';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import type { RootState } from '../app/store';

interface State {
    email: string;
    password: string;
    showPw: boolean;
    showErr: boolean;
    isLoading: boolean;
    errMsg: string;
}

interface CookieSetOptions {
    path: string;
    expires: Date;
    maxAge: number;
    domain: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: boolean | 'none' | 'lax' | 'strict';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
    setCookie: (name: string, value: any, options?: CookieSetOptions | undefined) => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const Login: React.FC<Props> = (props) => {
    const { setCookie } = props;
    const baseURL = useSelector((state: RootState) => state.url.baseURL);
    const navigate = useNavigate();
    const [values, setValues] = React.useState<State>({
        email: '',
        password: '',
        showPw: false,
        showErr: false,
        isLoading: false,
        errMsg: 'An unexpected error has occured. ',
    });
    const handleChange = (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({
            ...values,
            [prop]: event.target.value,
        });
    };
    const handleBoolToggle = (prop: keyof State) => () => {
        setValues({
            ...values,
            [prop]: !values[prop],
        });
    };
    const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            login();
        }
    };
    const handleErrClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setValues({
            ...values,
            showErr: false,
        });
    };

    async function login() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'loginAuth',
                data: {
                    email: values.email,
                    password: values.password,
                },
            });
            if (response.data !== 0) {
                setValues({
                    ...values,
                    isLoading: false,
                });
                setCookie('uid', response.data);
                navigate('/dashboard');
            } else {
                setValues({
                    ...values,
                    showErr: true,
                    isLoading: false,
                    errMsg: 'Username or password is incorrect. ',
                });
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                isLoading: false,
                errMsg: 'Error connecting to server. ',
            });
        }
    }

    return (
        <div
            style={{
                backgroundImage: `url(${background})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#000000',
                height: '100vh',
                width: '100vw',
            }}
        >
            <Backdrop open={values.isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Container maxWidth="xs" style={{ paddingTop: '10vh' }}>
                <Snackbar
                    open={values.showErr}
                    autoHideDuration={3000}
                    onClose={handleErrClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <Alert severity="error" sx={{ width: '100%' }}>
                        {values.errMsg}
                    </Alert>
                </Snackbar>
                <Paper sx={{ padding: '20px' }} elevation={3}>
                    <Stack spacing={4} m={2}>
                        <h2>{'Task Management App'}</h2>
                        <TextField
                            label="Email"
                            value={values.email}
                            onChange={handleChange('email')}
                            onKeyDown={handleKeyDown}
                        />
                        <TextField
                            type={values.showPw ? 'text' : 'password'}
                            label="Password"
                            value={values.password}
                            onChange={handleChange('password')}
                            onKeyDown={handleKeyDown}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleBoolToggle('showPw')}
                                            onMouseDown={handleMouseDown}
                                            edge="end"
                                        >
                                            {values.showPw ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button variant="contained" color="primary" onClick={login}>
                            {'Login'}
                        </Button>
                        <Button variant="contained" color="primary" component={Link} to="/register">
                            {'Register Account'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
};

export default Login;
