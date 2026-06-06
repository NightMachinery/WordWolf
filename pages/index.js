import axios from 'axios';
import { useContext } from 'react';
import { useRouter } from 'next/router';
import { StoreContext } from './api/contextStore';
import Login from '../components/Login';

function Home() {
  const router = useRouter();
  const { loginData, setLoginData } = useContext(StoreContext);

  const handleFormChange = (e) => {
    e.preventDefault();
    setLoginData({ [e.target.name]: e.target.value });
  };

  const saveAndRoute = (create) => {
    setLoginData({ create });
    router.push(`/${loginData.lobby}/lobby`);
  };

  const handleCreateLobby = async (e) => {
    e.preventDefault();
    if (loginData.name && loginData.lobby && loginData.authId) {
      axios
        .get('/createLobby', { params: { loginData } })
        .then((res) => {
          if (res.data === 'ok') {
            saveAndRoute(true);
          } else {
            alert(res.data === 'error' ? 'lobby name already taken' : res.data);
          }
        })
        .catch((err) => new Error(err));
    } else {
      alert('one of the fields is missing');
    }
  };

  const handleJoinLobby = async (e) => {
    e.preventDefault();
    if (loginData.name && loginData.lobby && loginData.authId) {
      axios
        .get('/joinLobby', { params: { loginData } })
        .then((res) => {
          if (res.data === 'ok') {
            saveAndRoute(false);
          } else {
            alert(res.data);
          }
        })
        .catch((err) => new Error(err));
    } else {
      alert('one of the fields is missing');
    }
  };

  return (
    <Login
      loginData={loginData}
      handleFormChange={handleFormChange}
      handleCreateLobby={handleCreateLobby}
      handleJoinLobby={handleJoinLobby}
    />
  );
}

export default Home;
