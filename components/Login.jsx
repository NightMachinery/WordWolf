import { Button, Input, Box } from '@chakra-ui/react';

import Image from 'next/image';
import Rules from './Rules';
import Credits from './Credits';
import LoginLogo from '../assets/LoginLogo.svg';
import LoginBanner from '../assets/LoginBanner.svg';

function Login({
  loginData, joinLobbyName, handleFormChange, handleCreateLobby, handleJoinLobby,
}) {
  return (
    <Box
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#211E32', paddingTop: '20px',
      }}
    >
      <Image src={LoginLogo} />
      <form style={{
        width: '550px', height: '520px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 80px', marginTop: '10px', marginBottom: '40px',
      }}
      >
        <span style={{
          alignSelf: 'center', background: '#fff', fontSize: '32px', marginTop: '5px', marginBottom: '5px',
        }}
        >
          Welcome
        </span>
        {/* Login Pic */}
        <Image src={LoginBanner} style={{ borderRadius: '30px' }} />
        <span style={{ background: '#fff', marginTop: '20px' }}>Enter Display Name:</span>
        <Input
          type="text"
          size="md"
          width="25%"
          height="50px"
          placeholder="Display Name"
          name="name"
          value={loginData?.name || ''}
          onChange={(e) => handleFormChange(e)}
          style={{ width: '100%' }}
        />
        <Box background="#fff" fontSize="14px" marginTop="10px" marginBottom="15px">
          {joinLobbyName
            ? `Joining room: ${joinLobbyName}`
            : 'Open a room link to join an existing room, or create a new room.'}
        </Box>
        <Button h="50px" w="100%" onClick={(e) => handleJoinLobby(e)} style={{ marginBottom: '20px' }} borderRadius="0px" fontSize="24px">
          Join
        </Button>
        <Button h="50px" w="100%" onClick={(e) => handleCreateLobby(e)} borderRadius="0px" fontSize="24px" style={{ marginBottom: '30px' }}>
          Create
        </Button>
      </form>
      <Box display="flex" w="550px" justifyContent="space-evenly" flexDirection="row" style={{ marginBottom: '50px' }}>
        <Rules />
        <Credits />
      </Box>
    </Box>
  );
}

export default Login;
