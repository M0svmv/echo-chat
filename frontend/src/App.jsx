import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import api from './api/axios';
import {setCredentials,setInitialized, logout} from './features/auth/authSlice';


import './App.css'

import {BrowserRouter ,Routes, Route} from 'react-router-dom';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Chat from "./pages/Home.jsx";

import ProtectedRoute from './routes/ProtectedRoute.jsx';

function App() {

  const dispatch = useDispatch();

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const res = await api.post("/auth/refresh");

        dispatch(
          setCredentials({
            user: res.data.data.user,
            accessToken: res.data.data.accessToken,
          })
        );
      } catch (err) {
  if (err.response?.status === 401) {
    dispatch(logout());
  } else {
    console.log("refresh failed but not logout");
  }
} finally {
  dispatch(setInitialized());
}
    };

    refreshUser();
  }, [dispatch]);

  return (
    <>
    <BrowserRouter>
      <Routes>
        
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/' element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
