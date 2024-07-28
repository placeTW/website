// src/main.tsx

import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./component/layout";
import "./i18n";
import "./index.scss";
import AdminPage from "./pages/admin";
import Gallery from "./pages/gallery";
import Translations from "./pages/translations";
import BriefingRoom from "./pages/briefing-room";
import { AlertProvider } from "./context/alert-context";
import AlertLevel2 from './component/alert-level-2'; // Import AlertLevel2

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <AlertProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<BriefingRoom />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/translations" element={<Translations />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/briefing-room" element={<BriefingRoom />} />
              <Route path="/alert-level-2" element={<AlertLevel2 />} /> {/* Add AlertLevel2 Route */}
            </Routes>
          </Layout>
        </BrowserRouter>
      </AlertProvider>
    </ChakraProvider>
  </React.StrictMode>,
);
