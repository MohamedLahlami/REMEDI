import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Box,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Text,
  Badge,
  VStack,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { CalendarIcon, WarningIcon } from "@chakra-ui/icons";
import { CiPill } from "react-icons/ci";

function CalendarView({ appointments, medications }) {
  const [markedDates, setMarkedDates] = useState({});
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Process appointments and medication depletion dates
  useEffect(() => {
    const dates = {};

    // Process appointments
    if (appointments && appointments.length > 0) {
      appointments.forEach((appointment) => {
        const dateStr = appointment.date;
        if (!dates[dateStr]) {
          dates[dateStr] = { appointments: [], medications: [] };
        }
        dates[dateStr].appointments.push(appointment);
      });
    }

    // Process medications for depletion dates
    if (medications && medications.length > 0) {
      medications.forEach((medication) => {
        if (medication.quantity !== undefined && medication.timesOfDay) {
          // Calculate approximate depletion date based on daily usage
          const dailyUsage = medication.timesOfDay.length;
          if (dailyUsage > 0 && medication.quantity > 0) {
            const daysUntilDepletion = Math.floor(
              medication.quantity / dailyUsage
            );

            if (daysUntilDepletion >= 0) {
              const depletionDate = new Date();
              depletionDate.setDate(
                depletionDate.getDate() + daysUntilDepletion
              );
              const dateStr = depletionDate.toISOString().split("T")[0];

              if (!dates[dateStr]) {
                dates[dateStr] = { appointments: [], medications: [] };
              }
              dates[dateStr].medications.push({
                ...medication,
                depletionDate: dateStr,
              });
            }
          }
        }
      });
    }

    setMarkedDates(dates);
  }, [appointments, medications]);

  // Custom tile rendering function for the calendar
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const dateStr = date.toISOString().split("T")[0];
    const marked = markedDates[dateStr];

    if (!marked) return null;

    const hasAppointments = marked.appointments.length > 0;
    const hasMedications = marked.medications.length > 0;

    return (
      <Popover trigger="hover" placement="top">
        <PopoverTrigger>
          <Flex direction="column" align="center" mt={1}>
            {hasAppointments && (
              <Icon as={CalendarIcon} color="blue.500" w={3} h={3} />
            )}
            {hasMedications && (
              <Icon as={WarningIcon} color="orange.500" w={3} h={3} />
            )}
          </Flex>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader fontWeight="bold">Events on {dateStr}</PopoverHeader>
          <PopoverBody>
            <VStack align="start" spacing={2}>
              {hasAppointments &&
                marked.appointments.map((appt, idx) => (
                  <Box key={`appt-${idx}`}>
                    <Text fontWeight="semibold">
                      <Icon as={CalendarIcon} color="blue.500" mr={1} />
                      Appointment: {appt.doctorName}
                    </Text>
                    <Text fontSize="sm" ml={5}>
                      {appt.time} - {appt.specialty}
                    </Text>
                  </Box>
                ))}

              {hasMedications &&
                marked.medications.map((med, idx) => (
                  <Box key={`med-${idx}`}>
                    <Text fontWeight="semibold">
                      <Icon as={CiPill} color="orange.500" mr={1} />
                      Running out: {med.medName}
                    </Text>
                    <Text fontSize="sm" ml={5}>
                      Quantity remaining: {med.quantity}
                    </Text>
                  </Box>
                ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  // Function to determine tile className based on the date
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const dateStr = date.toISOString().split("T")[0];
    const marked = markedDates[dateStr];

    if (!marked) return "";

    if (marked.appointments.length > 0 && marked.medications.length > 0) {
      return "appointment-and-medication-date";
    } else if (marked.appointments.length > 0) {
      return "appointment-date";
    } else if (marked.medications.length > 0) {
      return "medication-date";
    }

    return "";
  };

  return (
    <Box
      p={3}
      bg={bgColor}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      className="calendar-container"
    >
      <style>
        {`
          .calendar-container .react-calendar {
            border: none;
            width: 100%;
            font-family: inherit;
          }
          .calendar-container .react-calendar__tile {
            height: 45px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
          }
          .appointment-date {
            background-color: rgba(66, 153, 225, 0.15);
          }
          .medication-date {
            background-color: rgba(237, 137, 54, 0.15);
          }
          .appointment-and-medication-date {
            background: linear-gradient(135deg, 
              rgba(66, 153, 225, 0.15) 50%, 
              rgba(237, 137, 54, 0.15) 50%);
          }
        `}
      </style>
      <Calendar tileContent={tileContent} tileClassName={tileClassName} />
      <Flex mt={2} justify="flex-end">
        <Badge colorScheme="blue" mr={2} display="flex" alignItems="center">
          <Icon as={CalendarIcon} mr={1} /> Appointments
        </Badge>
        <Badge colorScheme="orange" display="flex" alignItems="center">
          <Icon as={CiPill} mr={1} /> Medication Refill
        </Badge>
      </Flex>
    </Box>
  );
}

export default CalendarView;
