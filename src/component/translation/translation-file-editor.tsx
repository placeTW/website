import { useTranslation } from "react-i18next";
import { officialLocales, locales, Locale } from "../../i18n";
import { useEffect, useState } from "react";
import {
  Input,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

interface Props {
  filename: string;
  editableLangs: string[];
}

const TranslationFileEditor = ({ filename, editableLangs }: Props) => {
  const { i18n } = useTranslation();

  const [translationData, setTranslationData] = useState(
    new Map<string, Record<string, string>>()
  );

  const [translationKeys, setTranslationKeys] = useState<Set<string>>(
    new Set()
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Within /locale/{language}/{filename}.json, fetch all the translations
    // and update the editor.
    const fetchTranslations = async (
      lang: string
    ): Promise<Record<string, string>> => {
      try {
        const jsonPath = `/locales/${lang}/${filename}.json`;
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch the json ${jsonPath}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Error fetching the json: ${error}`);
        return {};
      }
    };

    const updateTranslationData = async (lang: string) => {
      const data = await fetchTranslations(lang);
      Object.keys(data).forEach((key) => {
        setTranslationKeys(translationKeys.add(key));
      });
      setTranslationData(translationData.set(lang, data));
    };

    setLoading(true);
    Promise.all(
      Object.keys(locales).map((lang) => updateTranslationData(lang))
    ).then(() => {
      setLoading(false);
    });
  }, [filename, i18n, translationKeys]);

  const getTranslation = (language: string, key: string): string => {
    const translation = translationData.get(language)?.[key];
    return translation && translation !== "---" ? translation : "";
  };

  return (
    <TableContainer>
      <Table overflowX="auto" whiteSpace="nowrap">
        <TableCaption placement="top" fontSize="xl">
          {filename}.json
        </TableCaption>
        <Thead>
          <Tr>
            <Th key="id"></Th>
            {Object.entries(locales).map(([language, locale]) => (
              <Th key={language} fontSize="lg" minW={30} color={editableLangs.includes(language) ? "black" : "lightgray"}>
                <div>{`${locale.displayName}`}</div>
                {officialLocales.includes(i18n.language) &&
                  i18n.language !== language && (
                    <div>{`(${locale[i18n.language as keyof Locale]})`}</div>
                  )}
              </Th>
            ))}
          </Tr>
        </Thead>
        {!loading && (
          <Tbody>
            {Array.from(translationKeys).map((key) => (
              <Tr key={key}>
                <Td fontSize="xs" key="id">
                  {key}
                </Td>
                {Object.entries(locales).map(([language, locale]) => (
                  <Td key={language}>
                    <Input
                      disabled={locale.default || !editableLangs.includes(language)}
                      variant="outline"
                      minW={275}
                      value={getTranslation(language, key)}
                      placeholder={"(Placeholder) " + key}
                      color={getTranslation(language, key) ? "black" : "red"}
                      _placeholder={{ opacity: 0.4, color: 'inherit' }}
                      onChange={(event) => {
                        const newTranslationData = new Map(translationData);
                        const newTranslation =
                          newTranslationData.get(language) ?? {};
                        newTranslation[key] = event.target.value;
                        newTranslationData.set(language, newTranslation);
                        setTranslationData(newTranslationData);
                      }}
                    />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        )}
      </Table>
    </TableContainer>
  );
};

export default TranslationFileEditor;
