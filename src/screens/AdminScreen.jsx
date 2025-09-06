import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { FaChartBar, FaUsers, FaUtensils, FaSignOutAlt, FaCog } from 'react-icons/fa';

const AdminScreen = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    // ...tu lógica de logout...
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="sidebar-logo"><FaCog /> AdminLite</div>
        <ul className="sidebar-menu">
          <li><button className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => setActiveMenu('dashboard')}><FaChartBar /> Dashboard</button></li>
          <li><button className={activeMenu === 'platillos' ? 'active' : ''} onClick={() => setActiveMenu('platillos')}><FaUtensils /> Platillos</button></li>
          <li><button className={activeMenu === 'usuarios' ? 'active' : ''} onClick={() => setActiveMenu('usuarios')}><FaUsers /> Usuarios</button></li>
          <li><button onClick={handleLogout}><FaSignOutAlt /> Cerrar sesión</button></li>
        </ul>
      </aside>
      <main className="admin-main">
        <div className="d-flex justify-content-end mb-3">
          <button className="btn btn-outline-secondary" onClick={() => setDarkMode(dm => !dm)}>
            {darkMode ? '🌙 Modo Claro' : '🌙 Modo Oscuro'}
          </button>
        </div>
        {activeMenu === 'dashboard' && (
          <>
            <h1 className="mb-4">Dashboard</h1>
            <div className="admin-dashboard-cards">
              <div className="admin-card">
                <div className="admin-card-title">Órdenes</div>
                <div className="admin-card-value">3500</div>
                <div className="admin-card-desc">60% completadas</div>
              </div>
              <div className="admin-card">
                <div className="admin-card-title">Usuarios</div>
                <div className="admin-card-value">120</div>
                <div className="admin-card-desc">Activos este mes</div>
              </div>
              <div className="admin-card">
                <div className="admin-card-title">Platillos</div>
                <div className="admin-card-value">45</div>
                <div className="admin-card-desc">En el menú</div>
              </div>
            </div>
            {/* Aquí puedes agregar gráficas y widgets adicionales */}
          </>
        )}
        {activeMenu === 'platillos' && (
          <>
            <h1 className="mb-4">Gestión de Platillos</h1>
            {/* ...tu lógica y componentes de platillos... */}
          </>
        )}
        {activeMenu === 'usuarios' && (
          <>
            <h1 className="mb-4">Gestión de Usuarios</h1>
            {/* ...tu lógica y componentes de usuarios... */}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminScreen;