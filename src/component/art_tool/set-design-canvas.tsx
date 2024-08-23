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
import { Canvas } from "../../types/art-tool";
import { useDesignContext } from "../../context/design-context"; // Import DesignContext

interface SetDesignCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSetCanvas: (canvas: Canvas | null) => void;
}

const SetDesignCanvas: FC<SetDesignCanvasProps> = ({
  isOpen,
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
    onSetCanvas(selectedCanvas || null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Set Design Canvas</ModalHeader>
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
            Add
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
