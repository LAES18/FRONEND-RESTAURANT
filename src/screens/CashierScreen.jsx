import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  FaMoneyBillAlt, 
  FaCreditCard, 
  FaReceipt, 
  FaSignOutAlt, 
  FaCheck, 
  FaTimes, 
  FaClock,
  FaDollarSign,
  FaPrint
} from 'react-icons/fa';
import './CashierScreen.css';

// Asegúrate que todos los endpoints usen /api/ como prefijo, igual que en Railway.
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://backend-restaurant-production-b56f.up.railway.app';

const CashierScreen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [error, setError] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  // Manejar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchOrders = () => {
      axios.get(`${API_URL}/api/orders?status=servido`)
        .then(response => {
          setOrders(response.data);
        })
        .catch(error => console.error('Error fetching orders:', error));
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectOrder = (order) => {
    setSelectedOrders(prev => {
      if (prev.includes(order)) {
        return prev.filter(o => o.id !== order.id);
      } else {
        return [...prev, order];
      }
    });
  };

  const calculateTotal = () => {
    return selectedOrders.reduce((sum, order) => {
      return sum + order.dishes.reduce((dishSum, dish) => dishSum + parseFloat(dish.price || 0), 0);
    }, 0).toFixed(2);
  };

  const handlePayment = () => {
    if (selectedOrders.length === 0) {
      Swal.fire({icon: 'warning', title: 'Sin selección', text: 'Selecciona al menos una orden para procesar el pago.'});
      return;
    }
    setError('');

    const paymentData = selectedOrders.map(order => ({
      order_id: order.id,
      total: order.dishes.reduce((sum, dish) => sum + parseFloat(dish.price || 0), 0),
      method: paymentMethod,
    }));

    axios.post(`${API_URL}/api/payments`, paymentData)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Pago procesado exitosamente',
          showConfirmButton: false,
          timer: 1500
        });
        setOrders(orders.filter(order => !selectedOrders.includes(order)));
        setLastInvoice(selectedOrders);
        handleDownloadInvoice(selectedOrders); // Descargar factura automáticamente
        setSelectedOrders([]);
      })
      .catch(error => {
        console.error('Error al procesar el pago:', error);
        setError('Error al procesar el pago.');
      });
  };

  const handleDownloadInvoice = (ordersToPrint) => {
    const ticketWidth = 156; // 55mm en puntos (1mm ≈ 2.83pt)
    const margin = 8;
    const lineHeight = 13;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [ticketWidth, 600]
    });
    let y = margin + 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RestoSmart', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('FACTURA SIMPLIFICADA', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight;
    doc.setLineWidth(0.7);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 7;
    // Datos generales
    const now = new Date();
    const fecha = now.toLocaleDateString() + ' ' + now.toLocaleTimeString().slice(0,5);
    const recibo = ordersToPrint[0]?.id ? `#${ordersToPrint[0].id}` : '';
    doc.setFontSize(8);
    doc.text(`Recibo ${recibo}`, margin, y);
    y += lineHeight - 3;
    doc.text(`Fecha: ${fecha}`, margin, y);
    y += lineHeight - 3;
    doc.text(`Cajero: Cobrador`, margin, y);
    y += lineHeight - 3;
    doc.text(`TPV: POS 1`, margin, y);
    y += lineHeight;
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Dine In', margin, y);
    doc.setFont('helvetica', 'normal');
    y += lineHeight - 3;
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 6;
    // Platillos
    ordersToPrint.forEach(order => {
      order.dishes.forEach(dish => {
        doc.text(`${dish.name}`, margin, y);
        doc.text(`${parseFloat(dish.price).toFixed(2)}`, ticketWidth - margin, y, { align: 'right' });
        y += lineHeight - 5;
      });
    });
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 8;
    // Total
    const total = ordersToPrint.reduce((sum, order) => sum + order.dishes.reduce((dsum, d) => dsum + parseFloat(d.price || 0), 0), 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total', margin, y);
    doc.text(total.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(capitalize(paymentMethod), margin, y);
    doc.text(total.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight - 3;
    // IGIC/IVA ejemplo (7%)
    const baseImp = (total / 1.07);
    const cuota = total - baseImp;
    doc.setFontSize(7.5);
    doc.text(`IGIC 7%, base imp`, margin, y);
    doc.text(baseImp.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight - 7;
    doc.text(`IGIC 7%, cuota`, margin, y);
    doc.text(cuota.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight - 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('¡Gracias por su compra!', ticketWidth / 2, y, { align: 'center' });
    doc.save('factura.pdf');
  };

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

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
      popup: 'swal2-popup-restosmart'
    },
    buttonsStyling: false,
    color: '#343a40',
    background: '#fff8e1',
    confirmButtonColor: '#b85c00',
    cancelButtonColor: '#bfa76a',
    iconColor: '#b85c00',
  }).bind(Swal);

  return (
    <div 
      className="cashier-container min-vh-100"
      style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Header elegante modernizado */}
      <header 
        className="position-sticky top-0 py-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="container">
          <div className={`${isMobile ? 'd-grid gap-3' : 'd-flex justify-content-between align-items-center'}`}>
            <div className={`${isMobile ? 'text-center' : 'd-flex align-items-center'}`}>
              <div 
                className={`${isMobile ? 'mb-3' : 'me-4'} d-inline-flex align-items-center justify-content-center`}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <FaDollarSign className="text-white" size={35} />
              </div>
              <div>
                <h1 
                  className="text-white fw-bold mb-2"
                  style={{
                    fontSize: isMobile ? '1.8rem' : '2.5rem',
                    textShadow: '0 3px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  RestoSmart Caja
                </h1>
                <p 
                  className="text-white-50 mb-0"
                  style={{
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    fontWeight: '300'
                  }}
                >
                  Sistema de Pagos y Facturación
                </p>
              </div>
            </div>
            <button 
              className={`btn btn-lg border-0 ${isMobile ? 'w-100' : ''}`}
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                borderRadius: '15px',
                padding: '12px 25px',
                fontWeight: '600',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FaSignOutAlt className="me-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container-fluid px-4">
        {/* Panel de estadísticas elegante */}
        <div className="row g-4 mb-4">
          {/* Estadística de órdenes pendientes */}
          <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
            <div className="card border-0 h-100" style={{
              background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05))',
              borderRadius: '20px',
              border: '2px solid rgba(40, 167, 69, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body text-center py-4">
                <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  width: '70px',
                  height: '70px'
                }}>
                  <FaCreditCard size={isMobile ? 20 : 24} />
                </div>
                <h2 className="fw-bold mb-1" style={{color: '#28a745', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                  {orders.length}
                </h2>
                <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                  Pendientes
                </h6>
                <small className="text-muted">Por cobrar</small>
              </div>
            </div>
          </div>

          {/* Estadística de órdenes seleccionadas */}
          <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
            <div className="card border-0 h-100" style={{
              background: 'linear-gradient(135deg, rgba(184, 92, 0, 0.1), rgba(184, 92, 0, 0.05))',
              borderRadius: '20px',
              border: '2px solid rgba(184, 92, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body text-center py-4">
                <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                  color: 'white',
                  width: '70px',
                  height: '70px'
                }}>
                  <FaCheck size={isMobile ? 20 : 24} />
                </div>
                <h2 className="fw-bold mb-1" style={{color: 'var(--primary-color)', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                  {selectedOrders.length}
                </h2>
                <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                  Seleccionadas
                </h6>
                <small className="text-muted">Para cobrar</small>
              </div>
            </div>
          </div>

          {/* Estadística del total a cobrar */}
          <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
            <div className="card border-0 h-100" style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
              borderRadius: '20px',
              border: '2px solid rgba(255, 193, 7, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body text-center py-4">
                <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                  background: 'linear-gradient(135deg, #ffc107, #fd7e14)',
                  color: 'white',
                  width: '70px',
                  height: '70px'
                }}>
                  <FaDollarSign size={isMobile ? 20 : 24} />
                </div>
                <h2 className="fw-bold mb-1" style={{color: '#ffc107', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                  ${calculateTotal()}
                </h2>
                <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                  Total
                </h6>
                <small className="text-muted">A cobrar</small>
              </div>
            </div>
          </div>

          {/* Estadística del método de pago */}
          <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
            <div className="card border-0 h-100" style={{
              background: 'linear-gradient(135deg, rgba(111, 66, 193, 0.1), rgba(111, 66, 193, 0.05))',
              borderRadius: '20px',
              border: '2px solid rgba(111, 66, 193, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div className="card-body text-center py-4">
                <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                  background: 'linear-gradient(135deg, #6f42c1, #495057)',
                  color: 'white',
                  width: '70px',
                  height: '70px'
                }}>
                  {paymentMethod === 'efectivo' ? <FaMoneyBillAlt size={isMobile ? 20 : 24} /> : <FaCreditCard size={isMobile ? 20 : 24} />}
                </div>
                <h2 className="fw-bold mb-1" style={{color: '#6f42c1', fontSize: isMobile ? '1.5rem' : '1.8rem'}}>
                  {paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                </h2>
                <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                  Método
                </h6>
                <small className="text-muted">Seleccionado</small>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Panel de órdenes pendientes modernizado */}
          <div className={`${isMobile ? 'col-12' : 'col-lg-8'}`}>
            <div 
              className="card border-0 h-100"
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                borderRadius: '25px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              <div 
                className="d-flex align-items-center justify-content-between p-4 position-relative"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #f1f3f4 100%)',
                  borderBottom: '2px solid rgba(184, 92, 0, 0.1)'
                }}
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                      boxShadow: '0 5px 15px rgba(184, 92, 0, 0.3)'
                    }}
                  >
                    <FaMoneyBillAlt className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 
                      className="mb-1 fw-bold"
                      style={{
                        color: 'var(--primary-color)',
                        fontSize: isMobile ? '1.4rem' : '1.8rem'
                      }}
                    >
                      {isMobile ? 'Órdenes Pendientes' : 'Órdenes Pendientes de Cobro'}
                    </h3>
                    <p className="mb-0 text-muted">
                      Gestión de cobros del restaurante
                    </p>
                  </div>
                </div>
                {orders.length > 0 && (
                  <span className="badge bg-light text-dark px-3 py-2 rounded-pill fs-6">
                    {orders.length}
                  </span>
                )}
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert border-0 rounded-4 d-flex align-items-center mb-4" style={{
                    background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(220, 53, 69, 0.05))',
                    border: '2px solid rgba(220, 53, 69, 0.2)',
                    color: '#721c24'
                  }}>
                    <div className="me-3 p-2 rounded-circle" style={{
                      background: 'linear-gradient(135deg, #dc3545, #c82333)',
                      color: 'white'
                    }}>
                      <FaTimes size={16} />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="alert-heading mb-1 fw-bold">Error en el procesamiento</h6>
                      <p className="mb-0">{error}</p>
                    </div>
                  </div>
                )}

                {orders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-4 p-4 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                      background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                      color: 'white',
                      width: '120px',
                      height: '120px',
                      animation: 'float 3s ease-in-out infinite'
                    }}>
                      <FaDollarSign size={50} />
                    </div>
                    <h4 className="fw-bold mb-3" style={{color: 'var(--primary-dark)'}}>
                      Todo al día en caja
                    </h4>
                    <p className="text-muted mb-4" style={{fontSize: '1.1rem'}}>
                      No hay órdenes pendientes de cobro en este momento.<br/>
                      Las órdenes servidas aparecerán aquí automáticamente.
                    </p>
                    <div className="d-flex justify-content-center gap-4 text-muted mb-4">
                      <div className="text-center">
                        <FaClock size={24} className="mb-2 d-block mx-auto" />
                        <small>Esperando órdenes</small>
                      </div>
                      <div className="text-center">
                        <FaCreditCard size={24} className="mb-2 d-block mx-auto" />
                        <small>Sistema listo</small>
                      </div>
                    </div>
                    <div className="spinner-border" style={{color: 'var(--primary-color)'}} role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : (
                      <div className="row g-3 g-md-4">
                        {orders.map(order => (
                          <div key={order.id} className="col-12 col-lg-6">
                            <div 
                              className="card border-0 shadow-lg h-100 overflow-hidden position-relative"
                              onClick={() => handleSelectOrder(order)}
                              style={{
                                cursor: 'pointer',
                                borderRadius: '20px',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: selectedOrders.includes(order) 
                                  ? '3px solid var(--primary-color)' 
                                  : '2px solid rgba(184, 92, 0, 0.1)',
                                background: selectedOrders.includes(order) 
                                  ? 'linear-gradient(135deg, rgba(255, 248, 225, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)' 
                                  : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                                transform: selectedOrders.includes(order) ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                                boxShadow: selectedOrders.includes(order) 
                                  ? '0 20px 40px rgba(184, 92, 0, 0.25)' 
                                  : '0 10px 30px rgba(0,0,0,0.1)',
                                animation: selectedOrders.includes(order) ? 'selectedOrderGlow 2s infinite alternate' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!selectedOrders.includes(order)) {
                                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
                                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(184, 92, 0, 0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!selectedOrders.includes(order)) {
                                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                                }
                              }}
                            >
                              <div className="position-relative">
                                {/* Header elegante de la tarjeta */}
                                <div 
                                  className="d-flex align-items-center p-3 position-relative"
                                  style={{
                                    background: selectedOrders.includes(order) 
                                      ? 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)'
                                      : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                    borderRadius: '20px 20px 0 0',
                                    borderBottom: '2px solid rgba(184, 92, 0, 0.1)'
                                  }}
                                >
                                  <div className="d-flex align-items-center flex-grow-1">
                                    <div 
                                      className="d-flex align-items-center justify-content-center me-3"
                                      style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '12px',
                                        background: selectedOrders.includes(order)
                                          ? 'rgba(255, 255, 255, 0.2)'
                                          : 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                                        backdropFilter: selectedOrders.includes(order) ? 'blur(10px)' : 'none',
                                        boxShadow: selectedOrders.includes(order) 
                                          ? 'inset 0 2px 10px rgba(255, 255, 255, 0.3)'
                                          : '0 4px 15px rgba(184, 92, 0, 0.3)'
                                      }}
                                    >
                                      <FaReceipt 
                                        className={selectedOrders.includes(order) ? 'text-white' : 'text-white'} 
                                        size={18} 
                                      />
                                    </div>
                                    <div>
                                      <h5 
                                        className="mb-1 fw-bold"
                                        style={{
                                          color: selectedOrders.includes(order) ? '#fff' : 'var(--primary-color)',
                                          fontSize: '1.3rem',
                                          textShadow: selectedOrders.includes(order) ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                                        }}
                                      >
                                        Orden #{order.id}
                                      </h5>
                                      <p 
                                        className="mb-0 d-flex align-items-center"
                                        style={{
                                          color: selectedOrders.includes(order) ? 'rgba(255, 255, 255, 0.9)' : '#666',
                                          fontSize: '0.95rem'
                                        }}
                                      >
                                        <FaClock className="me-2" size={12} />
                                        {new Date(order.fecha || Date.now()).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="d-flex align-items-center gap-3">
                                    <div 
                                      className="badge fw-bold px-3 py-2"
                                      style={{
                                        background: selectedOrders.includes(order)
                                          ? 'rgba(255, 255, 255, 0.25)'
                                          : 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        borderRadius: '12px',
                                        backdropFilter: selectedOrders.includes(order) ? 'blur(10px)' : 'none',
                                        border: selectedOrders.includes(order) ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                                        boxShadow: selectedOrders.includes(order) 
                                          ? 'inset 0 2px 10px rgba(255, 255, 255, 0.2)'
                                          : '0 4px 15px rgba(184, 92, 0, 0.3)'
                                      }}
                                    >
                                      Mesa {order.mesa || 'N/A'}
                                    </div>
                                    {selectedOrders.includes(order) && (
                                      <div 
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                          width: '35px',
                                          height: '35px',
                                          borderRadius: '50%',
                                          background: 'rgba(255, 255, 255, 0.25)',
                                          backdropFilter: 'blur(10px)',
                                          border: '1px solid rgba(255, 255, 255, 0.3)',
                                          animation: 'checkmarkBounce 0.6s ease-out'
                                        }}
                                      >
                                        <FaCheck className="text-white" size={16} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="card-body p-4">
                                {/* Lista de platos elegante */}
                                <div className="mb-4">
                                  <div className="d-flex align-items-center mb-3">
                                    <div 
                                      className="d-flex align-items-center justify-content-center me-3"
                                      style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                        boxShadow: '0 3px 10px rgba(40, 167, 69, 0.3)'
                                      }}
                                    >
                                      <FaCreditCard className="text-white" size={12} />
                                    </div>
                                    <h6 className="mb-0 fw-bold text-muted">Platos ordenados ({order.dishes.length})</h6>
                                  </div>
                                  
                                  <div className="dishes-list">
                                    {order.dishes.map((dish, i) => (
                                      <div 
                                        key={i} 
                                        className="dish-item d-flex justify-content-between align-items-center p-3 mb-2 position-relative"
                                        style={{
                                          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                                          borderRadius: '12px',
                                          border: '1px solid rgba(184, 92, 0, 0.1)',
                                          transition: 'all 0.3s ease',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = 'translateX(5px)';
                                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(184, 92, 0, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = 'translateX(0)';
                                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                        }}
                                      >
                                        <div className="d-flex align-items-center">
                                          <div 
                                            className="d-flex align-items-center justify-content-center me-3"
                                            style={{
                                              width: '35px',
                                              height: '35px',
                                              borderRadius: '10px',
                                              background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                                              color: 'white',
                                              fontSize: '0.8rem',
                                              fontWeight: 'bold'
                                            }}
                                          >
                                            {i + 1}
                                          </div>
                                          <div>
                                            <div className="fw-bold mb-1" style={{color: 'var(--primary-dark)', fontSize: '1.1rem'}}>
                                              {dish.name}
                                            </div>
                                            <small 
                                              className="badge"
                                              style={{
                                                background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
                                                color: '#495057',
                                                borderRadius: '8px',
                                                padding: '4px 8px'
                                              }}
                                            >
                                              {dish.type}
                                            </small>
                                          </div>
                                        </div>
                                        <div 
                                          className="price-badge fw-bold px-3 py-2"
                                          style={{
                                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                            color: '#8b4513',
                                            borderRadius: '12px',
                                            fontSize: '1.1rem',
                                            boxShadow: '0 3px 10px rgba(255, 215, 0, 0.4)',
                                            minWidth: '80px',
                                            textAlign: 'center'
                                          }}
                                        >
                                          ${parseFloat(dish.price).toFixed(2)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Sección de total elegante */}
                                <div 
                                  className="total-section p-4 position-relative overflow-hidden"
                                  style={{
                                    background: selectedOrders.includes(order) 
                                      ? 'linear-gradient(135deg, rgba(184, 92, 0, 0.1) 0%, rgba(255, 248, 225, 0.8) 100%)'
                                      : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                    borderRadius: '15px',
                                    border: selectedOrders.includes(order) 
                                      ? '2px solid var(--primary-color)' 
                                      : '2px solid #dee2e6',
                                    boxShadow: selectedOrders.includes(order)
                                      ? '0 8px 25px rgba(184, 92, 0, 0.2)'
                                      : '0 5px 15px rgba(0,0,0,0.08)'
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                      <div 
                                        className="d-flex align-items-center justify-content-center me-3"
                                        style={{
                                          width: '50px',
                                          height: '50px',
                                          borderRadius: '15px',
                                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                          boxShadow: '0 5px 15px rgba(40, 167, 69, 0.3)'
                                        }}
                                      >
                                        <FaDollarSign className="text-white" size={20} />
                                      </div>
                                      <div>
                                        <h4 
                                          className="mb-1 fw-bold"
                                          style={{
                                            color: 'var(--primary-color)',
                                            fontSize: '1.8rem'
                                          }}
                                        >
                                          ${order.dishes.reduce((sum, dish) => sum + parseFloat(dish.price), 0).toFixed(2)}
                                        </h4>
                                        <p className="mb-0 text-muted">Total a cobrar</p>
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <div 
                                        className="badge fw-bold px-3 py-2 mb-2"
                                        style={{
                                          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                          color: 'white',
                                          fontSize: '0.9rem',
                                          borderRadius: '10px'
                                        }}
                                      >
                                        {order.dishes.length} platillo{order.dishes.length !== 1 ? 's' : ''}
                                      </div>
                                      <div className="small text-muted d-flex align-items-center justify-content-end">
                                        <FaClock className="me-1" size={12} />
                                        {new Date(order.fecha || Date.now()).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                          
                          {selectedOrders.includes(order) && (
                            <div className="selected-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{
                              background: 'rgba(210, 105, 30, 0.1)',
                              borderRadius: 'inherit',
                              pointerEvents: 'none'
                            }}>
                              <div className="selected-checkmark" style={{
                                background: 'var(--success-color)',
                                borderRadius: '50%',
                                width: '50px',
                                height: '50px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'zoomIn 0.5s ease-in-out'
                              }}>
                                <FaCheck style={{color: 'white', fontSize: '1.5rem'}} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de procesamiento de pago modernizado */}
          <div className="col-lg-4">
            <div 
              className="card border-0 sticky-top"
              style={{
                top: '20px',
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                borderRadius: '25px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              <div 
                className="d-flex align-items-center p-4 position-relative"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #f1f3f4 100%)',
                  borderBottom: '2px solid rgba(184, 92, 0, 0.1)'
                }}
              >
                <div 
                  className="d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '15px',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                    boxShadow: '0 5px 15px rgba(184, 92, 0, 0.3)'
                  }}
                >
                  <FaCreditCard className="text-white" size={24} />
                </div>
                <div>
                  <h3 
                    className="mb-1 fw-bold"
                    style={{
                      color: 'var(--primary-color)',
                      fontSize: '1.8rem'
                    }}
                  >
                    Procesar Pago
                  </h3>
                  <p className="mb-0 text-muted">
                    Sistema de cobros
                  </p>
                </div>
              </div>
              <div className="card-body p-4">
                {/* Resumen de pago elegante */}
                <div className="mb-5">
                  <div className="d-flex align-items-center mb-4">
                    <div 
                      className="d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                        boxShadow: '0 4px 15px rgba(184, 92, 0, 0.3)'
                      }}
                    >
                      <FaReceipt className="text-white" size={18} />
                    </div>
                    <h4 className="mb-0 fw-bold" style={{color: 'var(--primary-color)'}}>
                      Resumen de Cobro
                    </h4>
                  </div>
                  
                  {selectedOrders.length === 0 ? (
                    <div 
                      className="text-center py-5"
                      style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderRadius: '15px',
                        border: '2px dashed #dee2e6'
                      }}
                    >
                      <div className="mb-3">
                        <FaCreditCard 
                          size={50} 
                          style={{
                            color: '#dee2e6',
                            opacity: 0.7
                          }}
                        />
                      </div>
                      <p className="text-muted mb-0" style={{fontSize: '1.1rem'}}>
                        Selecciona órdenes para procesar el pago
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="p-4"
                      style={{
                        background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                        borderRadius: '15px',
                        border: '2px solid rgba(184, 92, 0, 0.1)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.08)'
                      }}
                    >
                      <div className="d-flex align-items-center mb-3">
                        <div 
                          className="badge fw-bold px-3 py-2"
                          style={{
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            color: 'white',
                            fontSize: '0.9rem',
                            borderRadius: '10px'
                          }}
                        >
                          {selectedOrders.length} orden{selectedOrders.length > 1 ? 'es' : ''} seleccionada{selectedOrders.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div 
                        className="p-4 mb-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(184, 92, 0, 0.05) 0%, rgba(255, 248, 225, 0.3) 100%)',
                          borderRadius: '12px',
                          border: '1px solid rgba(184, 92, 0, 0.1)'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-medium" style={{color: '#666'}}>Subtotal:</span>
                          <span className="fw-bold" style={{color: 'var(--primary-color)', fontSize: '1.2rem'}}>
                            ${calculateTotal()}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-medium" style={{color: '#666'}}>IVA (7%):</span>
                          <span className="fw-bold" style={{color: '#17a2b8', fontSize: '1.1rem'}}>
                            ${(parseFloat(calculateTotal()) * 0.07).toFixed(2)}
                          </span>
                        </div>
                        <hr style={{borderColor: 'rgba(184, 92, 0, 0.2)', margin: '1rem 0'}} />
                        <div 
                          className="d-flex justify-content-between align-items-center p-3"
                          style={{
                            background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                            borderRadius: '10px',
                            color: 'white'
                          }}
                        >
                          <span className="fw-bold" style={{fontSize: '1.3rem'}}>Total a Pagar:</span>
                          <span className="fw-bold" style={{fontSize: '1.8rem'}}>
                            ${(parseFloat(calculateTotal()) * 1.07).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de procesamiento final */}
                {selectedOrders.length > 0 && (
                  <div className="d-grid gap-3 mt-4">
                    <button
                      className="btn btn-lg border-0 fw-bold position-relative overflow-hidden"
                      onClick={handlePayment}
                      disabled={selectedOrders.length === 0}
                      style={{
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, #8b4513 100%)',
                        color: 'white',
                        borderRadius: '15px',
                        padding: '15px 30px',
                        fontSize: '1.2rem',
                        boxShadow: '0 10px 30px rgba(184, 92, 0, 0.3)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(184, 92, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(184, 92, 0, 0.3)';
                      }}
                    >
                      <FaDollarSign className="me-3" size={22} />
                      Procesar Pago ({selectedOrders.length} orden{selectedOrders.length !== 1 ? 'es' : ''})
                      <div 
                        className="position-absolute top-0 end-0 w-100 h-100"
                        style={{
                          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                          animation: 'shimmer 3s infinite'
                        }}
                      />
                    </button>

                    {lastInvoice && (
                      <button
                        className="btn btn-lg border-0 fw-bold position-relative overflow-hidden"
                        onClick={() => handleDownloadInvoice(lastInvoice)}
                        style={{
                          background: 'linear-gradient(135deg, #6f42c1 0%, #495057 100%)',
                          color: 'white',
                          borderRadius: '15px',
                          padding: '15px 30px',
                          fontSize: '1.1rem',
                          boxShadow: '0 8px 25px rgba(111, 66, 193, 0.3)',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 12px 35px rgba(111, 66, 193, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(111, 66, 193, 0.3)';
                        }}
                      >
                        <FaPrint className="me-3" size={18} />
                        Descargar Última Factura
                      </button>
                    )}
                  </div>
                )}

                {/* Información adicional */}
                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted">
                    <div className="mb-1">
                      <strong>Instrucciones:</strong>
                    </div>
                    <div>• Selecciona las órdenes haciendo clic en ellas</div>
                    <div>• Elige el método de pago</div>
                    <div>• Procesa el pago para generar la factura</div>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animated-icon {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .order-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 12px 35px rgba(210, 105, 30, 0.2) !important;
        }
        
        .selected-order .dish-item:hover .dish-name {
          color: var(--primary-color);
        }
        
        .selected-order .price-tag {
          animation: pulse 2s infinite;
        }
        
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes zoomIn {
          0% { opacity: 0; transform: scale(0); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .total-section {
          transition: all 0.3s ease;
        }
        
        .selected-order .total-section {
          animation: glow 2s infinite alternate;
        }
        
        @keyframes glow {
          from { box-shadow: 0 0 5px rgba(210, 105, 30, 0.5); }
          to { box-shadow: 0 0 20px rgba(210, 105, 30, 0.8); }
        }
        
        .btn:hover {
          transform: translateY(-3px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .restaurant-card {
          transition: all 0.3s ease;
        }
        
        .restaurant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 69, 19, 0.15);
        }
        
        @keyframes selectedOrderGlow {
          0% { box-shadow: 0 20px 40px rgba(184, 92, 0, 0.25); }
          100% { box-shadow: 0 25px 50px rgba(184, 92, 0, 0.4); }
        }
        
        @keyframes checkmarkBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        .payment-method-card:hover {
          transform: translateY(-3px) !important;
        }
        
        .dish-item:hover {
          transform: translateX(5px) !important;
        }
      `}</style>
    </div>
  );
};

export default CashierScreen;