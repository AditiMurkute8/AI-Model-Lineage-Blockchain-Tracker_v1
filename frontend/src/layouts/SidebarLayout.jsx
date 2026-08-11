import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

function SidebarLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default SidebarLayout;