import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import api from './api/axios';
import {setCredentials,setInitialized, logout} from './features/auth/authSlice';


import './App.css'

import {BrowserRouter ,Routes, Route} from 'react-router-dom';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";


import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import UiLayout from './layouts/UiLayout.jsx';

import ConversationsList from './components/ConversationsList.jsx';
import SendFriendRequest from './components/SendFriendRequest.jsx';
import FriendRequests from './components/FriendRequests.jsx';
import RequestsSent from './components/RequestsSent.jsx';



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
        <Route element={<ProtectedRoute />} >
        <Route element={<UiLayout />} >
        <Route path='/' element={<Home />} >
        <Route index element={<ConversationsList />} />
        <Route path='/available-users' element={<SendFriendRequest />} />
        <Route path='/friendRequests' element={<FriendRequests />} />
        <Route path='/requestsSent' element={<RequestsSent />} />
        </Route>
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
