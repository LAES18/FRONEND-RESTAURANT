import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Usa siempre `${API_URL}/api/` como prefijo para todos los endpoints de API en Railway.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? '/api'
    : 'http://localhost:3001/api');

const KitchenScreen = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = () => {
      axios.get(`${API_URL}/api/orders`)
        .then(response => {
          // Mostrar solo órdenes pendientes o en_proceso
          const filteredOrders = response.data.filter(order => order.status === 'pendiente' || order.status === 'en_proceso');
          setOrders(filteredOrders);
        })
        .catch(error => console.error('Error al obtener las órdenes:', error));
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsReady = (orderId) => {
    axios.patch(`${API_URL}/api/orders/${orderId}`, { status: 'servido' })
      .then(() => {
        Swal.fire({icon: 'success', title: '¡Listo!', text: 'Orden marcada como lista'});
        setOrders(orders.filter(order => order.id !== orderId));
      })
      .catch(error => {
        Swal.fire({icon: 'error', title: 'Error', text: 'Error al actualizar la orden'});
        console.error('Error al actualizar la orden:', error);
      });
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

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-end mb-2">
        <button className="btn btn-outline-danger" onClick={handleLogout}>Cerrar sesión</button>
      </div>
      <h1 className="text-center mb-4">👨‍🍳 Pantalla de la Cocina</h1>

      <div className="row">
        {orders.map(order => (
          <div className="col-md-6 mb-4" key={order.id}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Orden #{order.id} - Mesa {order.mesa || 'N/A'}</h5>
                <ul className="list-unstyled">
                  {order.dishes && order.dishes.map((dish, i) => (
                    <li key={i}>{dish.name} ({dish.type}) - ${dish.price}</li>
                  ))}
                </ul>
                <button className="btn btn-success" onClick={() => handleMarkAsReady(order.id)}>Marcar como lista</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenScreen;