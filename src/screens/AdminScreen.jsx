import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaEdit, FaTrash, FaEye, FaSignOutAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const mockData = [
  { id: 1, name: 'pizza', price: 5, type: 'cena' },
  { id: 2, name: 'Dragonfire Salmon', price: 100, type: 'almuerzo' },
  { id: 3, name: 'Burger', price: 18, type: 'cena' },
  { id: 4, name: 'arroz chino', price: 5, type: 'almuerzo' },
  { id: 5, name: 'huevos revueltos', price: 2.5, type: 'desayuno' },
];

const AdminScreen = () => {
  const [activeMenu, setActiveMenu] = useState('rental');
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(5);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Simula paginación
  const totalResults = mockData.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const paginatedData = mockData.slice((page - 1) * resultsPerPage, page * resultsPerPage);

  const handleLogout = () => {
    // ...tu lógica de logout...
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-logo">
          <img src="/logo192.png" alt="Logo" style={{height: '40px', marginRight: '12px'}} />
          <span>ORIGINAL CRUD Admin Panel</span>
        </div>
        <div className="admin-header-title">PHP CRUD GENERATOR</div>
        <button className="btn btn-outline-secondary" onClick={() => setDarkMode(dm => !dm)}>
          {darkMode ? '🌙 Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </header>
      <div style={{display: 'flex', flex: 1}}>
        <aside className="admin-sidebar">
          <div className="admin-sidebar-user">
            <FaUserCircle size={32} style={{marginBottom: '8px'}} />
            <div>Gilles Migliori</div>
            <div style={{fontSize: '0.95rem', fontWeight: '400'}}>Superadmin</div>
          </div>
          <ul className="admin-sidebar-menu">
            <li><button className={activeMenu === 'country' ? 'active' : ''} onClick={() => setActiveMenu('country')}>🌍 country</button></li>
            <li><button className={activeMenu === 'rental' ? 'active' : ''} onClick={() => setActiveMenu('rental')}>🛒 rental</button></li>
            <li><button className={activeMenu === 'business' ? 'active' : ''} onClick={() => setActiveMenu('business')}>💼 business</button></li>
            <li><button className={activeMenu === 'cat' ? 'active' : ''} onClick={() => setActiveMenu('cat')}>🐱 cat</button></li>
            <li><button className={activeMenu === 'newcat' ? 'active' : ''} onClick={() => setActiveMenu('newcat')}>➕ new category</button></li>
            <li><button onClick={handleLogout}><FaSignOutAlt /> Cerrar sesión</button></li>
          </ul>
        </aside>
        <main className="admin-main">
          <nav style={{marginBottom: '18px', color: '#b85c00', fontWeight: 500}}>
            <span style={{marginRight: '8px'}}>🏠 /</span> <span>{activeMenu}</span>
          </nav>
          <div className="admin-crud-table">
            <div className="admin-crud-table-header">
              <div className="admin-crud-table-title">{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}</div>
              <div className="admin-crud-table-actions">
                <button className="btn"><FaPlus /> ADD NEW</button>
              </div>
              <div className="admin-crud-table-controls">
                <span>Results / page :</span>
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
                  <th>Action</th>
                  <th>rental id</th>
                  <th>rental date</th>
                  <th>customer id</th>
                  <th>Display</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(row => (
                  <tr key={row.id}>
                    <td>
                      <button className="action-btn"><FaEdit /></button>
                      <button className="action-btn"><FaTrash /></button>
                    </td>
                    <td>{row.id}</td>
                    <td>24 May 2005 22:5{row.id} pm</td>
                    <td>{row.name.toUpperCase()}</td>
                    <td><button className="action-btn"><FaEye /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-crud-table-pagination">
              <button onClick={() => setPage(1)} disabled={page === 1}><FaChevronLeft /></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} className={page === i+1 ? 'active' : ''} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}><FaChevronRight /></button>
              <span style={{marginLeft: '12px'}}>Results 1 to {resultsPerPage} of {totalResults}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminScreen;