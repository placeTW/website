import { Button, Icon } from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";

const REPOSITORY_URL =
  "https://github.com/placeTW/website/new/main/translations/";

interface Props {
  filename: string;
  data: any;
}

const GithubSubmitButton = ({ filename, data }: Props) => {
  return (
    <Button
      leftIcon={<Icon as={FaGithub} />}
      colorScheme="gray"
      variant="outline"
      size="md"
      onClick={() => {
        // Add your GitHub submission logic here
        // For example, you can handle the click event and submit to GitHub using an API.
        window.open(
          REPOSITORY_URL +
            "?filename=" +
            filename +
            "&value=" +
            JSON.stringify(Object.fromEntries(data)),
          "_blank",
          "noopener"
        );
      }}
    >
      Submit to GitHub
    </Button>
  );
};

export default GithubSubmitButton;
