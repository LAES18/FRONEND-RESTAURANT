import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Collapse } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? '/api'
    : 'http://localhost:3001/api');

// Usa siempre `${API_URL}/api/` como prefijo para todos los endpoints de API en Railway.

const WaiterScreen = () => {
  const [dishes, setDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [mesa, setMesa] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDishes = () => {
      axios.get(`${API_URL}/api/dishes`)
        .then(response => {
          const defaultImages = {
            desayuno: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            almuerzo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
            cena: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
          };
          const dishesWithImages = response.data.map(dish => ({
            ...dish,
            image: dish.image || defaultImages[dish.type] || defaultImages.default
          }));
          setDishes(dishesWithImages);
        })
        .catch(error => console.error('Error al obtener los platillos:', error));
    };
    fetchDishes();
  }, []);

  useEffect(() => {
    if (tipo === 'todos') {
      setFilteredDishes(dishes);
    } else {
      setFilteredDishes(dishes.filter(d => d.type === tipo));
    }
  }, [tipo, dishes]);

  const handleSelectDish = (dish) => {
    setSelectedDishes([...selectedDishes, dish]);
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
    const orderData = {
      dishes: selectedDishes.map(dish => ({ dish_id: dish.id })),
      user_id: 1, // Reemplazar con el usuario real si tienes auth
      mesa,
    };
    axios.post(`${API_URL}/api/orders`, orderData)
      .then(() => {
        Swal.fire({icon: 'success', title: '¡Orden enviada!', text: 'La orden fue enviada exitosamente.'});
        setSelectedDishes([]);
        setMesa('');
      })
      .catch(error => {
        Swal.fire({icon: 'error', title: 'Error', text: 'Error al enviar la orden.'});
        console.error('Error al enviar la orden:', error);
      });
  };

  const calculateTotal = () => {
    return selectedDishes.reduce((total, dish) => total + (parseFloat(dish.price) || 0), 0).toFixed(2);
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
    <div className="container-fluid py-4 waiter-bg" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-start mb-2">
        <button className="btn btn-outline-danger" onClick={handleLogout}>Cerrar sesión</button>
      </div>
      <h1 className="mb-4 text-center waiter-title">🍽️ Pantalla del Mesero</h1>

      {/* Filtro por tipo de platillo */}
      <div className="row mb-4 justify-content-center">
        <div className="col-md-3 col-12 mb-2">
          <label className="form-label waiter-label">Filtrar por tipo:</label>
          <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="desayuno">Desayuno</option>
            <option value="almuerzo">Almuerzo</option>
            <option value="cena">Cena</option>
          </select>
        </div>
      </div>

      {/* Lista de platillos */}
      <div className="row">
        {filteredDishes.map(dish => (
          <div className="col-md-4 col-sm-6 mb-4" key={dish.id}>
            <div className="card h-100">
              <img src={dish.image} className="card-img-top" alt={dish.name} />
              <div className="card-body">
                <h5 className="card-title">{dish.name}</h5>
                <p className="card-text">Tipo: {dish.type}</p>
                <p className="card-text">Precio: ${dish.price}</p>
                <button className="btn btn-primary" onClick={() => handleSelectDish(dish)}>Elegir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón para desplegar carrito */}
      <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 1060 }}>
        <button
          className="btn btn-secondary rounded-circle p-3 shadow"
          onClick={() => setCartOpen(!cartOpen)}
          aria-controls="cart-collapse"
          aria-expanded={cartOpen}
          style={{ fontSize: '1.5rem', width: '70px', height: '70px' }}
        >
          🛒
        </button>
      </div>

      {/* Carrito de platillos seleccionados */}
      <Collapse in={cartOpen}>
        <div id="cart-collapse" className="position-fixed top-0 end-0 mt-5 me-3 p-4 border rounded shadow-sm bg-light" style={{ width: '300px', zIndex: 1050 }}>
          <h3 className="text-center">🛒 Carrito</h3>
          {selectedDishes.length === 0 ? (
            <p className="text-center">No hay platillos seleccionados.</p>
          ) : (
            <ul className="list-group mb-3">
              {selectedDishes.map((dish, index) => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                  {dish.name} - ${dish.price}
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveDish(index)}>Eliminar</button>
                </li>
              ))}
            </ul>
          )}

          {/* Total */}
          <div className="text-center mb-3">
            <h5>Total: ${calculateTotal()}</h5>
          </div>

          {/* Formulario para enviar la orden */}
          <div className="mt-4">
            <label className="form-label waiter-label">Número de mesa:</label>
            <input
              type="text"
              className="form-control mb-3"
              value={mesa}
              onChange={e => setMesa(e.target.value)}
              placeholder="Ingresa el número de mesa"
            />
            <button className="btn btn-success w-100" onClick={handleSendOrder}>Enviar Orden</button>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

export default WaiterScreen;