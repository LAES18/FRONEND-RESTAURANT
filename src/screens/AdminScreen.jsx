import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import './AdminScreen.css';
import './AdminDashboard.css';
import { FaUserCircle, FaPlus, FaTrash, FaSignOutAlt, FaUtensils, FaListAlt, FaUsers, FaMoneyCheckAlt, FaChartBar, FaFilter, FaPrint, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Navigate } from 'react-router-dom';

// Usar ruta relativa si VITE_API_URL está vacío
const API_URL = import.meta.env.VITE_API_URL || '';
const SPOONACULAR_API_KEY = '67ce982a724d41798877cf212f48d0de';

const AdminScreen = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Obtener datos del usuario actual
  const [userData] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  });
  const isSuperAdmin = userData.role === 'super_admin';
  
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
  const [dishes, setDishes] = useState([]);
  const [newDish, setNewDish] = useState({ name: '', price: '', type: 'desayuno', image_url: '' });
  const [editingDish, setEditingDish] = useState(null);
  const [editDish, setEditDish] = useState({ name: '', price: '', type: 'desayuno', image_url: '' });
  const [spoonacularResults, setSpoonacularResults] = useState([]);
  const [spoonacularTypes, setSpoonacularTypes] = useState({});
  const [spoonacularPrices, setSpoonacularPrices] = useState({});
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState({ date: '', month: '' });
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'administrador' });
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
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Estado para edición de usuario
  const [editUserId, setEditUserId] = useState(null);
  const [editUser, setEditUser] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'administrador' });

  useEffect(() => {
    fetchDishes();
    fetchUsers();
    fetchOrders();
    fetchPayments();
  }, []);

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
      // Enviar el rol del usuario actual para filtrar correctamente
      const res = await axios.get(`${API_URL}/api/users`, {
        params: { requestingUserRole: userData.role }
      });
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
      setNewDish({ name: '', price: '', type: 'principal', image_url: '' });
      fetchDishes();
      Swal.fire({ icon: 'success', title: 'Platillo agregado', text: 'Platillo agregado correctamente' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el platillo' });
    }
  };

  const handleEditDishStart = (dish) => {
    setEditingDish(dish.id);
    setEditDish({
      name: dish.name,
      price: dish.price,
      type: dish.type,
      image_url: dish.image_url || ''
    });
  };

  const handleEditDishCancel = () => {
    setEditingDish(null);
    setEditDish({ name: '', price: '', type: 'principal', image_url: '' });
  };

  const handleEditDishSave = async (dishId) => {
    if (!editDish.name || !editDish.price) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre y precio son obligatorios' });
      return;
    }
    try {
      await axios.put(`${API_URL}/api/dishes/${dishId}`, { ...editDish, price: Number(editDish.price) });
      setEditingDish(null);
      setEditDish({ name: '', price: '', type: 'principal', image_url: '' });
      fetchDishes();
      Swal.fire({ icon: 'success', title: 'Platillo actualizado', text: 'Platillo actualizado correctamente' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el platillo' });
    }
  };

  const handleExportDishesToExcel = () => {
    try {
      if (!dishes || dishes.length === 0) {
        Swal.fire('Advertencia', 'No hay platillos para exportar', 'warning');
        return;
      }
      
      const excelData = dishes.map(dish => ({
        'Nombre': dish.name,
        'Tipo': dish.type,
        'Precio': dish.price,
        'URL Imagen': dish.image_url || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Platillos');
      XLSX.writeFile(wb, `platillos-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      Swal.fire('Éxito', 'Platillos exportados correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire('Error', 'No se pudo exportar los platillos', 'error');
    }
  };

  const handleImportDishesFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        Swal.fire('Advertencia', 'El archivo Excel está vacío', 'warning');
        return;
      }
      
      // Mapear datos del Excel al formato esperado
      const dishesToImport = jsonData.map(row => ({
        name: row['Nombre'] || row['nombre'] || row['name'],
        type: row['Tipo'] || row['tipo'] || row['type'] || 'principal',
        price: parseFloat(row['Precio'] || row['precio'] || row['price']),
        image_url: row['URL Imagen'] || row['url_imagen'] || row['image_url'] || null
      }));
      
      // Validar datos
      const invalidRows = dishesToImport.filter(dish => !dish.name || !dish.price || isNaN(dish.price));
      if (invalidRows.length > 0) {
        Swal.fire('Error', `Hay ${invalidRows.length} filas con datos inválidos. Verifica que todas tengan nombre y precio válidos.`, 'error');
        return;
      }
      
      const result = await Swal.fire({
        title: `¿Importar ${dishesToImport.length} platillos?`,
        text: 'Los platillos se agregarán al menú existente',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, importar',
        cancelButtonText: 'Cancelar'
      });
      
      if (result.isConfirmed) {
        const response = await axios.post(`${API_URL}/api/dishes/bulk`, dishesToImport);
        fetchDishes();
        Swal.fire('Éxito', `${response.data.insertedCount} platillos importados correctamente`, 'success');
        event.target.value = ''; // Resetear input
      }
    } catch (error) {
      console.error('Error al importar:', error);
      const errorMsg = error.response?.data?.error || 'No se pudo importar los platillos';
      Swal.fire('Error', errorMsg, 'error');
      event.target.value = ''; // Resetear input
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
    if (!newUser.first_name || !newUser.email || !newUser.password) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre, email y contraseña son obligatorios' });
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/register`, newUser);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'administrador' });
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

  // Función para actualizar usuario
  const handleUpdateUser = async (userId) => {
    if (!editUser.name || !editUser.email) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre y email son obligatorios' });
      return;
    }
    
    try {
      const dataToSend = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        password: editUser.password || 'unchanged'
      };
      
      // Enviar el rol del usuario actual en la petición
      await axios.put(`${API_URL}/api/users/${userId}`, dataToSend, {
        params: { requestingUserRole: userData.role }
      });
      setEditUserId(null);
      setEditUser({ name: '', email: '', password: '', role: 'administrador' });
      fetchUsers();
      Swal.fire({ icon: 'success', title: 'Usuario actualizado', text: 'Usuario actualizado correctamente' });
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al actualizar usuario';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
    }
  };

  // Función para cancelar edición
  const handleCancelEditUser = () => {
    setEditUserId(null);
    setEditUser({ name: '', email: '', password: '', role: 'administrador' });
  };

  // Función para generar PDF de factura
  const generateInvoicePDF = (order) => {
    const ticketWidth = 210;
    const margin = 10;
    const lineHeight = 14;  // Aumentado de 13 a 14 para mejor espaciado
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [ticketWidth, 700]  // Aumentado de 600 a 700 para más espacio
    });
    
    let y = margin + 8;
    
    // Encabezado
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RestoSmart', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('FACTURA SIMPLIFICADA', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;
    
    doc.setLineWidth(0.7);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 10;
    
    // Datos generales
    const now = new Date();
    const fecha = now.toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const hora = now.toLocaleTimeString('es-GT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const recibo = order.daily_order_number ? `#${order.daily_order_number}` : (order.id ? `#${order.id}` : '');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recibo: ${recibo}`, margin, y);
    y += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Fecha: ${fecha}`, margin, y);
    y += lineHeight - 2;
    doc.text(`Hora: ${hora}`, margin, y);
    y += lineHeight - 2;
    doc.text(`Mesa: ${order.mesa || 'N/A'}`, margin, y);
    y += lineHeight - 2;
    
    // Mesero
    if (order.waiter_name) {
      doc.text(`Mesero: ${order.waiter_name}`, margin, y);
      y += lineHeight - 2;
    }
    
    y += 3;
    doc.setLineWidth(0.5);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Dine In', margin, y);
    y += lineHeight;
    
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 10;
    
    // Platillos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    if (order.dishes && order.dishes.length > 0) {
      order.dishes.forEach(dish => {
        // Nombre del plato (puede ocupar múltiples líneas si es largo)
        const dishName = dish.name || 'Sin nombre';
        const maxWidth = ticketWidth - margin - 50; // Espacio para el precio
        const lines = doc.splitTextToSize(dishName, maxWidth);
        
        doc.text(lines, margin, y);
        doc.text(`Q${parseFloat(dish.price).toFixed(2)}`, ticketWidth - margin, y, { align: 'right' });
        
        // Ajustar y según el número de líneas
        y += (lines.length * (lineHeight - 4)) + 3;
      });
    }
    
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 12;
    
    // Total
    const total = order.total || (order.dishes ? order.dishes.reduce((sum, d) => sum + parseFloat(d.price || 0), 0) : 0);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', margin, y);
    doc.text(`Q${parseFloat(total).toFixed(2)}`, ticketWidth - margin, y, { align: 'right' });
    y += lineHeight + 4;
    
    doc.setLineWidth(0.7);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 12;
    
    // IVA (12% para Guatemala)
    const baseImp = (total / 1.12);
    const cuota = total - baseImp;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Base Imponible (IVA 12%)`, margin, y);
    doc.text(`Q${baseImp.toFixed(2)}`, ticketWidth - margin, y, { align: 'right' });
    y += lineHeight - 3;
    doc.text(`Cuota IVA (12%)`, margin, y);
    doc.text(`Q${cuota.toFixed(2)}`, ticketWidth - margin, y, { align: 'right' });
    y += lineHeight + 6;
    
    // Pie de página
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('¡Gracias por su visita!', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight - 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('RestoSmart - Sistema de Gestión', ticketWidth / 2, y, { align: 'center' });
    
    doc.save(`factura-orden-${order.daily_order_number || order.id}.pdf`);
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
        console.error('Error al eliminar usuario:', err);
        
        // Verificar si es debido a órdenes asociadas
        if (err.response?.status === 400 && err.response?.data?.order_count) {
          const orderCount = err.response.data.order_count;
          Swal.fire({
            icon: 'warning',
            title: 'No se puede eliminar',
            html: `<p>Este usuario tiene <strong>${orderCount}</strong> ${orderCount === 1 ? 'orden asociada' : 'órdenes asociadas'}.</p><p style="font-size: 0.9em; color: #666; margin-top: 10px;">Elimina primero las órdenes o asígnalas a otro usuario.</p>`,
            confirmButtonText: 'Entendido'
          });
        } else {
          const errorMsg = err.response?.data?.error || 'No se pudo eliminar el usuario';
          Swal.fire({ icon: 'error', title: 'Error', text: errorMsg });
        }
      }
    }
  };

  // Función para eliminar orden
  const handleDeleteOrder = async (orderId, orderNumber) => {
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      html: `<p>Se eliminará la orden <strong>#${orderNumber}</strong> y todos sus registros asociados.</p><p style="color: #d33; font-size: 0.9em; margin-top: 10px;">Esta acción no se puede deshacer.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });
    
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/orders/${orderId}`);
        fetchOrders();
        Swal.fire({ 
          icon: 'success', 
          title: 'Eliminada', 
          text: 'Orden eliminada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Error al eliminar orden:', err);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: err.response?.data || 'No se pudo eliminar la orden' 
        });
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
      let dateParam = reportDate;
      // Si es mensual y el formato es YYYY-MM, agregar día para el backend
      if (type === 'mensual' && reportDate.length === 7) {
        dateParam = `${reportDate}-01`;
      }
      
      const url = `${API_URL}/api/payments/report?type=${type}&date=${dateParam}`;
      const res = await axios.get(url);
      setReport(res.data);
      
      if (!res.data.datos || res.data.datos.length === 0) {
        Swal.fire('Info', 'No hay datos para el período seleccionado', 'info');
      }
    } catch (err) {
      console.error('Error al generar reporte:', err);
      Swal.fire('Error', 'No se pudo generar el reporte', 'error');
      setReport([]);
    }
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
      if (!report.datos || report.datos.length === 0) {
        Swal.fire('Advertencia', 'No hay datos para exportar', 'warning');
        return;
      }
      
      // Crear array plano con todos los datos para exportar
      const excelData = [];
      
      report.datos.forEach(dia => {
        dia.ordenes.forEach(orden => {
          orden.productos.forEach(producto => {
            excelData.push({
              'Fecha': new Date(dia.fecha + 'T12:00:00').toLocaleDateString('es-GT'),
              'Orden #': orden.daily_order_number || orden.order_id,
              'Mesa': orden.mesa,
              'Mesero': orden.mesero,
              'Producto': producto.nombre,
              'Precio Producto': producto.precio,
              'Tipo': producto.tipo,
              'Método Pago': orden.method === 'efectivo' ? 'Efectivo' : 'Tarjeta',
              'Total Orden': orden.total
            });
          });
        });
      });
      
      // Agregar fila de totales al final
      excelData.push({
        'Fecha': '',
        'Orden #': '',
        'Mesa': '',
        'Mesero': '',
        'Producto': 'TOTAL GENERAL',
        'Precio Producto': '',
        'Tipo': '',
        'Método Pago': '',
        'Total Orden': report.totalGeneral
      });
      
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Reporte-${reportType}`);
      XLSX.writeFile(wb, `reporte-${reportType}-${report.date || new Date().toISOString().split('T')[0]}.xlsx`);
      
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
      <div className="admin-screen">
        {/* Header estandarizado */}
        <header className="admin-header">
          <div className="admin-header-content">
            <div className="admin-logo-section">
              <div className="admin-logo">
                <FaUserCircle />
              </div>
              <div className="admin-title-section">
                <h1>Panel de Administración</h1>
                <p>Sistema de Gestión del Restaurante</p>
              </div>
            </div>
            <button className="admin-logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="admin-container">
          {/* Navigation tabs moderna */}
          <nav className="admin-nav-tabs">
            <button 
              className={`admin-nav-tab ${activeMenu === 'platillos' ? 'active' : ''}`}
              onClick={() => setActiveMenu('platillos')}
            >
              <FaUtensils />
              <span>Platillos</span>
            </button>
            <button 
              className={`admin-nav-tab ${activeMenu === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveMenu('usuarios')}
            >
              <FaUsers />
              <span>Usuarios</span>
            </button>
            <button 
              className={`admin-nav-tab ${activeMenu === 'ordenes' ? 'active' : ''}`}
              onClick={() => setActiveMenu('ordenes')}
            >
              <FaListAlt />
              <span>Órdenes</span>
            </button>
            <button 
              className={`admin-nav-tab ${activeMenu === 'pagos' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pagos')}
            >
              <FaMoneyCheckAlt />
              <span>Pagos & Reportes</span>
            </button>
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
            <div className="admin-content">
              <div className="admin-section-header">
                <h2>
                  <FaUtensils />
                  Gestión de Platillos
                </h2>
              </div>
              
              {/* Formulario Agregar Platillo */}
              <form onSubmit={handleAddDishForm} className="admin-form">
                <div className="admin-form-row">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Nombre del platillo"
                    value={newDish.name}
                    onChange={(e) => setNewDish({...newDish, name: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="admin-input"
                    placeholder="Precio"
                    value={newDish.price}
                    onChange={(e) => setNewDish({...newDish, price: e.target.value})}
                    required
                  />
                  <select
                    className="admin-select"
                    value={newDish.type}
                    onChange={(e) => setNewDish({...newDish, type: e.target.value})}
                  >
                    <option value="desayuno">Desayuno</option>
                    <option value="almuerzo">Almuerzo</option>
                    <option value="cena">Cena</option>
                    <option value="bebida">Bebida</option>
                    <option value="postre">Postre</option>
                  </select>
                  <input
                    type="url"
                    className="admin-input"
                    placeholder="URL de imagen (opcional)"
                    value={newDish.image_url}
                    onChange={(e) => setNewDish({...newDish, image_url: e.target.value})}
                  />
                  <button type="submit" className="admin-btn-primary">
                    <FaPlus />
                    Agregar
                  </button>
                </div>
              </form>

              {/* Botones de Exportar/Importar Excel */}
              <div style={{marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <button
                  type="button"
                  className="admin-btn-success"
                  onClick={handleExportDishesToExcel}
                >
                  <FaDownload style={{marginRight: '0.5rem'}} />
                  Exportar a Excel
                </button>
                <label className="admin-btn-primary" style={{cursor: 'pointer', margin: 0}}>
                  <FaPlus style={{marginRight: '0.5rem'}} />
                  Importar desde Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    style={{display: 'none'}}
                    onChange={handleImportDishesFromExcel}
                  />
                </label>
                <span style={{fontSize: '0.85rem', color: '#666', alignSelf: 'center'}}>
                  * El Excel debe tener columnas: Nombre, Tipo, Precio, URL Imagen (opcional)
                </span>
              </div>

              {/* Búsqueda con Spoonacular */}
              <div style={{marginBottom: '2rem'}}>
                <div className="admin-form-row" style={{gridTemplateColumns: '2fr 1fr'}}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Buscar recetas en Spoonacular..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={handleSpoonacularSearch}
                  >
                    🔍 Buscar Recetas
                  </button>
                </div>
              </div>

                {/* Resultados de Spoonacular */}
                {spoonacularResults.length > 0 && (
                  <div style={{marginBottom: '2.5rem'}}>
                    <h4 style={{color: '#8b4513', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700}}>Recetas Encontradas</h4>
                    <div className="admin-grid-4">
                      {spoonacularResults.map((recipe) => (
                        <div key={recipe.id} style={{
                          background: 'white',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}>
                          <img 
                            src={recipe.image} 
                            alt={recipe.title}
                            style={{width: '100%', height: '180px', objectFit: 'cover'}}
                          />
                          <div style={{padding: '1rem'}}>
                            <h6 style={{marginBottom: '1rem', color: '#333'}}>{recipe.title}</h6>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem'}}>
                              <select
                                className="admin-select"
                                value={spoonacularTypes[recipe.id] || 'desayuno'}
                                onChange={(e) => setSpoonacularTypes({
                                  ...spoonacularTypes,
                                  [recipe.id]: e.target.value
                                })}
                                style={{padding: '0.5rem'}}
                              >
                                <option value="desayuno">Desayuno</option>
                                <option value="almuerzo">Almuerzo</option>
                                <option value="cena">Cena</option>
                                <option value="bebida">Bebida</option>
                                <option value="postre">Postre</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                className="admin-input"
                                placeholder="Precio"
                                value={spoonacularPrices[recipe.id] || ''}
                                onChange={(e) => setSpoonacularPrices({
                                  ...spoonacularPrices,
                                  [recipe.id]: e.target.value
                                })}
                                style={{padding: '0.5rem'}}
                              />
                            </div>
                            <button
                              className="admin-btn-success"
                              onClick={() => handleAddFromSpoonacular(recipe)}
                              style={{width: '100%', fontSize: '0.85rem', padding: '0.625rem'}}
                            >
                              Agregar al Menú
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Platillos */}
                <div>
                  <h4 style={{color: '#8b4513', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700}}>Platillos Actuales</h4>
                  {dishes.length === 0 ? (
                    <div className="admin-empty-state">
                      <FaUtensils />
                      <p>No hay platillos registrados</p>
                    </div>
                  ) : (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Precio</th>
                            <th style={{textAlign: 'center'}}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dishes.map((dish) => (
                            <tr key={dish.id}>
                              <td>
                                {dish.image_url ? (
                                  <img 
                                    src={dish.image_url} 
                                    alt={dish.name}
                                    style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div style={{width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999'}}>
                                    <FaUtensils />
                                  </div>
                                )}
                              </td>
                              {editingDish === dish.id ? (
                                <>
                                  <td>
                                    <input
                                      type="text"
                                      className="admin-input"
                                      value={editDish.name}
                                      onChange={(e) => setEditDish({...editDish, name: e.target.value})}
                                      style={{margin: 0}}
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="admin-select"
                                      value={editDish.type}
                                      onChange={(e) => setEditDish({...editDish, type: e.target.value})}
                                      style={{margin: 0}}
                                    >
                                      <option value="desayuno">Desayuno</option>
                                      <option value="almuerzo">Almuerzo</option>
                                      <option value="cena">Cena</option>
                                      <option value="bebida">Bebida</option>
                                      <option value="postre">Postre</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="admin-input"
                                      value={editDish.price}
                                      onChange={(e) => setEditDish({...editDish, price: e.target.value})}
                                      style={{margin: 0}}
                                    />
                                  </td>
                                  <td style={{textAlign: 'center'}}>
                                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                                      <button
                                        className="admin-btn-success"
                                        onClick={() => handleEditDishSave(dish.id)}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        ✓ Guardar
                                      </button>
                                      <button
                                        className="admin-btn-secondary"
                                        onClick={handleEditDishCancel}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        ✕ Cancelar
                                      </button>
                                    </div>
                                    <input
                                      type="url"
                                      className="admin-input"
                                      placeholder="URL de imagen"
                                      value={editDish.image_url}
                                      onChange={(e) => setEditDish({...editDish, image_url: e.target.value})}
                                      style={{marginTop: '0.5rem', fontSize: '0.8rem'}}
                                    />
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td style={{fontWeight: 600}}>{dish.name}</td>
                                  <td>
                                    <span className="admin-badge admin-badge-primary">
                                      {dish.type}
                                    </span>
                                  </td>
                                  <td style={{fontWeight: 700, color: '#b85c00'}}>Q{dish.price}</td>
                                  <td style={{textAlign: 'center'}}>
                                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                                      <button
                                        className="admin-btn-secondary"
                                        onClick={() => handleEditDishStart(dish)}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        ✏️ Editar
                                      </button>
                                      <button
                                        className="admin-btn-danger"
                                        onClick={() => handleDeleteDish(dish.id)}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* SECCIÓN USUARIOS */}
          {!loading && !error && activeMenu === 'usuarios' && (
            <div className="admin-content">
              <div className="admin-section-header">
                <h2>
                  <FaUsers />
                  Gestión de Usuarios
                </h2>
                {!isSuperAdmin && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    borderLeft: '4px solid #ffc107',
                    marginBottom: '1rem',
                    borderRadius: '4px'
                  }}>
                    <p style={{margin: 0, color: '#856404', fontSize: '0.9rem'}}>
                      ℹ️ Como Administrador, puedes visualizar y editar usuarios, pero solo los Super Administradores pueden agregar o eliminar usuarios del sistema.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Formulario Agregar Usuario - Solo para Super Admin */}
              {isSuperAdmin && (
                <form onSubmit={handleAddUserForm} className="admin-form">
                  <div className="admin-form-row" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'}}>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Nombre"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Apellido"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    />
                    <input
                      type="email"
                      className="admin-input"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                    <input
                      type="password"
                      className="admin-input"
                      placeholder="Contraseña"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                    <select
                      className="admin-select"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="super_admin">Super Administrador</option>
                      <option value="administrador">Administrador</option>
                      <option value="cajero">Cajero</option>
                      <option value="mesero">Mesero</option>
                      <option value="cocinero">Cocinero</option>
                    </select>
                    <button type="submit" className="admin-btn-primary">
                      <FaPlus />
                      Agregar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Usuarios */}
              <div>
                <h4 style={{color: '#8b4513', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700}}>Usuarios del Sistema</h4>
                {users.length === 0 ? (
                  <div className="admin-empty-state">
                    <FaUsers />
                    <p>No hay usuarios registrados</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th style={{textAlign: 'center'}}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            {editUserId === user.id ? (
                              <>
                                <td>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    value={editUser.name}
                                    onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                                    style={{margin: 0}}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="email"
                                    className="admin-input"
                                    value={editUser.email}
                                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                                    style={{margin: 0}}
                                  />
                                </td>
                                <td>
                                  {isSuperAdmin ? (
                                    <select
                                      className="admin-select"
                                      value={editUser.role}
                                      onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                                      style={{margin: 0}}
                                    >
                                      <option value="super_admin">Super Administrador</option>
                                      <option value="administrador">Administrador</option>
                                      <option value="cajero">Cajero</option>
                                      <option value="mesero">Mesero</option>
                                      <option value="cocinero">Cocinero</option>
                                    </select>
                                  ) : (
                                    <span className="admin-badge admin-badge-primary">
                                      {editUser.role}
                                    </span>
                                  )}
                                </td>
                                <td style={{textAlign: 'center'}}>
                                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'}}>
                                    <input
                                      type="password"
                                      className="admin-input"
                                      placeholder="Nueva contraseña (opcional)"
                                      value={editUser.password}
                                      onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                                      style={{margin: 0, fontSize: '0.85rem'}}
                                    />
                                    <div style={{display: 'flex', gap: '0.5rem'}}>
                                      <button
                                        className="admin-btn-success"
                                        onClick={() => handleUpdateUser(user.id)}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        ✓ Guardar
                                      </button>
                                      <button
                                        className="admin-btn-secondary"
                                        onClick={handleCancelEditUser}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        ✕ Cancelar
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{fontWeight: 600}}>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                  <span className="admin-badge admin-badge-primary">
                                    {user.role}
                                  </span>
                                </td>
                                <td style={{textAlign: 'center'}}>
                                  <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                                    <button
                                      className="admin-btn-secondary"
                                      onClick={() => handleEditUser(user)}
                                      style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                    >
                                      ✏️ Editar
                                    </button>
                                    {isSuperAdmin && (
                                      <button
                                        className="admin-btn-danger"
                                        onClick={() => handleDeleteUser(user.id)}
                                        style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                                      >
                                        <FaTrash />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN ÓRDENES */}
          {!loading && !error && activeMenu === 'ordenes' && (
            <div className="admin-content">
              <div className="admin-section-header">
                <h2>
                  <FaListAlt />
                  Órdenes del Restaurante
                </h2>
              </div>
              
              {/* Filtros de Órdenes */}
              <div className="admin-form" style={{marginBottom: '2rem'}}>
                <div className="admin-form-row" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#666'}}>
                      <FaFilter style={{marginRight: '0.5rem'}} />
                      Filtrar por fecha:
                    </label>
                    <input
                      type="date"
                      className="admin-input"
                      value={orderFilter.date}
                      onChange={(e) => setOrderFilter({...orderFilter, date: e.target.value, month: ''})}
                      placeholder="Selecciona una fecha"
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#666'}}>
                      <FaFilter style={{marginRight: '0.5rem'}} />
                      Filtrar por mes:
                    </label>
                    <input
                      type="month"
                      className="admin-input"
                      value={orderFilter.month}
                      onChange={(e) => setOrderFilter({...orderFilter, month: e.target.value, date: ''})}
                      placeholder="Selecciona un mes"
                    />
                  </div>
                  <div style={{display: 'flex', alignItems: 'flex-end'}}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setOrderFilter({date: '', month: ''})}
                      style={{width: '100%'}}
                    >
                      <FaFilter />
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Órdenes */}
              <div>
                <h4 style={{color: '#8b4513', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700}}>Órdenes Registradas</h4>
                {orders.length === 0 ? (
                  <div className="admin-empty-state">
                    <FaListAlt />
                    <p>No hay órdenes registradas</p>
                  </div>
                ) : (
                  <div className="admin-grid-3">
                    {orders.map((order) => (
                      <div key={order.id} className="admin-order-card">
                        <div className="admin-order-card-header">
                          <h5>Orden #{order.daily_order_number || order.id}</h5>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end'}}>
                            <span className="admin-badge admin-badge-primary">
                              Mesa {order.mesa || 'N/A'}
                            </span>
                            {order.waiter_name && (
                              <span style={{fontSize: '0.75rem', color: '#666', fontWeight: 500}}>
                                Mesero: {order.waiter_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="admin-order-card-body">
                          {order.dishes.map((dish, index) => (
                            <div key={index} className="admin-order-item">
                              <div>
                                <div className="admin-order-item-name">{dish.name}</div>
                                <div className="admin-order-item-type">{dish.type}</div>
                              </div>
                              <span className="admin-order-item-price">Q{dish.price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="admin-order-card-footer">
                          <div className="admin-order-total">
                            Total: Q{order.total ? parseFloat(order.total).toFixed(2) : '0.00'}
                          </div>
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button
                              className="admin-btn-secondary"
                              onClick={() => handleReprintInvoice(order.id)}
                              style={{padding: '0.625rem 1.25rem', fontSize: '0.9rem'}}
                            >
                              <FaPrint />
                              <span style={{marginLeft: '0.5rem'}}>Reimprimir</span>
                            </button>
                            <button
                              className="admin-btn-danger"
                              onClick={() => handleDeleteOrder(order.id, order.daily_order_number || order.id)}
                              style={{padding: '0.625rem 1.25rem', fontSize: '0.9rem'}}
                              title="Eliminar orden"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN PAGOS Y REPORTES */}
          {!loading && !error && activeMenu === 'pagos' && (
            <div className="admin-content">
              <div className="admin-section-header">
                <h2>
                  <FaMoneyCheckAlt />
                  Pagos y Reportes
                </h2>
              </div>
              
              {/* Filtros de Pagos */}
              <div className="admin-form" style={{marginBottom: '2rem'}}>
                <div className="admin-form-row" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#666'}}>
                      <FaFilter style={{marginRight: '0.5rem'}} />
                      Filtrar por fecha:
                    </label>
                    <input
                      type="date"
                      className="admin-input"
                      value={paymentFilter.date}
                      onChange={(e) => setPaymentFilter({...paymentFilter, date: e.target.value, month: ''})}
                      placeholder="Selecciona una fecha"
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#666'}}>
                      <FaFilter style={{marginRight: '0.5rem'}} />
                      Filtrar por mes:
                    </label>
                    <input
                      type="month"
                      className="admin-input"
                      value={paymentFilter.month}
                      onChange={(e) => setPaymentFilter({...paymentFilter, month: e.target.value, date: ''})}
                      placeholder="Selecciona un mes"
                    />
                  </div>
                  <div style={{display: 'flex', alignItems: 'flex-end'}}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setPaymentFilter({date: '', month: ''})}
                      style={{width: '100%'}}
                    >
                      <FaFilter />
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Pagos */}
              <div style={{marginBottom: '3rem'}}>
                <h4 style={{color: '#8b4513', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700}}>Historial de Pagos</h4>
                {payments.length === 0 ? (
                  <div className="admin-empty-state">
                    <FaMoneyCheckAlt />
                    <p>No hay pagos registrados</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Pago ID</th>
                          <th>Orden</th>
                          <th>Mesa</th>
                          <th>Mesero</th>
                          <th>Método</th>
                          <th>Total</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td style={{fontWeight: 600}}>#{payment.id}</td>
                            <td>{payment.order_id ? `#${payment.order_id}` : 'N/A'}</td>
                            <td>{payment.mesa || 'N/A'}</td>
                            <td>{payment.waiter_name || 'N/A'}</td>
                            <td>
                              <span className={`admin-badge ${payment.method === 'efectivo' ? 'admin-badge-success' : 'admin-badge-primary'}`}>
                                {payment.method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                              </span>
                            </td>
                            <td style={{fontWeight: 700, color: '#b85c00'}}>Q{payment.total}</td>
                            <td>{new Date(payment.paid_at).toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sección de Reportes */}
              <div style={{paddingTop: '2rem', borderTop: '2px solid #f0f0f0'}}>
                <h4 style={{color: '#8b4513', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700}}>Reportes de Ventas</h4>
                
                <div className="admin-form-row" style={{gridTemplateColumns: '1fr 1fr 2fr', marginBottom: '2rem'}}>
                  <div>
                    <label className="admin-label">Tipo de Reporte</label>
                    <select
                      className="admin-select"
                      value={reportType}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        // Ajustar formato de fecha según tipo
                        if (e.target.value === 'mensual') {
                          const today = new Date();
                          setReportDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
                        } else {
                          setReportDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                    >
                      <option value="diario">Reporte Diario</option>
                      <option value="mensual">Reporte Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">{reportType === 'mensual' ? 'Seleccionar Mes' : 'Seleccionar Día'}</label>
                    <input
                      type={reportType === 'mensual' ? 'month' : 'date'}
                      className="admin-input"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                    />
                  </div>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => handleReport(reportType)}
                    >
                      <FaChartBar />
                      Generar Reporte
                    </button>
                    {report.datos && report.datos.length > 0 && (
                      <button
                        type="button"
                        className="admin-btn-success"
                        onClick={handleExportToExcel}
                      >
                        <FaDownload />
                        Exportar Excel
                      </button>
                    )}
                  </div>
                </div>

                {/* Resultados del Reporte */}
                {report.datos && report.datos.length > 0 && (
                  <div>
                    <div style={{backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                      <h5 style={{color: '#8b4513', marginBottom: '0.5rem'}}>Resumen del Reporte {reportType === 'diario' ? 'Diario' : 'Mensual'}</h5>
                      <div style={{display: 'flex', gap: '2rem', marginTop: '1rem'}}>
                        <div>
                          <span style={{color: '#666', fontSize: '0.9rem'}}>Total General:</span>
                          <span style={{fontWeight: 700, fontSize: '1.3rem', color: '#28a745', marginLeft: '0.5rem'}}>
                            Q{parseFloat(report.totalGeneral).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                        <div>
                          <span style={{color: '#666', fontSize: '0.9rem'}}>Total Órdenes:</span>
                          <span style={{fontWeight: 700, fontSize: '1.3rem', color: '#007bff', marginLeft: '0.5rem'}}>
                            {report.datos.reduce((sum, dia) => sum + dia.numeroOrdenes, 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {report.datos.map((dia, diaIndex) => (
                      <div key={diaIndex} style={{marginBottom: '2rem', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden'}}>
                        <div style={{backgroundColor: '#8b4513', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <h6 style={{margin: 0, fontSize: '1.1rem'}}>
                            📅 {new Date(dia.fecha + 'T12:00:00').toLocaleDateString('es-GT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h6>
                          <div style={{display: 'flex', gap: '1.5rem'}}>
                            <span>Órdenes: <strong>{dia.numeroOrdenes}</strong></span>
                            <span>Total: <strong>Q{dia.totalDia.toFixed(2)}</strong></span>
                          </div>
                        </div>
                        
                        <div style={{padding: '1rem'}}>
                          {dia.ordenes.map((orden, ordenIndex) => (
                            <div key={ordenIndex} style={{marginBottom: '1.5rem', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '6px'}}>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '2px solid #dee2e6', paddingBottom: '0.5rem'}}>
                                <div>
                                  <strong style={{fontSize: '1.1rem', color: '#8b4513'}}>Orden #{orden.daily_order_number || orden.order_id}</strong>
                                  <span style={{marginLeft: '1rem', color: '#666'}}>Mesa: {orden.mesa}</span>
                                  <span style={{marginLeft: '1rem', color: '#666'}}>Mesero: {orden.mesero}</span>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                  <span style={{marginRight: '1rem', padding: '0.25rem 0.75rem', backgroundColor: orden.method === 'efectivo' ? '#28a745' : '#007bff', color: 'white', borderRadius: '4px', fontSize: '0.85rem'}}>
                                    {orden.method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                                  </span>
                                  <strong style={{fontSize: '1.2rem', color: '#28a745'}}>Q{orden.total.toFixed(2)}</strong>
                                </div>
                              </div>
                              
                              <div style={{marginTop: '0.8rem'}}>
                                <strong style={{fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', display: 'block'}}>Productos vendidos:</strong>
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem'}}>
                                  {orden.productos.map((prod, prodIndex) => (
                                    <div key={prodIndex} style={{display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e0e0e0'}}>
                                      <span style={{fontSize: '0.9rem'}}>{prod.nombre}</span>
                                      <span style={{fontWeight: 600, color: '#b85c00'}}>Q{prod.precio.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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