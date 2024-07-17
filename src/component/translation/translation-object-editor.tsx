import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  Heading,
  IconButton,
  Input,
  List,
  ListItem,
  Textarea,
} from "@chakra-ui/react";
import { FaMinus, FaPlus } from "react-icons/fa";

interface TranslationObjectEditorProps {
  objectKey: string;
  data: Record<string, string | string[]>;
  editText: (value: string | object) => void;
}

const TranslationObjectEditor = ({
  objectKey,
  data,
  editText,
}: TranslationObjectEditorProps) => {
  const getValue = (key: string): string | string[] => {
    if (data && data[key]) {
      return data[key];
    }
    return "";
  };

  const onEdit = (key: string, value: string | string[]) => {
    const newData = { ...data };
    newData[key] = value;
    editText(newData);
  };

  const editList = (key: string, value: string, listIndex: number) => {
    const list = getValue(key) as string[];
    list[listIndex] = value;
    onEdit(key, list);
  };

  const addList = (key: string) => {
    const list = getValue(key) as string[];
    list.push("");
    onEdit(key, list);
  };

  const removeList = (key: string, listIndex: number) => {
    const list = getValue(key) as string[];
    list.splice(listIndex, 1);
    onEdit(key, list);
  };

  return (
    <Card className="card" minW={300}>
      <CardHeader>
        <Heading size="md" className="card-title">
          {objectKey}
        </Heading>
      </CardHeader>
      <CardBody className="card-body">
        {Object.keys(data).map((dataKey) => (
          <div key={dataKey}>
            <Box as="h5" className="card-title">
              {dataKey}
            </Box>
            <FormControl>
              {data[dataKey] instanceof Array ? (
                <List>
                  {(data[dataKey] as string[]).map((value, listIndex) => (
                    <ListItem key={listIndex}>
                      <Input
                        type="text"
                        wordBreak={"break-word"}
                        value={value}
                        disabled={dataKey.includes("id")}
                        width="auto"
                        onChange={(e) => {
                          editList(dataKey, e.target.value, listIndex);
                        }}
                      />
                      <IconButton
                        aria-label="delete"
                        onClick={() => removeList(dataKey, listIndex)}
                        icon={<FaMinus />}
                      />
                    </ListItem>
                  ))}
                  <Button
                    onClick={() => addList(dataKey)}
                    leftIcon={<FaPlus />}
                  >
                    Add
                  </Button>
                </List>
              ) : (data[dataKey] as string).length < 20 ? (
                <Input
                  wordBreak={"break-word"}
                  value={data[dataKey] as string}
                  disabled={dataKey.includes("id")}
                  onChange={(e) => {
                    onEdit(dataKey, e.target.value);
                  }}
                />
              ) : (
                <Textarea
                  wordBreak={"break-word"}
                  value={data[dataKey] as string}
                  disabled={dataKey.includes("id")}
                  rows={4}
                  onChange={(e) => {
                    onEdit(dataKey, e.target.value);
                  }}
                />
              )}
            </FormControl>
          </div>
        ))}
      </CardBody>
    </Card>
  );
};

export default TranslationObjectEditor;
