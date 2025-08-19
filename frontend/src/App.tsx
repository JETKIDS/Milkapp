import { NavLink, Outlet, Route, Routes } from 'react-router-dom';
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
import { RegisterPage } from './pages/Register';

function Layout() {
	return (
		<div>
			<header className="app-header">
				<nav className="nav container">
					<NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>🏠 ダッシュボード</NavLink>
					<NavLink to="/register" className={({ isActive }) => isActive ? 'active' : undefined}>➕ 新規登録</NavLink>
					<NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : undefined}>👥 顧客</NavLink>
					<NavLink to="/manufacturers" className={({ isActive }) => isActive ? 'active' : undefined}>🏭 メーカー</NavLink>
					<NavLink to="/products" className={({ isActive }) => isActive ? 'active' : undefined}>📦 商品</NavLink>
					<NavLink to="/courses" className={({ isActive }) => isActive ? 'active' : undefined}>🗺️ コース</NavLink>
					<NavLink to="/schedules" className={({ isActive }) => isActive ? 'active' : undefined}>🗓️ スケジュール</NavLink>
					<NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : undefined}>🧾 注文</NavLink>
					<NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : undefined}>📈 レポート</NavLink>
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
				<Route path="/register" element={<RegisterPage />} />
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


