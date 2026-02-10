import { mockUsers, mockDishes, mockOrders, mockDelay } from './mockData.js';

// Utility para manejar requests con reintentos y mejor manejo de errores
export const apiRequest = async (endpoint, options = {}) => {
  // Si VITE_API_URL está vacío, usa ruta relativa (mismo dominio)
  const baseURL = import.meta.env.VITE_API_URL || '';
  // Si endpoint ya incluye /api/, no lo agregamos de nuevo
  const cleanEndpoint = endpoint.startsWith('api/') ? endpoint : `api/${endpoint}`;
  const url = baseURL ? `${baseURL}/${cleanEndpoint}` : `/${cleanEndpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options,
  };

  try {
    console.log(`🔄 API Request: ${defaultOptions.method} ${url}`);
    
    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Success:', data);
    return data;
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Funciones específicas para autenticación
// Función de login con fallback a mock data
export const loginUser = async (email, password) => {
  try {
    return await apiRequest('login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    console.log('Backend no disponible, usando datos mock para login');
    await mockDelay();
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      return { 
        success: true, 
        role: user.role, 
        message: 'Login exitoso (modo desarrollo)',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      };
    } else {
      throw new Error('Credenciales inválidas');
    }
  }
};

// Función de registro con fallback a mock data
export const registerUser = async (name, email, password, role) => {
  try {
    return await apiRequest('register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  } catch (error) {
    console.log('Backend no disponible, usando datos mock para registro');
    await mockDelay();
    
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('Este correo ya está registrado');
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      name, email, password, role
    };
    mockUsers.push(newUser);
    
    return { 
      success: true, 
      message: 'Usuario registrado exitosamente (modo desarrollo)',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    };
  }
};