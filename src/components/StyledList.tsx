import React, { useState } from 'react';
import Typewriter from 'typewriter-effect';
import { Link } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { Checkbox, Grid, List, ListItem, ListItemIcon, ListItemText, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    checkbox: {
        '&$checked': {
            color: '#24e042',
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

const StyledList: React.FC = () => {
    const classes = useStyles();

    const [searched, setSearched] = useState('');
    const searchFn = (text: string) => {
        return searched === '' || text.toLowerCase().includes(searched.toLowerCase());
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearched(event.target.value);
    };

    const [todos, setTodos] = useState(['Frontend', 'Backend', 'Relational Database']);
    const filtered = todos.filter(searchFn);
    let listItems = [];
    if (filtered.length === 0) {
        listItems = [
            <ListItem key="0">
                <ListItemText primary="No item found" />
            </ListItem>,
        ];
    } else {
        listItems = filtered.map((item) => (
            <ListItem key={item}>
                <ListItemIcon>
                    <Checkbox
                        edge="start"
                        classes={{
                            root: classes.checkbox,
                            checked: classes.checked,
                        }}
                    />
                </ListItemIcon>
                <ListItemText primary={item} />
            </ListItem>
        ));
    }

    return (
        <Grid container direction="column" justify="center" alignItems="center" className={classes.grid}>
            <Typography variant="h5" component="div" gutterBottom color="primary">
                <Typewriter
                    options={{
                        cursor: '',
                    }}
                    onInit={(typewriter) => {
                        typewriter.changeDelay(1).typeString("Here's a slightly nicer list.").start();
                    }}
                />
            </Typography>

            <br />

            <Paper elevation={3} sx={{ padding: 2 }}>
                <TextField variant="standard" label="Search" value={searched} onChange={handleChange} />
                <br />
                <List className={classes.list}>{listItems}</List>
            </Paper>

            <br />

            <Button variant="contained" color="secondary" component={Link} to="/">
                {'Back to Home'}
            </Button>
        </Grid>
    );
};

export default StyledList;
