import { Navigate, Route, Routes } from "react-router";
import { HomePage } from "../pages/HomePage";
import { ResultDetailPage } from "../pages/ResultDetailPage";
import { ResultsPage } from "../pages/ResultsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/results/:resultId" element={<ResultDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
