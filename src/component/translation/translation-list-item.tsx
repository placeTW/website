import {
  FormControl,
  Box,
  Card,
  CardBody,
  Textarea,
  Input,
  List,
  ListItem,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { TranslationListData } from "./translation-list-editor";
import { FaMinus, FaPlus } from "react-icons/fa";

interface Props {
  dataKeys: string[];
  translationData: TranslationListData | null;
  itemKeys?: { [key: string]: string };
  index: number;
  onEdit: (key: string, value: string | string[], index: number) => void;
}

const TranslationListItem = ({
  translationData,
  dataKeys,
  itemKeys,
  onEdit,
  index,
}: Props) => {
  const getValue = (key: string): string | string[] => {
    if (translationData && translationData[key]) {
      return translationData[key];
    }
    return itemKeys && itemKeys[key] === "list" ? [] : "";
  };

  const editList = (key: string, value: string, listIndex: number) => {
    const list = getValue(key) as string[];
    list[listIndex] = value;
    onEdit(key, list, index);
  };

  const addList = (key: string) => {
    const list = getValue(key) as string[];
    list.push("");
    onEdit(key, list, index);
  };

  const removeList = (key: string, listIndex: number) => {
    const list = getValue(key) as string[];
    list.splice(listIndex, 1);
    onEdit(key, list, index);
  };

  return (
    <>
      <Card className="card" minW={300}>
        <CardBody className="card-body">
          {dataKeys.map((key) => (
            <div key={key}>
              <Box as="h5" className="card-title">
                {key}
              </Box>
              <FormControl>
                {getValue(key) instanceof Array ||
                (itemKeys && itemKeys[key] === "list") ? (
                  <List>
                    {(getValue(key) as string[]).map((value, listIndex) => (
                      <ListItem>
                        <Input
                          type="text"
                          key={index}
                          wordBreak={"break-word"}
                          value={value}
                          disabled={key.includes("id")}
                          width="auto"
                          onChange={(e) => {
                            editList(key, e.target.value, listIndex);
                          }}
                        />
                        <IconButton
                          aria-label="delete"
                          onClick={() => removeList(key, listIndex)}
                          icon={<FaMinus />}
                        />
                      </ListItem>
                    ))}
                    <Button onClick={() => addList(key)} leftIcon={<FaPlus />}>
                      Add
                    </Button>
                  </List>
                ) : (getValue(key) as string).length < 20 ? (
                  <Input
                    wordBreak={"break-word"}
                    value={getValue(key) as string}
                    disabled={key.includes("id")}
                    onChange={(e) => {
                      onEdit(key, e.target.value, index);
                    }}
                  />
                ) : (
                  <Textarea
                    wordBreak={"break-word"}
                    value={getValue(key) as string}
                    disabled={key.includes("id")}
                    rows={4}
                    onChange={(e) => {
                      onEdit(key, e.target.value, index);
                    }}
                  />
                )}
              </FormControl>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
};

export default TranslationListItem;
