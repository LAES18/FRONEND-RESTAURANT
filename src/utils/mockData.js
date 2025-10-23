// Mock data para desarrollo cuando el backend no está disponible
export const mockUsers = [
  {
    id: 1,
    email: 'admin@resto.com',
    password: '123456',
    role: 'administrador',
    name: 'Administrador'
  },
  {
    id: 2,
    email: 'mesero@resto.com',
    password: '123456',
    role: 'mesero',
    name: 'Juan Mesero'
  },
  {
    id: 3,
    email: 'cocina@resto.com',
    password: '123456',
    role: 'cocina',
    name: 'Chef María'
  },
  {
    id: 4,
    email: 'cajero@resto.com',
    password: '123456',
    role: 'cobrador',
    name: 'Ana Cajera'
  }
];

export const mockDishes = [
  {
    id: 1,
    name: 'Hamburguesa Clásica',
    price: 12.99,
    type: 'almuerzo',
    description: 'Hamburguesa con carne, lechuga, tomate'
  },
  {
    id: 2,
    name: 'Pizza Margherita',
    price: 15.50,
    type: 'cena',
    description: 'Pizza con tomate, mozzarella y albahaca'
  },
  {
    id: 3,
    name: 'Desayuno Americano',
    price: 8.99,
    type: 'desayuno',
    description: 'Huevos, tocino, tostadas y café'
  }
];

export const mockOrders = [
  {
    id: 1,
    mesa: 'Mesa 1',
    items: [
      { dish: 'Hamburguesa Clásica', quantity: 2, price: 12.99 }
    ],
    total: 25.98,
    status: 'pendiente',
    timestamp: new Date().toISOString()
  }
];

// Simular delay de red
export const mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));