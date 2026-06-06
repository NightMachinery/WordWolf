import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  Box,
} from '@chakra-ui/react';
import { useState, useContext } from 'react';
import styled from 'styled-components';
import { socket } from '../pages/api/service/socket';
import { StoreContext } from '../pages/api/contextStore';


function WerewolfVote({ lobby, loginData }) {
  const [currVote, setCurrVote] = useState('---');
  const { voted, setVoted } = useContext(StoreContext);

  const clickedOnButton = (e) => {
    e.preventDefault();
    if (currVote === '---') {
      return;
    }
    socket.emit('VoteSeer', { player: lobby.players[currVote], lobbyName: lobby?.name, requesterAuthId: loginData.authId });
    setVoted(true);
  };

  const pickedDrop = (e) => {
    setCurrVote(e.target.value);
  };

  return (
    <Modal isOpen={lobby.gameState === 'wordGuessed'}>
      <ModalOverlay />
      <ModalContent display="flex" justifyContent="center" alignItems="center" textAlign="center">
        <ModalHeader>
          {lobby?.players[loginData.authId]?.role !== 'werewolf'
            ? <h1>VOTING ROUND</h1> : <h1>WHO IS THE SEER?</h1>}
        </ModalHeader>
        <ModalBody>
          {lobby?.players[loginData.authId]?.role !== 'werewolf'
            ? (
              <h3>The wolves are currently voting...</h3>
            )
            : (
              <Box display="flex" flexDirection="column">
                <ChooseS id="PlayersDrop" name="players" onChange={(e) => { pickedDrop(e); }}>
                  <option value="DEFAULT" selected disabled>---</option>
                  {lobby && Object.keys(lobby?.players)
                    .map((p) => ((loginData.authId !== p) && (lobby.players[p].spectator === false && lobby.players[p].observer === false))
                           && <option value={p}>{lobby.players[p].displayName}</option>)}
                </ChooseS>
                {voted ? null : <Box as="button" backgroundColor="#C4C4C4" marginTop="10" id="SubmitWeVote" onClick={(e) => { clickedOnButton(e); }}>SUBMIT</Box>}
              </Box>
            )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default WerewolfVote;

const ChooseS = styled.select`
  text-align: center;
`;
