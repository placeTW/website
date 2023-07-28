import { Box, SimpleGrid } from "@chakra-ui/react";
import ArtCard from "../component/art-card";

const Gallery = () => {
  return (
    <SimpleGrid minChildWidth="300px" spacing="40px" m={2}>
      <Box>
        <ArtCard artId={"capoo"} title={"Capoo"} blurb={"blurb"} desc={"desc"}/>
      </Box>
      <Box>
        <ArtCard artId={"capoo"} title={"Capoo"} blurb={"blurb"} desc={"desc"}/>
      </Box>
      <Box>
        <ArtCard artId={"capoo"} title={"Capoo"} blurb={"blurb"} desc={"desc"}/>
      </Box>
      <Box>
        <ArtCard artId={"capoo"} title={"Capoo"} blurb={"blurb"} desc={"desc"}/>
      </Box>
      <Box>
        <ArtCard artId={"capoo"} title={"Capoo"} blurb={"blurb"} desc={"desc"}/>
      </Box>
      <Box>
        <ArtCard artId={"dd"} title={"Capoo"} blurb={"blurb"} desc={"desc"}/>
      </Box>
    </SimpleGrid>
  );
};

export default Gallery;
