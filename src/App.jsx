import React from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LinkRedirectPage } from "./pages/LinkRedirectPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminLinkPage } from "./pages/AdminLinkPage";
import { AdminLayout } from "./pages/AdminLayout";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:slug" element={<LinkRedirectPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="links" replace />} />
          <Route path="links" element={<AdminPage />} />
          <Route path="link" element={<AdminLinkPage />} />
          <Route path="link/:slug" element={<AdminLinkPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
