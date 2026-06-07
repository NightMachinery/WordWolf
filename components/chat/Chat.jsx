import { useState, useEffect } from 'react';
import axios from 'axios';
import uuid from 'react-uuid';
import { Button, Input } from '@chakra-ui/react';
import ReactScrollableFeed from 'react-scrollable-feed';
import { socket } from '../../pages/api/service/socket';
import Message from './Message';

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 4h16v11H7.8L4 18.8V4Zm2 2v8l1-1h11V6H6Zm3 3h6v2H9V9Z" />
    </svg>
  );
}

function Chat({ players, username, lobby }) {
  const [message, setMessage] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    axios(`/messages/${lobby}`)
      .then((data) => setAllMessages(data.data))
      .catch();
  }, []);
  useEffect(() => {
    socket.on('allMessages', (data) => {
      setAllMessages(data);
    });
  }, [socket]);

  const handleMessageOnChange = (input) => {
    setMessage(input);
  };
  const handleSubmitOnClick = async () => {
    const data = {
      authId: username,
      name: players[username]?.displayName || players[username]?.name || username,
      lobby,
      message,
      id: uuid(),
    };
    await socket.emit('newMessage', data, lobby);
    setMessage('');
  };
  const is16 = (typeof window !== 'undefined' && window.innerWidth > 1500);

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
    <div
      style={{
        width: '22vw',
        height: '90vh',
        backgroundColor: '#C4C4C4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: '15px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '90%' }}>
        <h2 style={{
          position: 'relative',
          textAlign: 'center',
          fontSize: '32px',
          padding: '10px',
          fontWeight: 'bold',
        }}
        >
          CHAT
        </h2>
        <Button aria-label="Close chat" title="Close chat" size="sm" onClick={() => setOpen(false)}>×</Button>
      </div>
      <div style={is16
        ? {
          height: '70vh',
          width: '19.8vw',
          backgroundColor: 'white',
        }
        : {
          height: '66vh',
          width: '19.8vw',
          backgroundColor: 'white',
        }}
      >
        <ReactScrollableFeed>
          {allMessages?.map((msg) => <Message key={msg.id} players={players} message={msg} />)}
        </ReactScrollableFeed>
      </div>
      <div style={{ display: 'flex', marginTop: '15px', width: '90%' }}>
        <Input
          value={message}
          style={{
            backgroundColor: 'white', height: '60px', borderRadius: '0px', marginRight: '10px',
          }}
          onChange={(e) => handleMessageOnChange(e.target.value)}
        />
        <Button
          style={{
            backgroundColor: 'black',
            color: 'white',
            width: '25%',
            height: '60px',
            fontSize: '18px',
            borderRadius: '0px',
          }}
          onClick={() => handleSubmitOnClick()}
        >
          SEND
        </Button>
      </div>
    </div>
  );
}

export default Chat;
