import background from '../img/bg_1.jpg';
import { setUid, setTasks, setTask, addCategory, setCategory } from '../app/userSlice';
import axios from 'axios';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { ColorPicker } from 'material-ui-color';
import type { RootState } from '../app/store';
import type { task, category } from '../app/userSlice';

interface State {
    search: string;
    showErr: boolean;
    isLoading: boolean;
    errMsg: string;
    isEditingTask: boolean;
    editingTask: task | null;
    isCreatingTask: boolean;
    viewCategories: boolean;
    isEditingCategory: boolean;
    editingCategory: category | null;
    isCreatingCategory: boolean;
}

const Dashboard: React.FC = () => {
    const baseURL = useSelector((state: RootState) => state.url.baseURL);
    const uid = useSelector((state: RootState) => state.user.uid);
    const tasks = useSelector((state: RootState) => state.user.tasks);
    const categories = useSelector((state: RootState) => state.user.categories);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    React.useEffect(() => {
        if (uid === 0) {
            navigate('/error');
        }
        getCategories();
        getTasks();
    }, []);
    const [values, setValues] = React.useState<State>({
        search: '',
        showErr: false,
        isLoading: false,
        errMsg: 'An unexpected error has occured. ',
        isEditingTask: false,
        editingTask: null,
        isCreatingTask: false,
        viewCategories: false,
        isEditingCategory: false,
        editingCategory: null,
        isCreatingCategory: false,
    });
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
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
    const handleErrClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setValues({
            ...values,
            showErr: false,
        });
    };
    const openUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const closeUserMenu = () => {
        setAnchorEl(null);
    };
    const handleCloseTaskEdit = () => {
        setValues({
            ...values,
            isEditingTask: false,
            editingTask: null,
        });
    };
    const handleCloseCategoryEdit = () => {
        setValues({
            ...values,
            isEditingCategory: false,
            editingCategory: null,
        });
    };

    function logout() {
        console.log(`User${uid} has logged out. `);
        dispatch(setUid(0));
        navigate('/');
    }

    async function getTasks() {
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'getTasks',
                data: {
                    user_id: uid,
                },
            });
            if (response.data !== null) {
                dispatch(setTasks(response.data));
            } else {
                dispatch(setTasks([]));
            }
        } catch (error) {
            console.error(error);
        }
    }
    async function updateTask(row: task) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'editTask',
                data: {
                    ...row,
                    user_id: uid,
                },
            });
        } catch (error) {
            console.error(error);
        }
    }
    async function createTask(row: any) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'createTask',
                data: {
                    ...row,
                    user_id: uid,
                    order_number: tasks.length + 1,
                },
            });
        } catch (error) {
            console.error(error);
        }
        getTasks();
    }
    async function deleteTask(row: task) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'deleteTask',
                data: {
                    user_id: uid,
                    task_id: row.task_id,
                },
            });
        } catch (error) {
            console.error(error);
        }
        getTasks();
    }
    async function getCategories() {
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'getCategories',
                data: {
                    user_id: uid,
                },
            });
            if (response.data !== null) {
                for (let i = 0; i < response.data.length; i++) {
                    const newCategory = response.data[i];
                    const payload = {
                        id: newCategory.category_id,
                        value: {
                            category_id: newCategory.category_id,
                            name: newCategory.name,
                            priority: newCategory.priority,
                            color: newCategory.color,
                        },
                    };
                    dispatch(addCategory(payload));
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    async function updateCategory(row: category) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'editCategory',
                data: {
                    ...row,
                    user_id: uid,
                },
            });
        } catch (error) {
            console.error(error);
        }
    }
    async function createCategory(row: any) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'createCategory',
                data: {
                    ...row,
                    user_id: uid,
                },
            });
        } catch (error) {
            console.error(error);
        }
        getCategories();
    }
    async function deleteCategory(row: category) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'deleteCategory',
                data: {
                    user_id: uid,
                    category_id: row.category_id,
                },
            });
        } catch (error) {
            console.error(error);
        }
        getCategories();
        getTasks();
    }

    function TaskRow(props: { row: task }) {
        const { row } = props;
        const handleCheckbox = (row: task) => {
            const newRow = {
                ...row,
                is_done: !row.is_done,
            };
            const payload = {
                index: row.order_number - 1,
                value: newRow,
            };
            dispatch(setTask(payload));
            updateTask(newRow);
        };
        const handleCollapse = (row: task) => {
            const newRow = {
                ...row,
                is_open: !row.is_open,
            };
            const payload = {
                index: row.order_number - 1,
                value: newRow,
            };
            dispatch(setTask(payload));
        };
        const handleOpenEdit = (row: task) => {
            setValues({
                ...values,
                isEditingTask: true,
                editingTask: row,
            });
        };
        return (
            <React.Fragment>
                <TableRow sx={{ bgcolor: categories[row.category_id].color }}>
                    <TableCell>
                        <IconButton size="small" onClick={() => deleteTask(row)}>
                            <DeleteIcon />
                        </IconButton>
                    </TableCell>
                    <TableCell align="center">{row.order_number}</TableCell>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">{categories[row.category_id].name}</TableCell>
                    <TableCell align="center">{new Date(row.due_date).toLocaleString()}</TableCell>
                    <TableCell>
                        <Stack
                            direction="row"
                            spacing={1}
                            divider={<Divider orientation="vertical" flexItem />}
                            justifyContent="space-between"
                        >
                            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                                <EditIcon />
                            </IconButton>
                            <Checkbox checked={row.is_done} onChange={() => handleCheckbox(row)} />
                            <IconButton size="small" onClick={() => handleCollapse(row)}>
                                {row.is_open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Stack>
                    </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: categories[row.category_id].color }}>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={row.is_open} timeout="auto" unmountOnExit>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <h2>{'Description'}</h2>
                                    <h3>{row.description}</h3>
                                </Grid>
                                <Grid item xs={6}>
                                    <h2>{'Scheduled Notification'}</h2>
                                    <h3>{new Date(row.notify_date).toLocaleString()}</h3>
                                </Grid>
                            </Grid>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    }
    function TaskEdit(props: { row: task }) {
        const { row } = props;
        const [name, setName] = React.useState(row.name);
        const [description, setDescription] = React.useState(row.description);
        const [category, setCategory] = React.useState(row.category_id);
        const [deadline, setDeadline] = React.useState<Date | null>(new Date(row.due_date));
        const [notifydate, setNotifydate] = React.useState<Date | null>(new Date(row.notify_date));
        function isValidTask() {
            return deadline === null || notifydate === null || isNaN(deadline.valueOf()) || isNaN(notifydate.valueOf());
        }
        function handleEditTask() {
            if (deadline === null || notifydate === null || isNaN(deadline.valueOf()) || isNaN(notifydate.valueOf())) {
                return;
            }
            const newRow = {
                ...row,
                name: name,
                description: description,
                category_id: category,
                due_date: deadline.toISOString(),
                notify_date: notifydate.toISOString(),
            };
            const payload = {
                index: row.order_number - 1,
                value: newRow,
            };
            dispatch(setTask(payload));
            updateTask(newRow);
            setValues({
                ...values,
                isEditingTask: false,
                editingTask: null,
            });
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Edit Task'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <TextField label="Task name" value={name} onChange={(event) => setName(event.target.value)} />
                        <TextField
                            label="Description"
                            multiline
                            maxRows={6}
                            minRows={6}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                        <FormControl>
                            <InputLabel id="category">{'Category'}</InputLabel>
                            <Select
                                labelId="category"
                                input={<OutlinedInput label="Category" />}
                                value={category}
                                onChange={(event) => setCategory(event.target.value as number)}
                            >
                                {Object.keys(categories).map((category_id) => (
                                    <MenuItem key={category_id} value={parseInt(category_id)}>
                                        {categories[parseInt(category_id)].name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Due Date"
                                value={deadline}
                                onChange={(newValue) => {
                                    setDeadline(newValue);
                                }}
                            />
                            <DateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Scheduled Notification Date"
                                value={notifydate}
                                onChange={(newValue) => {
                                    setNotifydate(newValue);
                                }}
                            />
                        </LocalizationProvider>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={isValidTask()} onClick={handleEditTask}>
                        {'Apply'}
                    </Button>
                    <Button onClick={handleCloseTaskEdit}>{'Cancel'}</Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function TaskCreate() {
        const [name, setName] = React.useState('');
        const [description, setDescription] = React.useState('');
        const [category, setCategory] = React.useState(parseInt(Object.keys(categories)[0]));
        const [deadline, setDeadline] = React.useState<Date | null>(new Date());
        const [notifydate, setNotifydate] = React.useState<Date | null>(new Date());
        function isValidTask() {
            return deadline === null || notifydate === null || isNaN(deadline.valueOf()) || isNaN(notifydate.valueOf());
        }
        async function handleCreateTask() {
            if (deadline === null || notifydate === null || isNaN(deadline.valueOf()) || isNaN(notifydate.valueOf())) {
                return;
            }
            const newRow = {
                name: name,
                description: description,
                category_id: category,
                due_date: deadline.toISOString(),
                notify_date: notifydate.toISOString(),
            };
            createTask(newRow);
            setValues({
                ...values,
                isCreatingTask: false,
            });
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Create Task'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <TextField label="Task name" value={name} onChange={(event) => setName(event.target.value)} />
                        <TextField
                            label="Description"
                            multiline
                            maxRows={6}
                            minRows={6}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                        <FormControl>
                            <InputLabel id="category">{'Category'}</InputLabel>
                            <Select
                                labelId="category"
                                input={<OutlinedInput label="Category" />}
                                value={category}
                                onChange={(event) => setCategory(event.target.value as number)}
                            >
                                {Object.keys(categories).map((category_id) => (
                                    <MenuItem key={category_id} value={category_id}>
                                        {categories[parseInt(category_id)].name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Due Date"
                                value={deadline}
                                onChange={(newValue) => {
                                    setDeadline(newValue);
                                }}
                            />
                            <DateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Scheduled Notification Date"
                                value={notifydate}
                                onChange={(newValue) => {
                                    setNotifydate(newValue);
                                }}
                            />
                        </LocalizationProvider>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={isValidTask()} onClick={handleCreateTask}>
                        {'Create'}
                    </Button>
                    <Button onClick={handleBoolToggle('isCreatingTask')}>{'Cancel'}</Button>
                </DialogActions>
            </React.Fragment>
        );
    }

    function CategoryRow(props: { row: category }) {
        const { row } = props;
        const handleOpenEdit = (row: category) => {
            setValues({
                ...values,
                isEditingCategory: true,
                editingCategory: row,
            });
        };
        return (
            <React.Fragment>
                <TableRow sx={{ bgcolor: row.color }}>
                    <TableCell>
                        <IconButton size="small" disabled={row.priority === 0} onClick={() => deleteCategory(row)}>
                            <DeleteIcon />
                        </IconButton>
                    </TableCell>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">{row.priority}</TableCell>
                    <TableCell align="center">{row.color}</TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                                <EditIcon />
                            </IconButton>
                        </Stack>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    }
    function CategoryEdit(props: { row: category }) {
        const { row } = props;
        const [name, setName] = React.useState(row.name);
        const [priority, setPriority] = React.useState(row.priority.toString());
        const [color, setColor] = React.useState(row.color);
        function isValidCategory() {
            if (priority === '' || isNaN(Number(priority))) {
                return false;
            }
            return Number(priority) > 0 && color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/) != null; // eslint-disable-line
        }
        function handleEditCategory() {
            if (!isValidCategory()) {
                return;
            }
            const newRow = {
                category_id: row.category_id,
                name: name,
                priority: Number(priority),
                color: color,
            };
            const payload = {
                id: row.category_id,
                value: newRow,
            };
            dispatch(setCategory(payload));
            updateCategory(newRow);
            handleCloseCategoryEdit();
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Edit Category'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <TextField
                            label="Category name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <TextField
                            label="Category priority"
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                            helperText="Value must be greater than 0"
                        />
                        <ColorPicker value={color} onChange={(event) => setColor(`#${event.hex}`)} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={!isValidCategory()} onClick={handleEditCategory}>
                        {'Apply'}
                    </Button>
                    <Button onClick={handleCloseCategoryEdit}>{'Cancel'}</Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function CategoryCreate() {
        const [name, setName] = React.useState('');
        const [priority, setPriority] = React.useState('1');
        const [color, setColor] = React.useState('#ffffff');
        function isValidCategory() {
            if (priority === '' || isNaN(Number(priority))) {
                return false;
            }
            return Number(priority) > 0 && color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/) != null; // eslint-disable-line
        }
        function handleCreateCategory() {
            if (!isValidCategory()) {
                return;
            }
            const newRow = {
                name: name,
                priority: Number(priority),
                color: color,
            };
            createCategory(newRow);
            handleBoolToggle('isCreatingCategory')();
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Create Category'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <TextField
                            label="Category name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <TextField
                            label="Category priority"
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                            helperText="Value must be greater than 0"
                        />
                        <ColorPicker value={color} onChange={(event) => setColor(`#${event.hex}`)} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={!isValidCategory()} onClick={handleCreateCategory}>
                        {'Create'}
                    </Button>
                    <Button onClick={handleBoolToggle('isCreatingCategory')}>{'Cancel'}</Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function CategoryView() {
        return (
            <React.Fragment>
                <DialogTitle>{'Edit categories'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} m={2}>
                        <TableContainer sx={{ maxHeight: 400 }} component={Paper}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell />
                                        <TableCell align="center">{'Category Name'}</TableCell>
                                        <TableCell align="center">{'Priority'}</TableCell>
                                        <TableCell align="center">{'Color'}</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.keys(categories).map((key) => (
                                        <CategoryRow key={key} row={categories[parseInt(key)]} />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleBoolToggle('isCreatingCategory')}
                            endIcon={<AddIcon />}
                        >
                            {'Add Category'}
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBoolToggle('viewCategories')}>{'Close'}</Button>
                </DialogActions>
            </React.Fragment>
        );
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
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={openUserMenu}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={closeUserMenu}
                        >
                            <MenuItem>{'My account'}</MenuItem>
                            <MenuItem onClick={logout}>{'Logout'}</MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
            <Dialog
                open={values.isCreatingCategory}
                onClose={handleBoolToggle('isCreatingCategory')}
                maxWidth="sm"
                fullWidth
            >
                <CategoryCreate />
            </Dialog>
            <Dialog open={values.isEditingCategory} onClose={handleCloseCategoryEdit} maxWidth="sm" fullWidth>
                {values.editingCategory === null ? (
                    <DialogContent>{'Error'}</DialogContent>
                ) : (
                    <CategoryEdit row={values.editingCategory} />
                )}
            </Dialog>
            <Dialog open={values.viewCategories} onClose={handleBoolToggle('viewCategories')} maxWidth="md" fullWidth>
                <CategoryView />
            </Dialog>
            <Dialog open={values.isCreatingTask} onClose={handleBoolToggle('isCreatingTask')} maxWidth="sm" fullWidth>
                <TaskCreate />
            </Dialog>
            <Dialog open={values.isEditingTask} onClose={handleCloseTaskEdit} maxWidth="sm" fullWidth>
                {values.editingTask === null ? (
                    <DialogContent>{'Error'}</DialogContent>
                ) : (
                    <TaskEdit row={values.editingTask} />
                )}
            </Dialog>
            <Container maxWidth="md" style={{ paddingTop: '2vh' }}>
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
                <Paper sx={{ padding: '20px', overflow: 'hidden' }} elevation={3}>
                    <Stack spacing={2} m={2}>
                        <Stack direction="row" justifyContent="center" alignItems="center">
                            <h2>{'To-Do List'}</h2>
                            <ListAltIcon />
                        </Stack>
                        <TextField label="Search" value={values.search} onChange={handleChange('search')} />
                        <TableContainer sx={{ maxHeight: 500 }} component={Paper}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell />
                                        <TableCell align="center">{'No.'}</TableCell>
                                        <TableCell align="center">{'Name'}</TableCell>
                                        <TableCell align="center">{'Category'}</TableCell>
                                        <TableCell align="center">{'Due Date'}</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tasks.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                                colSpan={6}
                                                align="center"
                                            >
                                                <h2>{'You have no tasks'}</h2>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tasks.map((row) => <TaskRow key={row.task_id} row={row} />)
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleBoolToggle('isCreatingTask')}
                            endIcon={<AddIcon />}
                        >
                            {'Add task'}
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleBoolToggle('viewCategories')}>
                            {'View and edit categories'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
};

export default Dashboard;
