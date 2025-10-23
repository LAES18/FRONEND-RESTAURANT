import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaUtensils, FaCheck, FaClock, FaFire, FaSignOutAlt, FaPlay, FaChartLine, FaExclamationTriangle, FaListAlt, FaCheckCircle } from 'react-icons/fa';

// Usa siempre `${API_URL}/api/` como prefijo para todos los endpoints de API en Railway.
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://backend-restaurant-production-b56f.up.railway.app';

const KitchenScreen = () => {
  const [orders, setOrders] = useState([]);
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

  const handleStartOrder = (orderId) => {
    axios.patch(`${API_URL}/api/orders/${orderId}`, { status: 'en_proceso' })
      .then(() => {
        Swal.fire({icon: 'info', title: '¡En proceso!', text: 'Orden marcada en preparación'});
        // Actualizar el estado local
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'en_proceso' }
            : order
        ));
      })
      .catch(error => {
        Swal.fire({icon: 'error', title: 'Error', text: 'Error al actualizar la orden'});
        console.error('Error al actualizar la orden:', error);
      });
  };

  const handleMarkAsReady = (orderId) => {
    axios.patch(`${API_URL}/api/orders/${orderId}`, { status: 'servido' })
      .then(() => {
        Swal.fire({icon: 'success', title: '¡Listo!', text: 'Orden marcada como lista para servir'});
        setOrders(orders.filter(order => order.id !== orderId));
      })
      .catch(error => {
        Swal.fire({icon: 'error', title: 'Error', text: 'Error al actualizar la orden'});
        console.error('Error al actualizar la orden:', error);
      });
  };

  const getOrderPriority = (order) => {
    const now = new Date();
    const created = new Date(order.created_at);
    const minutesAgo = Math.floor((now - created) / (1000 * 60));
    
    if (minutesAgo > 20) return 'high';
    if (minutesAgo > 10) return 'medium';
    return 'normal';
  };

  const formatTimeAgo = (order) => {
    const now = new Date();
    const created = new Date(order.created_at);
    const minutesAgo = Math.floor((now - created) / (1000 * 60));
    
    if (minutesAgo < 1) return 'Hace menos de 1 min';
    if (minutesAgo < 60) return `Hace ${minutesAgo} min`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `Hace ${hoursAgo}h ${minutesAgo % 60}min`;
  };

  const renderOrderCard = (order, priority) => {
    const isInProcess = order.status === 'en_proceso';
    
    return (
      <div key={order.id} className={`${isMobile ? 'col-12' : 'col-xl-4 col-lg-6'}`}>
        <div 
          className="card border-0 shadow-lg h-100 overflow-hidden"
          style={{
            borderRadius: '20px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: priority === 'high' 
              ? 'linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%)' 
              : priority === 'medium'
              ? 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)'
              : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            border: priority === 'high' 
              ? '2px solid rgba(220, 53, 69, 0.3)' 
              : priority === 'medium'
              ? '2px solid rgba(255, 193, 7, 0.3)'
              : '2px solid rgba(184, 92, 0, 0.1)',
            animation: priority === 'high' ? 'urgentPulse 2s infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = priority === 'high'
              ? '0 20px 40px rgba(220, 53, 69, 0.3)'
              : '0 20px 40px rgba(184, 92, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          }}
        >
          {/* Header de la orden elegante */}
          <div className="position-relative">
            <div className="card-header border-0 py-4" style={{
              background: isInProcess 
                ? 'linear-gradient(135deg, #ffc107, #e0a800)'
                : priority === 'high'
                ? 'linear-gradient(135deg, #dc3545, #c82333)'
                : 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
              color: 'white'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <div className="me-3 p-2 rounded-circle" style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <FaUtensils size={18} />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">Orden #{order.id}</h5>
                    <small className="opacity-75">
                      Mesa {order.mesa || 'N/A'} • {formatTimeAgo(order)}
                    </small>
                  </div>
                </div>
                
                {/* Badge de estado */}
                <div className="d-flex align-items-center gap-2">
                  {priority === 'high' && (
                    <span className="badge bg-danger px-3 py-2 rounded-pill">
                      <FaExclamationTriangle className="me-1" size={12} />
                      Urgente
                    </span>
                  )}
                  {priority === 'medium' && (
                    <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
                      <FaClock className="me-1" size={12} />
                      Prioridad
                    </span>
                  )}
                  <span className={`badge px-3 py-2 rounded-pill ${
                    isInProcess ? 'bg-warning text-dark' : 'bg-light text-dark'
                  }`}>
                    {isInProcess ? (
                      <>
                        <FaFire className="me-1" size={12} />
                        Preparando
                      </>
                    ) : (
                      <>
                        <FaClock className="me-1" size={12} />
                        Pendiente
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Shimmer effect para órdenes urgentes */}
            {priority === 'high' && (
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                animation: 'shimmer 2s infinite',
                borderRadius: '20px 20px 0 0'
              }}></div>
            )}
          </div>
          
          {/* Contenido de la orden */}
          <div className="card-body p-4">
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <div className="me-2 p-2 rounded-circle" style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaListAlt size={14} />
                </div>
                <h6 className="mb-0 fw-bold" style={{color: 'var(--primary-dark)'}}>
                  Platillos del pedido ({order.dishes ? order.dishes.length : 0})
                </h6>
              </div>
              
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                {order.dishes && order.dishes.map((dish, i) => (
                  <div key={i} className="card border-0 mb-2 shadow-sm" style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(184, 92, 0, 0.1)',
                    background: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title mb-1 fw-bold" style={{
                            color: 'var(--primary-dark)',
                            fontSize: '0.95rem'
                          }}>
                            {dish.name}
                          </h6>
                          <p className="card-text small text-muted mb-0" style={{
                            textTransform: 'capitalize'
                          }}>
                            {dish.type}
                          </p>
                        </div>
                        <span className="fw-bold h6 mb-0" style={{
                          color: 'var(--primary-color)',
                          fontSize: '1.1rem'
                        }}>
                          ${dish.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Botón de acción elegante */}
            <div className="d-grid">
              {!isInProcess ? (
                <button
                  className="btn border-0 py-3 fw-bold"
                  onClick={() => handleStartOrder(order.id)}
                  style={{
                    background: 'linear-gradient(135deg, #ffc107, #e0a800)',
                    color: 'white',
                    borderRadius: '15px',
                    fontSize: '1.1rem',
                    boxShadow: '0 6px 20px rgba(255, 193, 7, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(255, 193, 7, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.3)';
                  }}
                >
                  <FaPlay className="me-2" />
                  Comenzar Preparación
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                    animation: 'shimmer 3s infinite'
                  }}></div>
                </button>
              ) : (
                <button
                  className="btn border-0 py-3 fw-bold"
                  onClick={() => handleMarkAsReady(order.id)}
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    color: 'white',
                    borderRadius: '15px',
                    fontSize: '1.1rem',
                    boxShadow: '0 6px 20px rgba(40, 167, 69, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: priority === 'high' ? 'urgentButton 1.5s infinite' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.3)';
                  }}
                >
                  <FaCheckCircle className="me-2" />
                  Marcar como Listo
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                    animation: 'shimmer 3s infinite'
                  }}></div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
      {/* Header elegante del sistema de cocina */}
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
                  <FaFire size={24} style={{color: '#fff'}} />
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
                    Sistema de Cocina
                  </h1>
                  <p className="restaurant-subtitle mb-0" style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '400'
                  }}>
                    Gestión de Pedidos y Preparación • RestoSmart
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
            {/* Panel de estadísticas elegante */}
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
                  <FaChartLine className="me-3" size={24} />
                  <h4 className="mb-0 fw-bold">Panel de Control de Cocina</h4>
                </div>
              </div>
              
              <div className="card-body p-4">
                <div className="row g-4">
                  {/* Estadística de órdenes pendientes */}
                  <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
                    <div className="card border-0 h-100" style={{
                      background: 'linear-gradient(135deg, rgba(23, 162, 184, 0.1), rgba(23, 162, 184, 0.05))',
                      borderRadius: '15px',
                      border: '2px solid rgba(23, 162, 184, 0.2)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div className="card-body text-center py-4">
                        <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                          background: 'linear-gradient(135deg, #17a2b8, #138496)',
                          color: 'white',
                          width: '70px',
                          height: '70px'
                        }}>
                          <FaClock size={isMobile ? 20 : 24} />
                        </div>
                        <h2 className="fw-bold mb-1" style={{color: '#17a2b8', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                          {orders.filter(o => o.status === 'pendiente').length}
                        </h2>
                        <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                          Pendientes
                        </h6>
                        <small className="text-muted">Por iniciar</small>
                      </div>
                    </div>
                  </div>

                  {/* Estadística de órdenes en preparación */}
                  <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
                    <div className="card border-0 h-100" style={{
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 193, 7, 0.2)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div className="card-body text-center py-4">
                        <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                          background: 'linear-gradient(135deg, #ffc107, #e0a800)',
                          color: 'white',
                          width: '70px',
                          height: '70px'
                        }}>
                          <FaFire size={isMobile ? 20 : 24} />
                        </div>
                        <h2 className="fw-bold mb-1" style={{color: '#ffc107', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                          {orders.filter(o => o.status === 'en_proceso').length}
                        </h2>
                        <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                          En Preparación
                        </h6>
                        <small className="text-muted">Cocinando</small>
                      </div>
                    </div>
                  </div>

                  {/* Estadística total de órdenes activas */}
                  <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
                    <div className="card border-0 h-100" style={{
                      background: 'linear-gradient(135deg, rgba(184, 92, 0, 0.1), rgba(184, 92, 0, 0.05))',
                      borderRadius: '15px',
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
                          <FaListAlt size={isMobile ? 20 : 24} />
                        </div>
                        <h2 className="fw-bold mb-1" style={{color: 'var(--primary-color)', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                          {orders.length}
                        </h2>
                        <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                          Total Activas
                        </h6>
                        <small className="text-muted">En cocina</small>
                      </div>
                    </div>
                  </div>

                  {/* Estadística de órdenes urgentes */}
                  <div className={`${isMobile ? 'col-6' : 'col-lg-3 col-md-6'}`}>
                    <div className="card border-0 h-100" style={{
                      background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(220, 53, 69, 0.05))',
                      borderRadius: '15px',
                      border: '2px solid rgba(220, 53, 69, 0.2)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div className="card-body text-center py-4">
                        <div className="mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                          background: 'linear-gradient(135deg, #dc3545, #c82333)',
                          color: 'white',
                          width: '70px',
                          height: '70px',
                          animation: orders.filter(order => getOrderPriority(order) === 'high').length > 0 ? 'pulse 2s infinite' : 'none'
                        }}>
                          <FaExclamationTriangle size={isMobile ? 20 : 24} />
                        </div>
                        <h2 className="fw-bold mb-1" style={{color: '#dc3545', fontSize: isMobile ? '2rem' : '2.5rem'}}>
                          {orders.filter(order => getOrderPriority(order) === 'high').length}
                        </h2>
                        <h6 className="text-muted mb-0" style={{fontSize: isMobile ? '0.9rem' : '1rem'}}>
                          Urgentes
                        </h6>
                        <small className="text-muted">+20 minutos</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de órdenes elegante */}
            {orders.length === 0 ? (
              <div className="card border-0 shadow-lg" style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                overflow: 'hidden'
              }}>
                <div className="card-body text-center py-5">
                  <div className="mb-4 p-4 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                    color: 'white',
                    width: '120px',
                    height: '120px'
                  }}>
                    <FaCheckCircle size={50} />
                  </div>
                  <h4 className="fw-bold mb-3" style={{color: 'var(--primary-dark)'}}>
                    ¡Todo al día en cocina!
                  </h4>
                  <p className="text-muted mb-4" style={{fontSize: '1.1rem'}}>
                    No hay órdenes pendientes en este momento.<br/>
                    Todas las preparaciones han sido completadas.
                  </p>
                  <div className="d-flex justify-content-center gap-4 text-muted">
                    <div className="text-center">
                      <FaClock size={24} className="mb-2 d-block mx-auto" />
                      <small>Esperando nuevos pedidos</small>
                    </div>
                    <div className="text-center">
                      <FaFire size={24} className="mb-2 d-block mx-auto" />
                      <small>Cocina lista</small>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Sección de órdenes urgentes */}
                {orders.filter(order => getOrderPriority(order) === 'high').length > 0 && (
                  <div className="mb-5">
                    <div className="card border-0 shadow-lg mb-4" style={{
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(255, 193, 203, 0.2))',
                      border: '2px solid rgba(220, 53, 69, 0.3)'
                    }}>
                      <div className="card-header border-0 py-3" style={{
                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                        color: 'white',
                        borderRadius: '13px 13px 0 0'
                      }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <div className="me-3 p-2 rounded-circle" style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <FaExclamationTriangle size={20} />
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold">Órdenes Urgentes</h5>
                              <small className="opacity-75">Más de 20 minutos de espera</small>
                            </div>
                          </div>
                          <span className="badge bg-light text-dark px-3 py-2 rounded-pill fs-6">
                            {orders.filter(order => getOrderPriority(order) === 'high').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row g-4">
                      {orders
                        .filter(order => getOrderPriority(order) === 'high')
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                        .map(order => renderOrderCard(order, 'high'))}
                    </div>
                  </div>
                )}

                {/* Sección de órdenes en preparación */}
                {orders.filter(order => order.status === 'en_proceso').length > 0 && (
                  <div className="mb-5">
                    <div className="card border-0 shadow-lg mb-4" style={{
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 235, 59, 0.2))',
                      border: '2px solid rgba(255, 193, 7, 0.3)'
                    }}>
                      <div className="card-header border-0 py-3" style={{
                        background: 'linear-gradient(135deg, #ffc107, #e0a800)',
                        color: 'white',
                        borderRadius: '13px 13px 0 0'
                      }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <div className="me-3 p-2 rounded-circle" style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <FaFire size={20} />
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold">En Preparación</h5>
                              <small className="opacity-75">Órdenes siendo cocinadas</small>
                            </div>
                          </div>
                          <span className="badge bg-light text-dark px-3 py-2 rounded-pill fs-6">
                            {orders.filter(order => order.status === 'en_proceso').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row g-4">
                      {orders
                        .filter(order => order.status === 'en_proceso')
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                        .map(order => renderOrderCard(order, getOrderPriority(order)))}
                    </div>
                  </div>
                )}

                {/* Sección de órdenes pendientes */}
                {orders.filter(order => order.status === 'pendiente').length > 0 && (
                  <div className="mb-5">
                    <div className="card border-0 shadow-lg mb-4" style={{
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, rgba(23, 162, 184, 0.1), rgba(111, 207, 230, 0.2))',
                      border: '2px solid rgba(23, 162, 184, 0.3)'
                    }}>
                      <div className="card-header border-0 py-3" style={{
                        background: 'linear-gradient(135deg, #17a2b8, #138496)',
                        color: 'white',
                        borderRadius: '13px 13px 0 0'
                      }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <div className="me-3 p-2 rounded-circle" style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <FaClock size={20} />
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold">Pendientes de Comenzar</h5>
                              <small className="opacity-75">Listas para iniciar preparación</small>
                            </div>
                          </div>
                          <span className="badge bg-light text-dark px-3 py-2 rounded-pill fs-6">
                            {orders.filter(order => order.status === 'pendiente').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row g-4">
                      {orders
                        .filter(order => order.status === 'pendiente')
                        .sort((a, b) => {
                          // Primero por prioridad, luego por tiempo
                          const priorityOrder = { 'high': 0, 'medium': 1, 'normal': 2 };
                          const aPriority = priorityOrder[getOrderPriority(a)];
                          const bPriority = priorityOrder[getOrderPriority(b)];
                          if (aPriority !== bPriority) return aPriority - bPriority;
                          return new Date(a.created_at) - new Date(b.created_at);
                        })
                        .map(order => renderOrderCard(order, getOrderPriority(order)))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --primary-color: #b85c00;
          --primary-dark: #8b4513;
          --primary-light: #d4a574;
          --accent-color: #bfa76a;
        }
        
        /* Animaciones para órdenes urgentes */
        @keyframes urgentPulse {
          0% { 
            transform: scale(1);
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.2);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 15px 40px rgba(220, 53, 69, 0.4);
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.2);
          }
        }
        
        @keyframes urgentButton {
          0% { 
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
          }
          50% { 
            box-shadow: 0 8px 30px rgba(40, 167, 69, 0.6);
          }
          100% { 
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        /* Efectos hover para tarjetas */
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
        
        /* Mejoras responsive */
        @media (max-width: 768px) {
          .card-body {
            padding: 1.5rem !important;
          }
          
          .urgentPulse {
            animation-duration: 1.5s;
          }
        }
        
        /* Efecto hover para elementos de orden */
        .card-body .card:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 15px rgba(184, 92, 0, 0.15);
          border-color: var(--primary-light) !important;
        }
        
        /* Animación para badges */
        .badge {
          animation: bounceIn 0.5s ease-out;
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Estilos para las tarjetas de estadísticas */
        .card-body .card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-body .card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        /* Efectos especiales para botones */
        .btn {
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .btn:hover::before {
          left: 100%;
        }
      `}</style>
    </div>
  );
};

export default KitchenScreen;