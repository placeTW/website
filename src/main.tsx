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
import BriefingRoom from "./pages/briefing-room"; // Import BriefingRoom
import { AlertProvider } from "./context/alert-context"; // Import AlertProvider
import DesignOffice from './pages/design-office';


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <AlertProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<BriefingRoom />} /> {/* Load BriefingRoom by default */}
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/translations" element={<Translations />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/briefing-room" element={<BriefingRoom />} />
              <Route path="/design-office" element={<DesignOffice />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AlertProvider>
    </ChakraProvider>
  </React.StrictMode>,
);
