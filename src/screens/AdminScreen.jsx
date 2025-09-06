import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';


// Función auxiliar para formatear el total de forma segura
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaTrash, FaSignOutAlt, FaUtensils, FaListAlt, FaUsers, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
const SPOONACULAR_API_KEY = '67ce982a724d41798877cf212f48d0de';

const AdminScreen = () => {
  const [activeMenu, setActiveMenu] = useState('platillos');
  const [darkMode, setDarkMode] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [newDish, setNewDish] = useState({ name: '', price: '', type: 'principal' });
  const [spoonacularResults, setSpoonacularResults] = useState([]);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState({ date: '', month: '' });
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ nombre: '', password: '', rol: 'admin' });
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.password) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre y contraseña son obligatorios' });
      return;
    }
    try {
      await axios.post(`${API_URL}/api/users`, newUser);
      setNewUser({ nombre: '', password: '', rol: 'admin' });
      fetchUsers();
      Swal.fire({ icon: 'success', title: 'Usuario creado', text: 'Usuario agregado correctamente' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el usuario' });
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/users/${id}`);
        fetchUsers();
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Usuario eliminado correctamente' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el usuario' });
      }
    }
  };
  const [payments, setPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState({ date: '', month: '' });
  const [reportType, setReportType] = useState('diario');
  const [report, setReport] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch inicial de datos y modo oscuro
  useEffect(() => {
    fetchDishes();
    fetchUsers();
    fetchOrders();
    fetchPayments();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (activeMenu === 'platillos') fetchDishes();
    if (activeMenu === 'usuarios') fetchUsers();
    if (activeMenu === 'ordenes') fetchOrders();
    if (activeMenu === 'pagos') fetchPayments();
  }, [activeMenu]);

  // Configuración de SweetAlert2
  useEffect(() => {
    Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-secondary',
        popup: 'swal2-popup-delicioso'
      },
      buttonsStyling: false,
      color: '#343a40',
      background: '#fff8e1',
      confirmButtonColor: '#b85c00',
      cancelButtonColor: '#bfa76a',
      iconColor: '#b85c00',
    }).bind(Swal);
  }, []);

  const fetchDishes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/dishes`);
      setDishes(res.data);
    } catch (err) {
      setError('Error al cargar platillos');
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
    } catch (err) {
      setError('Error al cargar órdenes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      setError('Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/payments`);
      setPayments(res.data);
    } catch (err) {
      setError('Error al cargar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSpoonacular = async () => {
    if (!search) return;
    try {
      const res = await axios.get(`${API_URL}/api/spoonacular?query=${search}&apiKey=${SPOONACULAR_API_KEY}`);
      setSpoonacularResults(res.data || []);
      if ((res.data || []).length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin resultados', text: 'No se encontraron platillos en Spoonacular.' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo buscar en Spoonacular' });
    }
  };

  const handleAddDishForm = async (e) => {
    e.preventDefault();
    if (!newDish.name || !newDish.price) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre y precio son obligatorios' });
      return;
    }
    try {
      await axios.post(`${API_URL}/api/dishes`, { ...newDish, price: Number(newDish.price) });
      setNewDish({ name: '', price: '', type: 'principal' });
      fetchDishes();
      Swal.fire({ icon: 'success', title: 'Platillo agregado', text: 'Platillo agregado correctamente' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el platillo' });
    }
  };

  const handleAddSpoonacularDish = async (dish) => {
    try {
      await axios.post(`${API_URL}/api/dishes`, dish);
      fetchDishes();
      Swal.fire({ icon: 'success', title: 'Platillo importado', text: 'Platillo importado de Spoonacular' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo importar el platillo' });
    }
  };

  const handleAddDish = async (dish) => {
    try {
      await axios.post(`${API_URL}/api/dishes`, dish);
      fetchDishes();
    } catch (err) { }
  };

  const handleDeleteDish = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar platillo?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/dishes/${id}`);
        fetchDishes();
        Swal.fire({icon: 'success', title: 'Eliminado', text: 'Platillo eliminado correctamente'});
      } catch (err) {
        Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo eliminar el platillo'});
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, { method: 'POST', credentials: 'include' });
      Swal.fire({icon: 'success', title: 'Sesión cerrada', text: 'Has cerrado sesión correctamente'});
      window.location.href = '/';
    } catch (err) {
      Swal.fire({icon: 'error', title: 'Error', text: 'Error al cerrar sesión'});
    }
  };

  const handleReport = async (type) => {
    setReportType(type);
    try {
      let url = `${API_URL}/api/payments/report?type=${type}`;
      if (paymentFilter.date) url += `&date=${paymentFilter.date}`;
      if (paymentFilter.month) url += `&month=${paymentFilter.month}`;
      const res = await axios.get(url);
      setReport(res.data);
    } catch (err) { setReport([]); }
  };

  const handleOrderFilter = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/api/orders`;
      if (orderFilter.date) url += `?date=${orderFilter.date}`;
      else if (orderFilter.month) url += `?month=${orderFilter.month}`;
      const res = await axios.get(url);
      setOrders(res.data);
    } catch (err) {
      setError('Error al filtrar órdenes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFilter = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/api/payments`;
      if (paymentFilter.date) url += `?date=${paymentFilter.date}`;
      else if (paymentFilter.month) url += `?month=${paymentFilter.month}`;
      const res = await axios.get(url);
      setPayments(res.data);
    } catch (err) {
      setError('Error al filtrar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReprintInvoice = async (orderId) => {
    try {
      await axios.post(`${API_URL}/api/orders/${orderId}/reprint`);
      Swal.fire({ icon: 'success', title: 'Factura reimpresa', text: `Factura de la orden #${orderId} reimpresa` });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo reimprimir la factura' });
    }
  };

  let renderError = null;
  try {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-header-logo">
            <span>Panel de Administración</span>
          </div>
          <div className="admin-header-title">Restaurante</div>
          <button className="btn btn-outline-secondary" onClick={() => setDarkMode(dm => !dm)}>
            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>
            {/* Botón exportar a Excel en reportes */}
            {activeMenu === 'pagos' && report.length > 0 && (
              <button className="btn btn-success mb-3" onClick={() => {
                const ws = XLSX.utils.json_to_sheet(report);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
                XLSX.writeFile(wb, `reporte-${reportType}.xlsx`);
              }}>
                Exportar reporte a Excel
              </button>
            )}
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
            {loading && (
              <div style={{textAlign: 'center', margin: '40px 0'}}>
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <div style={{marginTop: '12px'}}>Cargando...</div>
              </div>
            )}
            {error && (
              <div style={{textAlign: 'center', color: 'red', margin: '20px 0', fontWeight: 600}}>{error}</div>
            )}
            {!loading && !error && activeMenu === 'platillos' && (
              <div>
                <h2>Gestión de Platillos</h2>
                <form onSubmit={handleAddDishForm} style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
                  <input type="text" placeholder="Nombre" value={newDish.name} onChange={e => setNewDish({ ...newDish, name: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <input type="number" placeholder="Precio" value={newDish.price} onChange={e => setNewDish({ ...newDish, price: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a', width: '100px' }} />
                  <select value={newDish.type} onChange={e => setNewDish({ ...newDish, type: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }}>
                    <option value="principal">Principal</option>
                    <option value="entrada">Entrada</option>
                    <option value="bebida">Bebida</option>
                    <option value="postre">Postre</option>
                  </select>
                  <button className="btn btn-primary" type="submit"><FaPlus /> Agregar</button>
                </form>
                <div style={{display: 'flex', gap: '12px', marginBottom: '18px'}}>
                  <input type="text" placeholder="Buscar en Spoonacular..." value={search} onChange={e => setSearch(e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a'}} />
                  <button className="btn" type="button" onClick={handleSearchSpoonacular}>Buscar</button>
                </div>
                {spoonacularResults.length > 0 && (
                  <div style={{ marginBottom: '18px', background: '#f9f6f2', borderRadius: '10px', padding: '10px' }}>
                    <h5>Resultados de Spoonacular</h5>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {spoonacularResults.map((dish, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>{dish.name} - ${ (Number(dish.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) } <span style={{background: '#bfa76a', color: '#fff', borderRadius: '6px', padding: '2px 8px', marginLeft: '8px', fontSize: '0.95rem'}}>{dish.type}</span></span>
                          <button className="btn btn-success" onClick={() => handleAddSpoonacularDish(dish)}><FaPlus /> Importar</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ul style={{listStyle: 'none', padding: 0}}>
                  {dishes.map(dish => (
                    <li key={dish.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                      <span>{dish.name} - ${
                        (Number(dish.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      } <span style={{background: '#bfa76a', color: '#fff', borderRadius: '6px', padding: '2px 8px', marginLeft: '8px', fontSize: '0.95rem'}}>{dish.type}</span></span>
                      <button className="btn btn-danger" onClick={() => handleDeleteDish(dish.id)}><FaTrash /> Eliminar</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!loading && !error && activeMenu === 'ordenes' && (
              <div>
                <h2>Órdenes</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
                  <input type="date" value={orderFilter.date} onChange={e => setOrderFilter({ ...orderFilter, date: e.target.value, month: '' })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <input type="month" value={orderFilter.month} onChange={e => setOrderFilter({ ...orderFilter, month: e.target.value, date: '' })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <button className="btn btn-secondary" type="button" onClick={handleOrderFilter}>Filtrar</button>
                </div>
                <ul style={{listStyle: 'none', padding: 0}}>
                  {orders.map(order => (
                    <li key={order.id} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Orden #{order.id} - Mesa {order.mesa || 'N/A'}</strong>
                        <button className="btn btn-outline-primary" onClick={() => handleReprintInvoice(order.id)}>Reimprimir Factura</button>
                      </div>
                      <ul style={{margin: '8px 0 0 0', padding: 0}}>
                        {order.dishes.map((dish, i) => (
                          <li key={i}>{dish.name} ({dish.type}) - ${
                            (Number(dish.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!loading && !error && activeMenu === 'usuarios' && (
              <div>
                <h2>Gestión de Usuarios</h2>
                <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
                  <input type="text" placeholder="Nombre" value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <input type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <select value={newUser.rol} onChange={e => setNewUser({ ...newUser, rol: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }}>
                    <option value="admin">Admin</option>
                    <option value="cajero">Cajero</option>
                    <option value="mesero">Mesero</option>
                    <option value="cocina">Cocina</option>
                  </select>
                  <button className="btn btn-primary" type="submit"><FaPlus /> Agregar</button>
                </form>
                <ul style={{listStyle: 'none', padding: 0}}>
                  {users.map(user => (
                    <li key={user.id} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <span><strong>{user.nombre}</strong> <span style={{marginLeft: '8px', color: '#bfa76a'}}>{user.rol}</span></span>
                      <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)}><FaTrash /> Eliminar</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!loading && !error && activeMenu === 'pagos' && (
              <div>
                <h2>Pagos</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
                  <input type="date" value={paymentFilter.date} onChange={e => setPaymentFilter({ ...paymentFilter, date: e.target.value, month: '' })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <input type="month" value={paymentFilter.month} onChange={e => setPaymentFilter({ ...paymentFilter, month: e.target.value, date: '' })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <button className="btn btn-secondary" type="button" onClick={handlePaymentFilter}>Filtrar</button>
                </div>
                <ul style={{listStyle: 'none', padding: 0}}>
                  {payments.map(payment => (
                    <li key={payment.id} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                      <strong>Pago #{payment.id}</strong> - ${
                        (Number(payment.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      } - {payment.method}
                    </li>
                  ))}
                </ul>
                <div style={{marginTop: '18px'}}>
                  <h4>Reporte {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h4>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select value={reportType} onChange={e => handleReport(e.target.value)} style={{padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a'}}>
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensual">Mensual</option>
                    </select>
                    <button className="btn" onClick={() => handleReport(reportType)}><FaChartBar /> Ver Reporte</button>
                    {report.length > 0 && (
                      <button className="btn btn-success" onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(report);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
                        XLSX.writeFile(wb, `reporte-${reportType}.xlsx`);
                      }}>
                        Exportar reporte a Excel
                      </button>
                    )}
                  </div>
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {report.map((r, i) => (
                      <li key={i} style={{background: '#fff', borderRadius: '10px', marginBottom: '8px', padding: '10px 18px', boxShadow: '0 1px 4px #e3e6ea'}}>
                        <strong>{r.fecha}</strong> - Total: ${
                          (Number(r.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        }
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
  } catch (e) {
    renderError = e;
  }

  return (
    <div className="admin-dashboard">
      {renderError && (
        <div style={{color: 'red', textAlign: 'center', marginTop: '40px', fontWeight: 700}}>
          Error inesperado: {renderError.message || renderError.toString()}
        </div>
      )}
    </div>
  );
};

export default AdminScreen;