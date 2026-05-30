import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    accessToken: null,
    initialized: false,
};


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user ?? state.user;
            state.accessToken = action.payload.accessToken ?? state.accessToken;
            state.initialized = true;
            localStorage.setItem('user', JSON.stringify(state.user));
            
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            localStorage.removeItem('user');
            state.initialized = true;
        },
        // mark that an auth initialization attempt completed (success or failure)
        setInitialized: (state) => {
            state.initialized = true;
        }
    }
});

export const {setCredentials, logout, setInitialized} = authSlice.actions;
export default authSlice.reducer;