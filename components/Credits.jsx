import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  Box,
  Button,
} from '@chakra-ui/react';

function Credits() {
  const [credits, setCredits] = useState(false);

  function onClick() {
    setCredits(!credits);
  }

  return (
    <div>
      <Box className="credits" as="button" onClick={() => onClick()}>
        ABOUT
      </Box>
      <Modal isOpen={credits} onClose={() => setCredits(false)}>
        <ModalOverlay />
        <ModalContent background="white">
          <ModalHeader textAlign="center" fontSize="24px">WordWolf</ModalHeader>
          <ModalBody display="flex" flexDirection="column" alignItems="center" gap="12px" paddingBottom="24px">
            <Box textAlign="center">
              A self-hostable social deduction word game for local networks and intranets.
            </Box>
            <Button marginTop="12px" w="fit-content" colorScheme="blue" as="button" onClick={() => onClick()}>
              CLOSE
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Credits;
