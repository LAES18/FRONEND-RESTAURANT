import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './CashierScreen.css';

// Asegúrate que todos los endpoints usen /api/ como prefijo, igual que en Railway.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? '/api'
    : 'http://localhost:3001/api');

const CashierScreen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
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
    doc.text('Restaurante Delicioso', ticketWidth / 2, y, { align: 'center' });
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
    <div className="cashier-screen">
      <div className="pending-orders">
        <h2>💳 Órdenes Pendientes de Cobro</h2>
        <div className="orders-list">
          {orders.map(order => (
            <div
              className={`order-item ${selectedOrders.includes(order) ? 'selected' : ''}`}
              key={order.id}
              onClick={() => handleSelectOrder(order)}
            >
              <div className="order-header">
                <div className="order-info">Orden #{order.id} - Mesa {order.mesa || 'N/A'}</div>
                <div className="order-time">{new Date().toLocaleTimeString()}</div>
              </div>
              <ul className="dishes-list">
                {order.dishes.map((dish, i) => (
                  <li key={i} className="dish-item">
                    <span className="dish-name">{dish.name}</span>
                    <span className="dish-price">${parseFloat(dish.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="order-total">
                Total: ${order.dishes.reduce((sum, dish) => sum + parseFloat(dish.price), 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="payment-panel">
        <div className="payment-header">
          <h2>Procesar Pago</h2>
          <button className="btn-payment" onClick={handleLogout}>Cerrar sesión</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="order-details">
          <h3>Resumen de Orden</h3>
          <div className="payment-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${calculateTotal()}</span>
            </div>
            <div className="summary-row">
              <span>IVA (7%)</span>
              <span>${(parseFloat(calculateTotal()) * 0.07).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total a Pagar</span>
              <span>${(parseFloat(calculateTotal()) * 1.07).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="payment-actions">
          <button
            className={`btn-payment ${paymentMethod === 'efectivo' ? 'cash' : ''}`}
            onClick={() => setPaymentMethod('efectivo')}
          >
            💵 Efectivo
          </button>
          <button
            className={`btn-payment ${paymentMethod === 'tarjeta' ? 'card' : ''}`}
            onClick={() => setPaymentMethod('tarjeta')}
          >
            💳 Tarjeta
          </button>
        </div>

        <button
          className="btn-payment cash"
          onClick={handlePayment}
          disabled={selectedOrders.length === 0}
        >
          Procesar Pago
        </button>

        {lastInvoice && (
          <button
            className="btn-payment card"
            onClick={() => handleDownloadInvoice(lastInvoice)}
          >
            📄 Descargar Última Factura
          </button>
        )}
      </div>
    </div>
  );
};

export default CashierScreen;