import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  InputGroup,
  InputRightElement,
  Stack,
  IconButton,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormHelperText,
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import MedAutoComplete from './MedAutoComplete';
import moment from 'moment';
import { auth, firestore } from '../../../firebase/firebase.js';
import firebase from 'firebase/compat/app';

function AddMed() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [timesOfDay, setTimesOfDay] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [refillThreshold, setRefillThreshold] = useState('');
  const [formErrors, setFormErrors] = useState({
    medName: '',
    dosage: '',
    timesOfDay: '',
    quantity: '',
    refillThreshold: '',
  });

  const addTimeOfDay = () => {
    setTimesOfDay([...timesOfDay, '']);
  };

  const removeTimeOfDay = (index) => {
    const updatedTimesOfDay = timesOfDay.filter((_, i) => i !== index);
    setTimesOfDay(updatedTimesOfDay);
  };

  const handleTimeOfDayChange = (index, value) => {
    const updatedTimesOfDay = [...timesOfDay];

    // Check if `value` is a Moment object
    if (moment.isMoment(value)) {
      updatedTimesOfDay[index] = value.format('HH:mm');
    } else {
      updatedTimesOfDay[index] = value;
    }

    setTimesOfDay(updatedTimesOfDay);
  };

  const validateForm = () => {
    const errors = {
      medName: '',
      dosage: '',
      timesOfDay: '',
      quantity: '',
      refillThreshold: '',
    };
    let isValid = true;

    if (medName.trim() === '') {
      errors.medName = 'Medication name is required';
      isValid = false;
    }

    if (dosage.trim() === '') {
      errors.dosage = 'Dosage is required';
      isValid = false;
    }

    if (timesOfDay.length === 0) {
      errors.timesOfDay = 'At least 1 time is required';
      isValid = false;
    }

    if (quantity.trim() === '') {
      errors.quantity = 'Current quantity is required';
      isValid = false;
    } else if (isNaN(quantity) || parseInt(quantity) <= 0) {
      errors.quantity = 'Quantity must be a positive number';
      isValid = false;
    }

    if (refillThreshold.trim() === '') {
      errors.refillThreshold = 'Refill threshold is required';
      isValid = false;
    } else if (isNaN(refillThreshold) || parseInt(refillThreshold) <= 0) {
      errors.refillThreshold = 'Refill threshold must be a positive number';
      isValid = false;
    } else if (parseInt(refillThreshold) >= parseInt(quantity)) {
      errors.refillThreshold = 'Refill threshold must be less than current quantity';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const user = auth.currentUser;
  
      if (user) {
        const userId = user.uid;
  
        const medicationsRef = firestore.collection(`users/${userId}/medications`);
  
        const medicationData = {
          medName,
          dosage,
          dosageUnit,
          timesOfDay,
          timeEvents: timesOfDay.length,
          selected: Array(timesOfDay.length).fill(0), // Initialize "selected" array with 0 values
          quantity: parseInt(quantity),
          refillThreshold: parseInt(refillThreshold),
          needsRefill: parseInt(quantity) <= parseInt(refillThreshold),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        };
  
        medicationsRef
          .add(medicationData)
          .then((docRef) => {
            console.log('Medication stored in Firebase successfully');
  
            // Update the 'totalEvents' property in the user document
            firestore.collection('users').doc(userId).update({
              totalEvents: firebase.firestore.FieldValue.increment(timesOfDay.length),
            });
  
            onClose(); // Close the modal or perform any other necessary actions
            
            // Reset form fields
            setMedName('');
            setDosage('');
            setDosageUnit('mg');
            setTimesOfDay([]);
            setQuantity('');
            setRefillThreshold('');
          })
          .catch((error) => {
            console.error('Error storing medication in Firebase:', error);
          });
      } else {
        console.error('User not authenticated');
      }
    }
  };
  
  return (
    <>
      <Button colorScheme="blue" onClick={onOpen}>
        Add a medication
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a medication</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isInvalid={formErrors.medName !== ''} mb={4}>
              <FormLabel>Medication name</FormLabel>
              <MedAutoComplete value={medName} onChange={setMedName} />
              <FormErrorMessage>{formErrors.medName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={formErrors.dosage !== ''} mb={4}>
              <FormLabel>Dosage</FormLabel>
              <InputGroup>
                <Input
                  placeholder="Dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
                <InputRightElement width="auto">
                  <Select value={dosageUnit} onChange={(e) => setDosageUnit(e.target.value)}>
                    <option value="mg">mg</option>
                    <option value="mL">mL</option>
                  </Select>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{formErrors.dosage}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={formErrors.quantity !== ''} mb={4}>
              <FormLabel>Current Quantity (pills/doses)</FormLabel>
              <NumberInput min={1} value={quantity} onChange={(value) => setQuantity(value)}>
                <NumberInputField placeholder="How many pills/doses do you have?" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{formErrors.quantity}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={formErrors.refillThreshold !== ''} mb={4}>
              <FormLabel>Refill Reminder Threshold</FormLabel>
              <NumberInput min={1} value={refillThreshold} onChange={(value) => setRefillThreshold(value)}>
                <NumberInputField placeholder="When to remind you to refill?" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>You'll be reminded to refill when quantity reaches this number</FormHelperText>
              <FormErrorMessage>{formErrors.refillThreshold}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={formErrors.timesOfDay !== ''} mb={4}>
              <FormLabel>Frequency</FormLabel>
              <Stack spacing={2}>
                {timesOfDay.map((time, index) => (
                  <HStack key={index}>
                    <Datetime
                      dateFormat={false}
                      inputProps={{
                        placeholder: 'HH : mm',
                      }}
                      onChange={(momentObj) =>
                        handleTimeOfDayChange(index, momentObj)
                      }
                      renderInput={(props) => <Input {...props} />}
                    />
                    <IconButton
                      aria-label="Remove time"
                      icon={<MinusIcon />}
                      onClick={() => removeTimeOfDay(index)}
                    />
                  </HStack>
                ))}
                <FormErrorMessage>{formErrors.timesOfDay}</FormErrorMessage>
                <IconButton
                  aria-label="Add time"
                  icon={<AddIcon />}
                  onClick={addTimeOfDay}
                />
              </Stack>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default AddMed;