  // Función básica para generar y descargar un PDF de factura
  import jsPDF from 'jspdf';
  // Genera un PDF de factura presentable para una orden
  function generateInvoicePDF(order) {
    if (!order) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró la orden para imprimir.' });
      return;
    }
    const doc = new jsPDF();
    let y = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.text('Restaurante - Factura', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.text(`Fecha: ${order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}`, 20, y);
    doc.text(`Factura #${order.id || ''}`, 160, y);
    y += 8;
    doc.text(`Mesa: ${order.mesa || 'N/A'}`, 20, y);
    y += 8;

    // Línea separadora
    doc.line(20, y, 190, y);
    y += 6;

    // Tabla de productos
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 22, y);
    doc.text('Tipo', 92, y);
    doc.text('Precio', 132, y);
    doc.text('Total', 172, y);
    y += 6;
    doc.setFont('helvetica', 'normal');

    let total = 0;
    (order.dishes || []).forEach((dish) => {
      doc.text(String(dish.name).substring(0, 30), 22, y);
      doc.text(dish.type || '', 92, y);
      doc.text(`$${Number(dish.price).toFixed(2)}`, 132, y);
      doc.text(`$${Number(dish.price).toFixed(2)}`, 172, y);
      total += Number(dish.price);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 4;
    doc.line(120, y, 190, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 132, y);
    doc.text(`$${total.toFixed(2)}`, 172, y);
    y += 10;

    // Pie de página
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('¡Gracias por su compra!', 105, 285, { align: 'center' });

    doc.save(`factura-orden-${order.id || 'N/A'}.pdf`);
  }
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './AdminScreen.css';
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaTrash, FaSignOutAlt, FaUtensils, FaListAlt, FaUsers, FaMoneyCheckAlt, FaChartBar } from 'react-icons/fa';
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

  const isAuthenticated = true; // Reemplazar con lógica real de autenticación

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  let renderError = null;
  try {
    return (
      <div className="admin-dashboard">
        <header className="admin-header" style={{
          padding: isMobile ? '12px' : '1rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '10px' : '1rem',
          flexWrap: 'wrap'
        }}>
          <div className="admin-header-logo" style={{
            width: isMobile ? '100%' : 'auto',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <span style={{fontSize: isMobile ? '1.2rem' : '1.25rem'}}>Panel de Administración</span>
          </div>
          <div className="admin-header-title" style={{
            width: isMobile ? '100%' : 'auto',
            textAlign: isMobile ? 'center' : 'left',
            order: isMobile ? 2 : 'initial'
          }}>
            Restaurante
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-end',
            flexWrap: 'wrap',
            order: isMobile ? 3 : 'initial'
          }}>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => setDarkMode(dm => !dm)}
              style={{width: isMobile ? '100%' : 'auto'}}
            >
              {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
            </button>
            {/* Botón exportar a Excel en reportes */}
            {activeMenu === 'pagos' && report.length > 0 && (
              <button 
                className="btn btn-success mb-3" 
                onClick={() => {
                  const ws = XLSX.utils.json_to_sheet(report);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
                  XLSX.writeFile(wb, `reporte-${reportType}.xlsx`);
                }}
                style={{width: isMobile ? '100%' : 'auto'}}
              >
                Exportar reporte a Excel
              </button>
            )}
          </div>
        </header>
        <div className="dashboard-layout" style={{
            display: 'flex', 
            flex: 1,
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
          }}>
          <aside className="admin-sidebar" style={{
            width: window.innerWidth <= 768 ? '100%' : '250px',
            marginBottom: window.innerWidth <= 768 ? '1rem' : '0'
          }}>
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
                <form onSubmit={handleAddDishForm} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginBottom: '18px', 
                    alignItems: 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%'
                  }}>
                  <input 
                    type="text" 
                    placeholder="Nombre" 
                    value={newDish.name} 
                    onChange={e => setNewDish({ ...newDish, name: e.target.value })} 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '6px', 
                      border: '1px solid #bfa76a',
                      width: isMobile ? '100%' : 'auto'
                    }} 
                  />
                  <input 
                    type="number" 
                    placeholder="Precio" 
                    value={newDish.price} 
                    onChange={e => setNewDish({ ...newDish, price: e.target.value })} 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '6px', 
                      border: '1px solid #bfa76a',
                      width: isMobile ? '100%' : '100px'
                    }} 
                  />
                  <select 
                    value={newDish.type} 
                    onChange={e => setNewDish({ ...newDish, type: e.target.value })} 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '6px', 
                      border: '1px solid #bfa76a',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                    <option value="desayuno">Desayuno</option>
                    <option value="almuerzo">Almuerzo</option>
                    <option value="cena">Cena</option>
                  </select>
                  <button className="btn btn-primary" type="submit"><FaPlus /> Agregar</button>
                </form>
                <div style={{display: 'flex', gap: '12px', marginBottom: '18px'}}>
                  <input 
                    type="text" 
                    placeholder="Buscar en Spoonacular..." 
                    value={search || ''} 
                    onChange={e => setSearch(e.target.value || '')} 
                    style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a'}} 
                  />
                  <button 
                    className="btn" 
                    type="button" 
                    onClick={handleSearchSpoonacular}
                    disabled={!search?.trim()}
                  >
                    Buscar
                  </button>
                </div>
                {spoonacularResults.length > 0 && (
                  <div style={{ marginBottom: '18px', background: '#f9f6f2', borderRadius: '10px', padding: '10px' }}>
                    <h5>Resultados de Spoonacular</h5>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {spoonacularResults.map((dish, i) => (
                        <li key={dish.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>{dish.name}</span> {/* Usar name normalizado */}
                          <input type="number" min="1" value={spoonacularPrices[dish.id]} onChange={e => setSpoonacularPrices(p => ({ ...p, [dish.id]: e.target.value }))} style={{width: '80px', marginLeft: '8px', marginRight: '8px', borderRadius: '6px', border: '1px solid #bfa76a', padding: '4px'}} placeholder="Precio" />
                          <select value={spoonacularTypes[dish.id]} onChange={e => setSpoonacularTypes(t => ({ ...t, [dish.id]: e.target.value }))} style={{marginRight: '8px', borderRadius: '6px', border: '1px solid #bfa76a', padding: '4px'}}>
                            <option value="desayuno">Desayuno</option>
                            <option value="almuerzo">Almuerzo</option>
                            <option value="cena">Cena</option>
                          </select>
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
                    <li key={order.id} style={{
                      background: '#fff', 
                      borderRadius: '10px', 
                      marginBottom: '8px', 
                      padding: isMobile ? '12px' : '10px 18px', 
                      boxShadow: '0 1px 4px #e3e6ea'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'stretch' : 'center',
                        gap: isMobile ? '10px' : '0'
                      }}>
                        <strong style={{
                          fontSize: isMobile ? '1.1em' : 'inherit',
                          textAlign: isMobile ? 'center' : 'left'
                        }}>Orden #{order.id} - Mesa {order.mesa || 'N/A'}</strong>
                        <button 
                          className="btn btn-outline-primary" 
                          onClick={() => handleReprintInvoice(order.id)}
                          style={{
                            width: isMobile ? '100%' : 'auto'
                          }}
                        >
                          Reimprimir Factura
                        </button>
                      </div>
                      <ul style={{
                        margin: '8px 0 0 0', 
                        padding: 0,
                        borderTop: '1px solid #eee',
                        marginTop: '12px',
                        paddingTop: '12px'
                      }}>
                        {order.dishes.map((dish, i) => (
                          <li key={i} style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            padding: '4px 0',
                            borderBottom: i < order.dishes.length - 1 ? '1px solid #f5f5f5' : 'none'
                          }}>
                            <span style={{marginBottom: isMobile ? '4px' : '0'}}>
                              {dish.name} <small style={{color: '#666'}}>({dish.type})</small>
                            </span>
                            <strong>${
                              (Number(dish.price) || 0).toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })
                            }</strong>
                          </li>
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
                  <input type="text" placeholder="Nombre" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <input type="email" placeholder="Correo" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <input type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }} />
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #bfa76a' }}>
                    <option value="administrador">Administrador</option>
                    <option value="mesero">Mesero</option>
                    <option value="cocina">Cocina</option>
                    <option value="cobrador">Cobrador</option>
                  </select>
                  <button className="btn btn-primary" type="submit"><FaPlus /> Agregar</button>
                </form>
                <ul style={{listStyle: 'none', padding: 0}}>
                  {users.map(user => (
                    <li key={user.id} style={{
                      background: '#fff', 
                      borderRadius: '10px', 
                      marginBottom: '8px', 
                      padding: isMobile ? '12px' : '10px 18px', 
                      boxShadow: '0 1px 4px #e3e6ea', 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center', 
                      justifyContent: 'space-between',
                      gap: isMobile ? '10px' : '0'
                    }}>
                      {editUserId === user.id ? (
                        <form onSubmit={handleUpdateUser} style={{
                          display: 'flex', 
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: '8px', 
                          alignItems: isMobile ? 'stretch' : 'center', 
                          flex: 1,
                          width: '100%'
                        }}>
                          <input 
                            type="text" 
                            value={editUser.name} 
                            onChange={e => setEditUser({ ...editUser, name: e.target.value })} 
                            placeholder="Nombre" 
                            style={{
                              padding: '6px', 
                              borderRadius: '6px', 
                              border: '1px solid #bfa76a',
                              width: isMobile ? '100%' : 'auto'
                            }} 
                          />
                          <input 
                            type="email" 
                            value={editUser.email} 
                            onChange={e => setEditUser({ ...editUser, email: e.target.value })} 
                            placeholder="Correo" 
                            style={{
                              padding: '6px', 
                              borderRadius: '6px', 
                              border: '1px solid #bfa76a',
                              width: isMobile ? '100%' : 'auto'
                            }} 
                          />
                          <input 
                            type="password" 
                            value={editUser.password} 
                            onChange={e => setEditUser({ ...editUser, password: e.target.value })} 
                            placeholder="Nueva contraseña (opcional)" 
                            style={{
                              padding: '6px', 
                              borderRadius: '6px', 
                              border: '1px solid #bfa76a',
                              width: isMobile ? '100%' : 'auto'
                            }} 
                          />
                          <select 
                            value={editUser.role} 
                            onChange={e => setEditUser({ ...editUser, role: e.target.value })} 
                            style={{
                              padding: '6px', 
                              borderRadius: '6px', 
                              border: '1px solid #bfa76a',
                              width: isMobile ? '100%' : 'auto'
                            }}>
                            <option value="administrador">Administrador</option>
                            <option value="mesero">Mesero</option>
                            <option value="cocina">Cocina</option>
                            <option value="cobrador">Cobrador</option>
                          </select>
                          <button className="btn btn-success" type="submit">Guardar</button>
                          <button className="btn btn-secondary" type="button" onClick={handleCancelEditUser}>Cancelar</button>
                        </form>
                      ) : (
                        <>
                          <span><strong>{user.name || user.nombre}</strong> <span style={{marginLeft: '8px', color: '#bfa76a'}}>{user.role || user.rol}</span></span>
                          <div>
                            <button className="btn btn-primary" style={{marginRight: '8px'}} onClick={() => handleEditUser(user)}>Editar</button>
                            <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)}><FaTrash /> Eliminar</button>
                          </div>
                        </>
                      )}
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
                    <li key={payment.id} style={{
                      background: '#fff', 
                      borderRadius: '10px', 
                      marginBottom: '8px', 
                      padding: isMobile ? '12px' : '10px 18px',
                      boxShadow: '0 1px 4px #e3e6ea'
                    }}>
                      <div style={{
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? '8px' : '0'
                      }}>
                        <div style={{width: isMobile ? '100%' : 'auto'}}>
                          <strong>Pago #{payment.id}</strong>
                          <span style={{
                            display: isMobile ? 'block' : 'inline',
                            marginLeft: isMobile ? '0' : '10px',
                            marginTop: isMobile ? '4px' : '0',
                            color: '#666',
                            fontSize: isMobile ? '0.9em' : 'inherit'
                          }}>
                            {new Date(payment.fecha || payment.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center',
                          gap: isMobile ? '8px' : '10px',
                          width: isMobile ? '100%' : 'auto'
                        }}>
                          <span style={{
                            background: payment.method === 'efectivo' ? '#4caf50' : '#2196f3',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            width: isMobile ? '100%' : 'auto',
                            textAlign: isMobile ? 'center' : 'left'
                          }}>
                            {payment.method === 'efectivo' ? '💵' : '💳'} {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                          </span>
                          <strong style={{
                            fontSize: '1.1em',
                            width: isMobile ? '100%' : 'auto',
                            textAlign: isMobile ? 'center' : 'right'
                          }}>${
                            (Number(payment.total) || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })
                          }</strong>
                        </div>
                      </div>
                      {payment.orden_id && (
                        <div style={{
                          marginTop: '8px', 
                          fontSize: '0.9em', 
                          color: '#666',
                          borderTop: isMobile ? '1px solid #eee' : 'none',
                          paddingTop: isMobile ? '8px' : '0'
                        }}>
                          Orden #{payment.orden_id} {payment.mesa && `- Mesa ${payment.mesa}`}
                        </div>
                      )}
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
        <div style={{ color: 'red', textAlign: 'center', marginTop: '40px', fontWeight: 700 }}>
          Error inesperado: {renderError.message || renderError.toString()}
        </div>
      )}
    </div>
  );
};

export default AdminScreen;