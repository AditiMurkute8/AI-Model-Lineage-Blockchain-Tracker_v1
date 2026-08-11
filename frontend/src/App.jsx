import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import { Suspense, lazy } from "react";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ScrollToTop from "./components/ScrollToTop";

import AIModelsPage from "./pages/AIModelsPage";
import PlatformSelectorPage from "./pages/PlatformSelectorPage";

/* =========================
   LAZY LOAD PAGES
========================= */
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ModelsPage = lazy(() => import("./pages/ModelsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const VersionsPage = lazy(() => import("./pages/VersionsPage"));
const VersionDetailPage = lazy(() => import("./pages/VersionDetailPage"));
const LineagePage = lazy(() => import("./pages/LineagePage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const TrainPage = lazy(() => import("./pages/TrainPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const BlockchainVerifyPage = lazy(() => import("./pages/BlockchainVerifyPage"));

/* =========================
   REDIRECT HANDLERS
========================= */
function BlockchainModelRedirect() {
  const { modelId } = useParams();
  return <Navigate to={`/models/${modelId}/dashboard`} replace />;
}

function AIModelRedirect() {
  const { modelId } = useParams();
  return <Navigate to={`/ai/${modelId}/dashboard`} replace />;
}

/* =========================
   MAIN LAYOUT
========================= */
function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;

  const isBlockchainRoute =
    pathname.startsWith("/models/") && pathname !== "/models";

  const isAIRoute = pathname.startsWith("/ai/") && pathname !== "/ai";

  const showSidebar = isBlockchainRoute || isAIRoute;
  const showTopBar = pathname !== "/";

  return (
    <div className="app-shell">
      <ScrollToTop />

      {showSidebar && <Sidebar />}

      <main className={showSidebar ? "main-content with-sidebar" : "main-content"}>
        <div className="page-wrapper">
          {showTopBar && <TopBar />}

          <Suspense
            fallback={
              <div className="loading-text" style={{ padding: "40px" }}>
                Loading experience...
              </div>
            }
          >
            <Routes>
              {/* =========================
                  ROOT / PLATFORM SELECTOR
              ========================= */}
              <Route path="/" element={<PlatformSelectorPage />} />

              {/* =========================
                  AI SECTION
              ========================= */}
              <Route path="/ai" element={<AIModelsPage />} />
              <Route path="/ai/:modelId" element={<AIModelRedirect />} />
              <Route path="/ai/:modelId/dashboard" element={<DashboardPage />} />
              <Route path="/ai/:modelId/versions" element={<VersionsPage />} />
              <Route
                path="/ai/:modelId/version/:versionId"
                element={<VersionDetailPage />}
              />
              <Route path="/ai/:modelId/lineage" element={<LineagePage />} />
              <Route path="/ai/:modelId/compare" element={<ComparePage />} />
              <Route path="/ai/:modelId/train" element={<TrainPage />} />
              <Route path="/ai/:modelId/analytics" element={<AnalyticsPage />} />
              <Route
                path="/ai/:modelId/blockchain-verify"
                element={<BlockchainVerifyPage />}
              />

              {/* =========================
                  BLOCKCHAIN SECTION
              ========================= */}
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/models/:modelId" element={<BlockchainModelRedirect />} />
              <Route path="/models/:modelId/dashboard" element={<DashboardPage />} />
              <Route path="/models/:modelId/versions" element={<VersionsPage />} />
              <Route
                path="/models/:modelId/version/:versionId"
                element={<VersionDetailPage />}
              />
              <Route path="/models/:modelId/lineage" element={<LineagePage />} />
              <Route path="/models/:modelId/compare" element={<ComparePage />} />
              <Route path="/models/:modelId/train" element={<TrainPage />} />
              <Route path="/models/:modelId/analytics" element={<AnalyticsPage />} />
              <Route
                path="/models/:modelId/blockchain-verify"
                element={<BlockchainVerifyPage />}
              />

              {/* =========================
                  FALLBACK
              ========================= */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

/* =========================
   ROOT APP
========================= */
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;