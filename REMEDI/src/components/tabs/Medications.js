import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  SimpleGrid,
  Spacer,
  Text,
  Tag,
  Icon,
  Badge,
  Button,
  useDisclosure,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import AddMed from "./functions/AddMed";
import DeleteMed from "./functions/DeleteMed";
import { firestore, auth } from "../../firebase/firebase.js";
import { CiPill } from "react-icons/ci";
import { FaEdit, FaExclamationTriangle } from "react-icons/fa";
import firebase from "firebase/compat/app";

function Medications() {
  const [medications, setMedications] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newQuantity, setNewQuantity] = useState("");
  const [newRefillThreshold, setNewRefillThreshold] = useState("");
  const user = auth.currentUser; // Get the currently logged-in user
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = firestore
      .collection(`users/${user.uid}/medications`)
      .onSnapshot((snapshot) => {
        const meds = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMedications(meds);
      });

    return () => unsubscribe();
  }, [user.uid]);

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const parsedHours = parseInt(hours);
    const suffix = parsedHours >= 12 ? "PM" : "AM";
    const displayHours = parsedHours > 12 ? parsedHours - 12 : parsedHours;
    return `${displayHours}:${minutes} ${suffix}`;
  };

  const handleEditQuantity = (medication) => {
    setSelectedMedication(medication);
    setNewQuantity(medication.quantity?.toString() || "");
    setNewRefillThreshold(medication.refillThreshold?.toString() || "");
    onOpen();
  };

  const handleSaveQuantity = async () => {
    if (!selectedMedication) return;

    try {
      const quantityValue = parseInt(newQuantity);
      const thresholdValue = parseInt(newRefillThreshold);

      if (isNaN(quantityValue) || quantityValue < 0) {
        toast({
          title: "Invalid quantity",
          description: "Please enter a valid number of doses",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (isNaN(thresholdValue) || thresholdValue < 0) {
        toast({
          title: "Invalid threshold",
          description: "Please enter a valid refill threshold",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (thresholdValue > quantityValue) {
        toast({
          title: "Invalid threshold",
          description:
            "Refill threshold must be less than or equal to quantity",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await firestore
        .collection(`users/${user.uid}/medications`)
        .doc(selectedMedication.id)
        .update({
          quantity: quantityValue,
          refillThreshold: thresholdValue,
          needsRefill: quantityValue <= thresholdValue,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        });

      toast({
        title: "Updated successfully",
        description: "Medication quantity has been updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error("Error updating medication:", error);
      toast({
        title: "Error updating",
        description: "An error occurred while updating the medication",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      boxShadow="lg"
      maxWidth="100%"
      minHeight="100vh"
      p="6"
      bg="white"
    >
      <Heading
        marginBottom="6"
        size="lg"
        marginLeft="5px"
        bgGradient="linear(to-r, teal.500, blue.500)"
        bgClip="text"
      >
        Your Medications
      </Heading>
      <AddMed />

      {/* List all the medications in this grid */}
      <SimpleGrid
        spacing={4}
        templateColumns="repeat(auto-fill, minmax(260px, 1fr))"
        marginTop="8"
      >
        {medications.map((medication) => (
          <Card
            key={medication.id}
            borderRadius="lg"
            overflow="hidden"
            boxShadow="md"
            _hover={{
              transform: "translateY(-5px)",
              transition: "transform 0.3s ease",
              boxShadow: "xl",
            }}
            border="1px solid"
            borderColor={
              medication.quantity <= medication.refillThreshold
                ? "orange.200"
                : "gray.100"
            }
          >
            <CardBody>
              <Flex justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Flex alignItems="center" mb={2}>
                    <Icon as={CiPill} color="teal.500" boxSize={5} mr={2} />
                    <Text fontWeight="bold" fontSize="lg">
                      {medication.medName}
                    </Text>
                    {medication.quantity !== undefined &&
                      medication.quantity <= medication.refillThreshold && (
                        <Tooltip label="Refill needed">
                          <Box color="orange.500" ml={2}>
                            <FaExclamationTriangle />
                          </Box>
                        </Tooltip>
                      )}
                  </Flex>
                  <Badge
                    colorScheme="teal"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                    mb={2}
                  >
                    {medication.dosage} {medication.dosageUnit}
                  </Badge>

                  {/* Display quantity information */}
                  {medication.quantity !== undefined && (
                    <Flex alignItems="center" mt={2} mb={2}>
                      <Badge
                        colorScheme={
                          medication.quantity === 0
                            ? "red"
                            : medication.quantity <= medication.refillThreshold
                            ? "orange"
                            : "green"
                        }
                        borderRadius="full"
                        px={2}
                        py={0.5}
                        mr={2}
                      >
                        {medication.quantity} remaining
                      </Badge>
                      <Button
                        size="xs"
                        leftIcon={<FaEdit />}
                        onClick={() => handleEditQuantity(medication)}
                        colorScheme="blue"
                        variant="ghost"
                      >
                        Edit
                      </Button>
                    </Flex>
                  )}

                  <Box mt={3}>
                    {medication.timesOfDay.map((time, index) => (
                      <Tag
                        size="sm"
                        key={index}
                        colorScheme="blue"
                        borderRadius="full"
                        mr={1}
                        mb={1}
                      >
                        {formatTime(time)}
                      </Tag>
                    ))}
                  </Box>
                </Box>
                <Spacer />
                <DeleteMed id={medication.id} />
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Modal for editing quantity */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Medication Quantity</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4}>
              <FormLabel>Current Quantity</FormLabel>
              <NumberInput
                min={0}
                value={newQuantity}
                onChange={(valueString) => setNewQuantity(valueString)}
              >
                <NumberInputField placeholder="Number of pills/doses" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Refill Reminder Threshold</FormLabel>
              <NumberInput
                min={0}
                value={newRefillThreshold}
                onChange={(valueString) => setNewRefillThreshold(valueString)}
              >
                <NumberInputField placeholder="When to remind you to refill" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveQuantity}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Medications;
