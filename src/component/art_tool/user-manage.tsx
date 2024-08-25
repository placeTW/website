import { useEffect, useState } from "react";
import { Box, Table, Tbody, Td, Th, Thead, Tr, Select, Heading } from "@chakra-ui/react";
import { functionsFetchCanModerate, functionsUpdateUserStatus } from "../../api/supabase";
import { useUserContext } from "../../context/user-context";
import { UserType, RankType } from "../../types/users"; // Ensure these are imported correctly
import { useTranslation } from "react-i18next";

const UserManage: React.FC = () => {
  const { t } = useTranslation();
  const { users, currentUser, ranks } = useUserContext();
  const [moderatableRanks, setModeratableRanks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModeratableRanks = async () => {
      if (!currentUser) return;

      try {
        const data = await functionsFetchCanModerate(currentUser.rank);
        setModeratableRanks(data.can_moderate);
      } catch (error) {
        console.error("Fetch user details error:", error);
        setError("Fetch user details error");
      }
    };

    fetchModeratableRanks();
  }, [currentUser]);

  const updateUserRank = async (userId: string, rank: string) => {
    try {
      await functionsUpdateUserStatus(userId, rank);
    } catch (error) {
      console.error("Update user status error:", error);
      setError("Update user status error");
    }
  };

  const sortUsers = (users: UserType[]): UserType[] => {
    return users.sort((a, b) => {
      if (a.rank === b.rank) {
        return (a.email || "").localeCompare(b.email || "");
      }
      return a.rank.localeCompare(b.rank);
    });
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        {t("User Management")}
      </Heading>
      {error && <Box mb={4} color="red.500">{error}</Box>}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>{t("User ID")}</Th>
            <Th>{t("Username")}</Th>
            <Th>{t("Rank")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortUsers(users).map((user) => (
            <Tr key={user.user_id}>
              <Td>{user.user_id}</Td>
              <Td>{user.handle}</Td>
              <Td>
                <Select
                  value={user.rank}
                  onChange={(e) => updateUserRank(user.user_id, e.target.value)}
                  isDisabled={!moderatableRanks.includes(user.rank) || user.rank === currentUser?.rank}
                >
                  {ranks.map((rank: RankType) => (
                    <option key={rank.rank_id} value={rank.rank_id}>
                      {rank.rank_name}
                    </option>
                  ))}
                </Select>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default UserManage;
