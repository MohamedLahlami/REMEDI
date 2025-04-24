import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Button,
  useDisclosure,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  Flex,
  Spacer,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  HStack,
  VStack,
  useToast,
  FormErrorMessage,
  Switch,
  Checkbox,
  RadioGroup,
  Stack,
  Radio,
} from "@chakra-ui/react";
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  CalendarIcon,
  TimeIcon,
  BellIcon,
} from "@chakra-ui/icons";
import { firestore, auth } from "../../firebase/firebase.js";
import firebase from "firebase/compat/app";
import { useNotificationService } from "../../utils/notificationService";

function Appointments() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const toast = useToast();
  const { requestPermission, notificationPermissionStatus } = useNotificationService();

  const [formData, setFormData] = useState({
    doctorName: "",
    specialty: "",
    location: "",
    date: "",
    time: "",
    notes: "",
    notifyEnabled: true,
    notifyTiming: "1h", // Default to 1 hour before
  });

  // Notification timing options
  const notificationTimingOptions = [
    { value: "5m", label: "5 minutes before" },
    { value: "15m", label: "15 minutes before" },
    { value: "30m", label: "30 minutes before" },
    { value: "1h", label: "1 hour before" },
    { value: "2h", label: "2 hours before" },
    { value: "12h", label: "12 hours before" },
    { value: "1d", label: "1 day before" },
  ];

  // List of common doctor specialties
  const specialties = [
    "Primary Care",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Obstetrics & Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Pulmonology",
    "Rheumatology",
    "Urology",
    "Other",
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const appointmentsRef = firestore.collection(
        `users/${user.uid}/appointments`
      );

      const unsubscribe = appointmentsRef
        .orderBy("date", "asc")
        .onSnapshot((snapshot) => {
          const appointmentData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAppointments(appointmentData);
          setLoading(false);
        });

      return () => unsubscribe();
    }
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    if (notificationPermissionStatus === "default") {
      requestPermission();
    }
  }, [notificationPermissionStatus, requestPermission]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleRadioChange = (value) => {
    setFormData({
      ...formData,
      notifyTiming: value,
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.doctorName.trim()) {
      errors.doctorName = "Doctor name is required";
    }

    if (!formData.specialty) {
      errors.specialty = "Specialty is required";
    }

    if (!formData.date) {
      errors.date = "Date is required";
    } else {
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.date);
      if (selectedDate < today) {
        errors.date = "Date cannot be in the past";
      }
    }

    if (!formData.time) {
      errors.time = "Time is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const user = auth.currentUser;
      if (user) {
        const appointmentsRef = firestore.collection(
          `users/${user.uid}/appointments`
        );

        // Calculate notification time based on appointment date and notification timing preference
        const appointmentDateTime = new Date(`${formData.date}T${formData.time}`);
        const notificationTime = calculateNotificationTime(
          appointmentDateTime, 
          formData.notifyTiming
        );

        if (isEditing && currentAppointment) {
          // Update existing appointment
          await appointmentsRef.doc(currentAppointment.id).update({
            ...formData,
            notificationTime: notificationTime ? notificationTime.toISOString() : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

          toast({
            title: "Appointment updated",
            description: "Your appointment has been updated successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          // Add new appointment
          await appointmentsRef.add({
            ...formData,
            notificationTime: notificationTime ? notificationTime.toISOString() : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "scheduled",
          });

          toast({
            title: "Appointment scheduled",
            description: "Your appointment has been scheduled successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }

        resetForm();
        onClose();
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Error",
        description: "There was an error saving your appointment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Calculate when to send notification based on the timing preference
  const calculateNotificationTime = (appointmentDate, timingValue) => {
    if (!appointmentDate || !timingValue || !formData.notifyEnabled) return null;

    const notificationDate = new Date(appointmentDate);
    
    // Parse the timing value to determine how much time before the appointment
    const timeUnit = timingValue.slice(-1); // Last character (m, h, or d)
    const timeValue = parseInt(timingValue.slice(0, -1)); // Number value
    
    switch (timeUnit) {
      case 'm': // minutes
        notificationDate.setMinutes(notificationDate.getMinutes() - timeValue);
        break;
      case 'h': // hours
        notificationDate.setHours(notificationDate.getHours() - timeValue);
        break;
      case 'd': // days
        notificationDate.setDate(notificationDate.getDate() - timeValue);
        break;
      default:
        break;
    }
    
    return notificationDate;
  };

  const handleEdit = (appointment) => {
    setIsEditing(true);
    setCurrentAppointment(appointment);
    setFormData({
      doctorName: appointment.doctorName,
      specialty: appointment.specialty,
      location: appointment.location || "",
      date: appointment.date,
      time: appointment.time,
      notes: appointment.notes || "",
      notifyEnabled: appointment.notifyEnabled !== false, // Default to true if not set
      notifyTiming: appointment.notifyTiming || "1h", // Default to 1 hour if not set
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?"))
      return;

    try {
      const user = auth.currentUser;
      if (user) {
        await firestore
          .collection(`users/${user.uid}/appointments`)
          .doc(id)
          .delete();

        toast({
          title: "Appointment deleted",
          description: "The appointment has been deleted successfully",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the appointment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      doctorName: "",
      specialty: "",
      location: "",
      date: "",
      time: "",
      notes: "",
      notifyEnabled: true,
      notifyTiming: "1h",
    });
    setFormErrors({});
    setIsEditing(false);
    setCurrentAppointment(null);
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const isUpcoming = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(date);
    return appointmentDate >= today;
  };

  // Format the notification timing for display
  const formatNotificationTiming = (timingValue) => {
    return notificationTimingOptions.find(option => option.value === timingValue)?.label || 
           "1 hour before";
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
      <Flex align="center" mb={6}>
        <Heading
          size="lg"
          marginLeft="5px"
          bgGradient="linear(to-r, teal.500, blue.500)"
          bgClip="text"
        >
          Doctor Appointments
        </Heading>
        <Spacer />
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => {
            resetForm();
            onOpen();
          }}
        >
          Schedule Appointment
        </Button>
      </Flex>

      {loading ? (
        <Text>Loading appointments...</Text>
      ) : appointments.length === 0 ? (
        <Box
          textAlign="center"
          mt={10}
          p={6}
          borderWidth="1px"
          borderRadius="lg"
        >
          <Heading size="md" mb={4}>
            No Appointments Scheduled
          </Heading>
          <Text mb={6}>
            You don't have any appointments scheduled yet. Click the button
            below to schedule your first appointment.
          </Text>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={() => {
              resetForm();
              onOpen();
            }}
          >
            Schedule Appointment
          </Button>
        </Box>
      ) : (
        <SimpleGrid
          spacing={4}
          templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
          marginTop={4}
        >
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
              borderWidth="1px"
              borderColor={
                isUpcoming(appointment.date) ? "blue.200" : "gray.200"
              }
              opacity={isUpcoming(appointment.date) ? 1 : 0.7}
            >
              <CardBody>
                <Flex mb={3} align="center">
                  <Badge
                    colorScheme={isUpcoming(appointment.date) ? "blue" : "gray"}
                    fontSize="0.8em"
                    p={1}
                    borderRadius="md"
                  >
                    {isUpcoming(appointment.date) ? "Upcoming" : "Past"}
                  </Badge>
                  <Spacer />
                  <HStack>
                    <IconButton
                      size="sm"
                      icon={<EditIcon />}
                      aria-label="Edit appointment"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => handleEdit(appointment)}
                    />
                    <IconButton
                      size="sm"
                      icon={<DeleteIcon />}
                      aria-label="Delete appointment"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(appointment.id)}
                    />
                  </HStack>
                </Flex>

                <Heading size="md" mb={2}>
                  {appointment.doctorName}
                </Heading>
                <Badge colorScheme="teal" mb={3}>
                  {appointment.specialty}
                </Badge>

                <VStack align="start" spacing={2} mt={4}>
                  <Flex w="100%">
                    <CalendarIcon mr={2} color="blue.500" />
                    <Text>{formatDate(appointment.date)}</Text>
                  </Flex>
                  <Flex>
                    <TimeIcon mr={2} color="blue.500" />
                    <Text>{appointment.time}</Text>
                  </Flex>
                  {appointment.notifyEnabled && (
                    <Flex>
                      <BellIcon mr={2} color="blue.500" />
                      <Text fontSize="sm" color="blue.600">
                        Reminder: {formatNotificationTiming(appointment.notifyTiming)}
                      </Text>
                    </Flex>
                  )}
                  {appointment.location && (
                    <Text fontSize="sm" color="gray.600">
                      Location: {appointment.location}
                    </Text>
                  )}
                </VStack>

                {appointment.notes && (
                  <Box mt={3} p={2} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" fontStyle="italic">
                      {appointment.notes}
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Add/Edit Appointment Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? "Edit Appointment" : "Schedule New Appointment"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired isInvalid={!!formErrors.doctorName}>
              <FormLabel>Doctor Name</FormLabel>
              <Input
                name="doctorName"
                placeholder="Enter doctor's name"
                value={formData.doctorName}
                onChange={handleInputChange}
              />
              <FormErrorMessage>{formErrors.doctorName}</FormErrorMessage>
            </FormControl>

            <FormControl mb={4} isRequired isInvalid={!!formErrors.specialty}>
              <FormLabel>Specialty</FormLabel>
              <Select
                name="specialty"
                placeholder="Select specialty"
                value={formData.specialty}
                onChange={handleInputChange}
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{formErrors.specialty}</FormErrorMessage>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Location</FormLabel>
              <Input
                name="location"
                placeholder="Enter clinic/hospital location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </FormControl>

            <HStack spacing={4} mb={4}>
              <FormControl isRequired isInvalid={!!formErrors.date}>
                <FormLabel>Date</FormLabel>
                <Input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>{formErrors.date}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!formErrors.time}>
                <FormLabel>Time</FormLabel>
                <Input
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>{formErrors.time}</FormErrorMessage>
              </FormControl>
            </HStack>

            {/* Notification settings */}
            <Box 
              mt={4} 
              mb={4} 
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor="gray.200"
            >
              <Heading size="sm" mb={3}>
                <Flex align="center">
                  <BellIcon mr={2} />
                  Notification Settings
                </Flex>
              </Heading>
              
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel htmlFor="notify-toggle" mb="0">
                  Enable reminder notification
                </FormLabel>
                <Switch 
                  id="notify-toggle" 
                  name="notifyEnabled"
                  isChecked={formData.notifyEnabled}
                  onChange={handleInputChange}
                  colorScheme="blue"
                />
              </FormControl>
              
              {formData.notifyEnabled && (
                <FormControl>
                  <FormLabel>When to notify you?</FormLabel>
                  <RadioGroup 
                    value={formData.notifyTiming} 
                    onChange={handleRadioChange}
                  >
                    <Stack direction={["column", "column", "row"]} 
                           spacing={2} 
                           wrap="wrap"
                           justifyContent="flex-start"
                    >
                      {notificationTimingOptions.map(option => (
                        <Radio 
                          key={option.value} 
                          value={option.value}
                          colorScheme="blue"
                        >
                          {option.label}
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                </FormControl>
              )}
            </Box>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                name="notes"
                placeholder="Add notes about your appointment"
                value={formData.notes}
                onChange={handleInputChange}
                resize="vertical"
                rows={3}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
              {isEditing ? "Update" : "Save"}
            </Button>
            <Button
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Appointments;
