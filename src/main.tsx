// === Generic Imports === //
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

// === CSS Import === //
import "./index.css";

// === Component Imports === //
import Home from "./components/main/Home.tsx";
import Header from "./components/header/Header.tsx";

// === Main Document Body === //
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <div className={``}>
      <StrictMode>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </StrictMode>
    </div>
  </BrowserRouter>
);
