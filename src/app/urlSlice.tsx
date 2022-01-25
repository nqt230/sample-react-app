import { createSlice } from '@reduxjs/toolkit';

const urlSlice = createSlice({
    name: 'url',
    initialState: {
        baseURL: 'http://localhost:8080/',
    },
    reducers: {},
});

export default urlSlice.reducer;
