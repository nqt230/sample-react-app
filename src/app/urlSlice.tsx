import { createSlice } from '@reduxjs/toolkit';

const urlSlice = createSlice({
    name: 'url',
    initialState: {
        baseURL: 'https://cvwo-app230-backend.herokuapp.com/',
    },
    reducers: {},
});

export default urlSlice.reducer;
