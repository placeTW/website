import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import TranslationFileEditor from "../component/translation/translation-file-editor";
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import TranslationListEditor from "../component/translation/translation-list-editor";
import { useTranslation } from "react-i18next";

interface Metadata {
  type: string;
  item?: { [key: string]: string };
}

const TranslationVerification = ({ session }: { session: Session }) => {
  const { t } = useTranslation();

  const [verified, setVerified] = useState(false);
  const [translationFilenames, setTranslationFilenames] = useState<string[]>(
    []
  );
  const [metadata, setMetadata] = useState<Map<string, Metadata>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const translations = import.meta.env.DEV ? import.meta.glob("/public/templates/*.json") : import.meta.glob("/templates/*.json");
    setTranslationFilenames(
      Object.keys(translations).map(getFileNameWithExtension)
    );

    const fetchMetadata = async (filename: string): Promise<Metadata> => {
      try {
        const response = await fetch(`/templates/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch the json ${filename}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Error fetching the json: ${error}`);
        return {
          type: "file",
        } as Metadata;
      }
    };

    const updateMetadata = async (filename: string) => {
      const data = await fetchMetadata(filename);
      setMetadata(metadata.set(filename, data));
    };

    Promise.all(
      translationFilenames.map((filename) => updateMetadata(filename))
    ).then(() => {
      setLoading(false);
    });
  }, [metadata, translationFilenames]);

  function getFileNameWithExtension(filePath: string): string {
    // Use a regular expression to match the file name with extension
    const fileNameWithExtension = filePath.match(/\/([^/]+)$/)?.[1] || "";
    return fileNameWithExtension;
  }

  useEffect(() => {
    setVerified(true);
  }, [session]);

  // display the session user id
  return (
    <div className="col-6 form-widget">
      <h1 className="header">
        Logged in as {(session?.user?.identities ?? [])[0].id}
      </h1>
      <Button
        onClick={() => supabase.auth.signOut()}
        className="button block full-width"
      >
        {t("Log out")}
      </Button>
      {verified && !loading && translationFilenames && (
        <Tabs>
          <TabList>
            {translationFilenames.map((filename) => {
              return <Tab key={filename}>{filename}</Tab>;
            })}
          </TabList>
          <TabPanels>
            {metadata && translationFilenames.map((filename) => {
              return (
                <TabPanel key={filename}>
                  {metadata.get(filename) && metadata.get(filename)?.type === "file" && (
                    <TranslationFileEditor filename={filename} />
                  )}
                  {metadata.get(filename) && metadata.get(filename)?.type === "list" && (
                    <TranslationListEditor
                      filename={filename}
                      itemKeys={metadata.get(filename)?.item}
                    />
                  )}
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>
      )}
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default TranslationVerification;
