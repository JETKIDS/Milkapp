import { Link, Outlet, Route, Routes } from 'react-router-dom';
import './styles.css';
import { CustomersPage } from './pages/Customers';
import { ManufacturersPage } from './pages/Manufacturers';
import { ProductsPage } from './pages/Products';
import { CoursesPage } from './pages/Courses';
import { OrdersPage } from './pages/Orders';
import { SchedulesPage } from './pages/Schedules';
import { ContractsPage } from './pages/Contracts';
import { ReportsPage } from './pages/Reports';
import { DashboardPage } from './pages/Dashboard';
import { CustomerDetailPage } from './pages/CustomerDetail';

function Layout() {
	return (
		<div>
			<header className="app-header">
				<nav className="nav container">
					<Link to="/">Dashboard</Link>
					<Link to="/customers">Customers</Link>
					<Link to="/manufacturers">Manufacturers</Link>
					<Link to="/products">Products</Link>
					<Link to="/courses">Courses</Link>
					<Link to="/schedules">Schedules</Link>
					<Link to="/orders">Orders</Link>
					<Link to="/reports">Reports</Link>
				</nav>
			</header>
			<main className="container" style={{ paddingTop: 16 }}>
				<Outlet />
			</main>
		</div>
	);
}

function Page({ title }: { title: string }) {
	return <h1>{title}</h1>;
}

export function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/customers" element={<CustomersPage />} />
				<Route path="/customers/:id/contracts" element={<ContractsPage />} />
				<Route path="/customers/:id/detail" element={<CustomerDetailPage />} />
				<Route path="/manufacturers" element={<ManufacturersPage />} />
				<Route path="/products" element={<ProductsPage />} />
				<Route path="/courses" element={<CoursesPage />} />
				<Route path="/schedules" element={<SchedulesPage />} />
				<Route path="/orders" element={<OrdersPage />} />
				<Route path="/reports" element={<ReportsPage />} />
			</Route>
		</Routes>
	);
}


