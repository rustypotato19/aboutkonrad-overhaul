// === Generic Imports === //
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

// === CSS Import === //
import "./index.css";

// === Component Imports === //
import Landing from "./components/main/Landing.tsx";
// import Header from "./components/header/header.tsx";

// === Main Document Body === //
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <div className={``}>
      <StrictMode>
        {/* <Header /> */}
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </StrictMode>
    </div>
  </BrowserRouter>
);
