// add-to-canvas-popup.tsx
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
  Text, // Added import for Text
} from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { databaseFetchCanvases } from "../../api/supabase/database";
import { Canvas } from "../../types/art-tool";

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
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        setIsLoading(true);
        const fetchedCanvases = await databaseFetchCanvases();
        setCanvases(fetchedCanvases);
        console.log(fetchedCanvases);
      } catch (error) {
        console.error("Error fetching canvases:", error);
        // Handle error, e.g., show a toast message
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanvases();
  }, []);

  const handleCanvasChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCanvasId = event.target.value;
    console.log(selectedCanvasId);
    console.log(canvases);
    const selectedCanvas = canvases.find(
      (canvas) => canvas.id === Number(selectedCanvasId),
    );
    console.log(selectedCanvas);

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
          {isLoading ? (
            <Text>Loading canvases...</Text>
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