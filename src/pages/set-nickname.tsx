import { Box, Button, FormControl, FormLabel, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const SetNickname = () => {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
      } else {
        navigate("/"); // Redirect to home if there's no session
      }
    };

    getSession();
  }, [navigate]);

  const handleSetNickname = async () => {
    if (userId) {
      await supabase.from("profiles").upsert({ id: userId, nickname });
      navigate("/");
    }
  };

  return (
    <Box>
      <FormControl>
        <FormLabel>{t("Enter your nickname")}</FormLabel>
        <Input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </FormControl>
      <Button onClick={handleSetNickname} colorScheme="teal" mt={4}>
        {t("Set Nickname")}
      </Button>
    </Box>
  );
};

export default SetNickname;
