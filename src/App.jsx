import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LinkGeneratorPage } from "./pages/LinkGeneratorPage";
import { LinkRedirectPage } from "./pages/LinkRedirectPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/link_generator" element={<LinkGeneratorPage />} />
        <Route path="/p/:slug" element={<LinkRedirectPage />} />
      </Routes>
    </BrowserRouter>
  );
}
