import axios from 'axios';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { StoreContext } from './api/contextStore';
import Login from '../components/Login';

const slugWords = [
  'amber', 'brave', 'cinder', 'dawn', 'ember', 'forest', 'golden', 'harbor',
  'ivory', 'jade', 'kind', 'lunar', 'merry', 'nova', 'opal', 'prairie',
  'quiet', 'river', 'silver', 'thistle', 'umber', 'violet', 'willow', 'zephyr',
];

const randomInt = (max) => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint32Array(1);
    window.crypto.getRandomValues(bytes);
    return bytes[0] % max;
  }
  return Math.floor(Math.random() * max);
};

const generateLobbyName = () => {
  const first = slugWords[randomInt(slugWords.length)];
  const second = slugWords[randomInt(slugWords.length)];
  const number = randomInt(9000) + 1000;
  return `${first}-${second}-${number}`;
};

function Home() {
  const router = useRouter();
  const { loginData, setLoginData } = useContext(StoreContext);
  const queryLobby = typeof router.query.lobby === 'string' ? router.query.lobby : null;

  useEffect(() => {
    if (queryLobby) {
      setLoginData({ lobby: queryLobby, create: false });
    }
  }, [queryLobby]);

  const handleFormChange = (e) => {
    e.preventDefault();
    setLoginData({ [e.target.name]: e.target.value });
  };

  const saveAndRoute = (create, lobby) => {
    setLoginData({ create, lobby });
    router.push(`/${lobby}/lobby`);
  };

  const handleCreateLobby = async (e) => {
    e.preventDefault();
    const lobby = generateLobbyName();
    const payload = { ...loginData, lobby };
    if (payload.name && payload.authId) {
      axios
        .get('/createLobby', { params: { loginData: payload } })
        .then((res) => {
          if (res.data === 'ok') {
            saveAndRoute(true, lobby);
          } else {
            alert(res.data === 'error' ? 'generated lobby name already taken; try again' : res.data);
          }
        })
        .catch((err) => new Error(err));
    } else {
      alert('display name is missing');
    }
  };

  const handleJoinLobby = async (e) => {
    e.preventDefault();
    const lobby = queryLobby || loginData.lobby;
    const payload = { ...loginData, lobby };
    if (!lobby) {
      alert('open a room link to join, or create a new room');
      return;
    }
    if (payload.name && payload.authId) {
      axios
        .get('/joinLobby', { params: { loginData: payload } })
        .then((res) => {
          if (res.data === 'ok') {
            saveAndRoute(false, lobby);
          } else {
            alert(res.data);
          }
        })
        .catch((err) => new Error(err));
    } else {
      alert('display name is missing');
    }
  };

  return (
    <Login
      loginData={loginData}
      joinLobbyName={queryLobby || loginData.lobby}
      handleFormChange={handleFormChange}
      handleCreateLobby={handleCreateLobby}
      handleJoinLobby={handleJoinLobby}
    />
  );
}

export default Home;
