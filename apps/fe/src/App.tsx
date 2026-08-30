import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CandidateDashboard from "./pages/CandidateDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Home />} />
        <Route path="" element={<CandidateDashboard />} />
        <Route path="" element={<SupervisorDashboard />} />
        <Route path="" element={<AgentDashboard />} />
        <Route path="" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
