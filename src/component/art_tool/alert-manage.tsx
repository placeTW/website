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
  Heading,
} from "@chakra-ui/react";
import { FaEdit, FaSave } from "react-icons/fa";
import { updateAlertLevel, setActiveAlertLevel } from "../../api/supabase/database";
import { AlertState } from "../../types/art-tool";
import { useAlertContext } from "../../context/alert-context";

const AlertManage: React.FC = () => {
  const { alertId, setActiveAlertId, alertLevels } = useAlertContext();
  const [alerts, setAlerts] = useState<AlertState[]>(alertLevels);
  const [editedFields, setEditedFields] = useState<Record<number, Partial<AlertState>>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Update the component's state whenever the alert levels change in the context
    setAlerts(alertLevels);
    console.log("Context updated alerts:", alertLevels);
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
    if (editedFields[alertId]) {
      try {
        await updateAlertLevel(alertId, editedFields[alertId]);
        setEditingId(null); // Exit editing mode
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
        Manage Alert Levels
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Alert Name</Th>
            <Th>Description</Th>
            <Th>Active</Th>
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
                    onChange={(e) =>
                      handleInputChange(alert.alert_id, "alert_name", e.target.value)
                    }
                  />
                ) : (
                  alert.alert_name
                )}
              </Td>
              <Td>
                {editingId === alert.alert_id ? (
                  <Textarea
                    value={editedFields[alert.alert_id]?.message || alert.message}
                    onChange={(e) =>
                      handleInputChange(alert.alert_id, "message", e.target.value)
                    }
                  />
                ) : (
                  alert.message
                )}
              </Td>
              <Td>
                <Switch
                  isChecked={alert.alert_id === alertId}
                  onChange={() => handleActivateAlert(alert.alert_id)}
                />
              </Td>
              <Td>
                {editingId === alert.alert_id ? (
                  <Button
                    leftIcon={<FaSave />}
                    colorScheme="blue"
                    onClick={() => handleSave(alert.alert_id)}
                  >
                    Save
                  </Button>
                ) : (
                  <IconButton
                    icon={<FaEdit />}
                    aria-label="Edit"
                    onClick={() => handleEditClick(alert.alert_id)}
                  />
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
