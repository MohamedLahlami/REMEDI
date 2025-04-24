import React from "react";
import {
  Box,
  Card,
  CardBody,
  Flex,
  Text,
  Badge,
  Icon,
  Tooltip,
  Divider,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { CalendarIcon, TimeIcon, InfoIcon, BellIcon } from "@chakra-ui/icons";
import { FaMapMarkerAlt, FaRegClock } from "react-icons/fa";

function CompactAppointmentCard({ appointment }) {
  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const isToday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(dateString);
    appointmentDate.setHours(0, 0, 0, 0);
    return today.getTime() === appointmentDate.getTime();
  };

  const isUpcoming = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(dateString);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
  };

  const isWithinWeek = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const appointmentDate = new Date(dateString);
    appointmentDate.setHours(0, 0, 0, 0);
    
    return appointmentDate >= today && appointmentDate <= nextWeek;
  };

  const getColorScheme = () => {
    if (isToday(appointment.date)) return "blue";
    if (isWithinWeek(appointment.date)) return "teal";
    if (isUpcoming(appointment.date)) return "green";
    return "gray";
  };

  const getDateLabel = () => {
    if (isToday(appointment.date)) return "Today";
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    if (appointmentDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    
    // Return how many days from now
    if (isWithinWeek(appointment.date)) {
      const diffTime = Math.abs(appointmentDate - new Date());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `In ${diffDays} days`;
    }
    
    return null;
  };

  const getTimeLabelStyles = () => {
    const dateLabel = getDateLabel();
    if (!dateLabel) return {};
    
    if (dateLabel === "Today") {
      return {
        bg: "red.500",
        color: "white",
        icon: FaRegClock,
        boxShadow: "0 2px 5px rgba(239, 68, 68, 0.3)",
      };
    }
    
    if (dateLabel === "Tomorrow") {
      return {
        bg: "purple.500",
        color: "white",
        icon: FaRegClock,
        boxShadow: "0 2px 5px rgba(159, 122, 234, 0.3)",
      };
    }
    
    return {
      bg: "blue.400",
      color: "white",
      icon: FaRegClock,
      boxShadow: "0 2px 5px rgba(66, 153, 225, 0.3)",
    };
  };

  const dateLabel = getDateLabel();
  const timeLabelStyles = getTimeLabelStyles();
  const bgGlow = useColorModeValue(
    isToday(appointment.date) ? "0 0 10px rgba(66, 153, 225, 0.2)" : "none",
    isToday(appointment.date) ? "0 0 10px rgba(66, 153, 225, 0.3)" : "none"
  );

  return (
    <Card
      boxShadow={`md, ${bgGlow}`}
      p={1}
      borderRadius="lg"
      marginBottom={3}
      width="100%"
      bgGradient={isToday(appointment.date) 
        ? "linear(to-r, blue.50, gray.50)" 
        : isWithinWeek(appointment.date)
        ? "linear(to-r, teal.50, gray.50)"
        : "linear(to-r, white, gray.50)"}
      transition="all 0.2s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
      border="1px solid"
      borderColor={isToday(appointment.date) ? "blue.200" : "gray.100"}
      minHeight="80px"
    >
      <CardBody p={3}>
        <Flex direction="column">
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Flex alignItems="flex-start">
              <Tooltip label={appointment.specialty}>
                <Box
                  marginRight={3}
                  bg={isToday(appointment.date) ? "blue.100" : "blue.50"}
                  p={1.5}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={CalendarIcon} color="blue.500" boxSize={4} />
                </Box>
              </Tooltip>
              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={0.5}>
                  {appointment.doctorName}
                </Text>
                <Text fontSize="xs" color="gray.500" mb={0.5} display="flex" alignItems="center">
                  <Icon as={TimeIcon} color="gray.500" mr={1} boxSize={3} />
                  {formatDate(appointment.date)} at {appointment.time}
                </Text>
                {appointment.notifyEnabled && (
                  <HStack spacing={1} fontSize="2xs" color="gray.500">
                    <Icon as={BellIcon} boxSize={2.5} />
                    <Text>Reminder set</Text>
                  </HStack>
                )}
              </Box>
            </Flex>
            
            <Flex direction="column" alignItems="flex-end">
              <Badge
                colorScheme={getColorScheme()}
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                mb={1}
              >
                {appointment.specialty}
              </Badge>
              
              {dateLabel && (
                <Flex
                  align="center"
                  bg={timeLabelStyles.bg}
                  color={timeLabelStyles.color}
                  py={1}
                  px={2}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="bold"
                  boxShadow={timeLabelStyles.boxShadow}
                >
                  <Icon as={timeLabelStyles.icon} mr={1} boxSize={3} />
                  {dateLabel}
                </Flex>
              )}
            </Flex>
          </Flex>
          
          {(appointment.location || appointment.notes) && (
            <Box mt={2} pt={1}>
              {appointment.location && (
                <Flex alignItems="center" mb={1}>
                  <Icon as={FaMapMarkerAlt} color="gray.500" mr={1} boxSize={3} />
                  <Text fontSize="xs" color="gray.600">
                    {appointment.location}
                  </Text>
                </Flex>
              )}
              
              {appointment.notes && (
                <Tooltip label={appointment.notes.length > 80 ? appointment.notes : ""}>
                  <Flex alignItems="flex-start">
                    <Icon as={InfoIcon} color="gray.500" mr={1} boxSize={3} mt={0.5} />
                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                      {appointment.notes}
                    </Text>
                  </Flex>
                </Tooltip>
              )}
            </Box>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}

export default CompactAppointmentCard; 