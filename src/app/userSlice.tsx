import { createSlice } from '@reduxjs/toolkit';

export interface task {
    task_id: number;
    category_id: keyof categories;
    order_number: number;
    name: string;
    description: string;
    due_date: string;
    notify_date: string;
    is_done: boolean;
    is_open: boolean;
}

type tasks = task[];

export interface category {
    category_id: keyof categories;
    name: string;
    priority: number;
    color: string;
}

export interface categories {
    [category_id: number]: category;
}

interface userState {
    uid: number;
    tasks: tasks;
    categories: categories;
}

const initialState = {
    uid: 0,
    tasks: [],
    categories: {},
} as userState;

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUid: (state, action) => {
            state.uid = action.payload;
        },
        setTasks: (state, action) => {
            state.tasks = action.payload;
        },
        setTask: (state, action) => {
            state.tasks[action.payload.index] = action.payload.value;
        },
        addCategory: (state, action) => {
            state.categories = {
                ...state.categories,
                [action.payload.id]: action.payload.value,
            };
        },
        setCategory: (state, action) => {
            state.categories[action.payload.id] = action.payload.value;
        },
    },
});

export const { setUid, setTasks, setTask, addCategory, setCategory } = userSlice.actions;
export default userSlice.reducer;
