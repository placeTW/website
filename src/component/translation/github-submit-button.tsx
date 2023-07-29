import { Button, Icon } from "@chakra-ui/react";
import { FaPaperPlane } from "react-icons/fa";
import ExportTranslationModal from "./export-translation-modal";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const REPOSITORY_URL =
  "https://github.com/placeTW/website/new/main/public/locales/";

interface Props {
  filename: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: string;
  locale: string;
}

const GithubSubmitButton = ({ filename, data }: Props) => {
  const { t } = useTranslation();

  const [openModal, setOpenModal] = useState(false);

  const getUrl = () => {
    return (
      REPOSITORY_URL +
      "?filename=" +
      filename +
      (!needCopy(data) ? getEncodedData(data) : "")
    );
  };

  const getEncodedData = (data: string) => {
    return "&value=" + encodeURI(data);
  };

  const needCopy = (data: string) => {
    return data?.length > 1000;
  };

  return (
    <>
      <Button
        leftIcon={<Icon as={FaPaperPlane} />}
        colorScheme="gray"
        variant="outline"
        size="md"
        onClick={() => {
          setOpenModal(true);
          console.log(data);
        }}
      >
        {t("Submit Translation")}
      </Button>
      <ExportTranslationModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        data={data}
        url={getUrl()}
        needCopy={needCopy(data)}
      />
    </>
  );
};

export default GithubSubmitButton;
