import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Collapse } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaUtensils, FaShoppingCart, FaPlus, FaTrash, FaPaperPlane, FaSignOutAlt, FaFilter } from 'react-icons/fa';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://backend-restaurant-production-b56f.up.railway.app';

// Usa siempre `${API_URL}/api/` como prefijo para todos los endpoints de API en Railway.

const WaiterScreen = () => {
  const [dishes, setDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [mesa, setMesa] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
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
  return (selectedDishes.reduce((total, dish) => total + (parseFloat(dish.price) || 0), 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    <div className="container-fluid p-0">
      {/* Header responsivo del restaurante mejorado */}
      <header className="restaurant-header position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'linear-gradient(135deg, rgba(184, 92, 0, 0.95), rgba(139, 69, 19, 0.90))',
          backdropFilter: 'blur(10px)'
        }}></div>
        <div className="container position-relative">
          <div className={`${isMobile ? 'd-grid gap-4' : 'd-flex justify-content-between align-items-center'}`}>
            <div className={`${isMobile ? 'text-center' : ''} position-relative`}>
              <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-2">
                <div className="me-3 p-3 rounded-circle" style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <FaUtensils size={24} style={{color: '#fff'}} />
                </div>
                <div>
                  <h1 className="restaurant-title mb-1" style={{
                    fontSize: isMobile ? '1.8rem' : '2.2rem',
                    fontWeight: '700',
                    background: 'linear-gradient(45deg, #fff, #f8f9fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    Sistema de Meseros
                  </h1>
                  <p className="restaurant-subtitle mb-0" style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '400'
                  }}>
                    Gestión de Órdenes y Pedidos • RestoSmart
                  </p>
                </div>
              </div>
            </div>
            <button 
              className={`btn ${isMobile ? 'w-100 py-3' : 'px-4 py-2'} border-0 rounded-pill`}
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(45deg, #dc3545, #c82333)',
                color: 'white',
                fontWeight: '600',
                fontSize: isMobile ? '1.1rem' : '0.95rem',
                boxShadow: '0 4px 15px rgba(220, 53, 69, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.4)';
              }}
            >
              <FaSignOutAlt className="me-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container-fluid py-5" style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div className="row justify-content-center">
          <div className="col-12 col-xl-11">
            {/* Panel de control elegante */}
            <div className="card border-0 shadow-lg mb-5" style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              overflow: 'hidden'
            }}>
              <div className="card-header border-0 py-4" style={{
                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                color: 'white'
              }}>
                <div className="d-flex align-items-center justify-content-center">
                  <FaShoppingCart className="me-3" size={24} />
                  <h4 className="mb-0 fw-bold">Panel de Órdenes</h4>
                </div>
              </div>
              
              <div className="card-body p-4">
                {/* Filtros elegantes */}
                <div className="row g-3">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, #fff, #f8f9fa)',
                      border: '1px solid rgba(184, 92, 0, 0.1)'
                    }}>
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="me-3 p-2 rounded-circle" style={{
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                            color: 'white'
                          }}>
                            <FaFilter size={16} />
                          </div>
                          <h5 className="mb-0 fw-bold" style={{color: 'var(--primary-dark)'}}>
                            Filtrar Menú por Categoría
                          </h5>
                        </div>
                        
                        <div className={`${isMobile ? 'd-grid gap-2' : 'd-flex flex-wrap justify-content-center gap-3'}`}>
                          {[
                            {value: 'todos', label: 'Todos', icon: '🍽️'},
                            {value: 'desayuno', label: 'Desayuno', icon: '☀️'},
                            {value: 'almuerzo', label: 'Almuerzo', icon: '🌅'},
                            {value: 'cena', label: 'Cena', icon: '🌙'},
                            {value: 'bebida', label: 'Bebidas', icon: '🥤'},
                            {value: 'postre', label: 'Postres', icon: '🧁'}
                          ].map((category, index) => (
                            <button
                              key={category.value}
                              type="button"
                              className={`btn border-0 ${isMobile ? 'w-100 py-3' : 'px-4 py-2'} fw-semibold position-relative overflow-hidden`}
                              onClick={() => setTipo(category.value)}
                              style={{
                                minWidth: isMobile ? 'auto' : '140px',
                                borderRadius: '12px',
                                fontSize: isMobile ? '1.1rem' : '0.95rem',
                                background: tipo === category.value 
                                  ? 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))'
                                  : 'linear-gradient(135deg, #fff, #f8f9fa)',
                                color: tipo === category.value ? 'white' : 'var(--primary-dark)',
                                boxShadow: tipo === category.value 
                                  ? '0 8px 25px rgba(184, 92, 0, 0.3)' 
                                  : '0 2px 10px rgba(0,0,0,0.08)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: tipo === category.value ? 'translateY(-2px)' : 'translateY(0)',
                                border: tipo === category.value 
                                  ? '2px solid var(--primary-color)' 
                                  : '2px solid rgba(184, 92, 0, 0.1)'
                              }}
                              onMouseEnter={(e) => {
                                if (tipo !== category.value) {
                                  e.target.style.transform = 'translateY(-3px)';
                                  e.target.style.boxShadow = '0 6px 20px rgba(184, 92, 0, 0.2)';
                                  e.target.style.borderColor = 'var(--primary-light)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (tipo !== category.value) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                                  e.target.style.borderColor = 'rgba(184, 92, 0, 0.1)';
                                }
                              }}
                            >
                              <span className="me-2">{category.icon}</span>
                              {category.label}
                              {tipo === category.value && (
                                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                                  animation: 'shimmer 2s infinite'
                                }}></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de platillos elegante */}
            <div className="row g-4">
              {filteredDishes.map(dish => (
                <div className={`${isMobile ? 'col-12' : 'col-xl-3 col-lg-4 col-md-6'}`} key={dish.id}>
                  <div className="card border-0 shadow-lg h-100 overflow-hidden" style={{
                    borderRadius: '20px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(184, 92, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                  }}>
                    <div className="position-relative overflow-hidden">
                      <img 
                        src={dish.image} 
                        className="card-img-top" 
                        alt={dish.name}
                        style={{
                          height: isMobile ? '180px' : '220px',
                          objectFit: 'cover',
                          borderRadius: '20px 20px 0 0',
                          transition: 'transform 0.4s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                      
                      {/* Overlay gradient */}
                      <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)'
                      }}></div>
                      
                      {/* Category badge elegante */}
                      <div className="position-absolute top-0 start-0 m-3">
                        <span className="badge border-0 px-3 py-2" style={{
                          background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          borderRadius: '12px',
                          boxShadow: '0 4px 15px rgba(184, 92, 0, 0.4)',
                          textTransform: 'capitalize'
                        }}>
                          {dish.type}
                        </span>
                      </div>
                      
                      {/* Price badge flotante */}
                      <div className="position-absolute bottom-0 end-0 m-3">
                        <div className="badge px-3 py-2 border-0" style={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          color: 'var(--primary-dark)',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          borderRadius: '12px',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                        }}>
                          ${(Number(dish.price) || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-body p-4 d-flex flex-column">
                      <h5 className="card-title mb-3 fw-bold" style={{
                        color: 'var(--primary-dark)',
                        fontSize: '1.3rem',
                        lineHeight: '1.3'
                      }}>
                        {dish.name}
                      </h5>
                      
                      <p className="card-text flex-grow-1 text-muted mb-4" style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                      }}>
                        Exquisito platillo de la casa, preparado con ingredientes frescos y de la más alta calidad.
                      </p>
                      
                      <div className="mt-auto">
                        <button
                          className="btn w-100 border-0 py-3 fw-bold"
                          onClick={() => handleSelectDish(dish)}
                          style={{
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                            color: 'white',
                            borderRadius: '15px',
                            fontSize: '1rem',
                            boxShadow: '0 6px 20px rgba(184, 92, 0, 0.3)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(184, 92, 0, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 6px 20px rgba(184, 92, 0, 0.3)';
                          }}
                        >
                          <FaPlus className="me-2" />
                          Agregar al Pedido
                          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                            animation: 'shimmer 3s infinite'
                          }}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Botón flotante del carrito mejorado */}
      <div 
        className={`position-fixed ${isMobile ? 'bottom-0 end-0 m-3' : 'bottom-0 end-0 m-4'} ${cartShake ? 'cart-shake' : ''}`}
        style={{ zIndex: 1060 }}
      >
        <button
          className="btn rounded-circle shadow-lg border-0"
          onClick={() => setCartOpen(!cartOpen)}
          style={{
            width: isMobile ? '65px' : '75px',
            height: isMobile ? '65px' : '75px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
            color: 'white',
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            boxShadow: '0 8px 25px rgba(184, 92, 0, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px) scale(1.05)';
            e.target.style.boxShadow = '0 12px 35px rgba(184, 92, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 8px 25px rgba(184, 92, 0, 0.4)';
          }}
        >
          <FaShoppingCart />
          {selectedDishes.length > 0 && (
            <span 
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill d-flex align-items-center justify-content-center"
              style={{
                fontSize: '0.7rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                minWidth: '24px',
                height: '24px',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.4)',
                animation: selectedDishes.length > 0 ? 'pulse 2s infinite' : 'none'
              }}
            >
              {selectedDishes.length}
            </span>
          )}
          
          {/* Efecto shimmer en el botón */}
          <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle" style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
            animation: 'shimmer 3s infinite',
            pointerEvents: 'none'
          }}></div>
        </button>
        
        {/* Indicador de carrito activo */}
        {cartOpen && (
          <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-3" style={{
            borderColor: 'rgba(255, 255, 255, 0.8) !important',
            animation: 'pulse 1.5s infinite',
            pointerEvents: 'none'
          }}></div>
        )}
      </div>

      {/* Overlay para mobile */}
      {cartOpen && isMobile && (
        <div 
          className="cart-overlay"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Panel del carrito mejorado */}
      <Collapse in={cartOpen}>
        <div 
          className={`position-fixed ${isMobile ? 'bottom-0 start-0 end-0' : 'bottom-0 end-0'} ${isMobile ? 'mb-0 mx-0' : 'mb-5 me-4'}`}
          style={{ 
            width: isMobile ? '100%' : '400px',
            zIndex: 1050,
            maxHeight: isMobile ? '85vh' : '75vh',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'slideInCart 0.3s ease-out'
          }}
        >
          <div className="restaurant-card" style={{
            borderRadius: isMobile ? '20px 20px 0 0' : '20px',
            border: '2px solid rgba(184, 92, 0, 0.2)',
            boxShadow: isMobile 
              ? '0 -10px 30px rgba(184, 92, 0, 0.2)' 
              : '0 15px 40px rgba(184, 92, 0, 0.25)',
            backdropFilter: 'blur(15px)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.95) 100%)'
          }}>
            <div className="card-header border-0 py-4" style={{
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
              color: 'white',
              borderRadius: isMobile ? '18px 18px 0 0' : '18px 18px 0 0'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="me-3 p-2 rounded-circle" style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <FaShoppingCart size={20} />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">Carrito de Pedidos</h5>
                    <small className="opacity-75">
                      {selectedDishes.length} {selectedDishes.length === 1 ? 'artículo' : 'artículos'}
                    </small>
                  </div>
                </div>
                <button 
                  className="btn-close btn-close-white p-2"
                  onClick={() => setCartOpen(false)}
                  aria-label="Cerrar"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                ></button>
              </div>
            </div>
            
            <div className="card-body p-4" style={{
              maxHeight: isMobile ? 'calc(85vh - 120px)' : 'calc(75vh - 120px)',
              overflowY: 'auto'
            }}>
              {selectedDishes.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4" style={{
                    fontSize: '4rem',
                    color: 'var(--accent-color)',
                    opacity: '0.7'
                  }}>
                    <FaShoppingCart />
                  </div>
                  <h6 className="text-muted mb-2">Carrito vacío</h6>
                  <p className="text-muted small mb-0">
                    Agrega platillos del menú para crear una orden
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 text-muted">Platillos seleccionados</h6>
                      <span className="badge rounded-pill" style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                        color: 'white'
                      }}>
                        {selectedDishes.length}
                      </span>
                    </div>
                    
                    <div style={{maxHeight: '280px', overflowY: 'auto'}}>
                      {selectedDishes.map((dish, index) => (
                        <div key={index} className="card border-0 mb-3 shadow-sm" style={{
                          borderRadius: '12px',
                          border: '1px solid rgba(184, 92, 0, 0.1)',
                          transition: 'all 0.3s ease'
                        }}>
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="card-title mb-1 fw-bold" style={{
                                  color: 'var(--primary-dark)',
                                  fontSize: '0.95rem'
                                }}>
                                  {dish.name}
                                </h6>
                                <p className="card-text small text-muted mb-2" style={{
                                  textTransform: 'capitalize'
                                }}>
                                  {dish.type}
                                </p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="fw-bold h6 mb-0" style={{
                                    color: 'var(--primary-color)',
                                    fontSize: '1.1rem'
                                  }}>
                                    ${(Number(dish.price) || 0).toFixed(2)}
                                  </span>
                                  <button
                                    className="btn btn-sm border-0"
                                    onClick={() => handleRemoveDish(index)}
                                    style={{
                                      background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                      color: 'white',
                                      borderRadius: '8px',
                                      padding: '6px 8px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = 'scale(1.1)';
                                      e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = 'scale(1)';
                                      e.target.style.boxShadow = 'none';
                                    }}
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sección de total y envío */}
                  <div className="border-top pt-4">
                    <div className="card border-0 mb-4" style={{
                      background: 'linear-gradient(135deg, rgba(184, 92, 0, 0.1), rgba(255, 248, 225, 0.8))',
                      borderRadius: '15px',
                      border: '2px solid rgba(184, 92, 0, 0.2)'
                    }}>
                      <div className="card-body p-3 text-center">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h6 mb-0 fw-bold" style={{color: 'var(--primary-dark)'}}>
                            Total del pedido:
                          </span>
                          <span className="h4 mb-0 fw-bold" style={{color: 'var(--primary-color)'}}>
                            ${calculateTotal()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          id="mesaCartInput"
                          placeholder="Número de Mesa"
                          value={mesa}
                          onChange={(e) => setMesa(e.target.value)}
                          style={{
                            borderRadius: '12px',
                            fontSize: '1rem',
                            height: '55px',
                            background: '#fff',
                            border: '2px solid rgba(184, 92, 0, 0.2) !important',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary-color)';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(184, 92, 0, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(184, 92, 0, 0.2)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <label htmlFor="mesaCartInput" className="fw-semibold" style={{color: 'var(--primary-dark)'}}>
                          <FaUtensils className="me-2" size={14} />
                          Número de Mesa
                        </label>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        className="btn border-0 py-3 fw-bold"
                        onClick={handleSendOrder}
                        disabled={!mesa.trim() || selectedDishes.length === 0}
                        style={{
                          background: mesa.trim() && selectedDishes.length > 0
                            ? 'linear-gradient(135deg, #28a745, #20c997)'
                            : 'linear-gradient(135deg, #6c757d, #5a6268)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '1rem',
                          minHeight: '50px',
                          boxShadow: mesa.trim() && selectedDishes.length > 0
                            ? '0 6px 20px rgba(40, 167, 69, 0.3)'
                            : '0 2px 10px rgba(108, 117, 125, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          if (mesa.trim() && selectedDishes.length > 0) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (mesa.trim() && selectedDishes.length > 0) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.3)';
                          }
                        }}
                      >
                        <FaPaperPlane className="me-2" />
                        Enviar Orden a Cocina
                        {mesa.trim() && selectedDishes.length > 0 && (
                          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                            animation: 'shimmer 3s infinite'
                          }}></div>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Collapse>

      <style>{`
        :root {
          --primary-color: #b85c00;
          --primary-dark: #8b4513;
          --primary-light: #d4a574;
          --accent-color: #bfa76a;
        }
        
        .restaurant-card {
          background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
          border: none;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(184, 92, 0, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(184, 92, 0, 0.1);
        }
        
        .restaurant-form-control {
          border: 2px solid rgba(184, 92, 0, 0.2);
          border-radius: 12px;
          padding: 12px 15px;
          font-size: 0.95rem;
          background: #fff;
          transition: all 0.3s ease;
        }
        
        .restaurant-form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(184, 92, 0, 0.25);
          outline: none;
        }
        
        .btn-restaurant-success {
          background: linear-gradient(135deg, #28a745, #20c997);
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        
        .btn-restaurant-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }
        
        .btn-restaurant-success:disabled {
          opacity: 0.6;
          transform: none;
          box-shadow: none;
        }
        
        .cart-shake {
          animation: shake-cart 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes shake-cart {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        
        @keyframes slideInCart {
          from { 
            opacity: 0;
            transform: translateY(100%) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Animación para items del carrito */
        .card-body .card {
          animation: fadeInUp 0.3s ease-out;
          animation-fill-mode: both;
        }
        
        .card-body .card:nth-child(1) { animation-delay: 0.1s; }
        .card-body .card:nth-child(2) { animation-delay: 0.2s; }
        .card-body .card:nth-child(3) { animation-delay: 0.3s; }
        .card-body .card:nth-child(4) { animation-delay: 0.4s; }
        .card-body .card:nth-child(5) { animation-delay: 0.5s; }
        
        /* Scrollbar mejorado para el carrito */
        .card-body::-webkit-scrollbar {
          width: 6px;
        }
        
        .card-body::-webkit-scrollbar-track {
          background: rgba(184, 92, 0, 0.1);
          border-radius: 10px;
        }
        
        .card-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
          border-radius: 10px;
        }
        
        .card-body::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark);
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(184, 92, 0, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(184, 92, 0, 0.4); }
          50% { transform: scale(1.02); }
          70% { box-shadow: 0 0 0 10px rgba(184, 92, 0, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(184, 92, 0, 0); }
        }
        
        .btn:hover {
          transform: translateY(-3px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Animaciones de entrada */
        .restaurant-header {
          animation: slideDown 0.6s ease-out;
        }
        
        @keyframes slideDown {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .card {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark);
        }
        
        /* Efectos de focus mejorados */
        .form-control:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(184, 92, 0, 0.2) !important;
          border-color: var(--primary-color) !important;
        }
        
        /* Mejoras responsive para el carrito */
        @media (max-width: 768px) {
          .cart-shake {
            animation-duration: 0.3s;
          }
          
          .restaurant-card {
            max-height: 90vh !important;
          }
          
          .card-body {
            padding: 1.5rem !important;
          }
        }
        
        /* Efecto hover para elementos del carrito */
        .card-body .card:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 15px rgba(184, 92, 0, 0.15);
          border-color: var(--primary-light) !important;
        }
        
        /* Animación para el badge del carrito */
        .badge {
          animation: bounceIn 0.5s ease-out;
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Mejora del overlay cuando el carrito está abierto */
        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
          z-index: 1040;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default WaiterScreen;