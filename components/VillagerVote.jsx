import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalOverlay,
  ModalBody,
  Box,
} from '@chakra-ui/react';
import { useState, useContext } from 'react';
import styled from 'styled-components';
import { socket } from '../pages/api/service/socket';
import { StoreContext } from '../pages/api/contextStore';

function VillagerVote({ lobby, loginData }) {
  const [currVote, setCurrVote] = useState('---');
  const { voted, setVoted } = useContext(StoreContext);

  const clickedOnButton = (e) => {
    e.preventDefault();
    if (currVote === '---') {
      return;
    }
    socket.emit('VoteWerewolf', { player: lobby?.players[currVote], lobbyName: lobby?.name, requesterAuthId: loginData.authId });
    setVoted(true);
  };

  const pickedDrop = (e) => {
    setCurrVote(e.target.value);
  };

  return (
    <Modal isOpen={lobby?.gameState === 'outOfTokens' || lobby?.gameState === 'outOfTime'}>
      <ModalOverlay />
      <ModalContent display="flex" justifyContent="center" alignItems="center" textAlign="center">
        <ModalHeader>
          {lobby?.players[loginData.authId]?.role !== 'werewolf'
            ? <h1>WHO IS THE WOLF?</h1> : <h1>VOTING ROUND</h1>}
        </ModalHeader>
        <ModalBody>
          {lobby?.players[loginData.authId]?.role !== 'werewolf'
            ? (
              <Box display="flex" flexDirection="column">
                <ChooseW id="PlayersDrop" name="players" onChange={(e) => { pickedDrop(e); }}>
                  <option value="DEFAULT" selected disabled>---</option>
                  {lobby && Object.keys(lobby?.players)
                    .filter((p) => {
                      const player = lobby.players[p];
                      return loginData.authId !== p
                        && player.online
                        && player.spectator === false
                        && player.observer === false;
                    })
                    .map((p) => <option value={p}>{lobby.players[p].displayName}</option>)}
                </ChooseW>
                {voted ? null : <Box as="button" marginTop="10" backgroundColor="#C4C4C4" id="Submit" type="button" onClick={(e) => { clickedOnButton(e); }}>SUBMIT</Box>}
              </Box>
            ) : <h3>The villagers are currently voting...</h3>}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default VillagerVote;

const ChooseW = styled.select`
  text-align: center;
`;
