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
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { RootState } from '../app/store';

interface State {
    currEmail: string;
    email: string;
    currTelegramID: string;
    telegramID: string;
    password: string;
    showPw: boolean;
    repassword: string;
    showRePw: boolean;
    showErr: boolean;
    showSuccess: boolean;
    isLoading: boolean;
    errMsg: string;
    successMsg: string;
    userMenuAnchor: HTMLElement | null;
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
    cookies: { [x: string]: any };
    removeCookie: (name: string, options?: CookieSetOptions | undefined) => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const AccountSettings: React.FC<Props> = (props) => {
    const { cookies, removeCookie } = props;
    const baseURL = useSelector((state: RootState) => state.url.baseURL);
    const navigate = useNavigate();
    const [values, setValues] = React.useState<State>({
        currEmail: '',
        email: '',
        currTelegramID: '',
        telegramID: '',
        password: '',
        showPw: false,
        repassword: '',
        showRePw: false,
        showErr: false,
        showSuccess: false,
        isLoading: false,
        errMsg: 'An unexpected error has occured. ',
        successMsg: 'Success',
        userMenuAnchor: null,
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
    const handleSuccessClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setValues({
            ...values,
            showSuccess: false,
        });
    };
    const openMenu = (prop: keyof State) => (event: React.MouseEvent<HTMLElement>) => {
        setValues({
            ...values,
            [prop]: event.currentTarget,
        });
    };
    const closeMenu = (prop: keyof State) => () => {
        setValues({
            ...values,
            [prop]: null,
        });
    };
    React.useEffect(() => {
        refresh();
    }, []);
    async function getEmail() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'getEmail',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            setValues({
                ...values,
                isLoading: false,
                currEmail: response.data,
            });
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                isLoading: false,
                showErr: true,
                errMsg: 'Error connecting to server. ',
            });
        }
    }
    async function getTelegramID() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'getTelegramID',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            setValues({
                ...values,
                isLoading: false,
                currTelegramID: response.data,
            });
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                isLoading: false,
                showErr: true,
                errMsg: 'Error connecting to server. ',
            });
        }
    }

    async function refresh() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const responseEmail = await axios({
                method: 'post',
                url: baseURL + 'getEmail',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            const responseTelegramID = await axios({
                method: 'post',
                url: baseURL + 'getTelegramID',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            setValues({
                ...values,
                isLoading: false,
                currEmail: responseEmail.data,
                currTelegramID: responseTelegramID.data,
            });
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                isLoading: false,
                showErr: true,
                errMsg: 'Error connecting to server. ',
            });
        }
    }

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
    async function changePassword() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'updatePassword',
                data: {
                    user_id: Number(cookies['uid']),
                    password: values.password,
                },
            });
            if (response.data === 'Success') {
                setValues({
                    ...values,
                    isLoading: false,
                    showSuccess: true,
                    successMsg: 'Password changed successfully. ',
                });
            } else {
                setValues({
                    ...values,
                    isLoading: false,
                    showErr: true,
                    errMsg: 'Password change failed. ',
                });
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                isLoading: false,
                showErr: true,
                errMsg: 'Error connecting to server. ',
            });
        }
    }
    async function changeEmail() {
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
                url: baseURL + 'updateEmail',
                data: {
                    user_id: Number(cookies['uid']),
                    email: values.email,
                },
            });
            if (response.data === 'Success') {
                setValues({
                    ...values,
                    isLoading: false,
                    showSuccess: true,
                    successMsg: 'Email verification link sent. Access the link in the new email to change your email. ',
                });
            } else {
                setValues({
                    ...values,
                    isLoading: false,
                    showErr: true,
                    errMsg: 'An unexpected error occured. ',
                });
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                isLoading: false,
                showErr: true,
                errMsg: 'Error connecting to server. ',
            });
        }
    }
    async function changeTelegramID() {
        setValues({
            ...values,
            isLoading: true,
        });
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'updateTelegramID',
                data: {
                    user_id: Number(cookies['uid']),
                    telegram_id: values.telegramID,
                },
            });
            if (response.data === 'Success') {
                setValues({
                    ...values,
                    isLoading: false,
                    showSuccess: true,
                    successMsg:
                        'Telegram_id verification link sent. Access the link sent via Telegram to change your telegram_id. ',
                });
            } else {
                setValues({
                    ...values,
                    isLoading: false,
                    showErr: true,
                    errMsg: 'An unexpected error occured. ',
                });
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                isLoading: false,
                showErr: true,
                errMsg: 'Error connecting to server. ',
            });
        }
    }

    function logout() {
        removeCookie('uid');
        navigate('/');
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
            <AppBar position="static" color="primary">
                <Toolbar>
                    <h3 style={{ flexGrow: 1, textAlign: 'left' }}>{'Task Management App'}</h3>
                    <div>
                        <IconButton
                            size="large"
                            aria-controls="user-menu"
                            aria-haspopup="true"
                            onClick={openMenu('userMenuAnchor')}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                    </div>
                </Toolbar>
            </AppBar>
            <Menu
                id="user-menu"
                anchorEl={values.userMenuAnchor}
                keepMounted
                open={Boolean(values.userMenuAnchor)}
                onClose={closeMenu('userMenuAnchor')}
            >
                <MenuItem onClick={() => navigate('/dashboard')}>{'Dashboard'}</MenuItem>
                <MenuItem onClick={logout}>{'Logout'}</MenuItem>
            </Menu>
            <Container maxWidth="sm" style={{ paddingTop: '1vh' }}>
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
                <Snackbar
                    open={values.showSuccess}
                    autoHideDuration={3000}
                    onClose={handleSuccessClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <Alert severity="success" sx={{ width: '100%' }}>
                        {values.successMsg}
                    </Alert>
                </Snackbar>
                <Paper elevation={3}>
                    <Stack divider={<Divider flexItem />}>
                        <Typography variant="h4" align="left" style={{ margin: 20 }}>
                            {'Account Settings'}
                        </Typography>
                        <div style={{ maxHeight: '74vh', overflowY: 'scroll' }}>
                            <Grid container direction="column" style={{ height: '100%' }} spacing={0}>
                                <Grid item xs={4}>
                                    <Stack spacing={1} style={{ marginTop: 5, marginLeft: 20, marginRight: 20 }}>
                                        <Typography variant="h6" align="left">
                                            {'Edit Email'}
                                        </Typography>
                                        <Typography variant="body1" align="left">
                                            {`Current Email: ${values.currEmail}`}
                                            <IconButton size="small" style={{ marginLeft: 10 }} onClick={getEmail}>
                                                <RefreshIcon />
                                            </IconButton>
                                        </Typography>
                                        <TextField
                                            size="small"
                                            label="New Email"
                                            value={values.email}
                                            onChange={handleChange('email')}
                                            error={!isValidEmail(values.email)}
                                            helperText={isValidEmail(values.email) ? '' : 'Invalid Email'}
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="secondary"
                                            disabled={values.email === '' || !isValidEmail(values.email)}
                                            onClick={changeEmail}
                                        >
                                            {'Change email'}
                                        </Button>
                                        <Divider style={{ marginTop: 20 }} />
                                    </Stack>
                                </Grid>
                                <Grid item xs={4}>
                                    <Stack
                                        spacing={1}
                                        style={{ marginTop: 2, marginBottom: 2, marginLeft: 20, marginRight: 20 }}
                                    >
                                        <Typography variant="h6" align="left">
                                            {'Edit Password'}
                                        </Typography>
                                        <TextField
                                            size="small"
                                            type={values.showPw ? 'text' : 'password'}
                                            label="New Password"
                                            value={values.password}
                                            onChange={handleChange('password')}
                                            error={isValidPw(values.password) !== ''}
                                            helperText={isValidPw(values.password)}
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
                                            size="small"
                                            type={values.showRePw ? 'text' : 'password'}
                                            label="Confirm New Password"
                                            value={values.repassword}
                                            onChange={handleChange('repassword')}
                                            error={values.repassword !== '' && values.repassword !== values.password}
                                            helperText={
                                                values.repassword !== '' && values.repassword !== values.password
                                                    ? 'Password mismatch'
                                                    : ''
                                            }
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
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="secondary"
                                            disabled={
                                                values.password === '' ||
                                                isValidPw(values.password) !== '' ||
                                                values.password !== values.repassword
                                            }
                                            onClick={changePassword}
                                        >
                                            {'Change password'}
                                        </Button>
                                        <Divider style={{ marginTop: 20 }} />
                                    </Stack>
                                </Grid>
                                <Grid item xs={3}>
                                    <Stack spacing={1} style={{ marginBottom: 5, marginLeft: 20, marginRight: 20 }}>
                                        <Typography variant="h6" align="left">
                                            {'Edit Telegram ID'}
                                        </Typography>
                                        <Typography variant="body1" align="left">
                                            {values.currTelegramID === ''
                                                ? 'Current Telegram ID: Not registered'
                                                : `Current Telegram ID: ${values.currTelegramID}`}
                                            <IconButton size="small" style={{ marginLeft: 10 }} onClick={getTelegramID}>
                                                <RefreshIcon />
                                            </IconButton>
                                        </Typography>
                                        <Typography variant="body1" align="left">
                                            {'Telegram bot: http://t.me/cvwotaskmanagementapp230_bot'}
                                        </Typography>
                                        <TextField
                                            size="small"
                                            label="New Telegram ID"
                                            value={values.telegramID}
                                            onChange={handleChange('telegramID')}
                                            error={values.telegramID !== '' && isNaN(Number(values.telegramID))}
                                            helperText={
                                                values.telegramID !== '' && isNaN(Number(values.telegramID))
                                                    ? 'Invalid Telegram ID'
                                                    : ''
                                            }
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="secondary"
                                            disabled={values.telegramID === '' || isNaN(Number(values.telegramID))}
                                            onClick={changeTelegramID}
                                        >
                                            {'Change telegram_id'}
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </div>
                        <Button
                            variant="outlined"
                            color="secondary"
                            component={Link}
                            to="/dashboard"
                            style={{ margin: 20 }}
                        >
                            {'Back to dashboard'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
};

export default AccountSettings;
