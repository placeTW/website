import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
} from "@chakra-ui/react";
import { FC, useState } from "react";
import { useDesignContext } from "../../context/design-context"; // Import DesignContext
import { Canvas } from "../../types/art-tool";

interface SetDesignCanvasProps {
  isOpen: boolean;
  copy?: boolean;
  onClose: () => void;
  onSetCanvas: (canvas: Canvas | null, copy: boolean) => void;
}

const SetDesignCanvas: FC<SetDesignCanvasProps> = ({
  isOpen,
  copy,
  onClose,
  onSetCanvas,
}) => {
  const { canvases } = useDesignContext(); // Get canvases from context
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);

  const handleCanvasChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCanvasId = event.target.value;
    const selectedCanvas = canvases?.find(
      (canvas) => canvas.id === Number(selectedCanvasId),
    );

    setSelectedCanvas(selectedCanvas || null);
  };

  const handleSetCanvas = () => {
    onSetCanvas(selectedCanvas || null, copy || false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{copy ? "Copy to Canvas" : "Move to Canvas"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {canvases?.length === 0 || !canvases ? (
            <Text>No canvases available</Text>
          ) : (
            <Select
              placeholder="Select a canvas"
              value={selectedCanvas?.id || ""}
              onChange={handleCanvasChange}
            >
              {canvases.map((canvas) => (
                <option key={canvas.id} value={canvas.id}>
                  {canvas.canvas_name}
                </option>
              ))}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleSetCanvas}
            isDisabled={!selectedCanvas?.id}
          >
            {copy ? "Copy" : "Move"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SetDesignCanvas;
