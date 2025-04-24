import React, { useState, useEffect } from "react";
import { FaCheck, FaClock } from "react-icons/fa";
import {
  Box,
  Card,
  CardBody,
  Flex,
  Text,
  Badge,
  Icon,
  Tooltip,
  Progress,
  HStack,
} from "@chakra-ui/react";
import { WarningTwoIcon } from "@chakra-ui/icons";
import { firestore, auth } from "../../../firebase/firebase.js";
import liquid from "../../../images/liquid.svg";
import pill from "../../../images/pill.svg";
import firebase from "firebase/compat/app";

function CompactMedicationCard({
  medicationName,
  dosage,
  time,
  docId,
  onQuantityUpdated,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState(null);
  const [isMorning, setIsMorning] = useState(false);
  const [isAfternoon, setIsAfternoon] = useState(false);
  const [isEvening, setIsEvening] = useState(false);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const medicationsRef = firestore.collection(
        `users/${userId}/medications`
      );
      const query = medicationsRef.where("timesOfDay", "array-contains", time);

      const unsubscribe = query.onSnapshot((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const selected = data.selected || [];
          const timeIndex = data.timesOfDay.indexOf(time);
          if (timeIndex > -1) {
            setIsChecked(selected[timeIndex] === 1);
          } else {
            setIsChecked(false);
          }
          setMedicationDetails(data);
        });
      });

      return () => unsubscribe();
    }
  }, [time]);

  useEffect(() => {
    // Determine time of day for styling
    if (time) {
      const [hours] = time.split(':').map(Number);
      setIsMorning(hours >= 5 && hours < 12);
      setIsAfternoon(hours >= 12 && hours < 17);
      setIsEvening(hours >= 17 && hours < 21);
      setIsNight(hours >= 21 || hours < 5);
    }
  }, [time]);

  const handleCardClick = async () => {
    // Only decrease quantity when marking as taken (not when unmarking)
    const markingAsTaken = !isChecked;

    setIsChecked(markingAsTaken);
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const medicationsRef = firestore.collection(
          `users/${userId}/medications`
        );
        const query = medicationsRef.where(
          "timesOfDay",
          "array-contains",
          time
        );
        const snapshot = await query.get();

        snapshot.forEach((doc) => {
          const medicationData = doc.data();
          const selected = medicationData.selected || [];
          const timeIndex = medicationData.timesOfDay.indexOf(time);

          if (timeIndex > -1) {
            selected[timeIndex] = markingAsTaken ? 1 : 0;

            // Updates to be made to the document
            const updates = { selected };

            // Only update quantity if marking as taken, not when unmarking
            if (markingAsTaken && medicationData.quantity !== undefined) {
              const currentQuantity = medicationData.quantity;

              // Only decrease if there are pills remaining
              if (currentQuantity > 0) {
                const newQuantity = currentQuantity - 1;
                updates.quantity = newQuantity;
                updates.needsRefill =
                  newQuantity <= medicationData.refillThreshold;
                updates.lastUpdated =
                  firebase.firestore.FieldValue.serverTimestamp();
              }
            }

            doc.ref.update(updates);

            // Call the onQuantityUpdated callback to refresh the medication list
            if (markingAsTaken && onQuantityUpdated) {
              onQuantityUpdated();
            }
          }
        });
      }
    } catch (error) {
      console.log("Error updating medication selection:", error);
    }
  };

  const getDosageIcon = () => {
    if (dosage.includes("mL")) {
      return <img src={liquid} alt="Liquid" width="28" height="28" />;
    } else if (dosage.includes("mg")) {
      return <img src={pill} alt="Pill" width="28" height="28" />;
    }
    return null;
  };

  const convertTimeToAMPM = (time) => {
    if (time) {
      const [hours, minutes] = time.split(":");
      const parsedHours = parseInt(hours);
      const suffix = parsedHours >= 12 ? "PM" : "AM";
      const displayHours = parsedHours > 12 ? parsedHours - 12 : parsedHours;
      return `${displayHours}:${minutes} ${suffix}`;
    }
    return "";
  };

  // Get time period color scheme
  const getTimeColorScheme = () => {
    if (isMorning) return { bg: "yellow.100", color: "yellow.800", name: "Morning" };
    if (isAfternoon) return { bg: "blue.100", color: "blue.800", name: "Afternoon" };
    if (isEvening) return { bg: "orange.100", color: "orange.800", name: "Evening" };
    if (isNight) return { bg: "purple.100", color: "purple.800", name: "Night" };
    return { bg: "gray.100", color: "gray.800", name: "" };
  };

  const timeColors = getTimeColorScheme();

  // Calculate refill status if we have medication details
  const getRefillStatus = () => {
    if (!medicationDetails) return null;
    
    const { quantity, refillThreshold } = medicationDetails;
    if (quantity === undefined || refillThreshold === undefined) return null;
    
    const isLow = quantity <= refillThreshold;
    const isEmpty = quantity === 0;
    const percentLeft = Math.min(100, Math.max(0, (quantity / (refillThreshold * 2)) * 100));
    
    return { isLow, isEmpty, percentLeft, quantity, refillThreshold };
  };

  const refillStatus = getRefillStatus();

  return (
    <Card
      boxShadow="md"
      p={1}
      borderRadius="lg"
      onClick={handleCardClick}
      opacity={isChecked ? 0.7 : 1}
      cursor="pointer"
      marginBottom={3}
      width="100%"
      bgGradient={
        isChecked
          ? "linear(to-r, gray.100, gray.50)"
          : refillStatus?.isLow
          ? "linear(to-r, orange.50, gray.50)"
          : "linear(to-r, white, gray.50)"
      }
      transition="all 0.2s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
      border="1px solid"
      borderColor={refillStatus?.isLow ? "orange.200" : "gray.100"}
      minHeight="80px"
    >
      <CardBody p={3}>
        <Flex direction="column" h="100%">
          <Flex justifyContent="space-between" alignItems="center">
            <Flex alignItems="center">
              {getDosageIcon() && (
                <Tooltip label={dosage}>
                  <Box
                    marginRight={3}
                    bg="teal.50"
                    p={1}
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {getDosageIcon()}
                  </Box>
                </Tooltip>
              )}
              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={0.5}>
                  {medicationName}
                </Text>
                
                {medicationDetails?.medDescription && (
                  <Text fontSize="2xs" color="gray.600" mb={0.5} noOfLines={1}>
                    {medicationDetails.medDescription}
                  </Text>
                )}
                
                <Flex align="center">
                  <HStack 
                    bg={timeColors.bg} 
                    color={timeColors.color} 
                    px={2} 
                    py={0.5} 
                    borderRadius="md" 
                    fontSize="2xs"
                    fontWeight="bold"
                    spacing={1}
                  >
                    <Icon as={FaClock} boxSize={2.5} />
                    <Text>{convertTimeToAMPM(time)}</Text>
                  </HStack>
                  
                  {timeColors.name && (
                    <Text fontSize="2xs" color="gray.500" ml={1}>
                      {timeColors.name}
                    </Text>
                  )}
                </Flex>
              </Box>
            </Flex>

            <Flex alignItems="center">
              <Badge
                colorScheme="teal"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                mr={2}
              >
                {dosage}
              </Badge>
              
              {medicationDetails?.medPrice && (
                <Badge
                  colorScheme="green"
                  variant="outline"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="2xs"
                  mr={2}
                  display={{ base: 'none', sm: 'block' }}
                >
                  {medicationDetails.medPrice}
                </Badge>
              )}

              {isChecked && (
                <Box bg="green.100" p={1} borderRadius="full">
                  <FaCheck color="green" fontSize="14px" />
                </Box>
              )}
            </Flex>
          </Flex>

          {medicationDetails && (
            <Box mt={2}>
              {medicationDetails.instructions && (
                <Text fontSize="xs" color="gray.600" mb={1}>
                  {medicationDetails.instructions}
                </Text>
              )}
              
              {refillStatus && (
                <Box mt={1}>
                  <Flex justifyContent="space-between" alignItems="center" mb={1}>
                    <Text fontSize="xs" color="gray.600">
                      {refillStatus.quantity} remaining
                      {refillStatus.isLow && !refillStatus.isEmpty && (
                        <Badge colorScheme="orange" ml={1} fontSize="xx-small">
                          Low
                        </Badge>
                      )}
                      {refillStatus.isEmpty && (
                        <Badge colorScheme="red" ml={1} fontSize="xx-small">
                          Empty
                        </Badge>
                      )}
                    </Text>
                    <Tooltip label={`Refill threshold: ${refillStatus.refillThreshold}`}>
                      <Text fontSize="xs" color="gray.500">
                        {refillStatus.isLow && !refillStatus.isEmpty && (
                          <Icon as={WarningTwoIcon} color="orange.500" w={3} h={3} />
                        )}
                      </Text>
                    </Tooltip>
                  </Flex>
                  <Progress 
                    size="xs" 
                    value={refillStatus.percentLeft} 
                    colorScheme={refillStatus.isEmpty ? "red" : refillStatus.isLow ? "orange" : "green"}
                    borderRadius="full"
                  />
                </Box>
              )}
            </Box>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}

export default CompactMedicationCard;
