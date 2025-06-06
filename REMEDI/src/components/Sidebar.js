import React, { useState, createContext, useContext, useEffect } from "react";
import {
  IconButton,
  Avatar,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import {
  FiHome,
  FiMenu,
  FiChevronDown,
  FiSearch,
  FiCalendar,
} from "react-icons/fi";
import { CiPill } from "react-icons/ci";
import SignOut from "./SignOut";
import Home from "./tabs/Home";
import Medications from "./tabs/Medications";
import Lookup from "./tabs/Lookup";
import Appointments from "./tabs/Appointments";

const LinkItems = [
  { name: "Home", icon: FiHome },
  { name: "Medications", icon: CiPill },
  { name: "Appointments", icon: FiCalendar },
  { name: "Lookup", icon: FiSearch },
];

// Create a context to store the activeTab state and setActiveTab function
const SidebarContext = createContext();

export default function Sidebar({ firstName, lastName }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState("Home");

  // Add useEffect to ensure Home tab is selected on initial render
  useEffect(() => {
    if (!activeTab) {
      setActiveTab("Home");
    }
  }, [activeTab]);

  // Pass the activeTab state and setActiveTab function to the SidebarContext provider
  return (
    <SidebarContext.Provider value={{ activeTab, setActiveTab }}>
      <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.800")}>
        <SidebarContent
          onClose={onClose}
          display={{ base: "none", md: "block" }}
        />
        <Drawer
          autoFocus={false}
          isOpen={isOpen}
          placement="left"
          onClose={onClose}
          returnFocusOnClose={false}
          onOverlayClick={onClose}
          size="full"
        >
          <DrawerContent>
            <SidebarContent onClose={onClose} />
          </DrawerContent>
        </Drawer>
        {/* mobilenav */}
        <MobileNav onOpen={onOpen} firstName={firstName} lastName={lastName} />
        <Box ml={{ base: 0, md: 60 }} p="4">
          {/* Navigation Content goes here */}
          {activeTab === "Home" && <Home />}
          {activeTab === "Medications" && <Medications />}
          {activeTab === "Lookup" && <Lookup />}
          {activeTab === "Appointments" && <Appointments />}
        </Box>
      </Box>
    </SidebarContext.Provider>
  );
}

function SidebarContent({ onClose, ...rest }) {
  // Access the activeTab state and setActiveTab function from the SidebarContext
  const { activeTab, setActiveTab } = useContext(SidebarContext);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <Box
      transition="3s ease"
      bgGradient="linear(to-b, teal.500, blue.500)"
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text
          fontSize="2xl"
          fontFamily="monospace"
          fontWeight="bold"
          color="white"
        >
          REMEDI
        </Text>
        <CloseButton
          color="white"
          display={{ base: "flex", md: "none" }}
          onClick={onClose}
        />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          active={activeTab === link.name}
          onClick={() => handleTabClick(link.name)}
          isActive={activeTab === link.name}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
}

function NavItem({ icon, children, active, onClick, isActive, ...rest }) {
  return (
    <Link
      href="#"
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? "whiteAlpha.300" : "transparent"}
        color="white"
        fontWeight={isActive ? "bold" : "normal"}
        _hover={{
          bg: "teal.400",
          color: "white",
        }}
        boxShadow={isActive ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none"}
        transition="all 0.3s"
        onClick={onClick} // Trigger the onClick function to update the activeTab state
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="18"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
}

function MobileNav({ onOpen, firstName, lastName, ...rest }) {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      boxShadow="sm"
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
        bgGradient="linear(to-r, teal.500, blue.500)"
        bgClip="text"
      >
        REMEDI
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <Flex alignItems={"center"}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: "none" }}
            >
              <HStack>
                <Avatar
                  size={"sm"}
                  src={
                    "https://www.freepik.com/free-icon/user_14023446.htm#query=default%20avatar&position=8&from_view=keyword&track=ais"
                  }
                  bg="teal.500"
                />
                <VStack
                  display={{ base: "none", md: "flex" }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="md">
                    {firstName} {lastName}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    User
                  </Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue("white", "gray.900")}
              borderColor={useColorModeValue("gray.200", "gray.700")}
              boxShadow="lg"
            >
              <MenuItem>Profile</MenuItem>
              <MenuDivider />
              <SignOut />
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
}
