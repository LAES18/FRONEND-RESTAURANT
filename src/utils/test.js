// Test simple para verificar conectividad
const testBackend = async () => {
  console.log('🧪 Testing backend connectivity...');
  
  const endpoints = [
    '/api/health',
    'https://backend-restaurant-production-b56f.up.railway.app/api/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(endpoint);
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`Success: ${endpoint} - ${data}`);
        return true;
      }
    } catch (error) {
      console.log(`Failed: ${endpoint} - ${error.message}`);
    }
  }
  
  return false;
};

export default testBackend;