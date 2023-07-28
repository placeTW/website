import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { ChakraProvider } from "@chakra-ui/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages";
import Gallery from "./pages/gallery";
import Layout from "./component/layout";
import './i18n';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/gallery",
    element: <Gallery />,
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Layout>
        <RouterProvider router={router} />
      </Layout>
    </ChakraProvider>
  </React.StrictMode>
);
