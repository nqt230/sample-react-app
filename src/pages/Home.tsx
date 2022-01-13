import React, { useState } from 'react';
import Typewriter from 'typewriter-effect';
import { Link } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { Grid, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    checkbox: {
        '&$checked': {
            color: '#F5B369',
        },
    },
    checked: {},
    grid: {
        paddingTop: '10vh',
    },
    list: {
        width: '30vw',
    },
}));

const Home: React.FC = () => {
    const classes = useStyles();
    const [email, setEmail] = useState('');
    const emailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };
    const [password, setPassword] = useState('');
    const passwordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    return (
        <div style={{ backgroundColor: '#000000', height: '100%', minHeight: '100vh' }}>
            <Grid container direction="column" justify="center" alignItems="center" className={classes.grid}>
                <Paper sx={{ padding: '20px', minWidth: '20vw' }} elevation={3}>
                    <Stack spacing={2} m={2}>
                        <h2>{'Task Management App'}</h2>
                        <TextField label="Email" value={email} onChange={emailChange} />
                        <br />
                        <TextField label="Password" value={password} onChange={passwordChange} />
                        <br />
                        <Button variant="contained" color="secondary" component={Link} to="/styled">
                            {'Log in'}
                        </Button>
                        <br />
                        <Button variant="contained" color="secondary" component={Link} to="/styled">
                            {'Register'}
                        </Button>
                    </Stack>
                </Paper>
            </Grid>
        </div>
    );
};

export default Home;
