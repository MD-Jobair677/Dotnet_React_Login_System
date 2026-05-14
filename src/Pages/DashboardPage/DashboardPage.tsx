import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { logout } from '../../Core/Data/Redux/authSlice';
import type { AppDispatch } from '../../Core/Data/Redux/store';
import StudentsCrud from './StudentsCrud/StudentsCrud';
import RolesCrud from './RolesCrud/RolesCrud';
import PermissionsCrud from './PermissionsCrud/PermissionsCrud';

type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: number;
};

type StatItem = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
};

type Order = {
  id: string;
  customer: string;
  items: number;
  amount: string;
  status: 'Completed' | 'Processing' | 'Shipped' | 'Cancelled';
  date: string;
};

type Product = {
  name: string;
  category: string;
  price: string;
  stock: number;
  sold: number;
};

const navItems: NavItem[] = [
  { id: 'students', label: 'Students', icon: 'ST' },
  { id: 'Role', label: 'Role Management', icon: 'RL' },
  { id: 'permissions', label: 'Permissions', icon: 'PM' },
];

const stats: StatItem[] = [
  { label: 'Total Revenue', value: '$248,600', change: '+14.2%', trend: 'up' },
  { label: 'Total Orders', value: '3,456', change: '+8.7%', trend: 'up' },
  { label: 'New Customers', value: '1,284', change: '+22.1%', trend: 'up' },
  { label: 'Refund Rate', value: '2.4%', change: '-0.8%', trend: 'down' },
];

const orders: Order[] = [
  { id: '#ORD-9021', customer: 'Karim Uddin', items: 3, amount: '$4,500', status: 'Completed', date: 'Today, 2:30 PM' },
  { id: '#ORD-9020', customer: 'Fatema Begum', items: 1, amount: '$12,800', status: 'Processing', date: 'Today, 1:15 PM' },
  { id: '#ORD-9019', customer: 'Rahim Sheikh', items: 5, amount: '$2,850', status: 'Completed', date: 'Today, 12:45 PM' },
  { id: '#ORD-9018', customer: 'Sabrina Akter', items: 2, amount: '$8,200', status: 'Cancelled', date: 'Yesterday, 6:00 PM' },
  { id: '#ORD-9017', customer: 'Tanvir Islam', items: 4, amount: '$5,670', status: 'Shipped', date: 'Yesterday, 3:20 PM' },
];

const products: Product[] = [
  { name: 'Premium Kurta', category: 'Menswear', price: '$1,800', stock: 45, sold: 234 },
  { name: 'Silk Saree', category: 'Womenswear', price: '$4,500', stock: 28, sold: 156 },
  { name: 'Leather Belt', category: 'Accessories', price: '$850', stock: 62, sold: 389 },
  { name: 'Casual Shirt', category: 'Menswear', price: '$1,200', stock: 38, sold: 278 },
];

const activities = [
  'New order #ORD-9021 was processed',
  'Rahim Sheikh completed a payment',
  'Premium Kurta stock was updated',
  'Nusrat Jahan submitted a new review',
  'Fatema Begum requested a refund',
];

const chartBars = [44, 58, 52, 68, 74, 82, 71, 90, 84, 96, 88, 100];

const statusClass = (status: Order['status']) => `status ${status.toLowerCase()}`;

function Sidebar({
  active,
  open,
  onToggle,
  onSelect,
}: {
  active: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className={open ? 'dashboard-sidebar' : 'dashboard-sidebar collapsed'}>
      <div className="dashboard-brand">
        <span>PB</span>
        {open && <strong>PulseBoard</strong>}
      </div>

      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? 'active' : ''}
            onClick={() => onSelect(item.id)}
            title={open ? undefined : item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {open && <span>{item.label}</span>}
            {open && item.badge && <em>{item.badge}</em>}
          </button>
        ))}
      </nav>

      <button className="sidebar-toggle" type="button" onClick={onToggle}>
        {open ? 'Collapse' : 'Open'}
      </button>
    </aside>
  );
}

function StatCard({ stat }: { stat: StatItem }) {
  return (
    <article className="stat-card">
      <div>
        <span>{stat.label}</span>
        <strong>{stat.value}</strong>
      </div>
      <p className={stat.trend}>{stat.change}</p>
    </article>
  );
}

function OverviewPage() {
  const bestProduct = useMemo(() => products.reduce((best, product) => (product.sold > best.sold ? product : best)), []);

  return (
    <div className="dashboard-content">
      <section className="dashboard-heading">
        <div>
          <h1>Overview</h1>
          <p>Monitor orders, revenue, products, and recent activity.</p>
        </div>
        <div className="heading-actions">
          <button type="button">Export</button>
          <button type="button" className="primary">
            New Order
          </button>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel wide">
          <div className="panel-title">
            <h2>Revenue Trend</h2>
            <span>Monthly</span>
          </div>
          <div className="bar-chart" aria-label="Monthly revenue chart">
            {chartBars.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <h2>Top Product</h2>
            <span>{bestProduct.sold} sold</span>
          </div>
          <div className="product-highlight">
            <strong>{bestProduct.name}</strong>
            <p>{bestProduct.category}</p>
            <b>{bestProduct.price}</b>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel wide">
          <div className="panel-title">
            <h2>Recent Orders</h2>
            <span>{orders.length} orders</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.items}</td>
                    <td>{order.amount}</td>
                    <td>
                      <span className={statusClass(order.status)}>{order.status}</span>
                    </td>
                    <td>{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <h2>Activity</h2>
            <span>Live</span>
          </div>
          <ul className="activity-list">
            {activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Products</h2>
          <span>Inventory</span>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article key={product.name} className="product-card">
              <div>
                <strong>{product.name}</strong>
                <p>{product.category}</p>
              </div>
              <span>{product.price}</span>
              <small>{product.stock} in stock</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlaceholderPage({ active }: { active: string }) {
  const nav = navItems.find((item) => item.id === active);

  return (
    <div className="placeholder-page">
      <span>{nav?.icon ?? 'PG'}</span>
      <h1>{nav?.label ?? active}</h1>
      <p>This dashboard section is ready for your next feature.</p>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('auth_session');
    navigate('/login', { replace: true });
  };

  return (
    <main className="dashboard-page">
      <Sidebar
        active={active}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((value) => !value)}
        onSelect={setActive}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <label>
            <span>Search</span>
            <input type="search" placeholder="Search..." />
          </label>

          <div className="profile-pill" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>RH</span>
              <div>
                <strong>Rakib Hasan</strong>
                <small>Admin</small>
              </div>
            </div>

            <div className="heading-actions" style={{ marginLeft: 'auto' }}>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {active === 'overview' && <OverviewPage />}
        {active === 'students' && <StudentsCrud />}
        {active === 'Role' && <RolesCrud />}
        {active === 'permissions' && <PermissionsCrud />}
        {active !== 'overview' && active !== 'students' && active !== 'Role' && active !== 'permissions' && <PlaceholderPage active={active} />}
      </section>
    </main>
  );
}
