import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  useBreakpointValue,
} from "@chakra-ui/react";
import { firestore, auth } from "../../firebase/firebase.js";
import MedAlert from "./functions/MedAlert";
import RefillAlert from "./functions/RefillAlert";
import firebase from "firebase/compat/app";
import { useNotificationService } from "../../utils/notificationService";
import CompactMedicationCard from "./functions/CompactMedicationCard";
import CompactAppointmentCard from "./functions/CompactAppointmentCard";
import CalendarView from "./functions/CalendarView";

function Home() {
  const [medications, setMedications] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [allAppointments, setAllAppointments] = useState([]);
  const toast = useToast();
  const columnCount = useBreakpointValue({ base: 1, md: 2 });

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

        // Get all appointments for the calendar view
        const allAppointmentsRef = firestore.collection(
          `users/${userId}/appointments`
        );
        const allSnapshot = await allAppointmentsRef
          .orderBy("date", "asc")
          .get();
        const allAppointmentData = allSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllAppointments(allAppointmentData);

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

      {/* Main Content - Two Column Layout */}
      <SimpleGrid columns={columnCount} spacing={6} px={4} mt={4}>
        {/* Left Column - Medications and Appointments */}
        <Box>
          {/* Upcoming Appointments Section - only show if there are appointments */}
          {upcomingAppointments.length > 0 && (
            <Box mb={6}>
              <Heading size="md" mb={4} color="blue.600">
                Upcoming Appointments
              </Heading>
              {upcomingAppointments.map((appointment) => (
                <CompactAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
              <Divider mt={4} mb={2} />
            </Box>
          )}

          {/* Medications Section */}
          <Box mt={upcomingAppointments.length > 0 ? 2 : 0}>
            {loading ? (
              <Text>Loading medications...</Text>
            ) : medications.length > 0 ? (
              <>
                {medications.length > 0 && (
                  <Heading size="md" mb={4} color="teal.600">
                    Medications
                  </Heading>
                )}
                {medications.map((medication, index) => (
                  <CompactMedicationCard
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
                            const fetchedMedications = snapshot.docs.map(
                              (doc) => ({
                                id: doc.id,
                                ...doc.data(),
                              })
                            );

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
        </Box>

        {/* Right Column - Calendar View */}
        <Box>
          <Heading size="md" mb={4} color="purple.600">
            Monthly Overview
          </Heading>
          <CalendarView
            appointments={allAppointments}
            medications={allMedications}
          />
        </Box>
      </SimpleGrid>
    </>
  );
}

export default Home;
