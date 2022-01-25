import urlReducer from './urlSlice';
import userReducer from './userSlice';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
    reducer: {
        url: urlReducer,
        user: userReducer,
    },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
