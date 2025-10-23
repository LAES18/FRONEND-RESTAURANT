  // Función básica para generar y descargar un PDF de factura
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './AdminScreen.css';
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaTrash, FaSignOutAlt, FaUtensils, FaListAlt, FaUsers, FaMoneyCheckAlt, FaChartBar, FaFilter, FaPrint, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Navigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001');
const SPOONACULAR_API_KEY = '67ce982a724d41798877cf212f48d0de';

const AdminScreen = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Manejar el cambio de tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mover search al principio y asegurarnos de que esté inicializado
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState('platillos');
  const [darkMode, setDarkMode] = useState(() => {
    // Persistencia: lee de localStorage si existe
    const saved = localStorage.getItem('admin-dark-mode');
    return saved === 'true';
  });
  const [dishes, setDishes] = useState([]);
  const [newDish, setNewDish] = useState({ name: '', price: '', type: 'desayuno' });
  const [spoonacularResults, setSpoonacularResults] = useState([]);
  const [spoonacularTypes, setSpoonacularTypes] = useState({});
  const [spoonacularPrices, setSpoonacularPrices] = useState({});
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState({ date: '', month: '' });
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'administrador' });
  const [payments, setPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState({ date: '', month: '' });
  // Filtros reactivos para órdenes
  useEffect(() => {
    fetchOrders();
  }, [orderFilter.date, orderFilter.month]);

  // Filtros reactivos para pagos
  useEffect(() => {
    fetchPayments();
  }, [paymentFilter.date, paymentFilter.month]);
  const [reportType, setReportType] = useState('diario');
  const [report, setReport] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Estado para edición de usuario
  const [editUserId, setEditUserId] = useState(null);
  const [editUser, setEditUser] = useState({ name: '', email: '', password: '', role: 'administrador' });

  useEffect(() => {
    fetchDishes();
    fetchUsers();
    fetchOrders();
    fetchPayments();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    // Guardar preferencia
    localStorage.setItem('admin-dark-mode', darkMode);
    // Animación suave
    document.body.style.transition = 'background 0.4s, color 0.4s';
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
        popup: 'swal2-popup-restosmart'
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
      let url = `${API_URL}/api/orders`;
      const params = new URLSearchParams();
      
      if (orderFilter.date) {
        params.append('date', orderFilter.date);
      }
      if (orderFilter.month) {
        params.append('month', orderFilter.month);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await axios.get(url);
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
      let url = `${API_URL}/api/payments`;
      const params = new URLSearchParams();
      
      if (paymentFilter.date) {
        params.append('date', paymentFilter.date);
      }
      if (paymentFilter.month) {
        params.append('month', paymentFilter.month);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await axios.get(url);
      setPayments(res.data);
    } catch (err) {
      setError('Error al cargar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar en Spoonacular
  const handleSearchSpoonacular = async () => {
    // Verificación más estricta del estado search
    const searchTerm = search || '';
    if (!searchTerm.trim()) {
      Swal.fire({ icon: 'warning', title: 'Búsqueda vacía', text: 'Por favor ingresa un término de búsqueda' });
      return;
    }

    try {
      const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${search}&number=10&apiKey=${SPOONACULAR_API_KEY}`);
      if (!response.ok) {
        throw new Error('Error al buscar en Spoonacular');
      }
      const data = await response.json();
      setSpoonacularResults(
        (data.results || []).map(d => ({
          id: d.id,
          name: d.title, // Renombrar title a name
          image: d.image
        }))
      );
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  // Función para agregar platillo desde Spoonacular
  const handleAddSpoonacularDish = async (dish) => {
    const price = spoonacularPrices[dish.id];
    const type = spoonacularTypes[dish.id];

    if (!price || price <= 0) {
      Swal.fire({ icon: 'warning', title: 'Precio requerido', text: 'Por favor ingresa un precio válido' });
      return;
    }

    try {
      await axios.post(`${API_URL}/api/dishes`, {
        name: dish.name, // Usar name normalizado
        price: Number(price),
        type: type
      });

      fetchDishes();
      Swal.fire({ icon: 'success', title: 'Platillo importado', text: 'Platillo agregado desde Spoonacular' });

      // Limpiar resultados
      setSpoonacularResults([]);
      setSearch('');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el platillo' });
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

  // Función para agregar usuario
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Todos los campos son obligatorios' });
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/register`, newUser);
      setNewUser({ name: '', email: '', password: '', role: 'administrador' });
      fetchUsers();
      Swal.fire({ icon: 'success', title: 'Usuario agregado', text: 'Usuario creado correctamente' });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al crear usuario';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
    }
  };

  // Función para iniciar edición de usuario
  const handleEditUser = (user) => {
    setEditUserId(user.id);
    setEditUser({
      name: user.name || user.nombre,
      email: user.email,
      password: '',
      role: user.role || user.rol
    });
  };

  // Función para cancelar edición
  const handleCancelEditUser = () => {
    setEditUserId(null);
    setEditUser({ name: '', email: '', password: '', role: 'administrador' });
  };

  // Función unificada para reimprimir factura
  const handleReprintInvoice = async (item) => {
    try {
      let orderId;
      let order;
      
      // Si recibimos un objeto payment
      if (item.order_id) {
        orderId = item.order_id;
        const res = await axios.get(`${API_URL}/api/orders/${orderId}`);
        order = res.data;
      } else {
        // Si recibimos directamente un orderId o una orden
        orderId = typeof item === 'object' ? item.id : item;
        order = typeof item === 'object' ? item : null;
        
        if (!order) {
          const res = await axios.get(`${API_URL}/api/orders/${orderId}`);
          order = res.data;
        }
      }
      
      // Generar y descargar el PDF
      generateInvoicePDF(order);
      
      Swal.fire({
        icon: 'success',
        title: 'Factura Reimpresa',
        text: `La factura de la orden #${orderId} ha sido reimpresa`
      });
    } catch (err) {
      console.error('Error al reimprimir factura:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo reimprimir la factura'
      });
    }
  };

  // Función para generar reporte PDF
  const generateSalesReport = async (type) => {
    try {
      // Obtener órdenes pagadas
      const payments = await axios.get(`${API_URL}/api/payments`);
      const orders = await axios.get(`${API_URL}/api/orders?status=pagado`);
      
      // Procesar datos para el reporte
      const ordersWithPayments = orders.data.map(order => {
        const payment = payments.data.find(p => p.order_id === order.id);
        return {
          ...order,
          payment: payment || {}
        };
      });

      // Filtrar por período
      const now = new Date();
      const filteredOrders = ordersWithPayments.filter(order => {
        const orderDate = new Date(order.created_at);
        switch(type) {
          case 'daily':
            return orderDate.toDateString() === now.toDateString();
          case 'weekly':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return orderDate >= weekAgo;
          case 'monthly':
            return orderDate.getMonth() === now.getMonth() && 
                   orderDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });

      // Agrupar ventas por platillo
      const salesByDish = {};
      filteredOrders.forEach(order => {
        order.dishes.forEach(dish => {
          if (!salesByDish[dish.name]) {
            salesByDish[dish.name] = {
              quantity: 0,
              total: 0,
              type: dish.type
            };
          }
          salesByDish[dish.name].quantity += 1;
          salesByDish[dish.name].total += parseFloat(dish.price);
        });
      });

      // Convertir a array para el reporte
      const salesData = Object.entries(salesByDish).map(([name, data]) => ({
        name,
        ...data
      }));

      // Generar PDF
      const doc = new jsPDF();
      let y = 20;

      // Título
      doc.setFontSize(20);
      doc.text('Reporte de Ventas - Restaurante', 105, y, { align: 'center' });
      y += 15;

      // Subtítulo con periodo
      doc.setFontSize(12);
      const periodText = type === 'daily' ? 'Reporte Diario' : 
                        type === 'weekly' ? 'Reporte Semanal' : 
                        'Reporte Mensual';
      doc.text(periodText, 105, y, { align: 'center' });
      y += 15;

      // Periodo
      doc.setFontSize(12);
      const period = type === 'daily' ? 'Diario' : type === 'weekly' ? 'Semanal' : 'Mensual';
      doc.text(`Periodo: ${period}`, 20, y);
      y += 10;

      // Encabezados de tabla
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Platillo', 20, y);
      doc.text('Tipo', 80, y);
      doc.text('Cantidad', 130, y);
      doc.text('Total', 170, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 10;

      // Contenido de la tabla
      doc.setFont('helvetica', 'normal');
      let totalVentas = 0;
      let ventasPorTipo = {
        desayuno: 0,
        almuerzo: 0,
        cena: 0
      };

      let totalGeneral = 0;
      salesData.forEach(item => {
        doc.text(item.name.substring(0, 40), 20, y);
        doc.text(item.type, 80, y);
        doc.text(item.quantity.toString(), 130, y);
        doc.text(`$${item.total.toFixed(2)}`, 170, y);
        y += 7;
        totalGeneral += item.total;
        ventasPorTipo[item.type] += item.total;
      });

      y += 5;
      doc.line(20, y, 190, y);
      y += 10;

      // Resumen por tipo de platillo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen por Tipo:', 20, y);
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      Object.entries(ventasPorTipo).forEach(([tipo, total]) => {
        if (total > 0) {
          doc.text(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)}:`, 30, y);
          doc.text(`$${total.toFixed(2)}`, 170, y);
          y += 7;
        }
      });

      y += 5;
      doc.line(20, y, 190, y);
      y += 10;

      // Total General
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total General:', 30, y);
      doc.text(`$${totalGeneral.toFixed(2)}`, 170, y);

      // Fecha del reporte
      y += 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reporte generado el ${new Date().toLocaleString()}`, 105, y, { align: 'center' });

      // Guardar PDF
      doc.save(`reporte-ventas-${type}-${new Date().toISOString().split('T')[0]}.pdf`);

      // Generar Excel
      const wb = XLSX.utils.book_new();
      
      // Hoja de Detalle de Ventas
      const ws_data = [
        ['Platillo', 'Tipo', 'Cantidad', 'Precio Unitario', 'Total'],
        ...salesData.map(item => [
          item.name,
          item.type,
          item.quantity,
          (item.total / item.quantity).toFixed(2),
          item.total.toFixed(2)
        ])
      ];
      
      // Agregar totales por tipo
      ws_data.push([]);
      ws_data.push(['Resumen por Tipo']);
      Object.entries(ventasPorTipo).forEach(([tipo, total]) => {
        if (total > 0) {
          ws_data.push([tipo.charAt(0).toUpperCase() + tipo.slice(1), '', '', '', total.toFixed(2)]);
        }
      });
      
      // Agregar total general
      ws_data.push([]);
      ws_data.push(['Total General', '', '', '', totalGeneral.toFixed(2)]);
      
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      
      // Dar formato a las columnas
      const cols = [
        { wch: 40 }, // Platillo
        { wch: 15 }, // Tipo
        { wch: 10 }, // Cantidad
        { wch: 15 }, // Precio Unitario
        { wch: 15 }  // Total
      ];
      ws['!cols'] = cols;
      
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");
      XLSX.writeFile(wb, `reporte-ventas-${type}-${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'Reportes Generados',
        text: 'Los reportes han sido generados en PDF y Excel'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el reporte'
      });
    }
  };

  // Función para actualizar usuario
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser.name || !editUser.email || !editUser.role) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre, email y rol son obligatorios' });
      return;
    }
    
    try {
      const updateData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        password: editUser.password || 'unchanged'
      };
      
      await axios.put(`${API_URL}/api/users/${editUserId}`, updateData);
      setEditUserId(null);
      setEditUser({ name: '', email: '', password: '', role: 'administrador' });
      fetchUsers();
      Swal.fire({ icon: 'success', title: 'Usuario actualizado', text: 'Usuario actualizado correctamente' });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar usuario';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
    }
  };

  // Función para eliminar usuario
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

  // Función para buscar en Spoonacular (alias para handleSearchSpoonacular)
  const handleSpoonacularSearch = handleSearchSpoonacular;

  // Función para agregar platillo desde Spoonacular (alias para handleAddSpoonacularDish)
  const handleAddFromSpoonacular = handleAddSpoonacularDish;

  // Función para agregar usuario (alias para handleAddUser)
  const handleAddUserForm = handleAddUser;

  // Función para exportar reportes a Excel
  const handleExportToExcel = () => {
    try {
      if (report.length === 0) {
        Swal.fire('Advertencia', 'No hay datos para exportar', 'warning');
        return;
      }
      
      const ws = XLSX.utils.json_to_sheet(report);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Reporte-${reportType}`);
      XLSX.writeFile(wb, `reporte-${reportType}-${new Date().toLocaleDateString()}.xlsx`);
      
      Swal.fire('Éxito', 'Reporte exportado correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire('Error', 'No se pudo exportar el reporte', 'error');
    }
  };

  const isAuthenticated = true; // Reemplazar con lógica real de autenticación

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  let renderError = null;
  try {
    return (
      <div className="container-fluid p-0">
        {/* Header unificado con nuevo diseño */}
        <header className="restaurant-header">
          <div className="container">
            <h1 className="restaurant-title">
              <FaUserCircle className="me-3" />
              Panel de Administración
            </h1>
            <p className="restaurant-subtitle">Sistema de Gestión del Restaurante</p>
          </div>
        </header>

        <div className="container my-4">
          {/* Navigation responsiva */}
          <nav className="restaurant-nav">
            {isMobile ? (
              <div className="dropdown w-100">
                <button 
                  className="btn btn-restaurant-primary dropdown-toggle w-100 d-flex justify-content-between align-items-center"
                  type="button" 
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span>
                    {activeMenu === 'platillos' && (<><FaUtensils className="me-2" />Platillos</>)}
                    {activeMenu === 'pedidos' && (<><FaListAlt className="me-2" />Pedidos</>)}
                    {activeMenu === 'usuarios' && (<><FaUsers className="me-2" />Usuarios</>)}
                    {activeMenu === 'ventas' && (<><FaMoneyCheckAlt className="me-2" />Ventas</>)}
                    {activeMenu === 'dashboard' && (<><FaChartBar className="me-2" />Dashboard</>)}
                  </span>
                </button>
                <ul className="dropdown-menu w-100">
                  <li>
                    <button 
                      className={`dropdown-item ${activeMenu === 'platillos' ? 'active' : ''}`}
                      onClick={() => setActiveMenu('platillos')}
                    >
                      <FaUtensils className="me-2" />Platillos
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item ${activeMenu === 'pedidos' ? 'active' : ''}`}
                      onClick={() => setActiveMenu('pedidos')}
                    >
                      <FaListAlt className="me-2" />Pedidos
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item ${activeMenu === 'usuarios' ? 'active' : ''}`}
                      onClick={() => setActiveMenu('usuarios')}
                    >
                      <FaUsers className="me-2" />Usuarios
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item ${activeMenu === 'ventas' ? 'active' : ''}`}
                      onClick={() => setActiveMenu('ventas')}
                    >
                      <FaMoneyCheckAlt className="me-2" />Ventas
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                      onClick={() => setActiveMenu('dashboard')}
                    >
                      <FaChartBar className="me-2" />Dashboard
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <ul className="nav nav-pills justify-content-center">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeMenu === 'platillos' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('platillos')}
                >
                  <FaUtensils className="me-2" />
                  Platillos
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeMenu === 'usuarios' ? 'active' : ''}`}
                  onClick={() => setActiveMenu('usuarios')}
                >
                  <FaUsers className="me-2" />
                  Usuarios  
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeMenu === 'ordenes' ? 'active' : ''}`}
                  onClick={() => setActiveMenu('ordenes')}
                >
                  <FaListAlt className="me-2" />
                  Órdenes
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeMenu === 'pagos' ? 'active' : ''}`}
                  onClick={() => setActiveMenu('pagos')}
                >
                  <FaMoneyCheckAlt className="me-2" />
                  Pagos & Reportes
                </button>
              </li>
            </ul>
            )}
            
            {/* Controles superiores responsivos */}
            <div className={`${isMobile ? 'd-grid gap-2' : 'd-flex justify-content-between align-items-center'} mt-3`}>
              <div className={isMobile ? 'd-grid gap-2' : 'd-flex gap-2 align-items-center'}>
                <button 
                  className={`btn-restaurant-outline ${isMobile ? '' : 'btn-sm'}`}
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? '☀️' : '🌙'} {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                </button>
              </div>
              <button 
                className={`btn-restaurant-danger ${isMobile ? '' : 'btn-sm'}`}
                onClick={handleLogout}
              >
                <FaSignOutAlt className="me-2" />
                Cerrar Sesión
              </button>
            </div>
          </nav>

          {/* Loading y Error States */}
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border" style={{color: 'var(--primary-color)'}} role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* SECCIÓN PLATILLOS */}
          {!loading && !error && activeMenu === 'platillos' && (
            <div className="restaurant-card">
              <div className="card-header bg-transparent border-bottom-0">
                <h3 className="mb-0" style={{color: 'var(--primary-color)'}}>
                  <FaUtensils className="me-2" />
                  Gestión de Platillos
                </h3>
              </div>
              <div className="card-body">
                {/* Formulario Agregar Platillo */}
                <form onSubmit={handleAddDishForm} className="mb-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="restaurant-form-control"
                        placeholder="Nombre del platillo"
                        value={newDish.name}
                        onChange={(e) => setNewDish({...newDish, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="number"
                        step="0.01"
                        className="restaurant-form-control"
                        placeholder="Precio"
                        value={newDish.price}
                        onChange={(e) => setNewDish({...newDish, price: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        className="restaurant-form-control"
                        value={newDish.type}
                        onChange={(e) => setNewDish({...newDish, type: e.target.value})}
                      >
                        <option value="desayuno">Desayuno</option>
                        <option value="almuerzo">Almuerzo</option>
                        <option value="cena">Cena</option>
                        <option value="bebida">Bebida</option>
                        <option value="postre">Postre</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn-restaurant-primary w-100">
                        <FaPlus className="me-2" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </form>

                {/* Búsqueda con Spoonacular */}
                <div className="mb-4">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <input
                        type="text"
                        className="restaurant-form-control"
                        placeholder="Buscar recetas en Spoonacular..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <button
                        type="button"
                        className="btn-restaurant-outline w-100"
                        onClick={handleSpoonacularSearch}
                      >
                        🔍 Buscar Recetas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resultados de Spoonacular */}
                {spoonacularResults.length > 0 && (
                  <div className="mb-4">
                    <h5 style={{color: 'var(--secondary-color)'}}>Recetas encontradas:</h5>
                    <div className="row g-3">
                      {spoonacularResults.map((recipe) => (
                        <div key={recipe.id} className="col-md-6 col-lg-4">
                          <div className="card h-100 border-0 shadow-sm">
                            <img 
                              src={recipe.image} 
                              alt={recipe.title}
                              className="card-img-top"
                              style={{height: '200px', objectFit: 'cover'}}
                            />
                            <div className="card-body">
                              <h6 className="card-title">{recipe.title}</h6>
                              <div className="row g-2 mb-3">
                                <div className="col-6">
                                  <select
                                    className="form-select form-select-sm"
                                    value={spoonacularTypes[recipe.id] || 'desayuno'}
                                    onChange={(e) => setSpoonacularTypes({
                                      ...spoonacularTypes,
                                      [recipe.id]: e.target.value
                                    })}
                                  >
                                    <option value="desayuno">Desayuno</option>
                                    <option value="almuerzo">Almuerzo</option>
                                    <option value="cena">Cena</option>
                                    <option value="bebida">Bebida</option>
                                    <option value="postre">Postre</option>
                                  </select>
                                </div>
                                <div className="col-6">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    placeholder="Precio"
                                    value={spoonacularPrices[recipe.id] || ''}
                                    onChange={(e) => setSpoonacularPrices({
                                      ...spoonacularPrices,
                                      [recipe.id]: e.target.value
                                    })}
                                  />
                                </div>
                              </div>
                              <button
                                className="btn-restaurant-success btn-sm w-100"
                                onClick={() => handleAddFromSpoonacular(recipe)}
                              >
                                Agregar al Menú
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Platillos */}
                <div>
                  <h5 style={{color: 'var(--secondary-color)'}}>Platillos Actuales:</h5>
                  {dishes.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No hay platillos registrados</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="restaurant-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Precio</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dishes.map((dish) => (
                            <tr key={dish.id}>
                              <td className="fw-medium">{dish.name}</td>
                              <td>
                                <span className="badge rounded-pill" style={{
                                  backgroundColor: 'var(--accent-color)',
                                  color: 'var(--primary-color)'
                                }}>
                                  {dish.type}
                                </span>
                              </td>
                              <td className="fw-bold">${dish.price}</td>
                              <td>
                                <button
                                  className="btn-restaurant-danger btn-sm"
                                  onClick={() => handleDeleteDish(dish.id)}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN USUARIOS */}
          {!loading && !error && activeMenu === 'usuarios' && (
            <div className="restaurant-card">
              <div className="card-header bg-transparent border-bottom-0">
                <h3 className="mb-0" style={{color: 'var(--primary-color)'}}>
                  <FaUsers className="me-2" />
                  Gestión de Usuarios
                </h3>
              </div>
              <div className="card-body">
                {/* Formulario Agregar Usuario */}
                <form onSubmit={handleAddUserForm} className="mb-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <input
                        type="text"
                        className="restaurant-form-control"
                        placeholder="Nombre completo"
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="email"
                        className="restaurant-form-control"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="password"
                        className="restaurant-form-control"
                        placeholder="Contraseña"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <select
                        className="restaurant-form-control"
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      >
                        <option value="administrador">Administrador</option>
                        <option value="cajero">Cajero</option>
                        <option value="mesero">Mesero</option>
                        <option value="cocinero">Cocinero</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn-restaurant-primary w-100">
                        <FaPlus className="me-2" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </form>

                {/* Lista de Usuarios */}
                <div>
                  <h5 style={{color: 'var(--secondary-color)'}}>Usuarios del Sistema:</h5>
                  {users.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No hay usuarios registrados</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="restaurant-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td className="fw-medium">{user.name}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className="badge rounded-pill" style={{
                                  backgroundColor: 'var(--accent-color)',
                                  color: 'var(--primary-color)'
                                }}>
                                  {user.role}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn-restaurant-danger btn-sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN ÓRDENES */}
          {!loading && !error && activeMenu === 'ordenes' && (
            <div className="restaurant-card">
              <div className="card-header bg-transparent border-bottom-0">
                <h3 className="mb-0" style={{color: 'var(--primary-color)'}}>
                  <FaListAlt className="me-2" />
                  Órdenes del Restaurante
                </h3>
              </div>
              <div className="card-body">
                {/* Filtros de Órdenes */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Filtrar por fecha:</label>
                    <input
                      type="date"
                      className="restaurant-form-control"
                      value={orderFilter.date}
                      onChange={(e) => setOrderFilter({...orderFilter, date: e.target.value, month: ''})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">O por mes:</label>
                    <input
                      type="month"
                      className="restaurant-form-control"
                      value={orderFilter.month}
                      onChange={(e) => setOrderFilter({...orderFilter, month: e.target.value, date: ''})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <div className="d-grid">
                      <button
                        type="button"
                        className="btn-restaurant-outline"
                        onClick={handleOrderFilter}
                      >
                        <FaFilter className="me-2" />
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de Órdenes */}
                <div>
                  <h5 style={{color: 'var(--secondary-color)'}}>Órdenes Registradas:</h5>
                  {orders.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No hay órdenes registradas</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {orders.map((order) => (
                        <div key={order.id} className="col-md-6 col-lg-4">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-transparent border-bottom-0">
                              <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">Orden #{order.id}</h6>
                                <span className="badge" style={{
                                  backgroundColor: 'var(--primary-color)',
                                  color: 'white'
                                }}>
                                  Mesa {order.mesa || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="mb-3">
                                {order.dishes.map((dish, index) => (
                                  <div key={index} className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                                    <div>
                                      <span className="fw-medium">{dish.name}</span>
                                      <small className="text-muted d-block">{dish.type}</small>
                                    </div>
                                    <span className="fw-bold">${dish.price}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>Total: ${order.total}</strong>
                                <button
                                  className="btn-restaurant-outline btn-sm"
                                  onClick={() => handleReprintInvoice(order.id)}
                                >
                                  <FaPrint className="me-1" />
                                  Reimprimir
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN PAGOS Y REPORTES */}
          {!loading && !error && activeMenu === 'pagos' && (
            <div className="restaurant-card">
              <div className="card-header bg-transparent border-bottom-0">
                <h3 className="mb-0" style={{color: 'var(--primary-color)'}}>
                  <FaMoneyCheckAlt className="me-2" />
                  Pagos y Reportes
                </h3>
              </div>
              <div className="card-body">
                {/* Filtros de Pagos */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Filtrar por fecha:</label>
                    <input
                      type="date"
                      className="restaurant-form-control"
                      value={paymentFilter.date}
                      onChange={(e) => setPaymentFilter({...paymentFilter, date: e.target.value, month: ''})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">O por mes:</label>
                    <input
                      type="month"
                      className="restaurant-form-control"
                      value={paymentFilter.month}
                      onChange={(e) => setPaymentFilter({...paymentFilter, month: e.target.value, date: ''})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <div className="d-grid">
                      <button
                        type="button"
                        className="btn-restaurant-outline"
                        onClick={handlePaymentFilter}
                      >
                        <FaFilter className="me-2" />
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de Pagos */}
                <div className="mb-5">
                  <h5 style={{color: 'var(--secondary-color)'}}>Historial de Pagos:</h5>
                  {payments.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No hay pagos registrados</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="restaurant-table">
                        <thead>
                          <tr>
                            <th>Pago ID</th>
                            <th>Orden</th>
                            <th>Mesa</th>
                            <th>Método</th>
                            <th>Total</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="fw-medium">#{payment.id}</td>
                              <td>{payment.orden_id ? `#${payment.orden_id}` : 'N/A'}</td>
                              <td>{payment.mesa || 'N/A'}</td>
                              <td>
                                <span className="badge rounded-pill" style={{
                                  backgroundColor: payment.method === 'efectivo' ? '#28a745' : '#007bff',
                                  color: 'white'
                                }}>
                                  {payment.method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                                </span>
                              </td>
                              <td className="fw-bold">${payment.total}</td>
                              <td>{new Date(payment.fecha || payment.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sección de Reportes */}
                <div className="border-top pt-4">
                  <h5 style={{color: 'var(--secondary-color)'}}>Reportes de Ventas:</h5>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <select
                        className="restaurant-form-control"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                      >
                        <option value="diario">Reporte Diario</option>
                        <option value="semanal">Reporte Semanal</option>
                        <option value="mensual">Reporte Mensual</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn-restaurant-primary"
                          onClick={() => handleReport(reportType)}
                        >
                          <FaChartBar className="me-2" />
                          Generar Reporte
                        </button>
                        {report.length > 0 && (
                          <button
                            type="button"
                            className="btn-restaurant-success"
                            onClick={handleExportToExcel}
                          >
                            <FaDownload className="me-2" />
                            Exportar Excel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resultados del Reporte */}
                  {report.length > 0 && (
                    <div>
                      <h6>Resultados del Reporte {reportType.charAt(0).toUpperCase() + reportType.slice(1)}:</h6>
                      <div className="table-responsive">
                        <table className="restaurant-table">
                          <thead>
                            <tr>
                              <th>Período</th>
                              <th>Total de Ventas</th>
                              <th>Número de Órdenes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.map((item, index) => (
                              <tr key={index}>
                                <td className="fw-medium">{item.fecha}</td>
                                <td className="fw-bold text-success">${item.total}</td>
                                <td>{item.ordenes || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="container text-center mt-5">
        <div className="alert alert-danger">
          <h4>Error inesperado</h4>
          <p>{e.message || e.toString()}</p>
        </div>
      </div>
    );
  }
};

export default AdminScreen;