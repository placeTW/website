import { FormControl, Box, Card, CardBody, Textarea } from "@chakra-ui/react";
import { TranslationListData } from "./translation-list-editor";

interface Props {
  dataKeys: string[];
  translationData: TranslationListData | null;
  index: number;
  onEdit: (key: string, value: string, index: number) => void;
}

const TranslationListItem = ({
  translationData,
  dataKeys,
  onEdit,
  index,
}: Props) => {
  // Make a card for the TranslaationListData, which is a list of objects. The key is on the left, followed by an input for the value
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
                <Textarea
                  wordBreak={"break-word"}
                  value={translationData ? translationData[key] : ""}
                  onChange={(e) => {
                    onEdit(key, e.target.value, index);
                  }}
                />
              </FormControl>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
};

export default TranslationListItem;
