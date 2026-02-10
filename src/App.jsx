import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useNavigate } from 'react-router-dom';

// Configuración de API URL - usa ruta relativa si VITE_API_URL está vacío
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 480;

  if (role) {
    return <RoleBasedPage role={role} />;
  }

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      fontFamily: 'Poppins, sans-serif'
    }}>
      {/* Lado izquierdo - Imagen de fondo */}
      <div style={{
        flex: isMobile ? 0 : 1,
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: isMobile ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
          }}>
            RestoSmart
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
          }}>
            Gestión inteligente para restaurantes modernos
          </p>
        </div>
      </div>

      {/* Panel de login - Diseño exacto como la imagen */}
      <div style={{
        flex: isMobile ? 1 : '0 0 500px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#333',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              {isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
            </h2>
            <p style={{
              color: '#888',
              fontSize: '14px',
              margin: 0
            }}>
              {isLogin ? 'Ingresa tus credenciales' : 'Completa los datos'}
            </p>
          </div>

          {/* Toggle buttons exactos como la imagen */}
          <div style={{
            textAlign: 'center',
            marginBottom: '15px'
          }}>
            <p style={{
              color: '#495057',
              fontSize: '14px',
              margin: 0,
              fontWeight: '500'
            }}>
              Selecciona una opción:
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            marginBottom: '30px',
            background: '#f8f9fa',
            borderRadius: '30px',
            padding: '5px',
            border: '2px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <button 
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: '15px 25px',
                border: 'none',
                borderRadius: '25px',
                background: isLogin ? '#007bff' : 'transparent',
                color: isLogin ? 'white' : '#495057',
                cursor: 'pointer',
                fontWeight: isLogin ? '600' : '500',
                fontSize: '15px',
                transition: 'all 300ms ease',
                boxShadow: isLogin ? '0 4px 15px rgba(0,123,255,0.3)' : 'none',
                transform: isLogin ? 'translateY(-1px)' : 'none'
              }}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: '15px 25px',
                border: 'none',
                borderRadius: '25px',
                background: !isLogin ? '#28a745' : 'transparent',
                color: !isLogin ? 'white' : '#495057',
                cursor: 'pointer',
                fontWeight: !isLogin ? '600' : '500',
                fontSize: '15px',
                transition: 'all 300ms ease',
                boxShadow: !isLogin ? '0 4px 15px rgba(40,167,69,0.3)' : 'none',
                transform: !isLogin ? 'translateY(-1px)' : 'none'
              }}
            >
              Registrarse
            </button>
          </div>

          {/* Indicador del formulario activo */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '10px',
            background: isLogin ? '#e3f2fd' : '#e8f5e8',
            borderRadius: '10px',
            border: `1px solid ${isLogin ? '#bbdefb' : '#c8e6c9'}`
          }}>
            <p style={{
              color: isLogin ? '#1976d2' : '#388e3c',
              fontSize: '14px',
              margin: 0,
              fontWeight: '600'
            }}>
              {isLogin ? 'Formulario de Inicio de Sesión' : 'Formulario de Registro'}
            </p>
          </div>

          {/* Formularios */}
          {isLogin ? (
            <LoginForm setRole={setRole} windowWidth={windowWidth} />
          ) : (
            <RegisterForm toggleForm={toggleForm} />
          )}

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <p style={{
              color: '#ccc',
              fontSize: '12px',
              margin: 0
            }}>
              © 2025 RestoSmart. Todos los derechos reservados.
            </p>
            
            {/* Botón de test para verificar conectividad */}
            <button 
              onClick={async () => {
                try {
                  console.log('Testing /api/users...');
                  const response = await fetch('/api/users');
                  console.log('Test response:', response.status, response.statusText);
                  if (response.ok) {
                    const data = await response.json();
                    console.log('Users data:', data);
                    alert(`Backend conectado! Usuarios encontrados: ${data.length}`);
                  } else {
                    alert(`Backend responde pero con error: ${response.status}`);
                  }
                } catch (error) {
                  console.error('Test error:', error);
                  alert(`Error de conexión: ${error.message}`);
                }
              }}
              style={{
                marginTop: '10px',
                padding: '8px 15px',
                fontSize: '11px',
                border: '1px solid #28a745',
                borderRadius: '6px',
                background: '#f8fff9',
                color: '#28a745',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔍 Test Backend Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ setRole, windowWidth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Usar API_URL configurado (ruta relativa o URL absoluta)
    const loginUrl = API_URL ? `${API_URL}/api/login` : '/api/login';
    
    try {
      console.log('Intentando login a:', loginUrl);
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
        
      console.log('Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login exitoso:', data);
        
        // Guardar toda la información del usuario en localStorage
        localStorage.setItem('user', JSON.stringify(data));
        
        setRole(data.role);
      } else {
        const errorData = await response.text();
        console.log('Error del servidor:', errorData);
        alert('Credenciales inválidas');
      }
    } catch (error) {
      console.error(`Error al intentar login:`, error);
      alert('Error de conexión. El servidor no está disponible.');
    }
  };

  return (
    <div style={{ width: '100%', display: 'block' }}>
      <form onSubmit={handleLogin} style={{ width: '100%', display: 'block' }}>
      {/* Contenedor responsive para los campos */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: windowWidth <= 768 ? '12px' : '15px',
        marginBottom: '15px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: windowWidth <= 768 ? '250px' : '200px',
            padding: '12px 15px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: windowWidth <= 768 ? '250px' : '200px',
            padding: '12px 15px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
      </div>

      {/* Botón de iniciar sesión - más pequeño y forzado abajo */}
      <div style={{ 
        width: '100%', 
        clear: 'both',
        marginTop: '10px'
      }}>
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 200ms ease',
            display: 'block',
            margin: '0 auto'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Iniciar Sesión
        </button>
      </div>

      {/* Enlace olvidaste contraseña - DESPUÉS del botón */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '15px'
      }}>
        <a href="#" style={{ 
          color: '#007bff', 
          textDecoration: 'none',
          fontSize: '13px'
        }}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
    </div>
  );
}

function RegisterForm({ toggleForm }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('mesero');

  const handleRegister = async (e) => {
    e.preventDefault();
    // Usar API_URL configurado (ruta relativa o URL absoluta)
    const registerUrl = API_URL ? `${API_URL}/api/register` : '/api/register';
    
    try {
      console.log('Intentando registro a:', registerUrl);
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Registro exitoso:', data);
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        toggleForm(); // Cambiar a login después del registro
        // Limpiar formulario
        setName('');
        setEmail('');
        setPassword('');
        setRole('mesero');
      } else {
        const errorData = await response.text();
        console.log('Error del servidor:', errorData);
        
        // Mejor manejo de errores para email duplicado
        try {
          const errorObj = JSON.parse(errorData);
          if (errorObj.error && errorObj.error.includes('ya está registrado')) {
            alert('Este correo electrónico ya está registrado.\n\nPrueba con un email diferente o usa el botón "Iniciar Sesión" si ya tienes cuenta.');
          } else {
            alert(`Error: ${errorObj.error || 'Error desconocido'}`);
          }
        } catch (e) {
          // Si no es JSON válido
          if (errorData.includes('ya está registrado') || errorData.includes('Duplicate entry')) {
            alert('Este correo electrónico ya está registrado.\n\nPrueba con un email diferente o usa el botón "Iniciar Sesión".');
          } else {
            alert('Error al registrar usuario');
          }
        }
      }
    } catch (error) {
      console.error('Error al intentar registro:', error);
      alert('Error de conexión. El servidor no está disponible.');
    }
  };



  return (
    <div style={{ width: '100%' }}>
      {/* Primera fila - Nombre y Email */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '15px'
      }}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '15px 18px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '15px 18px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Segunda fila - Contraseña y Rol */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '15px'
      }}>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '15px 18px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '15px 18px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        >
          <option value="mesero">Mesero</option>
          <option value="cobrador">Cobrador/Cajero</option>
          <option value="cocina">Cocina</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>

      {/* Botón de registro */}
      <button 
        type="submit"
        onClick={handleRegister}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginTop: '10px',
          transition: 'background-color 200ms ease'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        Registrarse
      </button>
    </div>
  );
}

function RoleBasedPage({ role }) {
  const navigate = useNavigate();

  useEffect(() => {
    switch (role) {
      case 'administrador':
        navigate('/admin');
        break;
      case 'mesero':
        navigate('/waiter');
        break;
      case 'cocina':
        navigate('/kitchen');
        break;
      case 'cobrador':
        navigate('/cashier');
        break;
      default:
        navigate('/');
    }
  }, [role, navigate]);

  return null; // Render nothing as the user is being redirected
}

export default App;

// Ejemplo de uso en fetch:
// fetch(`${API_URL}/login`, {...})
// fetch(`${API_URL}/register`, {...})
// fetch(`${API_URL}/dishes`, {...})
// fetch(`${API_URL}/orders`, {...})
// fetch(`${API_URL}/payments`, {...})
// ...etc...
