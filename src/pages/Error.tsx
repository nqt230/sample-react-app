import background from '../img/bg_1.jpg';
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

const Error: React.FC = () => {
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
            <Container maxWidth="sm" style={{ paddingTop: '10vh' }}>
                <Paper sx={{ padding: '20px' }} elevation={3}>
                    <Stack spacing={4} m={2}>
                        <h2>{'Error'}</h2>
                        <h4>{'Please log in. '}</h4>
                        <Button variant="contained" color="primary" component={Link} to="/">
                            {'Back'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
};

export default Error;
