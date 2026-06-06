import {
  Button, Modal, ModalContent, ModalOverlay,
  ModalHeader, ModalBody, ModalFooter, Box,
} from '@chakra-ui/react';

function MayorPickModal({ lobby, onMayorPick, loginData }) {
  const onWordPick = (e) => {
    onMayorPick(e.target.name);
  };

  return (
    <Modal isOpen={lobby.gameState === 'mayorPick'}>
      <ModalOverlay />
      <ModalContent display="flex" flexDirection="column">
        <ModalHeader textAlign="center">
          {lobby?.mayor?.authId === loginData.authId
            ? <Box>Mayor! Choose a word!</Box> : <Box>Mayor is choosing a word!</Box>}
        </ModalHeader>
        <ModalBody>
          {lobby?.mayor?.authId === loginData.authId
            ? (
              <Box display="flex" justifyContent="space-evenly">
                {lobby.words.map((word) => (
                  <Button key={word} background="#D19E61" name={word} onClick={(e) => onWordPick(e)}>{word}</Button>
                ))}
              </Box>
            ) : <Box display="flex" justifyContent="center">Please wait!</Box>}
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  );
}

export default MayorPickModal;
