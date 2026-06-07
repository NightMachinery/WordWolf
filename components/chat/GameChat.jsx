import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Button, Input } from '@chakra-ui/react';
import ReactScrollableFeed from 'react-scrollable-feed';
import uuid from 'react-uuid';
import { StoreContext } from '../../pages/api/contextStore';
import { socket } from '../../pages/api/service/socket';
import Message from './Message';

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 4h16v11H7.8L4 18.8V4Zm2 2v8l1-1h11V6H6Zm3 3h6v2H9V9Z" />
    </svg>
  );
}

function GameChat({ players, username }) {
  const [message, setMessage] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const { lobby } = useContext(StoreContext);
  // get the message whenever there is new message sent
  useEffect(() => {
    axios.get(`/gameMessages/${lobby.name}`)
      .then((data) => setAllMessages(data.data))
      .catch();
  }, []);
  useEffect(() => {
    socket.on('allGameMessages', (data) => {
      setAllMessages(data);
    });
  }, [socket]);

  const handleMessageOnChange = (input) => {
    setMessage(input);
  };

  const handleSubmitOnClick = async (isQuestion) => {
    if (message.length === 0) {
      alert('message can not be blank');
      return;
    }
    const data = {
      id: uuid(), authId: username, name: players[username]?.displayName || players[username]?.name || username, lobby: lobby.name, message,
    };
    if (isQuestion) { data.question = true; } else { data.question = false; }
    await socket.emit('newGameMessage', data, lobby.name);
    setMessage('');
  };

  if (!open) {
    return (
      <Button
        aria-label="Open chat"
        title="Open chat"
        width="48px"
        height="48px"
        minWidth="48px"
        borderRadius="full"
        backgroundColor="#D19E61"
        color="black"
        onClick={() => setOpen(true)}
      >
        <ChatIcon />
      </Button>
    );
  }

  return (
    <div style={{
      width: '542px', height: '181px', backgroundColor: 'white',
    }}
    >
      <Button aria-label="Close chat" title="Close chat" size="xs" onClick={() => setOpen(false)}>×</Button>
      <ReactScrollableFeed>
        {allMessages?.map((msg) => <Message key={msg.id} message={msg} players={players} />)}
      </ReactScrollableFeed>

      {(!players || (!players[username].spectator && !players[username].observer)) ? (
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'white',
        }}
        >
          {' '}
          <Input
            value={message}
            style={{
              backgroundColor: '#C4C4C4', width: '320px', height: '45px', marginRight: '10px', borderRadius: '0px',
            }}
            onChange={(e) => handleMessageOnChange(e.target.value)}
          />

          {(lobby.mayor?.authId === username || lobby.gameState !== 'questionRound') ? '' : (
            <Button
              style={{
                backgroundColor: '#D19E61', color: 'black', width: '97px', height: '46px', marginRight: '10px', borderRadius: '0px',
              }}
              onClick={() => handleSubmitOnClick(true)}
            >
              ASK
            </Button>
          )}

          <Button
            style={{
              backgroundColor: 'black', color: 'white', width: '97px', height: '46px', borderRadius: '0px',
            }}
            onClick={() => handleSubmitOnClick()}
          >
            SEND
          </Button>
        </div>
      ) : ''}
    </div>
  );
}

export default GameChat;
