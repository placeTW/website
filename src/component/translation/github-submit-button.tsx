import { Button, Icon } from "@chakra-ui/react";
import { FaPaperPlane } from "react-icons/fa";
import ExportTranslationModal from "./export-translation-modal";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const REPOSITORY_URL =
  "https://github.com/placeTW/website/edit/main/public/locales/";

interface Props {
  filename: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: string;
  locale: string;
}

const GithubSubmitButton = ({ filename, data, locale }: Props) => {
  const { t } = useTranslation();

  const [openModal, setOpenModal] = useState(false);

  const getUrl = () => {
    return (
      REPOSITORY_URL + locale + "/?filename=" + filename +
      (!needCopy(data) ? getEncodedData(data) : "&value=")
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
        locale={locale}
        filename={filename}
      />
    </>
  );
};

export default GithubSubmitButton;
