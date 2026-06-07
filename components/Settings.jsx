import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SettingsIcon from '../assets/SettingsIcon.svg';

function Settings({
  updatePickCount, updateTimer, updateSaveTimer, updateMayorRoleSettings, lobby,
}) {
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();
  const [minuteValue,
    setMinuteValue] = useState(lobby.timer < 0 ? 1 : lobby.timer);
  const [wordAmount, setWordAmount] = useState(lobby.pickCount ? lobby.pickCount : 2);
  const [mayorRoles, setMayorRoles] = useState(
    Object.keys(lobby.mayorRoleEligibility || { villager: true }).filter(
      (role) => lobby.mayorRoleEligibility[role],
    ),
  );

  useEffect(() => {
    updateTimer({ minutes: minuteValue, seconds: 0 }, lobby);
    updateSaveTimer(minuteValue);
  }, [minuteValue]);

  useEffect(() => {
    updatePickCount(wordAmount);
  }, [wordAmount]);

  useEffect(() => {
    updateMayorRoleSettings({
      villager: mayorRoles.includes('villager'),
      seer: mayorRoles.includes('seer'),
      werewolf: mayorRoles.includes('werewolf'),
    });
  }, [mayorRoles]);

  const handleChange = (value) => {
    setMinuteValue(value);
  };

  const handleWordChange = (value) => {
    setWordAmount(value);
  };

  return (
    <div>
      <Button size="lg" bg="none" color="#fff" onClick={onSettingsOpen}>
        <Image src={SettingsIcon} width={25} />
        <span style={{ marginLeft: '10px' }}>
          Settings
        </span>
      </Button>
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Timers:
            <br />
            <ul>
              <li>
                Game Time (Min)
                <NumberInput
                  defaultValue={7}
                  min={1}
                  max={30}
                  value={minuteValue}
                  onChange={handleChange}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </li>
              <li>
                Available Words
                <NumberInput
                  defaultValue={2}
                  min={2}
                  max={5}
                  value={wordAmount}
                  onChange={handleWordChange}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </li>
            </ul>
            <br />
            Roles available to Mayor:
            <CheckboxGroup value={mayorRoles} onChange={setMayorRoles}>
              <Stack spacing={2} direction="column" marginTop="8px">
                <Checkbox value="villager">Villager</Checkbox>
                <Checkbox value="seer">Seer</Checkbox>
                <Checkbox value="werewolf">Wolf</Checkbox>
              </Stack>
            </CheckboxGroup>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onSettingsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <br />
    </div>
  );
}

export default Settings;
