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
  FaDollarSign
} from 'react-icons/fa';
import './CashierScreen.css';

// Usar ruta relativa si VITE_API_URL está vacío
const API_URL = import.meta.env.VITE_API_URL || '';

const CashierScreen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cardReference, setCardReference] = useState('');
  const [error, setError] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);
  const navigate = useNavigate();

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

    // Validar referencia de tarjeta si el método es tarjeta
    if (paymentMethod === 'tarjeta' && !cardReference.trim()) {
      Swal.fire({icon: 'warning', title: 'Referencia Requerida', text: 'Por favor ingresa el número de referencia de la tarjeta.'});
      return;
    }

    setError('');

    const paymentData = selectedOrders.map(order => ({
      order_id: order.id,
      total: order.dishes.reduce((sum, dish) => sum + parseFloat(dish.price || 0), 0),
      method: paymentMethod,
      card_reference: paymentMethod === 'tarjeta' ? cardReference.trim() : null
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
        setLastInvoice({ 
          orders: selectedOrders, 
          method: paymentMethod, 
          reference: paymentMethod === 'tarjeta' ? cardReference : '' 
        });
        handleDownloadInvoice(selectedOrders, paymentMethod, cardReference); // Descargar factura automáticamente
        setSelectedOrders([]);
        setCardReference(''); // Limpiar referencia
      })
      .catch(error => {
        console.error('Error al procesar el pago:', error);
        const errorMessage = error.response?.data || error.message || 'Error al procesar el pago.';
        
        // Verificar si es un error de validación de total
        if (errorMessage.includes('Total inválido') || errorMessage.includes('no coincide')) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Validación',
            html: '<p>El total del pago no coincide con los precios actuales.</p><p style="font-size: 0.9em; color: #666; margin-top: 10px;">Por favor, recarga las órdenes e intenta nuevamente.</p>',
            confirmButtonText: 'Recargar',
            confirmButtonColor: '#d33'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al procesar pago',
            text: typeof errorMessage === 'string' ? errorMessage : 'No se pudo procesar el pago. Intenta nuevamente.'
          });
        }
        setError('Error al procesar el pago.');
      });
  };

  const handleDownloadInvoice = (ordersToPrint, method = 'efectivo', reference = '') => {
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
    doc.text(capitalize(method), margin, y);
    doc.text(total.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight - 3;
    
    // Mostrar referencia si es pago con tarjeta
    if (method === 'tarjeta' && reference) {
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Ref: ${reference}`, margin, y);
      y += lineHeight - 3;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
    }
    
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
    <div className="cashier-container">
      {/* Header */}
      <header className="screen-header">
        <div className="screen-header-content">
          <div className="screen-logo-section">
            <div className="screen-logo">
              <FaDollarSign />
            </div>
            <div>
              <h1 className="screen-title">RestoSmart Caja</h1>
              <p className="screen-subtitle">Sistema de Pagos y Facturación</p>
            </div>
          </div>
          <button className="screen-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tarjetas de estadísticas */}
      <div className="stats-container">
        <div className="stat-card stat-pending">
          <div className="stat-icon">
            <FaReceipt />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{orders.length}</h3>
            <p className="stat-label">Pendientes</p>
            <p className="stat-sublabel">Por cobrar</p>
          </div>
        </div>

        <div className="stat-card stat-selected">
          <div className="stat-icon">
            <FaMoneyBillAlt />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{selectedOrders.length}</h3>
            <p className="stat-label">Seleccionadas</p>
            <p className="stat-sublabel">Para cobrar</p>
          </div>
        </div>

        <div className="stat-card stat-total">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">Q{calculateTotal()}</h3>
            <p className="stat-label">Total</p>
            <p className="stat-sublabel">A cobrar</p>
          </div>
        </div>

        <div className="stat-card stat-method">
          <div className="stat-icon">
            <FaCreditCard />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
            </h3>
            <p className="stat-label">Método</p>
            <p className="stat-sublabel">Seleccionado</p>
          </div>
        </div>
      </div>

      <div className="cashier-screen">
        {/* Panel de órdenes pendientes */}
        <div className="pending-orders">
          <div className="pending-orders-header">
            <div className="pending-orders-icon">
              <FaMoneyBillAlt />
            </div>
            <div>
              <h2>Órdenes Pendientes</h2>
              <span className="orders-count">{orders.length}</span>
            </div>
          </div>

          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="no-orders">
                <FaReceipt size={48} />
                <p>No hay órdenes pendientes</p>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className={`order-item ${selectedOrders.includes(order) ? 'selected' : ''}`}
                  onClick={() => handleSelectOrder(order)}
                >
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-number">Orden #{order.daily_order_number || order.id}</span>
                      <span className="order-mesa">Mesa {order.mesa || 'N/A'}</span>
                      {order.waiter_name && (
                        <span className="order-waiter" style={{fontSize: '0.85em', color: '#666'}}>
                          Mesero: {order.waiter_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="dishes-list">
                    {order.dishes.map((dish, i) => (
                      <div key={i} className="dish-item-small">
                        <span className="dish-name">{dish.name}</span>
                        <span className="dish-price">Q{parseFloat(dish.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total">
                    Total: Q{order.dishes.reduce((sum, dish) => sum + parseFloat(dish.price), 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de pago */}
        <div className="payment-panel">
          <div className="payment-header">
            <h2>💳 Procesar Pago</h2>
          </div>

          {error && (
            <div className="error-alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Detalle de órdenes seleccionadas */}
          <div className="order-details">
            <h3 className="section-title">Resumen de Orden</h3>
            {selectedOrders.length === 0 ? (
              <div className="no-selection">
                <p>Selecciona órdenes para procesar el pago</p>
              </div>
            ) : (
              <div className="selected-dishes">
                {selectedOrders.map(order =>
                  order.dishes.map((dish, i) => (
                    <div key={`${order.id}-${i}`} className="dish-item">
                      <span className="dish-item-name">{dish.name}</span>
                      <span className="dish-item-price">Q{parseFloat(dish.price).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="total-section">
            <div className="total-label">Total a Pagar:</div>
            <div className="total-amount">Q{calculateTotal()}</div>
          </div>

          {/* Métodos de pago */}
          <div className="payment-method-section">
            <h4 className="method-title">Método de Pago</h4>
            <div className="payment-methods">
              <button
                className={`payment-method-btn ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('efectivo')}
              >
                <div className="payment-method-icon">
                  <FaMoneyBillAlt />
                </div>
                <span className="payment-method-name">Efectivo</span>
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('tarjeta')}
              >
                <div className="payment-method-icon">
                  <FaCreditCard />
                </div>
                <span className="payment-method-name">Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Campo de referencia de tarjeta */}
          {paymentMethod === 'tarjeta' && (
            <div className="card-reference-section">
              <label className="reference-label">Número de Referencia/Autorización *</label>
              <input
                type="text"
                className="reference-input"
                placeholder="Ej: 123456789"
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
                maxLength={100}
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="payment-actions">
            <button
              className="btn-process-payment"
              onClick={handlePayment}
              disabled={selectedOrders.length === 0}
            >
              <FaDollarSign /> Procesar Pago
            </button>

            {lastInvoice && (
              <button
                className="btn-print-invoice"
                onClick={() => handleDownloadInvoice(lastInvoice.orders, lastInvoice.method, lastInvoice.reference)}
              >
                <FaReceipt /> Descargar Última Factura
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierScreen;