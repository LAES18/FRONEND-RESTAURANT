import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaTrash, FaSignOutAlt, FaUtensils, FaListAlt, FaUsers, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
const SPOONACULAR_API_KEY = '67ce982a724d41798877cf212f48d0de';

const AdminScreen = () => {
  const [activeMenu, setActiveMenu] = useState('platillos');
  const [darkMode, setDarkMode] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reportType, setReportType] = useState('diario');
  const [report, setReport] = useState([]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (activeMenu === 'platillos') fetchDishes();
    if (activeMenu === 'ordenes') fetchOrders();
    if (activeMenu === 'usuarios') fetchUsers();
    if (activeMenu === 'pagos') fetchPayments();
  }, [activeMenu]);

  const fetchDishes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/dishes`);
      setDishes(res.data);
    } catch (err) { setDishes([]); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
    } catch (err) { setOrders([]); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) { setUsers([]); }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments`);
      setPayments(res.data);
    } catch (err) { setPayments([]); }
  };

  const handleSearchSpoonacular = async () => {
    if (!search) return;
    try {
      const res = await axios.get(`${API_URL}/api/spoonacular?query=${search}&apiKey=${SPOONACULAR_API_KEY}`);
      // Suponiendo que la API retorna un array de platillos
      setDishes(res.data);
    } catch (err) { }
  };

  const handleAddDish = async (dish) => {
    try {
      await axios.post(`${API_URL}/api/dishes`, dish);
      fetchDishes();
    } catch (err) { }
  };

  const handleDeleteDish = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/dishes/${id}`);
      fetchDishes();
    } catch (err) { }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (err) { alert('Error al cerrar sesión'); }
  };

  const handleReport = async (type) => {
    setReportType(type);
    try {
      const res = await axios.get(`${API_URL}/api/payments/report?type=${type}`);
      setReport(res.data);
    } catch (err) { setReport([]); }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-logo">
          <img src="/logo192.png" alt="Logo" style={{height: '40px', marginRight: '12px'}} />
          <span>Panel de Administración</span>
        </div>
        <div className="admin-header-title">Restaurante</div>
        <button className="btn btn-outline-secondary" onClick={() => setDarkMode(dm => !dm)}>
          {darkMode ? '🌙 Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </header>
      <div style={{display: 'flex', flex: 1}}>
        <aside className="admin-sidebar">
          <div className="admin-sidebar-user">
            <FaUserCircle size={32} style={{marginBottom: '8px'}} />
            <div>Administrador</div>
            <div style={{fontSize: '0.95rem', fontWeight: '400'}}>Superadmin</div>
          </div>
          <ul className="admin-sidebar-menu">
            <li><button className={activeMenu === 'platillos' ? 'active' : ''} onClick={() => setActiveMenu('platillos')}><FaUtensils /> Gestión de Platillos</button></li>
            <li><button className={activeMenu === 'ordenes' ? 'active' : ''} onClick={() => setActiveMenu('ordenes')}><FaListAlt /> Órdenes</button></li>
            <li><button className={activeMenu === 'usuarios' ? 'active' : ''} onClick={() => setActiveMenu('usuarios')}><FaUsers /> Gestión de Usuarios</button></li>
            <li><button className={activeMenu === 'pagos' ? 'active' : ''} onClick={() => setActiveMenu('pagos')}><FaMoneyCheckAlt /> Pagos</button></li>
            <li><button onClick={handleLogout}><FaSignOutAlt /> Cerrar sesión</button></li>
          </ul>
        </aside>
        <main className="admin-main">
          <nav style={{marginBottom: '18px', color: '#b85c00', fontWeight: 500}}>
            <span style={{marginRight: '8px'}}>🏠 /</span> <span>{activeMenu}</span>
          </nav>
          {activeMenu === 'platillos' && (
            <div>
              <h2>Gestión de Platillos</h2>
              <div style={{display: 'flex', gap: '12px', marginBottom: '18px'}}>
                <input type="text" placeholder="Ejemplo: pizza, pasta, hamburguesa..." value={search} onChange={e => setSearch(e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a'}} />
                <button className="btn" onClick={handleSearchSpoonacular}>Buscar</button>
              </div>
              <ul style={{listStyle: 'none', padding: 0}}>
                {dishes.map(dish => (
                  <li key={dish.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                    <span>{dish.name} - ${dish.price?.toFixed(2) || '0.00'} <span style={{background: '#bfa76a', color: '#fff', borderRadius: '6px', padding: '2px 8px', marginLeft: '8px', fontSize: '0.95rem'}}>{dish.type}</span></span>
                    <button className="btn btn-danger" onClick={() => handleDeleteDish(dish.id)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeMenu === 'ordenes' && (
            <div>
              <h2>Órdenes</h2>
              <ul style={{listStyle: 'none', padding: 0}}>
                {orders.map(order => (
                  <li key={order.id} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                    <strong>Orden #{order.id} - Mesa {order.mesa || 'N/A'}</strong>
                    <ul style={{margin: '8px 0 0 0', padding: 0}}>
                      {order.dishes.map((dish, i) => (
                        <li key={i}>{dish.name} ({dish.type}) - ${dish.price}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeMenu === 'usuarios' && (
            <div>
              <h2>Gestión de Usuarios</h2>
              <ul style={{listStyle: 'none', padding: 0}}>
                {users.map(user => (
                  <li key={user.id} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                    <strong>{user.nombre}</strong> <span style={{marginLeft: '8px', color: '#bfa76a'}}>{user.rol}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeMenu === 'pagos' && (
            <div>
              <h2>Pagos</h2>
              <div style={{display: 'flex', gap: '12px', marginBottom: '18px'}}>
                <select value={reportType} onChange={e => handleReport(e.target.value)} style={{padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a'}}>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
                <button className="btn" onClick={() => handleReport(reportType)}><FaChartBar /> Ver Reporte</button>
              </div>
              <ul style={{listStyle: 'none', padding: 0}}>
                {payments.map(payment => (
                  <li key={payment.id} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                    <strong>Pago #{payment.id}</strong> - ${payment.total?.toFixed(2) || '0.00'} - {payment.method}
                  </li>
                ))}
              </ul>
              <div style={{marginTop: '18px'}}>
                <h4>Reporte {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h4>
                <ul style={{listStyle: 'none', padding: 0}}>
                  {report.map((r, i) => (
                    <li key={i} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                      <strong>{r.fecha}</strong> - Total: ${r.total?.toFixed(2) || '0.00'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminScreen;