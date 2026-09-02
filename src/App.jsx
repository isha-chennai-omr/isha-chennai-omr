import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LinkGeneratorPage } from "./pages/LinkGeneratorPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/link_generator" element={<LinkGeneratorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
