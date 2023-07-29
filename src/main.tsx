import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages";
import Gallery from "./pages/gallery";
import Layout from "./component/layout";
import "./i18n";
import Translations from "./pages/translations";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/translations" element={<Translations />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
