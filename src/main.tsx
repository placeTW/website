import { ChakraProvider } from "@chakra-ui/react";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./component/layout";
import ProtectedRoute from "./component/auth/ProtectedRoute";
import { AlertProvider } from "./context/alert-context";
import { DesignProvider } from "./context/design-context";  
import { ColorProvider } from "./context/color-context"; // Import ColorProvider
import { UserProvider } from "./context/user-context"; // Import UserProvider

import theme from "./theme"; // Import your custom theme
import "./i18n";
import "./index.scss";

// Lazy load page components for better code splitting
const HomePage = lazy(() => import("./pages"));
const AdminPage = lazy(() => import("./pages/admin"));
const Gallery = lazy(() => import("./pages/gallery"));
const Translations = lazy(() => import("./pages/translations"));
const BriefingRoom = lazy(() => import("./pages/briefing-room"));
const DesignOffice = lazy(() => import("./pages/design-office"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Apply the custom theme to ChakraProvider */}
    <ChakraProvider theme={theme}> 
      <UserProvider> {/* Add UserProvider */}
        <AlertProvider>
          <DesignProvider>
            <ColorProvider> {/* Wrap with ColorProvider */}
              <BrowserRouter>
                <Layout>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route 
                        path="/translations" 
                        element={
                          <ProtectedRoute>
                            <Translations />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute requiresRank={['A', 'B']}>
                            <AdminPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/briefing-room" 
                        element={
                          <ProtectedRoute>
                            <BriefingRoom />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/design-office" 
                        element={
                          <ProtectedRoute>
                            <DesignOffice />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>  
                  </Suspense>
                </Layout>
              </BrowserRouter>
            </ColorProvider>
          </DesignProvider>
        </AlertProvider>
      </UserProvider>
    </ChakraProvider>
  </React.StrictMode>
);
