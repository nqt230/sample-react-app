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
    repassword: string;
    showRePw: boolean;
    showErr: boolean;
    isLoading: boolean;
    errMsg: string;
}

const Register: React.FC = () => {
    const baseURL = useSelector((state: RootState) => state.url.baseURL);
    const navigate = useNavigate();
    const [values, setValues] = React.useState<State>({
        email: 'ngqiting@gmail.com',
        password: '39207481Aa@',
        showPw: false,
        repassword: '39207481Aa@',
        showRePw: false,
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
    const handleErrClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setValues({
            ...values,
            showErr: false,
        });
    };

    function isValidPw(pw: string) {
        if (pw === '') {
            return '';
        }
        let has_lower = false;
        let has_upper = false;
        let has_num = false;
        let has_spec = false;
        let len = 0;
        for (let i = 0; i < pw.length; i++) {
            const c = pw.charCodeAt(i);
            len++;
            if (97 <= c && c <= 122) {
                has_lower = true;
            } else if (65 <= c && c <= 90) {
                has_upper = true;
            } else if (48 <= c && c <= 57) {
                has_num = true;
            } else {
                has_spec = true;
            }

            if (has_lower && has_upper && has_num && has_spec && len >= 8) {
                return '';
            }
        }
        let errStr = 'Needs ';
        if (!has_lower) {
            errStr += 'lowercase character, ';
        }
        if (!has_upper) {
            errStr += 'uppercase characer, ';
        }
        if (!has_num) {
            errStr += 'number, ';
        }
        if (!has_spec) {
            errStr += 'special character, ';
        }
        if (len < 8) {
            errStr += 'minimum 8 characters, ';
        }
        return errStr.slice(0, -2);
    }
    function isValidEmail(em: string) {
        return em === '' || em.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/) != null; // eslint-disable-line
    }
    function isValidAcc() {
        return (
            values.email !== '' &&
            isValidEmail(values.email) &&
            values.password !== '' &&
            isValidPw(values.password) === '' &&
            values.repassword === values.password
        );
    }
    async function registerAcc() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'checkEmailAvail',
                data: {
                    email: values.email,
                },
            });
            const isTaken = response.data;
            if (isTaken) {
                setValues({
                    ...values,
                    showErr: true,
                    isLoading: false,
                    errMsg: 'Email already registered with an account. ',
                });
                return;
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                isLoading: false,
                errMsg: 'Error connecting to server. ',
            });
            return;
        }
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'createAcc',
                data: {
                    email: values.email,
                    password: values.password,
                },
            });
            setValues({
                ...values,
                isLoading: false,
            });
            if (response.data === 'Success') {
                navigate('/verify');
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
            <Container maxWidth="sm" style={{ paddingTop: '10vh' }}>
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
                        <h2>{'Register Account'}</h2>
                        <TextField
                            label="Email"
                            value={values.email}
                            onChange={handleChange('email')}
                            error={!isValidEmail(values.email)}
                            helperText={isValidEmail(values.email) ? '' : 'Invalid Email'}
                            required
                        />
                        <TextField
                            type={values.showPw ? 'text' : 'password'}
                            label="Password"
                            value={values.password}
                            onChange={handleChange('password')}
                            error={isValidPw(values.password) !== ''}
                            helperText={isValidPw(values.password)}
                            required
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
                        <TextField
                            type={values.showRePw ? 'text' : 'password'}
                            label="Confirm Password"
                            value={values.repassword}
                            onChange={handleChange('repassword')}
                            error={values.repassword !== '' && values.repassword !== values.password}
                            helperText={
                                values.repassword !== '' && values.repassword !== values.password
                                    ? 'Password mismatch'
                                    : ''
                            }
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleBoolToggle('showRePw')}
                                            onMouseDown={handleMouseDown}
                                            edge="end"
                                        >
                                            {values.showRePw ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button variant="contained" color="primary" onClick={registerAcc} disabled={!isValidAcc()}>
                            {'Create Account'}
                        </Button>
                        <Button variant="contained" color="primary" component={Link} to="/">
                            {'Back'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
};

export default Register;
