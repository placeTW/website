import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Input,
  Textarea,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Switch,
  Button,
  useToast,
} from '@chakra-ui/react';
import { AlertState } from '../../types/art-tool';
import { fetchAlertLevels, updateAlertLevel, setActiveAlertLevel } from '../../api/supabase/database';
import { supabase } from '../../api/supabase'; // Import the Supabase client

const AlertManage = () => {
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [editedAlertId, setEditedAlertId] = useState<number | null>(null);
  const [editedFields, setEditedFields] = useState<Partial<AlertState>>({});
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await fetchAlertLevels();
        setAlerts(data || []);
      } catch (error) {
        toast({
          title: 'Error fetching alerts',
          description: (error as Error).message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        console.error('Error during fetchAlertLevels in useEffect:', error);
      }
    };

    fetchAlerts();

    const subscription = supabase
      .channel('public:art_tool_alert_state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'art_tool_alert_state' },
        fetchAlerts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleInputChange = (alertId: number, field: string, value: any) => {
    setEditedAlertId(alertId);
    setEditedFields((prevFields) => ({
      ...prevFields,
      [field]: value,
    }));
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!editedAlertId) return;

    try {
      await updateAlertLevel(editedAlertId, editedFields);
      setIsEditing(false);
      setEditedAlertId(null);
      setEditedFields({});
      toast({
        title: 'Changes saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: `Error saving changes`,
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error(`Error during handleSaveChanges for alert_id ${editedAlertId}:`, error);
    }
  };

  const handleSetActiveAlert = async (activeAlertId: number) => {
    try {
      await setActiveAlertLevel(activeAlertId);
      setAlerts(alerts.map(a => ({ ...a, Active: a.alert_id === activeAlertId })));
    } catch (error) {
      toast({
        title: 'Error setting active alert',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error(`Error during handleSetActiveAlert for alert_id ${activeAlertId}:`, error);
    }
  };

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        Manage Alert Levels
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th width="20%">Alert Name</Th>
            <Th width="55%">Description</Th>
            <Th width="15%">Active</Th>
            <Th width="10%"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {alerts.map(alert => (
            <Tr key={alert.alert_id}>
              <Td>
                <Input
                  size="sm"
                  value={
                    editedAlertId === alert.alert_id && editedFields.alert_name !== undefined
                      ? editedFields.alert_name
                      : alert.alert_name
                  }
                  onChange={(e) => handleInputChange(alert.alert_id, 'alert_name', e.target.value)}
                />
              </Td>
              <Td>
                <Textarea
                  value={
                    editedAlertId === alert.alert_id && editedFields.message !== undefined
                      ? editedFields.message
                      : alert.message
                  }
                  onChange={(e) => handleInputChange(alert.alert_id, 'message', e.target.value)}
                  size="sm"
                  resize="vertical"
                  fontSize="sm"
                />
              </Td>
              <Td textAlign="center">
                <Switch
                  isChecked={alert.Active}
                  onChange={() => handleSetActiveAlert(alert.alert_id)}
                />
              </Td>
              <Td textAlign="center">
                {isEditing && editedAlertId === alert.alert_id && (
                  <Button colorScheme="blue" size="sm" onClick={handleSaveChanges}>
                    Save
                  </Button>
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
