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
  const [idKey, setIdKey] = useState<string>("id");

  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState(false);
  const [translationsNeeded, setTranslationsNeeded] = useState<Set<string>>(
    new Set()
  );

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
        setTranslationsNeeded(translationsNeeded.add(lang));
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
            setIdKey(key);
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
      // get the longest translation list
      const max = Math.max(
        ...Array.from(translationData.values()).map((data) => data.length)
      );
      // fill the translation list with empty data if it is emty
      Array.from(translationData.keys()).forEach((lang) => {
        const data = translationData.get(lang);
        if (data && data.length < max) {
          for (let i = data.length; i < max; i++) {
            data.push({
              [idKey]: Array.from(translationKeys)[i] ?? String(i),
            });
          }
          setTranslationData(new Map(translationData.set(lang, data)));
        }
      });
      setLoading(false);
    });
  }, []);

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
                  color={
                    canEditLanguage(language)
                      ? translationsNeeded.has(language)
                        ? "red"
                        : "black"
                      : "lightgray"
                  }
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
          {!loading && translationData && (
            <Tbody>
              <Tr>
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Object.keys(locales).map((language) => (
                    <Td key={language + "-button"}>
                      <GithubSubmitButton
                        filename={filename}
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
                    <Td key={language} verticalAlign="top">
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
