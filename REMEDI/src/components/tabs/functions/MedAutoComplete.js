import { Input, Box, UnorderedList, ListItem } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import React, { useState, useEffect } from 'react';
import medicationData from '../../../data/medications.json';

function MedAutoComplete({ value, onChange }) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [matchedTerms, setMatchedTerms] = useState([]);
  const [allMedications, setAllMedications] = useState([]);

  // Initialize medications on component mount
  useEffect(() => {
    try {
      if (Array.isArray(medicationData)) {
        setAllMedications(medicationData);
      } else {
        console.error("Medication data is not an array:", typeof medicationData);
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

    // Pass the value to the parent component
    onChange(inputValue);

    if (!inputValue || inputValue.trim() === '') {
      setMatchedTerms([]);
      return;
    }

    // Search with prioritization of matches that start with the search term
    const searchLower = inputValue.toLowerCase();
    
    // Split into two groups: starting with search term vs containing search term
    const startsWithMatches = [];
    const containsMatches = [];
    
    allMedications.forEach(med => {
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
    
    // Limit to top 5 results
    setMatchedTerms(combinedResults.slice(0, 5));
  };

  const handleItemClick = (medication) => {
    setSearchTerm(medication.name);
    setMatchedTerms([]);

    // Pass the value to the parent component
    onChange(medication.name);
  };

  return (
    <>
      <Input
        placeholder="Enter a drug name"
        value={searchTerm}
        onChange={handleInputChange}
      />

      {matchedTerms.length > 0 && (
        <Box mt={2}>
          <UnorderedList listStyleType="none" p={0}>
            {matchedTerms.map((medication, index) => (
              <ListItem
                key={index}
                cursor="pointer"
                _hover={{ boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)', transition: 'box-shadow 0.3s' }}
                onClick={() => handleItemClick(medication)}
                p={2}
                bg="white"
                borderRadius="md"
                mb={2} // Add margin bottom between list elements
              >
                <SearchIcon color="blue.500" mr={2} />
                {medication.name} 
                {medication.description && (
                  <Box as="span" fontSize="sm" color="gray.600" ml={1}>
                    ({medication.description})
                  </Box>
                )}
                {medication.ppv && (
                  <Box as="span" fontSize="sm" color="green.600" ml={2}>
                    {medication.ppv}
                  </Box>
                )}
              </ListItem>
            ))}
          </UnorderedList>
        </Box>
      )}
    </>
  );
}

export default MedAutoComplete;