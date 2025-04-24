import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import AddMed from './AddMed';

function MedAlert() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box mt={5}>
      <Alert
        status="info"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="md"
        p={8}
      >
        <AlertIcon boxSize="40px" />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          No medications found
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          You don't have any medications scheduled. Click the button below to add a medication.
        </AlertDescription>
        <Box mt={4}>
          <AddMed />
        </Box>
      </Alert>
    </Box>
  );
}

export default MedAlert;