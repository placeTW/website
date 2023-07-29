import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import TranslationFileEditor from "../component/translation/translation-file-editor";
import { officialLocales } from "../i18n";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import TranslationListEditor from "../component/translation/translation-list-editor";

interface Metadata {
  type: string;
  interface?: string;
}

const TranslationVerification = ({ session }: { session: Session }) => {
  const [verified, setVerified] = useState(false);
  const [translationFilenames, setTranslationFilenames] = useState<string[]>(
    []
  );
  const [metadata, setMetadata] = useState<Map<string, Metadata>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const translations = import.meta.glob("/public/templates/*.json");
    setTranslationFilenames(
      Object.keys(translations).map(getFileNameWithExtension)
    );
  }, []);

  useEffect(() => {
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

    setLoading(true);
    Promise.all(
      translationFilenames.map((filename) => updateMetadata(filename))
    ).then(() => {
      console.log(metadata);
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
      <button
        onClick={() => supabase.auth.signOut()}
        className="button block full-width"
      >
        Log out
      </button>
      {verified && !loading && translationFilenames && metadata.size > 0 && (
        <Tabs>
          <TabList>
            {translationFilenames.map((filename) => {
              return <Tab>{filename}</Tab>;
            })}
          </TabList>
          <TabPanels>
            {translationFilenames.map((filename) => {
              return (
                <TabPanel>
                  {metadata.get(filename)?.type === "file" && (
                    <TranslationFileEditor
                      filename={filename}
                      editableLangs={officialLocales}
                    />
                  )}
                  {metadata.get(filename)?.type === "list" && (
                    <TranslationListEditor
                      filename={filename}
                      editableLangs={officialLocales}
                    />
                  )}
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>
      )}
    </div>
  );
};

export default TranslationVerification;
