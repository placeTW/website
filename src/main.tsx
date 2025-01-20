import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./component/layout";
import { AlertProvider } from "./context/alert-context";
import { DesignProvider } from "./context/design-context";
import { ColorProvider } from "./context/color-context"; // Import ColorProvider
import HomePage from "./pages";
import AdminPage from "./pages/admin";
import BriefingRoom from "./pages/briefing-room";
import DesignOffice from "./pages/design-office";
import Gallery from "./pages/gallery";
import Translations from "./pages/translations";

import theme from "./theme"; // Import your custom theme
import "./i18n";
import "./index.scss";

const enableArtTool = import.meta.env.VITE_ENABLE_ART_TOOL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Apply the custom theme to ChakraProvider */}
    <ChakraProvider theme={theme}> 
      <AlertProvider>
        <DesignProvider>
          <ColorProvider> {/* Wrap with ColorProvider */}
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/translations" element={<Translations />} />
                  <Route path="/admin" element={<AdminPage />} />
                  {enableArtTool && (
                    <>
                      <Route path="/briefing-room" element={<BriefingRoom />} />
                      <Route path="/design-office" element={<DesignOffice />} />
                    </>
                  )}
                </Routes>
              </Layout>
            </BrowserRouter>
          </ColorProvider>
        </DesignProvider>
      </AlertProvider>
    </ChakraProvider>
  </React.StrictMode>
);
