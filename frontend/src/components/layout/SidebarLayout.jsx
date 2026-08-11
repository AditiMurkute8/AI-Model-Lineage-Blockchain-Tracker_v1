import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

function SidebarLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
export default SidebarLayout;