import { useEffect, useState } from "react";
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
import { geti18nLanguage } from "../../utils";

interface Props {
  filename: string;
  itemKeys?: { [key: string]: string };
  editableLangs?: string[];
}

export interface TranslationListData {
  [key: string]: string | string[];
}

const TranslationListEditor = ({
  filename,
  itemKeys,
  editableLangs,
}: Props) => {
  const [translationData, setTranslationData] = useState(
    new Map<string, TranslationListData[]>()
  );
  const [translationKeys, setTranslationKeys] = useState<Set<string>>(
    new Set()
  );

  const [dataKeys, setDataKeys] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    // Within /locale/{language}/{filename}.json, fetch all the translations
    // and update the editor.
    const fetchTranslations = async (
      lang: string
    ): Promise<TranslationListData[]> => {
      try {
        const jsonPath = `/locales/${lang}/${filename}`;
        const response = await fetch(jsonPath);
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

    Promise.all(
      Object.keys(locales).map((lang) => updateTranslationData(lang))
    ).then(() => {
      setLoading(false);
    });
  });

  const canEditLanguage = (language: string): boolean => {
    return !editableLangs || editableLangs.includes(language);
  };

  const getData = (language: string): TranslationListData[] => {
    return translationData.get(language) ?? ([] as TranslationListData[]);
  };

  useEffect(() => {
    if (!edited) return;
    window.addEventListener("beforeunload", alertUser);
    return () => {
      window.removeEventListener("beforeunload", alertUser);
    };
  }, [edited]);
  const alertUser = (e: {
    preventDefault: () => void;
    returnValue: string;
  }) => {
    e.preventDefault();
    e.returnValue = "";
  };

  const getTranslationData = (language: string, index: number) => {
    return translationData.get(language)?.[index] ?? {};
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
                  key={language + "-language"}
                  fontSize="lg"
                  minW={30}
                  color={canEditLanguage(language) ? "black" : "lightgray"}
                >
                  <div>{`${locale.displayName}`}</div>

                  {officialLocales.includes(geti18nLanguage()) &&
                    geti18nLanguage() !== language && (
                      <div>{`(${
                        locale[geti18nLanguage() as keyof Locale]
                      })`}</div>
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
                    <Td key={language + "-button"}>
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
                  {Object.keys(locales).map((language) => (
                    <Td key={language}>
                      <TranslationListItem
                        key={key}
                        dataKeys={Array.from(dataKeys)}
                        itemKeys={itemKeys}
                        translationData={getTranslationData(
                          language,
                          Array.from(translationKeys).indexOf(key)
                        )}
                        index={Array.from(translationKeys).indexOf(key)}
                        onEdit={(key, value, index) => {
                          const newData = translationData.get(language);
                          if (newData && index !== undefined && index !== -1) {
                            newData[index][key] = value;
                            setTranslationData(
                              new Map(translationData.set(language, newData))
                            );
                            setEdited(true);
                          }
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
    </>
  );
};

export default TranslationListEditor;
