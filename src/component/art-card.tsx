import {
  Box,
  Heading,
  Image,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

interface ArtCardProps {
  artId: string;
  title: string;
  blurb: string;
  desc: string;
}

const ArtCard: React.FC<ArtCardProps> = ({ artId, title, blurb, desc }) => {
  return (
    <Box boxShadow="2xl" overflow="hidden" rounded="md">
      {/* Image */}
      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
        <Image
          alt={artId}
          fallbackSrc="https://via.placeholder.com/200"
          h="200px"
          objectFit="cover"
          src={`/images/${artId}.png`}
        />
      </Box>

      <Box p={6}>
        <Stack>
          {/* Title */}
          <Text
            color={"green.500"}
            textTransform={"uppercase"}
            fontWeight={800}
            fontSize={"sm"}
            letterSpacing={1.1}
          >
            {title}
          </Text>

          {/* Blurb */}
          <Heading
            // eslint-disable-next-line react-hooks/rules-of-hooks
            color={useColorModeValue("gray.700", "white")}
            fontSize={"2xl"}
            fontFamily={"body"}
          >
            {blurb}
          </Heading>

          {/* Desc */}
          <Text color={"gray.500"}>{desc}</Text>
        </Stack>
      </Box>
    </Box>
  );
};

export default ArtCard;
