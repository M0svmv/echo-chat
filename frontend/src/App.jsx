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

import ConversationsList from './components/parentComponents/sideMenu/chats/ConversationsList.jsx';
import ArchiveChats from './components/parentComponents/sideMenu/chats/ArchiveChats.jsx';
import GroupsList from './components/parentComponents/sideMenu/chats/GroupsList.jsx';

import SendFriendRequest from './components/parentComponents/sideMenu/friends/SendFriendRequest.jsx';
import FriendRequests from './components/parentComponents/sideMenu/friends/FriendRequests.jsx';
import RequestsSent from './components/parentComponents/sideMenu/friends/RequestsSent.jsx';
import Friends from './components/parentComponents/sideMenu/friends/FriendsList.jsx';

import Profile from './components/parentComponents/sideMenu/profile/Profile.jsx';
import UpdateProfile from './components/parentComponents/sideMenu/profile/UpdateProfile.jsx';
import ChangePassword from './components/parentComponents/sideMenu/profile/ChangePassword.jsx';


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
        <Route path='/groups' element={<GroupsList />} />
        <Route path='/available-users' element={<SendFriendRequest />} />
        <Route path='/friendRequests' element={<FriendRequests />} />
        <Route path='/requestsSent' element={<RequestsSent />} />
        <Route path='/archive' element={<ArchiveChats />} />
        <Route path='/friends' element={<Friends />} />
        <Route path='/updateProfile' element={<UpdateProfile />} />
        <Route path='/changePassword' element={<ChangePassword />} />
        <Route path='/profile' element={<Profile />} />
        
        </Route>
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
