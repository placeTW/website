import { Button, Icon } from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";

const REPOSITORY_URL =
  "https://github.com/placeTW/website/new/main/public/locales/";

interface Props {
  filename: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: string;
  locale: string;
}

const GithubSubmitButton = ({ filename, data, locale }: Props) => {
  const getUrl = (locale: string) => {
    return (
      REPOSITORY_URL +
      "?filename=" +
      filename +
      "&value=" +
      encodeURI(data)
    );
  };

  return (
    <Button
      leftIcon={<Icon as={FaGithub} />}
      colorScheme="gray"
      variant="outline"
      size="md"
      onClick={() => {
        console.log(data);
        // Add your GitHub submission logic here
        // For example, you can handle the click event and submit to GitHub using an API.
        window.open(getUrl(locale), "_blank", "noopener");
      }}
    >
      Submit to GitHub
    </Button>
  );
};

export default GithubSubmitButton;
