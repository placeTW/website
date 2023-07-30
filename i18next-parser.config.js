// i18next-parser.config.js

export default {
  contextSeparator: "_",
  createOldCatalogs: false,
  defaultNamespace: "translation",
  defaultValue: function (locale, namespace, key, value) {
    if (locale === "en") {
      return value || key;
    }
    return "";
  },
  indentation: 2,
  keepRemoved: false,
  keySeparator: false,
  lexers: {
    ts: [{ lexer: "JavascriptLexer" }],
    tsx: [{ lexer: "JsxLexer" }],
    js: [{ lexer: "JavascriptLexer" }],
    jsx: [{ lexer: "JsxLexer" }],
    default: ["JavascriptLexer"],
  },
  locales: ["en", "zh", "lt", "lv", "et", "fr", "cz", "es", "ua"],
  namespaceSeparator: false,
  output: "public/locales/$LOCALE/$NAMESPACE.json",
  pluralSeparator: false,
  input: ["src/**/*.{js,jsx,ts,tsx}", "src/*.{js,jsx,ts,tsx}"],
  sort: true,
  skipDefaultValues: false,
  useKeysAsDefaultValue: true,
  verbose: true,
  failOnWarnings: false,
  failOnUpdate: false,
  customValueTemplate: null,
  resetDefaultValueLocale: true,
  i18nextOptions: null,
};
