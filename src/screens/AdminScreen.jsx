import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaUserPlus, FaUtensils, FaSignOutAlt, FaMoon, FaSun, FaCog, FaUsers, FaListAlt, FaMoneyCheckAlt } from 'react-icons/fa';

// Define Spoonacular API key
const SPOONACULAR_API_KEY = "67ce982a724d41798877cf212f48d0de";

// Usa la misma API_URL que en App.jsx
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? '/api'
    : 'http://localhost:3001/api');

// Usa siempre `${API_URL}/api/` como prefijo para todos los endpoints de API en Railway.

const AdminScreen = () => {
  const [activeTab, setActiveTab] = useState('platillos');
  const [dishes, setDishes] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [newDish, setNewDish] = useState({ name: '', price: '', type: 'desayuno' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');
  const [mesaFilter, setMesaFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [spoonacularResults, setSpoonacularResults] = useState([]);
  const [loadingSpoonacular, setLoadingSpoonacular] = useState(false);
  const [errorSpoonacular, setErrorSpoonacular] = useState("");
  const [spoonacularTypeSelect, setSpoonacularTypeSelect] = useState({ show: false, item: null });
  const [selectedType, setSelectedType] = useState('desayuno');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  // --- NUEVO: Filtro de reporte de pagos ---
  const [paymentReportType, setPaymentReportType] = useState('dia'); // dia, semana, mes
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchAll = () => {
      axios.get(`${API_URL}/api/orders?status=pagado`)
        .then(response => setOrders(response.data))
        .catch(error => console.error('Error al obtener las órdenes:', error));
      axios.get(`${API_URL}/api/payments`)
        .then(response => setPayments(response.data))
        .catch(error => console.error('Error al obtener los pagos:', error));
      axios.get(`${API_URL}/api/dishes`)
        .then(response => setDishes(response.data))
        .catch(error => console.error('Error al obtener los platillos:', error));
      axios.get(`${API_URL}/api/users`)
        .then(response => setUsers(response.data))
        .catch(error => console.error('Error al obtener los usuarios:', error));
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const handleAddDish = () => {
    axios.post(`${API_URL}/api/dishes`, newDish)
      .then(() => {
        setNewDish({ name: '', price: '', type: 'desayuno' });
        axios.get(`${API_URL}/api/dishes`).then(r => setDishes(r.data));
        Swal.fire({icon: 'success', title: 'Platillo agregado', text: 'El platillo fue agregado exitosamente.'});
      })
      .catch(error => Swal.fire({icon: 'error', title: 'Error', text: 'Error al agregar el platillo.'}));
  };

  const handleDeleteDish = (dishId) => {
    axios.delete(`${API_URL}/api/dishes/${dishId}`)
      .then(() => {
        setDishes(dishes.filter(dish => dish.id !== dishId));
        Swal.fire({icon: 'success', title: 'Platillo eliminado', text: 'El platillo fue eliminado.'});
      })
      .catch(error => Swal.fire({icon: 'error', title: 'Error', text: 'Error al eliminar el platillo.'}));
  };

  const handleAddUser = (newUser) => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      Swal.fire({icon: 'warning', title: 'Campos incompletos', text: 'Por favor, completa todos los campos antes de agregar un usuario.'});
      return;
    }
    axios.post(`${API_URL}/api/register`, newUser)
      .then(() => {
        setUsers([...users, newUser]);
        setNewUser({ name: '', email: '', password: '', role: '' });
        Swal.fire({icon: 'success', title: 'Usuario agregado', text: 'El usuario fue agregado exitosamente.'});
      })
      .catch(error => Swal.fire({icon: 'error', title: 'Error', text: 'Error al agregar el usuario.'}));
  };

  const handleDeleteUser = (userId) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${API_URL}/api/users/${userId}`)
          .then(() => {
            setUsers(users.filter(user => user.id !== userId));
            Swal.fire({icon: 'success', title: 'Usuario eliminado', text: 'El usuario fue eliminado.'});
          })
          .catch(error => Swal.fire({icon: 'error', title: 'Error', text: 'Error al eliminar el usuario.'}));
      }
    });
  };

  const handleEditUser = (userId, updatedUser) => {
    if (!updatedUser.name || !updatedUser.email || !updatedUser.role) {
      Swal.fire({icon: 'warning', title: 'Campos incompletos', text: 'Por favor, completa todos los campos antes de editar el usuario.'});
      return;
    }
    const userToSend = { ...updatedUser };
    if (!userToSend.password) {
      delete userToSend.password;
    }
    axios.put(`${API_URL}/api/users/${userId}`, userToSend)
      .then(() => {
        setUsers(users.map(user => user.id === userId ? { ...user, ...updatedUser } : user));
        setEditingUser(null);
        Swal.fire({icon: 'success', title: 'Usuario editado', text: 'Los cambios fueron guardados.'});
      })
      .catch(error => Swal.fire({icon: 'error', title: 'Error', text: 'Error al editar el usuario.'}));
  };

  const buscarPlatillosSpoonacular = async () => {
    setLoadingSpoonacular(true);
    setErrorSpoonacular("");
    try {
      const response = await axios.get(
        `https://api.spoonacular.com/food/menuItems/search?query=${encodeURIComponent(searchTerm)}&number=5&apiKey=${SPOONACULAR_API_KEY}`
      );
      setSpoonacularResults(response.data.menuItems || []);
    } catch (error) {
      setErrorSpoonacular("Error al buscar en Spoonacular");
    }
    setLoadingSpoonacular(false);
  };

  const agregarPlatilloDesdeSpoonacular = async (item, type) => {
    try {
      // Obtener detalles del platillo para el precio
      const response = await axios.get(
        `https://api.spoonacular.com/food/menuItems/${item.id}?apiKey=${SPOONACULAR_API_KEY}`
      );
      const price = response.data.price || 100; // Si no hay precio, poner 100 por defecto
      const newDish = {
        name: item.title,
        price: price,
        type: type,
        image: item.image
      };
      await axios.post(`${API_URL}/api/dishes`, newDish);
      setDishes([...dishes, newDish]);
      setSpoonacularTypeSelect({ show: false, item: null });
    } catch (error) {
      alert("Error al agregar el platillo desde Spoonacular");
    }
  };

  const handleDownloadInvoice = (order, payment) => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(18);
    doc.text('Factura', 105, y, { align: 'center' });
    y += 12;
    doc.setFontSize(12);
    doc.text(`Orden #${order.id}   Mesa: ${order.mesa || 'N/A'}`, 15, y);
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 6;
    doc.setFontSize(11);
    order.dishes.forEach(dish => {
      doc.text(`${dish.name} (${dish.type})`, 18, y);
      doc.text(`$${dish.price.toFixed(2)}`, 180, y, { align: 'right' });
      y += 9;
    });
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: $${parseFloat(payment.total).toFixed(2)}`, 18, y);
    doc.setFont('helvetica', 'normal');
    y += 10;
    doc.setFontSize(11);
    doc.text(`Método de pago: ${payment.method}`, 18, y);
    y += 8;
    doc.text(`Fecha: ${payment.paid_at ? payment.paid_at.substring(0, 19).replace('T', ' ') : ''}`, 18, y);
    y += 12;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('¡Gracias por su compra!', 105, y, { align: 'center' });
    doc.save(`factura_orden_${order.id}.pdf`);
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = orderStatusFilter === 'todos' || order.status === orderStatusFilter;
    const mesaMatch = !mesaFilter || (order.mesa && order.mesa.toString().includes(mesaFilter));
    let fechaMatch = true;
    if (startDate) {
      fechaMatch = fechaMatch && order.created_at && order.created_at >= startDate;
    }
    if (endDate) {
      fechaMatch = fechaMatch && order.created_at && order.created_at <= endDate + ' 23:59:59';
    }
    return statusMatch && mesaMatch && fechaMatch;
  });
  // Función para filtrar pagos por día, semana o mes
  function filterPayments(payments, type) {
    const now = new Date();
    return payments.filter(payment => {
      const paidAt = new Date(payment.paid_at);
      if (type === 'dia') {
        return paidAt.toDateString() === now.toDateString();
      } else if (type === 'semana') {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        return paidAt >= firstDayOfWeek && paidAt <= lastDayOfWeek;
      } else if (type === 'mes') {
        return paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  const filteredPayments = filterPayments(payments, paymentReportType);
  const totalPagos = filteredPayments.reduce((sum, p) => sum + parseFloat(p.total), 0);

  // --- NUEVO: Exportar pagos a PDF y Excel ---
  const exportPaymentsToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Pagos', 14, 18);
    doc.setFontSize(11);
    doc.text(`Periodo: ${paymentReportType.charAt(0).toUpperCase() + paymentReportType.slice(1)}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      head: [['ID', 'Orden', 'Total', 'Método', 'Fecha']],
      body: filteredPayments.map(p => [
        p.id,
        p.order_id,
        `$${parseFloat(p.total).toFixed(2)}`,
        p.method,
        p.paid_at ? p.paid_at.substring(0, 19).replace('T', ' ') : ''
      ]),
    });
    doc.text(`Total: $${totalPagos.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save('reporte_pagos.pdf');
  };

  const exportPaymentsToExcel = () => {
    const wsData = [
      ['ID', 'Orden', 'Total', 'Método', 'Fecha'],
      ...filteredPayments.map(p => [
        p.id,
        p.order_id,
        parseFloat(p.total),
        p.method,
        p.paid_at ? p.paid_at.substring(0, 19).replace('T', ' ') : ''
      ]),
      [],
      ['Total', '', totalPagos, '', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
    XLSX.writeFile(wb, 'reporte_pagos.xlsx');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/');
    } catch (error) {
      Swal.fire({icon: 'error', title: 'Error', text: 'Error al cerrar sesión'});
    }
  };

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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-end mb-3 gap-2">
        <button className="btn btn-outline-secondary" onClick={() => setDarkMode(dm => !dm)}>
          {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          <FaSignOutAlt /> Cerrar sesión
        </button>
      </div>
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-lg rounded-4 p-4 mb-4 admin-card">
            <div className="d-flex align-items-center mb-4 gap-2">
              <FaCog size={32} className="text-primary" />
              <h1 className="mb-0 text-primary">Pantalla del Administrador</h1>
            </div>
            <ul className="nav nav-tabs mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button className="nav-link active" id="platillos-tab" data-bs-toggle="tab" data-bs-target="#platillos" type="button" role="tab" aria-controls="platillos" aria-selected="true"><FaUtensils className="me-1" /> Gestión de Platillos</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="ordenes-tab" data-bs-toggle="tab" data-bs-target="#ordenes" type="button" role="tab" aria-controls="ordenes" aria-selected="false"><FaListAlt className="me-1" /> Órdenes</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="usuarios-tab" data-bs-toggle="tab" data-bs-target="#usuarios" type="button" role="tab" aria-controls="usuarios" aria-selected="false"><FaUsers className="me-1" /> Gestión de Usuarios</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="pagos-tab" data-bs-toggle="tab" data-bs-target="#pagos" type="button" role="tab" aria-controls="pagos" aria-selected="false"><FaMoneyCheckAlt className="me-1" /> Pagos</button>
              </li>
            </ul>
            <div className="tab-content">
              <div className="tab-pane fade show active" id="platillos" role="tabpanel" aria-labelledby="platillos-tab">
                {/* Gestión de Platillos */}
                <div className="p-3 rounded-3 bg-light-subtle mb-3">
                  <h3 className="mb-3 text-secondary"><FaUtensils className="me-2" />Gestión de Platillos</h3>
                  <div className="mb-3">
                    <label className="form-label">Buscar platillo en Spoonacular:</label>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ejemplo: pizza, pasta, hamburguesa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-secondary" onClick={buscarPlatillosSpoonacular} disabled={loadingSpoonacular}>
                        Buscar
                      </button>
                    </div>
                    {loadingSpoonacular && <div>Buscando...</div>}
                    {errorSpoonacular && <div className="text-danger">{errorSpoonacular}</div>}
                    {spoonacularResults.length > 0 && (
                      <ul className="list-group mb-2">
                        {spoonacularResults.map(item => (
                          <li className="list-group-item d-flex align-items-center" key={item.id}>
                            <img src={item.image} alt={item.title} style={{width: 50, height: 50, objectFit: 'cover', marginRight: 10}} />
                            <span className="flex-grow-1">{item.title}</span>
                            <button className="btn btn-success btn-sm ms-2" onClick={() => setSpoonacularTypeSelect({ show: true, item })}>
                              Agregar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Selector de tipo para Spoonacular */}
                    {spoonacularTypeSelect.show && (
                      <div className="mb-3">
                        <label className="form-label">Selecciona el tipo de platillo para "{spoonacularTypeSelect.item.title}":</label>
                        <select className="form-select mb-2" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                          <option value="desayuno">Desayuno</option>
                          <option value="almuerzo">Almuerzo</option>
                          <option value="cena">Cena</option>
                        </select>
                        <button className="btn btn-primary me-2" onClick={() => agregarPlatilloDesdeSpoonacular(spoonacularTypeSelect.item, selectedType)}>
                          Confirmar y agregar
                        </button>
                        <button className="btn btn-secondary" onClick={() => setSpoonacularTypeSelect({ show: false, item: null })}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <ul className="list-group mb-3">
                    {dishes.map(dish => (
                      <li className="list-group-item d-flex justify-content-between align-items-center" key={dish.id}>
                        {dish.name} - ${dish.price} <span className="badge bg-secondary">{dish.type}</span>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDish(dish.id)}>Eliminar</button>
                      </li>
                    ))}
                  </ul>
                  <h3>Agregar Nuevo Platillo</h3>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Nombre"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  />
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Precio"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                  />
                  <select
                    className="form-select mb-2"
                    value={newDish.type}
                    onChange={e => setNewDish({ ...newDish, type: e.target.value })}
                  >
                    <option value="desayuno">Desayuno</option>
                    <option value="almuerzo">Almuerzo</option>
                    <option value="cena">Cena</option>
                  </select>
                  <button className="btn btn-primary" onClick={handleAddDish}>Agregar</button>
                </div>
              </div>
              <div className="tab-pane fade" id="ordenes" role="tabpanel" aria-labelledby="ordenes-tab">
                {/* Órdenes */}
                <div className="p-3 rounded-3 bg-light-subtle mb-3">
                  <h3 className="mb-3 text-secondary"><FaListAlt className="me-2" />Órdenes</h3>
                  {/* Aquí va tu lógica y componentes de órdenes */}
                </div>
              </div>
              <div className="tab-pane fade" id="usuarios" role="tabpanel" aria-labelledby="usuarios-tab">
                {/* Gestión de Usuarios */}
                <div className="p-3 rounded-3 bg-light-subtle mb-3">
                  <h3 className="mb-3 text-secondary"><FaUsers className="me-2" />Gestión de Usuarios</h3>
                  <ul className="list-group mb-3">
                    {users.map((user, index) => (
                      <li className="list-group-item d-flex justify-content-between align-items-center" key={user.id || index}>
                        {user.name} - {user.role}
                        <div>
                          <button className="btn btn-warning btn-sm me-2" onClick={() => setEditingUser(user)}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>Eliminar</button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {editingUser && editingUser.id && (
                    <div className="mb-3">
                      <h3>Editar Usuario</h3>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Nombre"
                        value={editingUser.name || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      />
                      <input
                        type="email"
                        className="form-control mb-2"
                        placeholder="Email"
                        value={editingUser.email || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      />
                      <input
                        type="password"
                        className="form-control mb-2"
                        placeholder="Contraseña (dejar en blanco para no cambiar)"
                        value={editingUser.password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      />
                      <select
                        className="form-select mb-2"
                        value={editingUser.role || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="">Seleccionar Rol</option>
                        <option value="administrador">Administrador</option>
                        <option value="mesero">Mesero</option>
                        <option value="cocina">Cocinero</option>
                        <option value="cobrador">Cobrador</option>
                      </select>
                      <button className="btn btn-primary me-2" onClick={() => handleEditUser(editingUser.id, editingUser)}>Guardar Cambios</button>
                      <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                    </div>
                  )}

                  <button className="btn btn-success mb-3" onClick={() => setShowAddUserForm(!showAddUserForm)}>
                    {showAddUserForm ? 'Ocultar Formulario' : 'Agregar Usuario'}
                  </button>

                  {showAddUserForm && (
                    <div className="mb-3">
                      <h3>Agregar Nuevo Usuario</h3>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Nombre"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                      <input
                        type="email"
                        className="form-control mb-2"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                      <input
                        type="password"
                        className="form-control mb-2"
                        placeholder="Contraseña"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                      <select
                        className="form-select mb-2"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <option value="">Seleccionar Rol</option>
                        <option value="administrador">Administrador</option>
                        <option value="mesero">Mesero</option>
                        <option value="cocina">Cocinero</option>
                        <option value="cobrador">Cobrador</option>
                      </select>
                      <button className="btn btn-primary" onClick={() => handleAddUser(newUser)}>Agregar Usuario</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="tab-pane fade" id="pagos" role="tabpanel" aria-labelledby="pagos-tab">
                {/* Pagos */}
                <div className="p-3 rounded-3 bg-light-subtle mb-3">
                  <h3 className="mb-3 text-secondary"><FaMoneyCheckAlt className="me-2" />Pagos</h3>
                  {/* Aquí va tu lógica y componentes de pagos */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;