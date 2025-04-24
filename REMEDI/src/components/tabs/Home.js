import React, { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import {
  Box,
  Card,
  CardBody,
  Flex,
  Text,
  Heading,
  Badge,
  useToast,
  Divider,
  Icon,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { CalendarIcon, TimeIcon, BellIcon } from "@chakra-ui/icons";
import { firestore, auth } from "../../firebase/firebase.js";
import liquid from "../../images/liquid.svg";
import pill from "../../images/pill.svg";
import MedAlert from "./functions/MedAlert";
import RefillAlert from "./functions/RefillAlert";
import firebase from "firebase/compat/app";
import { useNotificationService } from "../../utils/notificationService";

function MedicationCard({
  medicationName,
  dosage,
  time,
  docId,
  onQuantityUpdated,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const toast = useToast();

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
          const selected = doc.data().selected || [];
          const timeIndex = doc.data().timesOfDay.indexOf(time);
          if (timeIndex > -1) {
            setIsChecked(selected[timeIndex] === 1);
          } else {
            setIsChecked(false);
          }
        });
      });

      return () => unsubscribe();
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

                // If quantity is now zero, but was above zero before
                if (newQuantity === 0 && currentQuantity > 0) {
                  toast({
                    title: "Medication depleted",
                    description: `You've run out of ${medicationData.medName}. Please refill soon.`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                }
                // If quantity is now at or below threshold but above zero
                else if (
                  newQuantity > 0 &&
                  newQuantity <= medicationData.refillThreshold &&
                  currentQuantity > medicationData.refillThreshold
                ) {
                  toast({
                    title: "Refill needed soon",
                    description: `${medicationData.medName} is running low (${newQuantity} remaining).`,
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                  });
                }
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
      return <img src={liquid} alt="Liquid" width="32" height="32" />;
    } else if (dosage.includes("mg")) {
      return <img src={pill} alt="Pill" width="32" height="32" />;
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

  return (
    <Card
      boxShadow="lg"
      p={2}
      borderRadius="xl"
      onClick={handleCardClick}
      opacity={isChecked ? 0.7 : 1}
      cursor="pointer"
      marginBottom={3}
      width="65%"
      margin="auto"
      marginTop={4}
      bgGradient={
        isChecked
          ? "linear(to-r, gray.100, gray.50)"
          : "linear(to-r, white, gray.50)"
      }
      transition="all 0.3s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
      border="1px solid"
      borderColor="gray.100"
    >
      <CardBody>
        <Flex justifyContent="space-between" alignItems="center">
          <Flex alignItems="center">
            {getDosageIcon() && (
              <Box
                marginRight={6}
                marginTop={1}
                bg="teal.50"
                p={2}
                borderRadius="full"
              >
                {getDosageIcon()}
              </Box>
            )}
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {medicationName}
              </Text>
              <Badge
                colorScheme="teal"
                borderRadius="full"
                px={2}
                py={0.5}
                mb={1}
              >
                {dosage}
              </Badge>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {convertTimeToAMPM(time)}
              </Text>
            </Box>
          </Flex>
          {isChecked && (
            <Box bg="green.100" p={2} borderRadius="full">
              <FaCheck color="green" fontSize="16px" />
            </Box>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}

// Add a new component for upcoming appointments
function AppointmentReminder({ appointment }) {
  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <Card
      boxShadow="lg"
      p={2}
      borderRadius="xl"
      opacity={1}
      marginBottom={3}
      width="65%"
      margin="auto"
      marginTop={4}
      bgGradient="linear(to-r, blue.50, gray.50)"
      transition="all 0.3s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
      border="1px solid"
      borderColor="blue.100"
    >
      <CardBody>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Flex alignItems="center" mb={2}>
              <Icon as={CalendarIcon} color="blue.500" boxSize={5} mr={2} />
              <Text fontWeight="bold" fontSize="md">
                Appointment: {appointment.doctorName}
              </Text>
            </Flex>
            <Badge
              colorScheme="blue"
              borderRadius="full"
              px={2}
              py={0.5}
              mb={1}
            >
              {appointment.specialty}
            </Badge>
            <Flex mt={2}>
              <Icon as={TimeIcon} color="blue.500" mr={1} />
              <Text fontSize="sm" color="gray.600">
                {formatDate(appointment.date)} at {appointment.time}
              </Text>
            </Flex>
            {appointment.location && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                Location: {appointment.location}
              </Text>
            )}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
}

function Home() {
  const [medications, setMedications] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const toast = useToast();

  // Get notification service functions
  const { notificationPermissionStatus, requestPermission } =
    useNotificationService();

  const fetchMedications = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;

        // Get all medications first for refill alerts
        const medicationsRef = firestore.collection(
          `users/${userId}/medications`
        );
        const snapshot = await medicationsRef.get();
        const fetchedMedications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllMedications(fetchedMedications);

        // Get the daily reminders
        const medicationData = fetchedMedications.flatMap((medication) => {
          return medication.timesOfDay.map((time) => ({
            medicationName: medication.medName,
            dosage: `${medication.dosage} ${medication.dosageUnit}`,
            time: time,
            docId: medication.id,
          }));
        });

        const sortedMedications = medicationData.sort((a, b) => {
          const timeA = a.time.split(":").join("");
          const timeB = b.time.split(":").join("");
          return timeA.localeCompare(timeB);
        });

        setMedications(sortedMedications);
      }
    } catch (error) {
      console.log("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;

        // Get upcoming appointments (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split("T")[0];

        const appointmentsRef = firestore.collection(
          `users/${userId}/appointments`
        );
        const snapshot = await appointmentsRef
          .where("date", ">=", todayStr)
          .orderBy("date", "asc")
          .limit(3) // Limit to next 3 appointments
          .get();

        const appointmentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUpcomingAppointments(appointmentData);
      }
    } catch (error) {
      console.log("Error fetching appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Request notification permissions when component mounts
  useEffect(() => {
    if (notificationPermissionStatus === "default") {
      // Wait a bit before asking for permission to avoid overwhelming the user on load
      const permissionTimer = setTimeout(() => {
        requestPermission();
      }, 3000);

      return () => clearTimeout(permissionTimer);
    }
  }, [notificationPermissionStatus, requestPermission]);

  useEffect(() => {
    fetchMedications();
    fetchAppointments();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Box p="4" mb={2}>
        <Heading
          marginBottom="4"
          size="lg"
          marginLeft="5px"
          bgGradient="linear(to-r, teal.500, blue.500)"
          bgClip="text"
        >
          Today's reminders
        </Heading>
        <Text
          fontSize="md"
          color="#605e5c"
          fontWeight="400"
          padding={2}
          border="1px solid"
          borderColor="gray.100"
          borderRadius="md"
          display="inline-block"
          boxShadow="sm"
        >
          {currentDate}
        </Text>
      </Box>

      {/* Notification Permission Alert */}
      {notificationPermissionStatus === "denied" && (
        <Box px={4} mb={4}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Notifications blocked</AlertTitle>
            <AlertDescription>
              Please enable notifications in your browser settings to receive
              medication and appointment reminders.
            </AlertDescription>
          </Alert>
        </Box>
      )}

      {/* Refill Alert Section */}
      {allMedications.length > 0 && (
        <Box px={4}>
          <RefillAlert medications={allMedications} />
        </Box>
      )}

      {/* Upcoming Appointments Section - only show if there are appointments */}
      {upcomingAppointments.length > 0 && (
        <Box px={4} mt={4}>
          <Heading size="md" mb={2} color="blue.600">
            Upcoming Appointments
          </Heading>
          {upcomingAppointments.map((appointment) => (
            <AppointmentReminder
              key={appointment.id}
              appointment={appointment}
            />
          ))}
          <Divider mt={4} mb={2} />
        </Box>
      )}

      {/* Medications Section */}
      <Box p={4} mt={upcomingAppointments.length > 0 ? 2 : 0}>
        {loading ? (
          <Text>Loading medications...</Text>
        ) : medications.length > 0 ? (
          <>
            {medications.length > 0 && (
              <Heading size="md" mb={2} color="teal.600">
                Medications
              </Heading>
            )}
            {medications.map((medication, index) => (
              <MedicationCard
                key={`${medication.medicationName}-${index}`}
                medicationName={medication.medicationName}
                dosage={medication.dosage}
                time={medication.time}
                docId={medication.docId}
                onQuantityUpdated={() => {
                  const fetchMedications = async () => {
                    try {
                      const user = auth.currentUser;
                      if (user) {
                        const userId = user.uid;

                        // Get all medications first for refill alerts
                        const medicationsRef = firestore.collection(
                          `users/${userId}/medications`
                        );
                        const snapshot = await medicationsRef.get();
                        const fetchedMedications = snapshot.docs.map((doc) => ({
                          id: doc.id,
                          ...doc.data(),
                        }));

                        setAllMedications(fetchedMedications);

                        // Get the daily reminders
                        const medicationData = fetchedMedications.flatMap(
                          (medication) => {
                            return medication.timesOfDay.map((time) => ({
                              medicationName: medication.medName,
                              dosage: `${medication.dosage} ${medication.dosageUnit}`,
                              time: time,
                              docId: medication.id,
                            }));
                          }
                        );

                        const sortedMedications = medicationData.sort(
                          (a, b) => {
                            const timeA = a.time.split(":").join("");
                            const timeB = b.time.split(":").join("");
                            return timeA.localeCompare(timeB);
                          }
                        );

                        setMedications(sortedMedications);
                      }
                    } catch (error) {
                      console.log("Error fetching medications:", error);
                    }
                  };

                  fetchMedications();
                }}
              />
            ))}
          </>
        ) : !loadingAppointments && upcomingAppointments.length === 0 ? (
          <MedAlert />
        ) : null}
      </Box>
    </>
  );
}

export default Home;
