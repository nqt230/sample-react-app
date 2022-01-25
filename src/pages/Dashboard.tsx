import background from '../img/bg_1.jpg';
import { setTasks, setTask, setCategories, setCategory, removeCategory } from '../app/userSlice';
import axios from 'axios';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
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
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import MobileDateTimePicker from '@mui/lab/MobileDateTimePicker';
import MobileDateRangePicker from '@mui/lab/MobileDateRangePicker';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Typography from '@mui/material/Typography';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import EmailIcon from '@mui/icons-material/Email';
import TelegramIcon from '@mui/icons-material/Telegram';
import type { DateRange } from '@mui/lab/DateRangePicker';
import type { RootState } from '../app/store';
import type { Task, Category, Categories, Notification } from '../app/userSlice';

interface State {
    search: string;
    showErr: boolean;
    errMsg: string;
    isEditingTask: boolean;
    editingTask: Task | null;
    viewCategories: boolean;
    isEditingCategory: boolean;
    editingCategory: Category | null;
    isCreatingCategory: boolean;
    userMenuAnchor: HTMLElement | null;
    sortMenuAnchor: HTMLElement | null;
    sortAscending: boolean;
    deleteMenuAnchor: HTMLElement | null;
    filterMenuOpen: boolean;
    filterDateRange: DateRange<Date>;
    filterTaskNumberRange: number[];
    showCompletedTask: boolean;
    showUncompletedTask: boolean;
    promptOpen: boolean;
    promptMsg: string;
    promptAction: null | (() => void);
}

interface CreatedTask {
    category_id: keyof Categories;
    name: string;
    description: string;
    due_date: string;
}

interface CreatedCategory {
    name: string;
    priority: number;
    color: string;
}

interface CreatedNotification {
    notify_date: string;
    email_notify: boolean;
    telegram_notify: boolean;
}

interface CategoriesFilter {
    [category_id: number]: boolean;
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

const Dashboard: React.FC<Props> = (props) => {
    const { cookies, removeCookie } = props;
    const baseURL = useSelector((state: RootState) => state.url.baseURL);
    const tasks = useSelector((state: RootState) => state.user.tasks);
    const [tasksFiltered, setTasksFiltered] = React.useState<Task[]>([]);
    const categories = useSelector((state: RootState) => state.user.categories);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    React.useEffect(() => {
        refresh();
    }, []);
    const [values, setValues] = React.useState<State>({
        search: '',
        showErr: false,
        errMsg: 'An unexpected error has occured. ',
        isEditingTask: false,
        editingTask: null,
        viewCategories: false,
        isEditingCategory: false,
        editingCategory: null,
        isCreatingCategory: false,
        userMenuAnchor: null,
        sortMenuAnchor: null,
        sortAscending: true,
        deleteMenuAnchor: null,
        filterMenuOpen: false,
        filterDateRange: [null, null],
        filterTaskNumberRange: [0, 0],
        showCompletedTask: true,
        showUncompletedTask: true,
        promptOpen: false,
        promptMsg: '',
        promptAction: null,
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [isCreatingTask, setIsCreatingTask] = React.useState(false);
    const [currNotificationTask, setCurrNotificationTask] = React.useState<Task | null>(null);
    const [openCreateNotification, setOpenCreateNotification] = React.useState(false);
    const [editingNotification, setEditingNotification] = React.useState<Notification | null>(null);
    const [openEditNotification, setOpenEditNotification] = React.useState(false);
    const [categoriesFilter, setCategoriesFilter] = React.useState<CategoriesFilter>({});
    const toggleCategoryFilter = (prop: keyof CategoriesFilter) => () => {
        setCategoriesFilter({
            ...categoriesFilter,
            [prop]: !categoriesFilter[prop],
        });
    };
    const openFilterMenu = () => {
        let min = values.filterTaskNumberRange[0];
        let max = values.filterTaskNumberRange[1];
        if (min < 1 || min > tasks.length) {
            min = 1;
        }
        if (max < 1 || max > tasks.length) {
            max = tasks.length;
        }
        setValues({
            ...values,
            filterMenuOpen: true,
            filterTaskNumberRange: [min, max],
        });
    };
    const closeFilterMenu = () => {
        handleBoolToggle('filterMenuOpen')();
        applyFilter();
    };
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
            applyFilter();
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
    const closePrompt = () => {
        setValues({
            ...values,
            promptOpen: false,
            promptMsg: '',
            promptAction: null,
        });
    };

    function logout() {
        removeCookie('uid');
        navigate('/');
    }
    function applyFilter() {
        const filterFn = (row: Task) => {
            if (!row.name.toLowerCase().includes(values.search.toLowerCase())) {
                return false;
            }
            if (!categoriesFilter[row.category_id]) {
                return false;
            }
            if (values.filterDateRange[0] !== null && new Date(row.due_date) < values.filterDateRange[0]) {
                return false;
            }
            if (values.filterDateRange[1] !== null && new Date(row.due_date) > values.filterDateRange[1]) {
                return false;
            }
            if (values.filterTaskNumberRange[0] !== 0 && row.order_number < values.filterTaskNumberRange[0]) {
                return false;
            }
            if (values.filterTaskNumberRange[1] !== 0 && row.order_number > values.filterTaskNumberRange[1]) {
                return false;
            }
            if ((!values.showCompletedTask && row.is_done) || (!values.showUncompletedTask && !row.is_done)) {
                return false;
            }
            return true;
        };
        setTasksFiltered(tasks.filter(filterFn));
    }

    async function sortByTaskName() {
        setIsLoading(true);
        const compareFn = (a: Task, b: Task) => {
            if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return values.sortAscending ? -1 : 1;
            }
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return values.sortAscending ? 1 : -1;
            }
            return 0;
        };
        const newTasks = [...tasks];
        newTasks.sort(compareFn);
        for (let i = 0; i < newTasks.length; i++) {
            await updateTask({
                ...newTasks[i],
                order_number: i + 1,
            });
        }
        await getTasks();
        setIsLoading(false);
    }
    async function sortByCategoryName() {
        setIsLoading(true);
        const compareFn = (a: Task, b: Task) => {
            if (categories[a.category_id].name.toLowerCase() < categories[b.category_id].name.toLowerCase()) {
                return values.sortAscending ? -1 : 1;
            }
            if (categories[a.category_id].name.toLowerCase() > categories[b.category_id].name.toLowerCase()) {
                return values.sortAscending ? 1 : -1;
            }
            return 0;
        };
        const newTasks = [...tasks];
        newTasks.sort(compareFn);
        for (let i = 0; i < newTasks.length; i++) {
            await updateTask({
                ...newTasks[i],
                order_number: i + 1,
            });
        }
        await getTasks();
        setIsLoading(false);
    }
    async function sortByCategoryPriority() {
        setIsLoading(true);
        const compareFn = (a: Task, b: Task) => {
            if (categories[a.category_id].priority > categories[b.category_id].priority) {
                return values.sortAscending ? -1 : 1;
            }
            if (categories[a.category_id].priority < categories[b.category_id].priority) {
                return values.sortAscending ? 1 : -1;
            }
            return 0;
        };
        const newTasks = [...tasks];
        newTasks.sort(compareFn);
        for (let i = 0; i < newTasks.length; i++) {
            await updateTask({
                ...newTasks[i],
                order_number: i + 1,
            });
        }
        await getTasks();
        setIsLoading(false);
    }
    async function sortByDueDate() {
        setIsLoading(true);
        const compareFn = (a: Task, b: Task) => {
            const dateA = new Date(a.due_date);
            const dateB = new Date(b.due_date);
            if (dateA < dateB) {
                return values.sortAscending ? -1 : 1;
            }
            if (dateA > dateB) {
                return values.sortAscending ? 1 : -1;
            }
            return 0;
        };
        const newTasks = [...tasks];
        newTasks.sort(compareFn);
        for (let i = 0; i < newTasks.length; i++) {
            await updateTask({
                ...newTasks[i],
                order_number: i + 1,
            });
        }
        await getTasks();
        setIsLoading(false);
    }
    async function moveTask(row: Task, change: number) {
        if (row.order_number + change < 1 || row.order_number + change > tasks.length) {
            return;
        }
        setIsLoading(true);
        const rowToSwapWith = tasks[row.order_number - 1 + change];
        await updateTask({
            ...row,
            order_number: rowToSwapWith.order_number,
        });
        await updateTask({
            ...rowToSwapWith,
            order_number: row.order_number,
        });
        await getTasks();
        setIsLoading(false);
    }

    async function deleteCompleted() {
        setIsLoading(true);
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].is_done) {
                await axios({
                    method: 'post',
                    url: baseURL + 'deleteTask',
                    data: {
                        user_id: Number(cookies['uid']),
                        task_id: tasks[i].task_id,
                    },
                });
            }
        }
        await getTasks();
        setIsLoading(false);
    }
    async function deleteOverdue() {
        setIsLoading(true);
        const now = new Date();
        for (let i = 0; i < tasks.length; i++) {
            if (now > new Date(tasks[i].due_date)) {
                await axios({
                    method: 'post',
                    url: baseURL + 'deleteTask',
                    data: {
                        user_id: Number(cookies['uid']),
                        task_id: tasks[i].task_id,
                    },
                });
            }
        }
        await getTasks();
        setIsLoading(false);
    }
    async function deleteFiltered() {
        setIsLoading(true);
        for (let i = 0; i < tasksFiltered.length; i++) {
            await axios({
                method: 'post',
                url: baseURL + 'deleteTask',
                data: {
                    user_id: Number(cookies['uid']),
                    task_id: tasksFiltered[i].task_id,
                },
            });
        }
        await getTasks();
        setIsLoading(false);
    }
    async function deleteAll() {
        setIsLoading(true);
        for (let i = 0; i < tasks.length; i++) {
            await axios({
                method: 'post',
                url: baseURL + 'deleteTask',
                data: {
                    user_id: Number(cookies['uid']),
                    task_id: tasks[i].task_id,
                },
            });
        }
        await getTasks();
        setIsLoading(false);
    }

    async function getTasks() {
        setIsLoading(true);
        try {
            const responseGetTasks = await axios({
                method: 'post',
                url: baseURL + 'getTasks',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            if (responseGetTasks.data !== null) {
                for (let i = 0; i < responseGetTasks.data.length; i++) {
                    const responseGetNotifications = await axios({
                        method: 'post',
                        url: baseURL + 'getNotifications',
                        data: {
                            user_id: Number(cookies['uid']),
                            task_id: responseGetTasks.data[i].task_id,
                        },
                    });
                    if (responseGetNotifications.data !== null) {
                        responseGetTasks.data[i]['notifications'] = responseGetNotifications.data;
                    } else {
                        responseGetTasks.data[i]['notifications'] = [];
                    }
                }
                dispatch(setTasks(responseGetTasks.data));
                setTasksFiltered(responseGetTasks.data);
                setValues({
                    ...values,
                    filterTaskNumberRange: [1, responseGetTasks.data.length],
                });
            } else {
                dispatch(setTasks([]));
                setTasksFiltered([]);
                setValues({
                    ...values,
                    filterTaskNumberRange: [0, 0],
                });
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                errMsg: 'Error connecting to server',
            });
        }
        setIsLoading(false);
    }
    async function updateTask(row: Task) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'editTask',
                data: {
                    ...row,
                    user_id: Number(cookies['uid']),
                },
            });
        } catch (error) {
            console.error(error);
        }
    }
    async function createTask(row: CreatedTask) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'createTask',
                data: {
                    ...row,
                    user_id: Number(cookies['uid']),
                    order_number: tasks.length + 1,
                },
            });
            getTasks();
        } catch (error) {
            console.error(error);
        }
    }
    async function deleteTask(row: Task) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'deleteTask',
                data: {
                    user_id: Number(cookies['uid']),
                    task_id: row.task_id,
                },
            });
            getTasks();
        } catch (error) {
            console.error(error);
        }
    }

    async function getCategories() {
        setIsLoading(true);
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'getCategories',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            if (response.data !== null) {
                const newCategories: Categories = {};
                const newCategoriesFilter: CategoriesFilter = {};
                for (let i = 0; i < response.data.length; i++) {
                    const newCategory: Category = response.data[i];
                    const payload = {
                        id: newCategory.category_id,
                        value: {
                            category_id: newCategory.category_id,
                            name: newCategory.name,
                            priority: newCategory.priority,
                            color: newCategory.color,
                        },
                    };
                    newCategories[payload.id] = payload.value;
                    newCategoriesFilter[payload.id] = true;
                }
                dispatch(setCategories(newCategories));
                setCategoriesFilter(newCategoriesFilter);
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                errMsg: 'Error connecting to server',
            });
        }
        setIsLoading(false);
    }
    async function updateCategory(row: Category) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'editCategory',
                data: {
                    ...row,
                    user_id: Number(cookies['uid']),
                },
            });
        } catch (error) {
            console.error(error);
        }
    }
    async function createCategory(row: CreatedCategory) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'createCategory',
                data: {
                    ...row,
                    user_id: Number(cookies['uid']),
                },
            });
        } catch (error) {
            console.error(error);
        }
        getCategories();
    }
    async function deleteCategory(row: Category) {
        try {
            await axios({
                method: 'post',
                url: baseURL + 'deleteCategory',
                data: {
                    user_id: Number(cookies['uid']),
                    category_id: row.category_id,
                },
            });
        } catch (error) {
            console.error(error);
        }
        dispatch(removeCategory({ id: row.category_id }));
        getTasks();
    }

    async function refresh() {
        setIsLoading(true);
        try {
            const responseGetCategories = await axios({
                method: 'post',
                url: baseURL + 'getCategories',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            if (responseGetCategories.data !== null) {
                const newCategories: Categories = {};
                const newCategoriesFilter: CategoriesFilter = {};
                for (let i = 0; i < responseGetCategories.data.length; i++) {
                    const newCategory: Category = responseGetCategories.data[i];
                    const payload = {
                        id: newCategory.category_id,
                        value: {
                            category_id: newCategory.category_id,
                            name: newCategory.name,
                            priority: newCategory.priority,
                            color: newCategory.color,
                        },
                    };
                    newCategories[payload.id] = payload.value;
                    newCategoriesFilter[payload.id] = true;
                }
                dispatch(setCategories(newCategories));
                setCategoriesFilter(newCategoriesFilter);
            }
            const responseGetTasks = await axios({
                method: 'post',
                url: baseURL + 'getTasks',
                data: {
                    user_id: Number(cookies['uid']),
                },
            });
            if (responseGetTasks.data !== null) {
                for (let i = 0; i < responseGetTasks.data.length; i++) {
                    const responseGetNotifications = await axios({
                        method: 'post',
                        url: baseURL + 'getNotifications',
                        data: {
                            user_id: Number(cookies['uid']),
                            task_id: responseGetTasks.data[i].task_id,
                        },
                    });
                    if (responseGetNotifications.data !== null) {
                        responseGetTasks.data[i]['notifications'] = responseGetNotifications.data;
                    } else {
                        responseGetTasks.data[i]['notifications'] = [];
                    }
                }
                dispatch(setTasks(responseGetTasks.data));
                setTasksFiltered(responseGetTasks.data);
                setValues({
                    ...values,
                    filterTaskNumberRange: [1, responseGetTasks.data.length],
                });
            } else {
                dispatch(setTasks([]));
                setTasksFiltered([]);
                setValues({
                    ...values,
                    filterTaskNumberRange: [0, 0],
                });
            }
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                errMsg: 'Error connecting to server',
            });
        }
        setIsLoading(false);
    }

    async function createNotification(notif: CreatedNotification, task: Task) {
        setIsLoading(true);
        try {
            const response = await axios({
                method: 'post',
                url: baseURL + 'createNotification',
                data: {
                    ...notif,
                    user_id: Number(cookies['uid']),
                    task_id: task.task_id,
                },
            });
            const newNotifId = Number(response.data);
            const newNotif: Notification = {
                ...notif,
                notification_id: newNotifId,
            };
            const newTask: Task = {
                ...task,
                notifications: [...task.notifications, newNotif],
            };
            const payload = {
                index: task.order_number - 1,
                value: newTask,
            };
            dispatch(setTask(payload));
            const newTasks = tasksFiltered.map((task, i) => {
                if (i === payload.index) {
                    return newTask;
                } else {
                    return task;
                }
            });
            setTasksFiltered(newTasks);
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                errMsg: 'Error connecting to server',
            });
        }
        setIsLoading(false);
    }
    async function updateNotification(notif: Notification, task: Task) {
        setIsLoading(true);
        try {
            await axios({
                method: 'post',
                url: baseURL + 'editNotification',
                data: {
                    ...notif,
                },
            });
            const newTask: Task = {
                ...task,
                notifications: task.notifications.map((n: Notification) => {
                    if (n.notification_id === notif.notification_id) {
                        return notif;
                    }
                    return n;
                }),
            };
            const payload = {
                index: task.order_number - 1,
                value: newTask,
            };
            dispatch(setTask(payload));
            const newTasks = tasksFiltered.map((task, i) => {
                if (i === payload.index) {
                    return newTask;
                } else {
                    return task;
                }
            });
            setTasksFiltered(newTasks);
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                errMsg: 'Error connecting to server',
            });
        }
        setIsLoading(false);
    }
    async function deleteNotification(notif: Notification, task: Task) {
        setIsLoading(true);
        try {
            await axios({
                method: 'post',
                url: baseURL + 'deleteNotification',
                data: {
                    user_id: Number(cookies['uid']),
                    notification_id: notif.notification_id,
                },
            });
            const newTask: Task = {
                ...task,
                notifications: task.notifications.filter(
                    (n: Notification) => n.notification_id !== notif.notification_id,
                ),
            };
            const payload = {
                index: task.order_number - 1,
                value: newTask,
            };
            dispatch(setTask(payload));
            const newTasks = tasksFiltered.map((task, i) => {
                if (i === payload.index) {
                    return newTask;
                } else {
                    return task;
                }
            });
            setTasksFiltered(newTasks);
        } catch (error) {
            console.error(error);
            setValues({
                ...values,
                showErr: true,
                errMsg: 'Error connecting to server',
            });
        }
        setIsLoading(false);
    }

    function TaskRow(props: { row: Task }) {
        const { row } = props;
        const handleCheckbox = (row: Task) => {
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
            const newTasks = tasksFiltered.map((row, i) => {
                if (i === payload.index) {
                    return newRow;
                } else {
                    return row;
                }
            });
            setTasksFiltered(newTasks);
        };
        const handleCollapse = (row: Task) => {
            const newRow = {
                ...row,
                is_open: !row.is_open,
            };
            const payload = {
                index: row.order_number - 1,
                value: newRow,
            };
            dispatch(setTask(payload));
            const newTasks = tasksFiltered.map((row) => {
                if (row.task_id === newRow.task_id) {
                    return newRow;
                } else {
                    return row;
                }
            });
            setTasksFiltered(newTasks);
        };
        const handleOpenEdit = (row: Task) => {
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
                        <Stack
                            direction="row"
                            spacing={1}
                            divider={<Divider orientation="vertical" flexItem />}
                            justifyContent="space-between"
                        >
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setValues({
                                        ...values,
                                        promptOpen: true,
                                        promptMsg: `Delete task "${row.name}"?`,
                                        promptAction: () => deleteTask(row),
                                    });
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                            <Stack spacing={0}>
                                <IconButton
                                    size="small"
                                    onClick={() => moveTask(row, -1)}
                                    disabled={row.order_number === 1}
                                >
                                    <ArrowDropUpIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => moveTask(row, 1)}
                                    disabled={row.order_number === tasks.length}
                                >
                                    <ArrowDropDownIcon />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </TableCell>
                    <TableCell align="center">{row.order_number}</TableCell>
                    <TableCell align="center" style={{ wordWrap: 'break-word', maxWidth: 100 }}>
                        {row.name}
                    </TableCell>
                    <TableCell align="center" style={{ wordWrap: 'break-word', maxWidth: 100 }}>
                        {categories[row.category_id].name}
                    </TableCell>
                    <TableCell align="center">{new Date(row.due_date).toLocaleString()}</TableCell>
                    <TableCell align="center">
                        <Checkbox checked={row.is_done} onChange={() => handleCheckbox(row)} color="default" />
                    </TableCell>
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
                            <IconButton size="small" onClick={() => handleCollapse(row)}>
                                {row.is_open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Stack>
                    </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: categories[row.category_id].color }}>
                    <TableCell
                        style={{ paddingBottom: row.is_open ? 10 : 0, paddingTop: row.is_open ? 10 : 0 }}
                        colSpan={7}
                    >
                        <Collapse in={row.is_open} timeout="auto" unmountOnExit>
                            <Grid container style={{ width: 790 }} spacing={3}>
                                <Grid item xs={6}>
                                    <Typography variant="h5" style={{ marginTop: 5, marginBottom: 5 }}>
                                        {'Description'}
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                        {row.description === '' ? 'No description' : row.description}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Divider orientation="vertical" />
                                </Grid>
                                <Grid item xs={5.5}>
                                    <Typography variant="h5" style={{ marginTop: 5, marginBottom: 5 }}>
                                        {'Scheduled Notifications'}
                                    </Typography>
                                    <Grid container direction="column">
                                        {row.notifications.length === 0 ? (
                                            <div />
                                        ) : (
                                            row.notifications.map((n: Notification) => (
                                                <NotificationRow key={n.notification_id} notif={n} task={row} />
                                            ))
                                        )}
                                        <Grid container spacing={1} m={0.5} justifyContent="center" alignItems="center">
                                            <Grid item xs={12}>
                                                <Chip
                                                    label="Schedule New Notification"
                                                    variant="filled"
                                                    onClick={() => {
                                                        setCurrNotificationTask(row);
                                                        setOpenCreateNotification(true);
                                                    }}
                                                    style={{ width: '100%' }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    }
    function TaskEdit(props: { row: Task }) {
        const { row } = props;
        const [name, setName] = React.useState(row.name);
        const [description, setDescription] = React.useState(row.description);
        const [category, setCategory] = React.useState(row.category_id);
        const [duedate, setDuedate] = React.useState<Date | null>(new Date(row.due_date));
        function isValidTask() {
            if (name === '') {
                return false;
            }
            if (duedate === null || isNaN(duedate.valueOf())) {
                return false;
            }
            return true;
        }
        function handleEditTask() {
            if (name === '') {
                return;
            }
            if (duedate === null || isNaN(duedate.valueOf())) {
                return;
            }
            const newRow = {
                ...row,
                name: name,
                description: description,
                category_id: category,
                due_date: duedate.toISOString(),
            };
            const payload = {
                index: row.order_number - 1,
                value: newRow,
            };
            dispatch(setTask(payload));
            updateTask(newRow);
            const newTasks = tasksFiltered.map((row, i) => {
                if (i === payload.index) {
                    return newRow;
                } else {
                    return row;
                }
            });
            setTasksFiltered(newTasks);
            handleCloseTaskEdit();
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Edit Task'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <TextField
                            label="Task name"
                            value={name}
                            onChange={(event) => {
                                if (event.target.value.length > 50) {
                                    setName(event.target.value.slice(0, 50));
                                } else {
                                    setName(event.target.value);
                                }
                            }}
                            helperText={name.length >= 50 ? '50 character limit reached' : ''}
                            required
                        />
                        <TextField
                            label="Description"
                            multiline
                            rows={6}
                            value={description}
                            onChange={(event) => {
                                if (event.target.value.length > 150) {
                                    setDescription(event.target.value.slice(0, 150));
                                } else {
                                    setDescription(event.target.value);
                                }
                            }}
                            helperText={description.length >= 150 ? '150 character limit reached' : ''}
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
                            <MobileDateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Due Date"
                                value={duedate}
                                onChange={(newValue) => {
                                    setDuedate(newValue);
                                }}
                            />
                        </LocalizationProvider>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" disabled={!isValidTask()} onClick={handleEditTask}>
                        {'Apply'}
                    </Button>
                    <Button color="secondary" onClick={handleCloseTaskEdit}>
                        {'Close'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function TaskCreate() {
        const [name, setName] = React.useState('');
        const [description, setDescription] = React.useState('');
        const [category, setCategory] = React.useState(parseInt(Object.keys(categories)[0]));
        const [duedate, setDuedate] = React.useState<Date | null>(new Date());
        function isValidTask() {
            if (name === '') {
                return false;
            }
            if (duedate === null || isNaN(duedate.valueOf())) {
                return false;
            }
            return true;
        }
        function handleCreateTask() {
            if (name === '') {
                return;
            }
            if (duedate === null || isNaN(duedate.valueOf())) {
                return;
            }
            const newRow = {
                name: name,
                description: description,
                category_id: Number(category),
                due_date: duedate.toISOString(),
            };
            createTask(newRow);
            setIsCreatingTask(false);
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Create Task'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <TextField
                            label="Task name"
                            value={name}
                            onChange={(event) => {
                                if (event.target.value.length > 50) {
                                    setName(event.target.value.slice(0, 50));
                                } else {
                                    setName(event.target.value);
                                }
                            }}
                            helperText={name.length >= 50 ? '50 character limit reached' : ''}
                            required
                        />
                        <TextField
                            label="Description"
                            multiline
                            rows={6}
                            value={description}
                            onChange={(event) => {
                                if (event.target.value.length > 150) {
                                    setDescription(event.target.value.slice(0, 150));
                                } else {
                                    setDescription(event.target.value);
                                }
                            }}
                            helperText={description.length >= 150 ? '150 character limit reached' : ''}
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
                            <MobileDateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Due Date"
                                value={duedate}
                                onChange={(newValue) => {
                                    setDuedate(newValue);
                                }}
                            />
                        </LocalizationProvider>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" disabled={!isValidTask()} onClick={handleCreateTask}>
                        {'Create'}
                    </Button>
                    <Button color="secondary" onClick={() => setIsCreatingTask(false)}>
                        {'Cancel'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }

    function CategoryRow(props: { row: Category }) {
        const { row } = props;
        const handleOpenEdit = (row: Category) => {
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
                        <IconButton
                            size="small"
                            disabled={row.priority === 0}
                            onClick={() => {
                                setValues({
                                    ...values,
                                    promptOpen: true,
                                    promptMsg: `Delete category "${row.name}"?`,
                                    promptAction: () => deleteCategory(row),
                                });
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </TableCell>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">{row.priority}</TableCell>
                    <TableCell align="center">{row.color}</TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" disabled={row.priority === 0} onClick={() => handleOpenEdit(row)}>
                                <EditIcon />
                            </IconButton>
                        </Stack>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    }
    function CategoryEdit(props: { row: Category }) {
        const { row } = props;
        const [name, setName] = React.useState(row.name);
        const [priority, setPriority] = React.useState(row.priority.toString());
        const [color, setColor] = React.useState(row.color);
        function isValidCategory() {
            if (name === '') {
                return false;
            }
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
                            onChange={(event) => {
                                if (event.target.value.length <= 50 || event.target.value.length < name.length) {
                                    setName(event.target.value);
                                }
                            }}
                            helperText={name.length >= 50 ? '50 character limit reached' : ''}
                            required
                        />
                        <TextField
                            label="Category priority"
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                            helperText="Value must be greater than 0"
                        />
                        <Typography variant="h6">{'Category Color'}</Typography>
                        <HexColorPicker color={color} onChange={setColor} style={{ width: '100%' }} />
                        <HexColorInput
                            prefixed
                            color={color}
                            onChange={setColor}
                            style={{
                                padding: 6,
                                marginTop: 2,
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                background: '#eee',
                                outline: 'none',
                                font: 'inherit',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" disabled={!isValidCategory()} onClick={handleEditCategory}>
                        {'Apply'}
                    </Button>
                    <Button color="secondary" onClick={handleCloseCategoryEdit}>
                        {'Close'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function CategoryCreate() {
        const [name, setName] = React.useState('');
        const [priority, setPriority] = React.useState('1');
        const [color, setColor] = React.useState('#FFFFFF');
        function isValidCategory() {
            if (name === '') {
                return false;
            }
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
                            onChange={(event) => {
                                if (event.target.value.length <= 50 || event.target.value.length < name.length) {
                                    setName(event.target.value);
                                }
                            }}
                            helperText={name.length >= 50 ? '50 character limit reached' : ''}
                            required
                        />
                        <TextField
                            label="Category priority"
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                            helperText="Value must be greater than 0"
                        />
                        <Typography variant="h6">{'Category Color'}</Typography>
                        <HexColorPicker color={color} onChange={setColor} style={{ width: '100%' }} />
                        <HexColorInput
                            prefixed
                            color={color}
                            onChange={setColor}
                            style={{
                                padding: 6,
                                marginTop: 2,
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                background: '#eee',
                                outline: 'none',
                                font: 'inherit',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" disabled={!isValidCategory()} onClick={handleCreateCategory}>
                        {'Create'}
                    </Button>
                    <Button color="secondary" onClick={handleBoolToggle('isCreatingCategory')}>
                        {'Cancel'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function CategoryView() {
        return (
            <React.Fragment>
                <DialogTitle>{'Edit categories'}</DialogTitle>
                <DialogContent dividers style={{ maxHeight: '70vw' }}>
                    <Stack spacing={2} m={2}>
                        <TableContainer component={Paper}>
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
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleBoolToggle('isCreatingCategory')}
                        endIcon={<AddIcon />}
                    >
                        {'Add Category'}
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handleBoolToggle('viewCategories')}>
                        {'Close'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }

    function NotificationEdit(props: { notif: Notification; task: Task }) {
        const { notif, task } = props;
        const [notifyDate, setNotifyDate] = React.useState<Date | null>(new Date(notif.notify_date));
        const [emailNotify, setEmailNotify] = React.useState(notif.email_notify);
        const [telegramNotify, setTelegramNotify] = React.useState(notif.telegram_notify);
        function isValidNotif() {
            return notifyDate !== null && !isNaN(notifyDate.valueOf());
        }
        function handleUpdateNotif() {
            if (notifyDate === null || isNaN(notifyDate.valueOf())) {
                return;
            }
            const newNotif: Notification = {
                notification_id: notif.notification_id,
                notify_date: notifyDate.toISOString(),
                email_notify: emailNotify,
                telegram_notify: telegramNotify,
            };
            updateNotification(newNotif, task);
            setCurrNotificationTask(null);
            setEditingNotification(null);
            setOpenEditNotification(false);
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Edit notification'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <MobileDateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Notification Date"
                                value={notifyDate}
                                onChange={(newValue) => {
                                    setNotifyDate(newValue);
                                }}
                            />
                        </LocalizationProvider>
                        <FormControlLabel
                            control={
                                <Switch
                                    color="secondary"
                                    checked={emailNotify}
                                    onClick={() => setEmailNotify(!emailNotify)}
                                />
                            }
                            label="Send notification by email"
                            labelPlacement="end"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    color="secondary"
                                    checked={telegramNotify}
                                    onClick={() => setTelegramNotify(!telegramNotify)}
                                />
                            }
                            label="Send notification by telegram"
                            labelPlacement="end"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" disabled={!isValidNotif()} onClick={handleUpdateNotif}>
                        {'Update'}
                    </Button>
                    <Button
                        color="secondary"
                        onClick={() => {
                            setCurrNotificationTask(null);
                            setEditingNotification(null);
                            setOpenEditNotification(false);
                        }}
                    >
                        {'Cancel'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function NotificationCreate(props: { task: Task }) {
        const [notifyDate, setNotifyDate] = React.useState<Date | null>(new Date());
        const [emailNotify, setEmailNotify] = React.useState(true);
        const [telegramNotify, setTelegramNotify] = React.useState(true);
        function isValidNotif() {
            return notifyDate !== null && !isNaN(notifyDate.valueOf());
        }
        function handleCreateNotif() {
            if (notifyDate === null || isNaN(notifyDate.valueOf())) {
                return;
            }
            const newRow: CreatedNotification = {
                notify_date: notifyDate.toISOString(),
                email_notify: emailNotify,
                telegram_notify: telegramNotify,
            };
            createNotification(newRow, props.task);
            setCurrNotificationTask(null);
            setOpenCreateNotification(false);
        }
        return (
            <React.Fragment>
                <DialogTitle>{'Schedule notification'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} m={1}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <MobileDateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                label="Notification Date"
                                value={notifyDate}
                                onChange={(newValue) => {
                                    setNotifyDate(newValue);
                                }}
                            />
                        </LocalizationProvider>
                        <FormControlLabel
                            control={
                                <Switch
                                    color="secondary"
                                    checked={emailNotify}
                                    onClick={() => setEmailNotify(!emailNotify)}
                                />
                            }
                            label="Send notification by email"
                            labelPlacement="end"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    color="secondary"
                                    checked={telegramNotify}
                                    onClick={() => setTelegramNotify(!telegramNotify)}
                                />
                            }
                            label="Send notification by telegram"
                            labelPlacement="end"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" disabled={!isValidNotif()} onClick={handleCreateNotif}>
                        {'Create'}
                    </Button>
                    <Button
                        color="secondary"
                        onClick={() => {
                            setCurrNotificationTask(null);
                            setOpenCreateNotification(false);
                        }}
                    >
                        {'Cancel'}
                    </Button>
                </DialogActions>
            </React.Fragment>
        );
    }
    function NotificationRow(props: { notif: Notification; task: Task }) {
        const { notif, task } = props;
        return (
            <React.Fragment>
                <Grid container spacing={1} m={0.5} justifyContent="center" alignItems="center">
                    <Grid item xs={10}>
                        <Chip
                            key={notif.notification_id}
                            label={new Date(notif.notify_date).toLocaleString()}
                            variant="filled"
                            onDelete={() => {
                                setValues({
                                    ...values,
                                    promptOpen: true,
                                    promptMsg: `Delete notification on ${new Date(
                                        notif.notify_date,
                                    ).toLocaleString()}?`,
                                    promptAction: () => deleteNotification(notif, task),
                                });
                            }}
                            onClick={() => {
                                setCurrNotificationTask(task);
                                setEditingNotification(notif);
                                setOpenEditNotification(true);
                            }}
                            style={{ width: '100%' }}
                        />
                    </Grid>
                    <Grid item xs={1}>
                        <EmailIcon color={notif.email_notify ? 'secondary' : 'disabled'} />
                    </Grid>
                    <Grid item xs={1}>
                        <TelegramIcon color={notif.telegram_notify ? 'secondary' : 'disabled'} />
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }

    function Prompt(props: { action: () => void; msg: string }) {
        const { action, msg } = props;
        return (
            <React.Fragment>
                <DialogTitle>{'Confirm action'}</DialogTitle>
                <DialogContent style={{ wordWrap: 'break-word' }}>
                    <DialogContentText>{msg}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            action();
                            closePrompt();
                        }}
                        color="secondary"
                    >
                        {'Confirm'}
                    </Button>
                    <Button onClick={closePrompt} color="secondary">
                        {'Cancel'}
                    </Button>
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
            <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
                <MenuItem onClick={() => navigate('/accountsettings')}>{'My account'}</MenuItem>
                <MenuItem onClick={logout}>{'Logout'}</MenuItem>
            </Menu>
            <Menu
                id="sort-menu"
                anchorEl={values.sortMenuAnchor}
                keepMounted
                open={Boolean(values.sortMenuAnchor)}
                onClose={closeMenu('sortMenuAnchor')}
            >
                <MenuItem onClick={handleBoolToggle('sortAscending')}>
                    <Stack
                        sx={{ width: 190 }}
                        direction="row"
                        spacing={0}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        {values.sortAscending ? 'Ascending order' : 'Descending order'}
                        <Switch checked={values.sortAscending} color="secondary" />
                    </Stack>
                </MenuItem>
                <MenuItem onClick={sortByTaskName}>{'Sort by Task Name'}</MenuItem>
                <MenuItem onClick={sortByCategoryName}>{'Sort by Category Name'}</MenuItem>
                <MenuItem onClick={sortByCategoryPriority}>{'Sort by Category Priority'}</MenuItem>
                <MenuItem onClick={sortByDueDate}>{'Sort by Due Date'}</MenuItem>
            </Menu>
            <Menu
                id="delete-menu"
                anchorEl={values.deleteMenuAnchor}
                keepMounted
                open={Boolean(values.deleteMenuAnchor)}
                onClose={closeMenu('deleteMenuAnchor')}
            >
                <MenuItem
                    onClick={() => {
                        setValues({
                            ...values,
                            promptOpen: true,
                            promptMsg: 'Delete all completed tasks?',
                            promptAction: () => deleteCompleted(),
                        });
                    }}
                >
                    {'Delete completed'}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setValues({
                            ...values,
                            promptOpen: true,
                            promptMsg: 'Delete all overdue tasks?',
                            promptAction: () => deleteOverdue(),
                        });
                    }}
                >
                    {'Delete overdue'}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setValues({
                            ...values,
                            promptOpen: true,
                            promptMsg: 'Delete all currently displayed tasks?',
                            promptAction: () => deleteFiltered(),
                        });
                    }}
                >
                    {'Delete filtered'}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setValues({
                            ...values,
                            promptOpen: true,
                            promptMsg: 'Delete all tasks?',
                            promptAction: () => deleteAll(),
                        });
                    }}
                >
                    {'Delete all'}
                </MenuItem>
            </Menu>
            <Dialog open={values.promptOpen} onClose={closePrompt} maxWidth="xs" fullWidth>
                {values.promptAction === null ? (
                    <div />
                ) : (
                    <Prompt action={values.promptAction} msg={values.promptMsg} />
                )}
            </Dialog>
            <Dialog open={values.filterMenuOpen} onClose={closeFilterMenu} maxWidth="sm" fullWidth scroll="paper">
                <DialogTitle>{'Filter Menu'}</DialogTitle>
                <DialogContent dividers style={{ maxHeight: '70vw' }}>
                    <Stack spacing={0}>
                        <h3>{'Categories'}</h3>
                        <Grid container spacing={0.5}>
                            {Object.keys(categories).map((key) => (
                                <Grid item xs={4} key={key}>
                                    <MenuItem dense onClick={toggleCategoryFilter(parseInt(key))}>
                                        <Grid container alignItems="center">
                                            <Grid item xs={9} style={{ overflow: 'hidden' }}>
                                                {categories[parseInt(key)].name}
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Switch checked={categoriesFilter[parseInt(key)]} color="secondary" />
                                            </Grid>
                                        </Grid>
                                    </MenuItem>
                                </Grid>
                            ))}
                        </Grid>
                        <h3>{'Date range'}</h3>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <MobileDateRangePicker
                                startText="Start"
                                value={values.filterDateRange}
                                onChange={(newValue) => {
                                    setValues({
                                        ...values,
                                        filterDateRange: newValue,
                                    });
                                }}
                                renderInput={(startProps, endProps) => (
                                    <React.Fragment>
                                        <TextField {...startProps} />
                                        <Box sx={{ mx: 2 }}>{' to '}</Box>
                                        <TextField {...endProps} />
                                    </React.Fragment>
                                )}
                                clearable
                            />
                        </LocalizationProvider>
                        <h3>{'Task number range'}</h3>
                        <h4 style={{ paddingTop: 0, paddingBottom: 0, marginTop: 0.5, marginBottom: 0.5 }}>
                            {`Showing task ${values.filterTaskNumberRange[0]} to ${values.filterTaskNumberRange[1]}`}
                        </h4>
                        <Slider
                            value={values.filterTaskNumberRange}
                            onChange={(event: Event, newValue: number | number[]) => {
                                setValues({
                                    ...values,
                                    filterTaskNumberRange: newValue as number[],
                                });
                            }}
                            valueLabelDisplay="auto"
                            min={1}
                            max={tasks.length}
                            step={1}
                            marks
                            color="secondary"
                            style={{ marginLeft: 10, marginRight: 10, width: '95%' }}
                        />
                        <Stack direction="row" alignItems="center" style={{ marginTop: 15 }}>
                            <h3>{'Show completed tasks'}</h3>
                            <Switch
                                checked={values.showCompletedTask}
                                onChange={handleBoolToggle('showCompletedTask')}
                                color="secondary"
                            />
                        </Stack>
                        <Stack direction="row" alignItems="center">
                            <h3>{'Show uncompleted tasks'}</h3>
                            <Switch
                                checked={values.showUncompletedTask}
                                onChange={handleBoolToggle('showUncompletedTask')}
                                color="secondary"
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" onClick={closeFilterMenu}>
                        {'Close'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={openCreateNotification}
                onClose={() => {
                    setCurrNotificationTask(null);
                    setOpenCreateNotification(false);
                }}
                maxWidth="sm"
                fullWidth
            >
                {currNotificationTask === null ? <div /> : <NotificationCreate task={currNotificationTask} />}
            </Dialog>
            <Dialog
                open={openEditNotification}
                onClose={() => {
                    setCurrNotificationTask(null);
                    setEditingNotification(null);
                    setOpenEditNotification(false);
                }}
                maxWidth="sm"
                fullWidth
            >
                {currNotificationTask === null || editingNotification === null ? (
                    <div />
                ) : (
                    <NotificationEdit notif={editingNotification} task={currNotificationTask} />
                )}
            </Dialog>
            <Dialog
                open={values.isCreatingCategory}
                onClose={handleBoolToggle('isCreatingCategory')}
                maxWidth="sm"
                fullWidth
            >
                <CategoryCreate />
            </Dialog>
            <Dialog open={values.isEditingCategory} onClose={handleCloseCategoryEdit} maxWidth="sm" fullWidth>
                {values.editingCategory === null ? <div /> : <CategoryEdit row={values.editingCategory} />}
            </Dialog>
            <Dialog open={values.viewCategories} onClose={handleBoolToggle('viewCategories')} maxWidth="md" fullWidth>
                <CategoryView />
            </Dialog>
            <Dialog open={isCreatingTask} onClose={() => setIsCreatingTask(false)} maxWidth="sm" fullWidth>
                <TaskCreate />
            </Dialog>
            <Dialog open={values.isEditingTask} onClose={handleCloseTaskEdit} maxWidth="sm" fullWidth>
                {values.editingTask === null ? <div /> : <TaskEdit row={values.editingTask} />}
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
                <Paper elevation={3}>
                    <Stack spacing={0}>
                        <Typography variant="h4" style={{ margin: 35 }}>
                            <Stack direction="row" justifyContent="center" alignItems="center">
                                {'To-Do List'}
                                <ListAltIcon style={{ paddingLeft: 5 }} fontSize="inherit" />
                            </Stack>
                        </Typography>
                        <TextField
                            label="Search"
                            value={values.search}
                            onChange={handleChange('search')}
                            onKeyDown={handleKeyDown}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={applyFilter} onMouseDown={handleMouseDown} edge="end">
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            style={{ marginLeft: 20, marginRight: 20, marginBottom: 20 }}
                        />
                        <Divider />
                        <div style={{ maxHeight: 515, overflowY: 'scroll' }}>
                            <TableContainer
                                style={{ marginTop: 20, marginBottom: 20, marginLeft: 10, maxWidth: '98%' }}
                                component={Paper}
                            >
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    divider={<Divider orientation="vertical" flexItem />}
                                                    justifyContent="space-between"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        aria-controls="delete-menu"
                                                        aria-haspopup="true"
                                                        onClick={openMenu('deleteMenuAnchor')}
                                                    >
                                                        <DeleteSweepIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        aria-controls="sort-menu"
                                                        aria-haspopup="true"
                                                        onClick={openMenu('sortMenuAnchor')}
                                                    >
                                                        <SortIcon />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">{'No.'}</TableCell>
                                            <TableCell align="center">{'Name'}</TableCell>
                                            <TableCell align="center">{'Category'}</TableCell>
                                            <TableCell align="center">{'Due Date'}</TableCell>
                                            <TableCell align="center">{'Done'}</TableCell>
                                            <TableCell>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    divider={<Divider orientation="vertical" flexItem />}
                                                    justifyContent="space-between"
                                                >
                                                    <IconButton size="small" onClick={openFilterMenu}>
                                                        <FilterAltIcon />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={refresh}>
                                                        <RefreshIcon />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tasksFiltered.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    style={{ paddingBottom: 0, paddingTop: 0 }}
                                                    colSpan={7}
                                                    align="center"
                                                >
                                                    <h2>{'No tasks found'}</h2>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            tasksFiltered.map((row) => <TaskRow key={row.task_id} row={row} />)
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                        <Divider />
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => setIsCreatingTask(true)}
                            endIcon={<AddIcon />}
                            style={{ marginLeft: 20, marginRight: 20, marginTop: 20 }}
                        >
                            {'Add task'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleBoolToggle('viewCategories')}
                            style={{ margin: 20 }}
                        >
                            {'View and edit categories'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    );
};

export default Dashboard;
