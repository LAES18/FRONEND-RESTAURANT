import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';

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
      setError('Selecciona al menos una orden para procesar el pago.');
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
        alert('Pago procesado exitosamente');
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
    const ticketWidth = 180; // un poco más ancho para mejor formato
    const margin = 12;
    const lineHeight = 16;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [ticketWidth, 900]
    });
    let y = margin + 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Restaurante Delicioso', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('FACTURA SIMPLIFICADA', ticketWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;
    doc.setLineWidth(0.7);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 10;
    // Datos generales
    const now = new Date();
    const fecha = now.toLocaleDateString() + ' ' + now.toLocaleTimeString().slice(0,5);
    const recibo = ordersToPrint[0]?.id ? `#${ordersToPrint[0].id}` : '';
    doc.setFontSize(10);
    doc.text(`Recibo ${recibo}`, margin, y);
    y += lineHeight - 2;
    doc.text(`Fecha: ${fecha}`, margin, y);
    y += lineHeight - 2;
    doc.text(`Cajero: Cobrador`, margin, y);
    y += lineHeight - 2;
    doc.text(`TPV: POS 1`, margin, y);
    y += lineHeight;
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Dine In', margin, y);
    doc.setFont('helvetica', 'normal');
    y += lineHeight - 2;
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 8;
    // Platillos
    ordersToPrint.forEach(order => {
      order.dishes.forEach(dish => {
        doc.text(`${dish.name}`, margin, y);
        doc.text(`${parseFloat(dish.price).toFixed(2)}`, ticketWidth - margin, y, { align: 'right' });
        y += lineHeight - 4;
      });
    });
    y += 4;
    doc.setLineWidth(0.3);
    doc.line(margin, y, ticketWidth - margin, y);
    y += 10;
    // Total
    const total = ordersToPrint.reduce((sum, order) => sum + order.dishes.reduce((dsum, d) => dsum + parseFloat(d.price || 0), 0), 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total', margin, y);
    doc.text(total.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(capitalize(paymentMethod), margin, y);
    doc.text(total.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight;
    // IGIC/IVA ejemplo (7%)
    const baseImp = (total / 1.07);
    const cuota = total - baseImp;
    doc.setFontSize(9.5);
    doc.text(`IGIC 7%, base imp`, margin, y);
    doc.text(baseImp.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight - 6;
    doc.text(`IGIC 7%, cuota`, margin, y);
    doc.text(cuota.toFixed(2), ticketWidth - margin, y, { align: 'right' });
    y += lineHeight;
    doc.setFontSize(10);
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
      alert('Error al cerrar sesión');
    }
  };

  return (
    <div className="cashier-container">
      <div className="d-flex justify-content-end mb-2">
        <button className="btn btn-outline-danger" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h1 className="cashier-title">💳 Pantalla del Cobrador</h1>

      <h2 className="cashier-section-title">Órdenes Servidas</h2>
      <ul className="cashier-orders-list">
        {orders.map(order => (
          <li
            className={`cashier-order-item ${selectedOrders.includes(order) ? 'selected' : ''}`}
            key={order.id}
            onClick={() => handleSelectOrder(order)}
          >
            <div>
              <strong>Orden #{order.id} - Mesa {order.mesa || 'N/A'}</strong>
              <ul className="cashier-dishes-list">
                {order.dishes.map((dish, i) => (
                  <li key={i}>{dish.name} ({dish.type}) - ${dish.price}</li>
                ))}
              </ul>
            </div>
            <span className="cashier-order-total">Total: ${order.dishes.reduce((sum, dish) => sum + parseFloat(dish.price), 0).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <h2 className="cashier-section-title">Procesar Pago</h2>
      {error && <div className="cashier-error">{error}</div>}

      <div className="cashier-summary">
        <span>Total a pagar: ${calculateTotal()}</span>
      </div>

      <div className="cashier-payment-method">
        <label>Método de Pago:</label>
        <select
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value)}
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>

      <button className="cashier-pay-button" onClick={handlePayment}>Procesar Pago</button>
      {/* El botón manual de descarga de factura sigue disponible si se desea */}
      {lastInvoice && (
        <button className="cashier-pay-button mt-2" onClick={() => downloadTicket(lastInvoice)}>
          Descargar Factura Último Pago
        </button>
      )}
    </div>
  );
};

export default CashierScreen;