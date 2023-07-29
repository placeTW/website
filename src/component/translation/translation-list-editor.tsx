import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GithubSubmitButton from "./github-submit-button";
import { Locale, locales, officialLocales } from "../../i18n";
import TranslationListItem from "./translation-list-item";
import {
  TableContainer,
  Table,
  TableCaption,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@chakra-ui/react";

interface Props {
  filename: string;
  editableLangs?: string[];
}

export interface TranslationListData {
  [key: string]: string | string[];
}

const TranslationListEditor = ({ filename, editableLangs }: Props) => {
  const { i18n } = useTranslation();

  const [translationData, setTranslationData] = useState(
    new Map<string, TranslationListData[]>()
  );
  const [translationKeys, setTranslationKeys] = useState<Set<string>>(
    new Set()
  );

  const [dataKeys, setDataKeys] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Within /locale/{language}/{filename}.json, fetch all the translations
    // and update the editor.
    const fetchTranslations = async (
      lang: string
    ): Promise<TranslationListData[]> => {
      try {
        const jsonPath = `/locales/${lang}/${filename}`;
        const response = await fetch(jsonPath);
        console.log(response);
        if (!response.ok) {
          throw new Error(`Failed to fetch the json ${jsonPath}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Error fetching the json: ${error}`);
        return [] as TranslationListData[];
      }
    };

    const updateTranslationData = async (lang: string) => {
      const data = await fetchTranslations(lang);
      data.forEach((translation) => {
        Object.keys(translation)
          .filter((key) => key.includes("id"))
          .forEach((key) => {
            setTranslationKeys(translationKeys.add(translation[key] as string));
          });
        Object.keys(translation).forEach((key) => {
          setDataKeys(dataKeys.add(key));
        });
      });

      setTranslationData(translationData.set(lang, data));
    };

    setLoading(true);
    Promise.all(
      Object.keys(locales).map((lang) => updateTranslationData(lang))
    ).then(() => {
      setLoading(false);
      console.log(dataKeys);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canEditLanguage = (language: string): boolean => {
    return !editableLangs || editableLangs.includes(language);
  };

  const getData = (language: string): TranslationListData[] => {
    return translationData.get(language) ?? ([] as TranslationListData[]);
  };
  

  return (
    <>
      <TableContainer>
        <Table overflowX="auto" whiteSpace="nowrap">
          <TableCaption placement="top" fontSize="xl">
            {filename}
          </TableCaption>
          <Thead>
            <Tr>
              {Object.entries(locales).map(([language, locale]) => (
                <Th
                  key={language}
                  fontSize="lg"
                  minW={30}
                  color={canEditLanguage(language) ? "black" : "lightgray"}
                >
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
              <Tr>
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Object.keys(locales).map((language) => (
                    <Td>
                      <GithubSubmitButton
                        filename={`${language}/${filename}`}
                        data={JSON.stringify(getData(language), null, 2)}
                        locale={language}
                      />
                    </Td>
                  ))
                }
              </Tr>

              {Array.from(translationKeys).map((key) => (
                <Tr key={key}>
                  {Object.entries(locales).map(([language]) => (
                    <Td key={language}>
                      <TranslationListItem
                        dataKeys={Array.from(dataKeys)}
                        translationData={
                          translationData
                            .get(language)
                            ?.find(
                              (translation) =>
                                translation[
                                  Object.keys(translation).find((key) =>
                                    key.includes("id")
                                  ) ?? "id"
                                ] === key
                            ) as TranslationListData
                        }
                      />
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
    </>
  );
};

export default TranslationListEditor;
