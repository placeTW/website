import GithubSubmitButton from "./github-submit-button";

interface Props {
  filename: string;
  interface: string;
  editableLangs?: string[];
}

const TranslationListEditor = ({filename, interface, editableLangs}: Props) => {

  const canEditLanguage = (language: string): boolean => {
    return !editableLangs || editableLangs.includes(language);
  };


  return (
    <>
      <GithubSubmitButton filename={filename}/>
    </>
  );
};

export default TranslationListEditor;
