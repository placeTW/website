import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { FaEdit, FaEye, FaShareAlt, FaTrash } from "react-icons/fa";

const proposals = [
  {
    name: "New Proposal Name",
    imgSrc: "/path/to/placeholder.png",
    createdBy: "",
    rank: "",
  },
  {
    name: "Taiwan Flag Small",
    imgSrc: "/path/to/taiwan_flag_small.png",
    createdBy: "Admiral HT",
    rank: "Admiral",
  },
  {
    name: "Cake",
    imgSrc: "/path/to/cake.png",
    createdBy: "Admiral HT",
    rank: "Admiral",
  },
];

const ProposalCards: React.FC = () => {
  return (
    <VStack spacing={4} align="stretch">
      {proposals.map((proposal, index) => (
        <Box
          key={index}
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="sm"
          padding="4"
          bg="white"
        >
          <HStack spacing={4} align="center">
            <Image
              src={proposal.imgSrc}
              boxSize="50px"
              objectFit="cover"
              alt={proposal.name}
            />
            <Box flex="1">
              <Heading size="md">{proposal.name}</Heading>
              {proposal.createdBy && (
                <Text fontSize="sm" color="gray.500">
                  {proposal.createdBy}
                </Text>
              )}
            </Box>
            <Button variant="ghost" colorScheme="blue" size="sm">
              <FaEye />
            </Button>
            <Button variant="ghost" colorScheme="blue" size="sm">
              <FaEdit />
            </Button>
            <Button variant="ghost" colorScheme="blue" size="sm">
              <FaShareAlt />
            </Button>
            <Button variant="ghost" colorScheme="red" size="sm">
              <FaTrash />
            </Button>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};

export default ProposalCards;
