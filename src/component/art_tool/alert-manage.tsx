import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Textarea,
  Input,
  IconButton,
  Button,
  Switch,
  useToast,
  Select,
  Heading,
} from "@chakra-ui/react";
import { FaEdit, FaSave } from "react-icons/fa";
import {
  updateAlertLevel,
  setActiveAlertLevel,
} from "../../api/supabase/database";
import { AlertState } from "../../types/art-tool";
import { useAlertContext } from "../../context/alert-context";
import { useDesignContext } from "../../context/design-context";

const AlertManage: React.FC = () => {
  const { currentAlertData, setActiveAlertId, alertLevels } = useAlertContext();
  const { canvases } = useDesignContext();
  
  // Provide default empty array if alertLevels is null
  const [alerts, setAlerts] = useState<AlertState[]>(alertLevels ?? []);
  const [editedFields, setEditedFields] = useState<Record<number, Partial<AlertState>>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Ensure alertLevels is non-null before setting state
    setAlerts(alertLevels ?? []);
  }, [alertLevels]);

  const handleInputChange = (alertId: number, field: string, value: any) => {
    setEditedFields((prevFields) => ({
      ...prevFields,
      [alertId]: {
        ...(prevFields[alertId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (alertId: number) => {
    const editedAlert = editedFields[alertId];
    if (editedAlert) {
      try {
        await updateAlertLevel(alertId, editedAlert);
        setEditingId(null);
        toast({
          title: "Success",
          description: "Alert level updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error updating alert level:", error);
        toast({
          title: "Error",
          description: "Failed to update alert level",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleActivateAlert = async (alertId: number) => {
    try {
      await setActiveAlertLevel(alertId);
      setActiveAlertId(alertId);
      toast({
        title: "Success",
        description: "Alert level activated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error activating alert level:", error);
      toast({
        title: "Error",
        description: "Failed to activate alert level",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditClick = (alertId: number) => {
    setEditingId(alertId);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Alert Management
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th width="25%">Alert Name</Th>
            <Th>Description</Th>
            <Th width="20%">Canvas</Th>
            <Th width="10%">Active</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {alerts.map((alert) => (
            <Tr key={alert.alert_id}>
              <Td>
                {editingId === alert.alert_id ? (
                  <Input
                    value={editedFields[alert.alert_id]?.alert_name || alert.alert_name}
                    onChange={(e) => handleInputChange(alert.alert_id, "alert_name", e.target.value)}
                  />
                ) : (
                  alert.alert_name
                )}
              </Td>
              <Td>
                {editingId === alert.alert_id ? (
                  <Textarea
                    value={editedFields[alert.alert_id]?.message || alert.message}
                    onChange={(e) => handleInputChange(alert.alert_id, "message", e.target.value)}
                  />
                ) : (
                  alert.message
                )}
              </Td>
              <Td>
                {editingId === alert.alert_id ? (
                  <Select
                    value={editedFields[alert.alert_id]?.canvas_id ?? alert.canvas_id ?? ""}
                    onChange={(e) => handleInputChange(alert.alert_id, "canvas_id", e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {canvases?.map((canvas) => (
                      <option key={canvas.id} value={canvas.id}>
                        {canvas.canvas_name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  canvases?.find((c) => c.id === alert.canvas_id)?.canvas_name || "Unassigned"
                )}
              </Td>
              <Td>
                <Switch
                  isChecked={alert.alert_id === currentAlertData?.alert_id}
                  onChange={() => handleActivateAlert(alert.alert_id)}
                />
              </Td>
              <Td>
                {editingId === alert.alert_id ? (
                  <Button leftIcon={<FaSave />} colorScheme="blue" onClick={() => handleSave(alert.alert_id)}>
                    Save
                  </Button>
                ) : (
                  <IconButton icon={<FaEdit />} aria-label="Edit" onClick={() => handleEditClick(alert.alert_id)} />
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AlertManage;
