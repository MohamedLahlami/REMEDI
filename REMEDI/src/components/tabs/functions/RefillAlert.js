import React, { useState } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  Flex,
  Text,
  Collapse,
  Badge,
  Divider,
  VStack,
  HStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { FaChevronDown, FaChevronUp, FaCheck } from "react-icons/fa";
import { firestore, auth } from "../../../firebase/firebase.js";
import firebase from "firebase/compat/app";

function RefillAlert({ medications }) {
  const [isOpen, setIsOpen] = useState(true);
  const toast = useToast();

  // Filter only medications that need refill
  const medsNeedingRefill = medications.filter(
    (med) => med.quantity <= med.refillThreshold
  );

  if (medsNeedingRefill.length === 0) return null;

  const handleMarkRefilled = async (medicationId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const medicationRef = firestore
          .collection(`users/${userId}/medications`)
          .doc(medicationId);

        // Set a default value if the user hasn't specified one
        const newQuantity = window.prompt(
          "Enter the new quantity after refill:",
          "30"
        );

        if (newQuantity === null) return; // User cancelled

        const parsedQuantity = parseInt(newQuantity);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          toast({
            title: "Invalid quantity",
            description: "Please enter a positive number",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        await medicationRef.update({
          quantity: parsedQuantity,
          needsRefill:
            parsedQuantity <=
            medications.find((m) => m.id === medicationId).refillThreshold,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        });

        toast({
          title: "Medication refilled",
          description: "Your medication has been marked as refilled",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error updating medication quantity:", error);
      toast({
        title: "Error",
        description: "Could not update medication quantity",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box mb={6}>
      <Alert
        status="warning"
        variant="left-accent"
        borderRadius="md"
        boxShadow="md"
      >
        <Flex width="100%" direction="column">
          <Flex justify="space-between" align="center" width="100%" py={2}>
            <Flex align="center">
              <AlertIcon />
              <Box ml={2}>
                <AlertTitle>Medications need refill</AlertTitle>
                <AlertDescription>
                  {medsNeedingRefill.length} medication
                  {medsNeedingRefill.length > 1 ? "s" : ""} running low
                </AlertDescription>
              </Box>
            </Flex>
            <IconButton
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Collapse" : "Expand"}
            />
          </Flex>

          <Collapse in={isOpen} animateOpacity>
            <VStack
              spacing={3}
              align="stretch"
              mt={2}
              px={2}
              pb={3}
              divider={<Divider />}
            >
              {medsNeedingRefill.map((med) => (
                <HStack key={med.id} justify="space-between">
                  <Box>
                    <Text fontWeight="bold">{med.medName}</Text>
                    <Flex align="center" mt={1}>
                      <Badge
                        colorScheme={med.quantity === 0 ? "red" : "orange"}
                        mr={2}
                      >
                        {med.quantity} remaining
                      </Badge>
                      <Text fontSize="sm" color="gray.600">
                        Threshold: {med.refillThreshold}
                      </Text>
                    </Flex>
                  </Box>
                  <Button
                    size="sm"
                    leftIcon={<FaCheck />}
                    colorScheme="green"
                    onClick={() => handleMarkRefilled(med.id)}
                  >
                    Mark Refilled
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Collapse>
        </Flex>
      </Alert>
    </Box>
  );
}

export default RefillAlert;
