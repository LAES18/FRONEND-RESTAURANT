import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaEdit, FaTrash, FaEye, FaSignOutAlt, FaUtensils, FaListAlt, FaUsers, FaMoneyCheckAlt } from 'react-icons/fa';

// Simulación de datos de platillos
const mockDishes = [
  { id: 1, name: 'pizza', price: 5, type: 'cena' },
  { id: 2, name: 'Dragonfire Salmon', price: 100, type: 'almuerzo' },
  { id: 3, name: 'Burger', price: 18, type: 'cena' },
  { id: 4, name: 'arroz chino', price: 5, type: 'almuerzo' },
  { id: 5, name: 'huevos revueltos', price: 2.5, type: 'desayuno' },
];

const AdminScreen = () => {
  const [activeMenu, setActiveMenu] = useState('platillos');
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(5);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Paginación para platillos
  const totalResults = mockDishes.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const paginatedDishes = mockDishes.slice((page - 1) * resultsPerPage, page * resultsPerPage);

  const handleLogout = () => {
    // ...tu lógica de logout...
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
            <div className="admin-crud-table">
              <div className="admin-crud-table-header">
                <div className="admin-crud-table-title">Gestión de Platillos</div>
                <div className="admin-crud-table-actions">
                  <button className="btn"><FaPlus /> Agregar Platillo</button>
                </div>
                <div className="admin-crud-table-controls">
                  <span>Resultados / página :</span>
                  <select value={resultsPerPage} onChange={e => setResultsPerPage(Number(e.target.value))}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
              <table className="admin-crud-table-table">
                <thead>
                  <tr>
                    <th>Acción</th>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDishes.map(row => (
                    <tr key={row.id}>
                      <td>
                        <button className="action-btn"><FaEdit /></button>
                        <button className="action-btn"><FaTrash /></button>
                        <button className="action-btn"><FaEye /></button>
                      </td>
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>${row.price.toFixed(2)}</td>
                      <td>{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-crud-table-pagination">
                <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i+1} className={page === i+1 ? 'active' : ''} onClick={() => setPage(i+1)}>{i+1}</button>
                ))}
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                <span style={{marginLeft: '12px'}}>Resultados 1 a {resultsPerPage} de {totalResults}</span>
              </div>
            </div>
          )}
          {activeMenu === 'ordenes' && (
            <div>
              <h1 className="mb-4">Órdenes</h1>
              {/* Aquí va tu lógica y componentes de órdenes */}
            </div>
          )}
          {activeMenu === 'usuarios' && (
            <div>
              <h1 className="mb-4">Gestión de Usuarios</h1>
              {/* Aquí va tu lógica y componentes de usuarios */}
            </div>
          )}
          {activeMenu === 'pagos' && (
            <div>
              <h1 className="mb-4">Pagos</h1>
              {/* Aquí va tu lógica y componentes de pagos */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminScreen;