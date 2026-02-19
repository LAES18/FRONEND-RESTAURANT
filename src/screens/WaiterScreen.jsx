import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './WaiterScreen.css';

// Usar ruta relativa si VITE_API_URL está vacío
const API_URL = import.meta.env.VITE_API_URL || '';

const WaiterScreen = () => {
  const [dishes, setDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [mesa, setMesa] = useState('');
  const [notes, setNotes] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [previousOrders, setPreviousOrders] = useState([]);
  
  // Guardar datos del usuario al cargar el componente (no se sobrescribe con otras pestañas)
  const [userData] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  });
  
  const navigate = useNavigate();

  // Solicitar permisos de notificación al cargar el componente
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            new Notification('Notificaciones activadas', {
              body: 'Recibirás notificaciones cuando tus órdenes estén listas',
              icon: '/restaurant-icon.png',
              badge: '/restaurant-icon.png'
            });
          }
        });
      }
    }
  }, []);

  // Función para enviar notificación del navegador
  const sendBrowserNotification = (order) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 ¡Orden Lista!', {
        body: `Mesa ${order.mesa} - Orden #${order.daily_order_number || order.id}\nLista para servir`,
        icon: '/restaurant-icon.png',
        badge: '/restaurant-icon.png',
        tag: `order-${order.id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });

      notification.onclick = () => {
        window.focus();
        setShowPendingOrders(true);
        fetchPendingOrders();
        notification.close();
      };

      // Auto cerrar después de 10 segundos
      setTimeout(() => notification.close(), 10000);
    }
  };

  // Polling cada 10 segundos para detectar órdenes listas
  useEffect(() => {
    const checkForReadyOrders = async () => {
      try {
        // Obtener todas las órdenes servidas
        const response = await axios.get(`${API_URL}/api/orders?status=servido&unpaid=true`);
        const currentOrders = response.data;
        
        // Comparar con órdenes anteriores para detectar nuevas órdenes listas
        if (previousOrders.length > 0) {
          const previousOrderIds = previousOrders.map(o => o.id);
          const newReadyOrders = currentOrders.filter(order => !previousOrderIds.includes(order.id));
          
          // Enviar notificación por cada orden nueva que esté lista
          newReadyOrders.forEach(order => {
            sendBrowserNotification(order);
            // También mostrar notificación SweetAlert si el usuario está activo
            if (document.visibilityState === 'visible') {
              Swal.fire({
                icon: 'success',
                title: '🔔 ¡Orden Lista!',
                html: `<strong>Mesa ${order.mesa}</strong><br>Orden #${order.daily_order_number || order.id}<br>Lista para servir`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true
              });
            }
          });
        }
        
        setPreviousOrders(currentOrders);
      } catch (error) {
        console.error('Error al verificar órdenes listas:', error);
      }
    };

    // Ejecutar inmediatamente
    checkForReadyOrders();

    // Polling cada 10 segundos
    const interval = setInterval(checkForReadyOrders, 10000);

    return () => clearInterval(interval);
  }, [previousOrders, API_URL]);

  useEffect(() => {
    const fetchDishes = () => {
      axios.get(`${API_URL}/api/dishes`)
        .then(response => {
          const defaultImages = {
            desayuno: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            almuerzo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
            cena: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            bebida: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80',
            postre: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80',
            principal: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
          };
          const dishesWithImages = response.data.map(dish => ({
            ...dish,
            image: dish.image_url || dish.image || defaultImages[dish.type] || defaultImages.default
          }));
          setDishes(dishesWithImages);
        })
        .catch(error => console.error('Error al obtener los platillos:', error));
    };
    fetchDishes();
  }, []);

  useEffect(() => {
    let filtered = dishes;
    
    if (tipo !== 'todos') {
      filtered = filtered.filter(d => d.type === tipo);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDishes(filtered);
  }, [tipo, dishes, searchTerm]);

  const handleSelectDish = (dish) => {
    setSelectedDishes([...selectedDishes, dish]);
    setCartShake(true);
    setTimeout(() => setCartShake(false), 400);
  };

  const handleRemoveDish = (index) => {
    setSelectedDishes(selectedDishes.filter((_, i) => i !== index));
  };

  const handleSendOrder = () => {
    if (!mesa) {
      Swal.fire({icon: 'warning', title: 'Falta número de mesa', text: 'Por favor, ingresa el número de mesa.'});
      return;
    }
    if (selectedDishes.length === 0) {
      Swal.fire({icon: 'warning', title: 'Carrito vacío', text: 'Selecciona al menos un platillo.'});
      return;
    }
    
    // Determinar el nombre del mesero desde el estado (guardado al cargar el componente)
    let waiterName = 'Mesero';
    if (userData.name) {
      waiterName = userData.name;
    } else if (userData.first_name) {
      waiterName = `${userData.first_name} ${userData.last_name || ''}`.trim();
    }
    
    console.log('[DEBUG] UserData:', userData);
    console.log('[DEBUG] WaiterName:', waiterName);
    
    const orderData = {
      dishes: selectedDishes.map(dish => ({ dish_id: dish.id })),
      user_id: userData.id || 1,
      mesa,
      waiter_name: waiterName,
      notes: notes || null
    };
    
    if (editingOrder) {
      // Actualizar orden existente
      axios.put(`${API_URL}/api/orders/${editingOrder.id}`, {
        newDishes: selectedDishes.map(dish => ({ dish_id: dish.id })),
        notes: notes,
        waiter_name: waiterName
      })
        .then(() => {
          Swal.fire({icon: 'success', title: '¡Orden actualizada!', text: 'Los nuevos platillos han sido enviados a cocina.'});
          setSelectedDishes([]);
          setMesa('');
          setNotes('');
          setCartOpen(false);
          setEditingOrder(null);
          setShowPendingOrders(false);
          fetchPendingOrders();
        })
        .catch(error => {
          Swal.fire({icon: 'error', title: 'Error', text: 'Error al actualizar la orden.'});
          console.error('Error al actualizar la orden:', error);
        });
    } else {
      // Crear nueva orden
      axios.post(`${API_URL}/api/orders`, orderData)
        .then(() => {
          Swal.fire({icon: 'success', title: '¡Orden enviada!', text: 'La orden fue enviada exitosamente.'});
          setSelectedDishes([]);
          setMesa('');
          setNotes('');
          setCartOpen(false);
        })
        .catch(error => {
          Swal.fire({icon: 'error', title: 'Error', text: 'Error al enviar la orden.'});
          console.error('Error al enviar la orden:', error);
        });
    }
  };

  const calculateTotal = () => {
    return (selectedDishes.reduce((total, dish) => total + (parseFloat(dish.price) || 0), 0) || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
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

  const fetchPendingOrders = async () => {
    try {
      // Solo órdenes servidas (listas para cobrar) y sin pagar
      const response = await axios.get(`${API_URL}/api/orders?status=servido&unpaid=true`);
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error al cargar órdenes pendientes:', error);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setMesa(order.mesa);
    setNotes(order.notes || '');
    setSelectedDishes([]);
    setShowPendingOrders(false);
    setCartOpen(true);
    Swal.fire({
      icon: 'info',
      title: 'Editando Orden',
      text: `Editando orden #${order.daily_order_number || order.id} de la mesa ${order.mesa}. Agrega los nuevos platillos.`,
      timer: 3000
    });
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setSelectedDishes([]);
    setMesa('');
    setNotes('');
    setCartOpen(false);
  };

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'denied') {
        Swal.fire({
          icon: 'warning',
          title: 'Notificaciones Bloqueadas',
          html: 'Has bloqueado las notificaciones. Para activarlas:<br><br>1. Haz clic en el candado 🔒 en la barra de dirección<br>2. Busca "Notificaciones"<br>3. Cambia a "Permitir"',
          confirmButtonText: 'Entendido'
        });
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('✅ Notificaciones Activadas', {
            body: 'Recibirás notificaciones cuando tus órdenes estén listas',
            icon: '/restaurant-icon.png'
          });
          Swal.fire({
            icon: 'success',
            title: 'Notificaciones Activadas',
            text: 'Recibirás alertas cuando tus órdenes estén listas',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } else {
        // Ya están permitidas
        Swal.fire({
          icon: 'success',
          title: 'Notificaciones Activas',
          text: 'Las notificaciones ya están activadas correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No Compatible',
        text: 'Tu navegador no soporta notificaciones'
      });
    }
  };

  Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
    confirmButtonColor: '#b85c00',
    cancelButtonColor: '#6c757d',
    iconColor: '#b85c00',
  }).bind(Swal);

  return (
    <div className="waiter-screen">
      {/* Header */}
      <header className="waiter-header">
        <div className="waiter-header-content">
          <div className="waiter-logo-section">
            <div className="waiter-logo">🍽️</div>
            <div className="waiter-title-section">
              <h1>RestoSmart Mesero</h1>
              <p>Sistema de Toma de Órdenes</p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '0.75rem'}}>
            <button 
              className="waiter-logout-btn" 
              onClick={() => {
                fetchPendingOrders();
                setShowPendingOrders(true);
              }}
              style={{background: 'rgba(40, 167, 69, 0.2)', borderColor: 'rgba(40, 167, 69, 0.3)'}}
            >
              <span>📋</span> Órdenes Pendientes
            </button>
            <button className="waiter-logout-btn" onClick={handleLogout}>
              <span>🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor principal */}
      <div className="waiter-container">
        {/* Filtros y búsqueda */}
        <div className="waiter-filters">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Buscar platillo:</label>
              <input
                type="text"
                className="waiter-search-input"
                placeholder="🔍 Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Filtrar por tipo:</label>
              <select 
                className="waiter-filter-select" 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="todos">Todos los platillos</option>
                <option value="desayuno">Desayuno</option>
                <option value="almuerzo">Almuerzo</option>
                <option value="cena">Cena</option>
                <option value="bebida">Bebidas</option>
                <option value="postre">Postres</option>
                <option value="principal">Principal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de platillos */}
        {filteredDishes.length > 0 ? (
          <div className="waiter-dishes-grid">
            {filteredDishes.map((dish) => (
              <div key={dish.id} className="waiter-dish-card">
                <img 
                  src={dish.image} 
                  alt={dish.name}
                  className="waiter-dish-image"
                />
                <div className="waiter-dish-body">
                  <h5 className="waiter-dish-name">{dish.name}</h5>
                  <span className={`waiter-dish-type ${dish.type}`}>
                    {dish.type.charAt(0).toUpperCase() + dish.type.slice(1)}
                  </span>
                  <div className="waiter-dish-price">
                    Q{(Number(dish.price) || 0).toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                  <button 
                    className="waiter-dish-btn" 
                    onClick={() => handleSelectDish(dish)}
                  >
                    + Agregar al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="waiter-no-results">
            <div className="waiter-no-results-icon">🔍</div>
            <h3>No se encontraron platillos</h3>
            <p>Intenta con otros términos de búsqueda o filtros</p>
          </div>
        )}
      </div>

      {/* Botón flotante de notificaciones */}
      <button 
        className="waiter-notification-button" 
        onClick={handleRequestNotifications}
        style={{
          background: notificationPermission === 'granted' 
            ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' 
            : notificationPermission === 'denied'
            ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
            : 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'
        }}
        title={
          notificationPermission === 'granted' 
            ? 'Notificaciones activas' 
            : notificationPermission === 'denied' 
            ? 'Notificaciones bloqueadas - Click para ayuda' 
            : 'Click para activar notificaciones'
        }
      >
        {notificationPermission === 'granted' ? '🔔' : '🔕'}
      </button>

      {/* Botón flotante del carrito */}
      <button 
        className={`waiter-cart-button ${cartShake ? 'cart-shake' : ''}`}
        onClick={() => setCartOpen(true)}
      >
        🛒
        {selectedDishes.length > 0 && (
          <span className="waiter-cart-badge">{selectedDishes.length}</span>
        )}
      </button>

      {/* Overlay del carrito */}
      {cartOpen && (
        <div 
          className="waiter-cart-overlay" 
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Panel lateral del carrito */}
      <div className={`waiter-cart-panel ${cartOpen ? 'open' : ''}`}>
        <div className="waiter-cart-header">
          <h3>🛒 Carrito</h3>
          <button className="waiter-cart-close" onClick={() => setCartOpen(false)}>
            ✕
          </button>
        </div>

        <div className="waiter-cart-body">
          {selectedDishes.length === 0 ? (
            <div className="waiter-cart-empty">
              <div className="waiter-cart-empty-icon">🛒</div>
              <h4>Carrito vacío</h4>
              <p>Agrega platillos para crear una orden</p>
            </div>
          ) : (
            <>
              {selectedDishes.map((dish, index) => (
                <div key={index} className="waiter-cart-item">
                  <div className="waiter-cart-item-info">
                    <div className="waiter-cart-item-name">{dish.name}</div>
                    <div className="waiter-cart-item-price">
                      Q{(Number(dish.price) || 0).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </div>
                  <button 
                    className="waiter-cart-item-remove"
                    onClick={() => handleRemoveDish(index)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="waiter-cart-footer">
          <div className="waiter-cart-total">
            <div className="waiter-cart-total-label">Total a pagar:</div>
            <div className="waiter-cart-total-amount">Q{calculateTotal()}</div>
          </div>

          {editingOrder && (
            <div style={{padding: '0.75rem', background: '#fff3cd', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ffc107'}}>
              <strong>✏️ Editando Orden #{editingOrder.daily_order_number || editingOrder.id}</strong>
              <p style={{margin: '0.25rem 0 0 0', fontSize: '0.85rem'}}>Agrega los nuevos platillos que el cliente desea</p>
            </div>
          )}

          <label className="form-label fw-bold">Número de mesa:</label>
          <input
            type="text"
            className="waiter-cart-mesa-input"
            placeholder="Ej: Mesa 5"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            disabled={editingOrder !== null}
          />

          <label className="form-label fw-bold" style={{marginTop: '1rem'}}>Notas / Observaciones:</label>
          <textarea
            className="waiter-cart-mesa-input"
            placeholder="Ej: Para llevar, sin cebolla, extra picante..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            style={{resize: 'vertical', fontFamily: 'inherit', padding: '0.75rem'}}
          />

          <button 
            className="waiter-cart-send-btn"
            onClick={handleSendOrder}
            disabled={selectedDishes.length === 0 || !mesa}
          >
            {editingOrder ? '✓ Agregar a la Orden' : '✓ Enviar Orden a Cocina'}
          </button>
          
          {editingOrder && (
            <button 
              className="waiter-cart-send-btn"
              onClick={handleCancelEdit}
              style={{background: '#6c757d', marginTop: '0.5rem'}}
            >
              ✕ Cancelar Edición
            </button>
          )}
        </div>
      </div>

      {/* Modal de Órdenes Pendientes */}
      {showPendingOrders && (
        <div className="waiter-modal-overlay" onClick={() => setShowPendingOrders(false)}>
          <div className="waiter-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="waiter-modal-header">
              <h3>📋 Órdenes Pendientes de Cobrar</h3>
              <button onClick={() => setShowPendingOrders(false)} className="waiter-modal-close">✕</button>
            </div>
            <div className="waiter-modal-body">
              {pendingOrders.length === 0 ? (
                <p style={{textAlign: 'center', padding: '2rem', color: '#666'}}>No hay órdenes pendientes</p>
              ) : (
                <div style={{display: 'grid', gap: '1rem'}}>
                  {pendingOrders.map(order => (
                    <div key={order.id} className="pending-order-card">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem'}}>
                        <div>
                          <h4 style={{margin: 0, color: '#8b4513'}}>
                            Orden #{order.daily_order_number || order.id}
                          </h4>
                          <p style={{margin: '0.25rem 0', fontSize: '0.9rem', color: '#666'}}>
                            Mesa: {order.mesa}{order.waiter_name && ` | Mesero: ${order.waiter_name}`}
                          </p>
                          {order.notes && (
                            <p style={{margin: '0.5rem 0', fontSize: '0.85rem', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px'}}>
                              📝 {order.notes}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleEditOrder(order)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          ✏️ Editar
                        </button>
                      </div>
                      <div style={{borderTop: '1px solid #dee2e6', paddingTop: '0.75rem'}}>
                        <strong style={{fontSize: '0.9rem', color: '#666'}}>Platillos:</strong>
                        <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}}>
                          {order.dishes && order.dishes.map((dish, idx) => (
                            <li key={idx} style={{marginBottom: '0.25rem', fontSize: '0.9rem'}}>
                              {dish.name} - Q{parseFloat(dish.price).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        <div style={{marginTop: '0.75rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', color: '#b85c00'}}>
                          Total: Q{order.total ? parseFloat(order.total).toFixed(2) : '0.00'}
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
    </div>
  );
};

export default WaiterScreen;
