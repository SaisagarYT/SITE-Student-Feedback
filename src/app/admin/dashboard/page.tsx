import AdminDashboardProtected from "./AdminDashboardProtected";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardProtected>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
        {/* Add admin dashboard content here */}
        
      </div>
    </AdminDashboardProtected>
  );
}
