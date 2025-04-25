import {
  Input,
  Box,
  List,
  ListItem,
  Spinner,
  Heading,
  Text,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import React, { useState, useEffect } from "react";
import medicationData from "../../../data/medications.json";
import { fetchMedicationInfo } from "../../../api/open_fda.js";

function LookupSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchedTerms, setMatchedTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [dosingInformation, setDosingInformation] = useState("");
  const [medicationDescription, setMedicationDescription] = useState("");
  const [allMedications, setAllMedications] = useState([]);

  // Initialize medications on component mount
  useEffect(() => {
    try {
      if (Array.isArray(medicationData)) {
        setAllMedications(medicationData);
        console.log(`Loaded ${medicationData.length} medications successfully`);
      } else {
        console.error(
          "Medication data is not an array:",
          typeof medicationData
        );
        setAllMedications([]);
      }
    } catch (error) {
      console.error("Error loading medication data:", error);
      setAllMedications([]);
    }
  }, []);

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    setSearchTerm(inputValue);

    if (!inputValue || inputValue.trim() === "") {
      setMatchedTerms([]);
      return;
    }

    // Simple but effective search
    const searchLower = inputValue.toLowerCase();

    // Split into two groups: starting with search term vs containing search term
    const startsWithMatches = [];
    const containsMatches = [];

    allMedications.forEach((med) => {
      if (!med || !med.name) return;

      const nameLower = med.name.toLowerCase();

      // Check if it starts with the search term
      if (nameLower.startsWith(searchLower)) {
        startsWithMatches.push(med);
      }
      // If it doesn't start with but contains the search term
      else if (nameLower.includes(searchLower)) {
        containsMatches.push(med);
      }
    });

    // Sort each group alphabetically
    startsWithMatches.sort((a, b) => a.name.localeCompare(b.name));
    containsMatches.sort((a, b) => a.name.localeCompare(b.name));

    // Combine the two groups with startsWithMatches first
    const combinedResults = [...startsWithMatches, ...containsMatches];

    // Log for debugging
    console.log(
      `Found ${combinedResults.length} matches (${startsWithMatches.length} starting with "${inputValue}")`
    );

    // Limit to top 5 results
    setMatchedTerms(combinedResults.slice(0, 5));
  };

  const handleItemClick = (medication) => {
    setSearchTerm(medication.name);
    setMatchedTerms([]);
    setSelectedMedication(medication);
    setIsLoading(true);
  };

  const handleSearchClick = () => {
    if (!searchTerm.trim()) return;

    const medication = allMedications.find(
      (med) => med.name && med.name.toLowerCase() === searchTerm.toLowerCase()
    );

    if (medication) {
      setSelectedMedication(medication);
      setIsLoading(true);
    }
  };

  useEffect(() => {
    if (selectedMedication) {
      fetchMedicationInfo(selectedMedication.name)
        .then((data) => {
          setDosingInformation(data.dosages);
          setMedicationDescription(data.description);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching medication information:", error);
          setDosingInformation("Error fetching dosing information");
          setIsLoading(false);
        });
    }
  }, [selectedMedication]);

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center">
        {/* Search input */}
        <Box position="relative" width="60%">
          <Input
            value={searchTerm}
            onChange={handleInputChange}
            size="lg"
            bg="white"
            paddingRight="2.5rem"
            placeholder="Enter a drug name"
          />
          <Box
            position="absolute"
            right="0.75rem"
            top="50%"
            transform="translateY(-50%)"
          >
            {isLoading ? (
              <Spinner color="blue.500" size="md" />
            ) : (
              <SearchIcon
                color="blue.500"
                boxSize={6}
                cursor="pointer"
                onClick={handleSearchClick}
              />
            )}
          </Box>
          {/* Matched terms list */}
          {matchedTerms.length > 0 && (
            <Box
              position="absolute"
              width="100%"
              bg="white"
              boxShadow="md"
              borderRadius="md"
              mt={2}
              zIndex={1}
            >
              <List spacing={2}>
                {matchedTerms.map((medication, index) => (
                  <ListItem
                    key={index}
                    cursor="pointer"
                    _hover={{ background: "blue.50" }}
                    onClick={() => handleItemClick(medication)}
                    p={2}
                    borderRadius="md"
                  >
                    {medication.name}
                    {medication.description && (
                      <Box as="span" fontSize="sm" color="gray.600" ml={1}>
                        ({medication.description})
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Box>

      {/* Selected Medication Information */}
      <Box display="flex" marginTop="60px" textAlign="left" p={4}>
        {selectedMedication && (
          <Box>
            <Heading textAlign="left" size="lg">
              {selectedMedication.name}
            </Heading>
            {selectedMedication.description && (
              <Text color="gray.600" marginTop="10px">
                <Text fontWeight="bold" display="inline">
                  Description:
                </Text>{" "}
                {selectedMedication.description}
              </Text>
            )}
            {selectedMedication.ppv && (
              <Text color="green.600" marginTop="10px">
                <Text fontWeight="bold" display="inline">
                  Price:
                </Text>{" "}
                {selectedMedication.ppv}
              </Text>
            )}
            <Heading textAlign="left" size="md" marginTop="30px">
              What is {selectedMedication.name}?
            </Heading>
            <Text marginTop="10px">{medicationDescription}</Text>
            <Heading textAlign="left" size="md" marginTop="30px">
              Dosing information
            </Heading>
            <Text marginTop="10px">{dosingInformation}</Text>
          </Box>
        )}
      </Box>
    </>
  );
}

export default LookupSearch;
