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

interface AddToCanvasPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCanvas: (canvasId: string | null) => void;
}

const AddToCanvasPopup: FC<AddToCanvasPopupProps> = ({
  isOpen,
  onClose,
  onAddToCanvas,
}) => {
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        setIsLoading(true);
        const fetchedCanvases = await databaseFetchCanvases();
        setCanvases(fetchedCanvases);
        console.log(fetchedCanvases)
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
    setSelectedCanvasId(event.target.value);
  };

  const handleAddToCanvas = () => {
    onAddToCanvas(selectedCanvasId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Design to Canvas</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Text>Loading canvases...</Text>
          ) : (
            <Select
              placeholder="Select a canvas"
              value={selectedCanvasId || ""}
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
            onClick={handleAddToCanvas}
            isDisabled={!selectedCanvasId}
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

export default AddToCanvasPopup;
