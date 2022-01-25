import { createSlice } from '@reduxjs/toolkit';

export interface Notification {
    notification_id: number;
    notify_date: string;
    email_notify: boolean;
    telegram_notify: boolean;
}

export interface Task {
    task_id: number;
    category_id: keyof Categories;
    order_number: number;
    name: string;
    description: string;
    due_date: string;
    is_done: boolean;
    is_open: boolean;
    notifications: Notification[];
}

export type Tasks = Task[];

export interface Category {
    category_id: keyof Categories;
    name: string;
    priority: number;
    color: string;
}

export interface Categories {
    [category_id: number]: Category;
}

interface userState {
    tasks: Tasks;
    categories: Categories;
}

const initialState = {
    tasks: [],
    categories: {},
} as userState;

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setTasks: (state, action) => {
            state.tasks = action.payload;
        },
        setTask: (state, action) => {
            state.tasks[action.payload.index] = action.payload.value;
        },
        setCategories: (state, action) => {
            state.categories = action.payload;
        },
        setCategory: (state, action) => {
            state.categories[action.payload.id] = action.payload.value;
        },
        removeCategory: (state, action) => {
            delete state.categories[action.payload.id];
        },
    },
});

export const { setTasks, setTask, setCategories, setCategory, removeCategory } = userSlice.actions;
export default userSlice.reducer;
