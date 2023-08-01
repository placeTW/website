import {
  Input,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Locale, locales, officialLocales } from "../../i18n";
import { geti18nLanguage } from "../../utils";
import GithubSubmitButton from "./github-submit-button";
import TranslationObjectEditor from "./translation-object-editor";
import { Placeholder } from "../../modules/translation-verification";

interface Props {
  filename: string;
  editableLangs?: string[];
  placeholder?: Placeholder;
}

const TranslationFileEditor = ({ filename, editableLangs, placeholder }: Props) => {
  const [translationData, setTranslationData] = useState(
    new Map<string, Record<string, string | object>>(),
  );

  const [translationKeys, setTranslationKeys] = useState<Set<string>>(
    new Set(),
  );

  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    const fetchTranslations = async (
      lang: string,
    ): Promise<Record<string, string | object>> => {
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

    Promise.all(
      Object.keys(locales).map((lang) => updateTranslationData(lang)),
    ).then(() => {
      setLoading(false);
    });
  }, []);

  const getTranslation = (language: string, key: string): string | object => {
    const translation = translationData.get(language)?.[key];
    return translation && translation !== "---" ? translation : placeholder ?? "";
  };

  const canEditLanguage = (language: string): boolean => {
    return !editableLangs || editableLangs.includes(language);
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

  const editText = (language: string, key: string, value: string | object) => {
    const newTranslationData = new Map(translationData);
    const newTranslation = newTranslationData.get(language) ?? {};
    newTranslation[key] = value;
    newTranslationData.set(language, newTranslation);
    setTranslationData(newTranslationData);
    setEdited(true);
  };

  const StringEditor = (key: string, language: string) =>
    (getTranslation(language, key) as string).length < 20 ? (
      <Input
        type="text"
        disabled={!canEditLanguage(language)}
        variant="outline"
        minW={275}
        value={getTranslation(language, key) as string}
        placeholder={"(Placeholder) " + key}
        color={getTranslation(language, key) ? "black" : "red"}
        _placeholder={{ opacity: 0.4, color: "inherit" }}
        onChange={(event) => {
          editText(language, key, event.target.value);
        }}
      />
    ) : (
      <Textarea
        disabled={!canEditLanguage(language)}
        variant="outline"
        minW={275}
        value={getTranslation(language, key) as string}
        placeholder={"(Placeholder) " + key}
        color={getTranslation(language, key) ? "black" : "red"}
        wrap="soft"
        _placeholder={{ opacity: 0.4, color: "inherit" }}
        onChange={(event) => {
          editText(language, key, event.target.value);
        }}
      />
    );

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
          {!loading && translationData && (
            <Tbody>
              <Tr>
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Object.keys(locales).map((language) => (
                    <Td key={language + "-button"}>
                      <GithubSubmitButton
                        filename={filename}
                        data={JSON.stringify(
                          translationData.get(language),
                          null,
                          2,
                        )}
                        locale={language}
                      />
                    </Td>
                  ))
                }
              </Tr>
              {Array.from(translationKeys).map((key) => (
                <Tr key={key}>
                  {Object.entries(locales).map(([language]) => (
                    <Td key={language} verticalAlign="top">
                      {typeof getTranslation(language, key) === "string" ? (
                        StringEditor(key, language)
                      ) : (
                        <TranslationObjectEditor
                          objectKey={key}
                          data={
                            getTranslation(language, key) as Record<
                              string,
                              string | string[]
                            >
                          }
                          editText={(value) => editText(language, key, value)}
                        />
                      )}
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

export default TranslationFileEditor;
