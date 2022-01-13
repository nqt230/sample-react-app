import StyledList from '../components/StyledList';
import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    page: {
        backgroundColor: '#000000',
        minHeight: '100vh',
        height: '100%',
    },
}));

const StyledPage: React.FC = () => {
    const classes = useStyles();

    return (
        <div className={classes.page}>
            <StyledList />
        </div>
    );
};

export default StyledPage;
