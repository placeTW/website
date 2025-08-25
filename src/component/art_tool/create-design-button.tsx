import { Box, Button } from "@chakra-ui/react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa6";
import CreateDesignModal from "./create-design-modal";
import { Design } from "../../types/art-tool";

interface CreateDesignButtonProps {
  canvasId: number | undefined;
  onCreate: (design: Design) => void;
}

const CreateDesignButton: FC<CreateDesignButtonProps> = ({ canvasId, onCreate }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Box>
        <Button
          leftIcon={<FaPlus />}
          aria-label={t("Create new design")}
          size="lg"
          colorScheme="blue"
          onClick={handleOpenModal}
          boxShadow="lg"
          borderRadius="full"
        >
          {t("New Design")}
        </Button>
      </Box>
      <CreateDesignModal isOpen={isModalOpen} canvasId={canvasId} onClose={handleCloseModal} onCreate={onCreate} />
    </>
  );
};

export default CreateDesignButton;
