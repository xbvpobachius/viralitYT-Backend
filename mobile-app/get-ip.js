// Script para obtener la IP local automáticamente
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar direcciones internas y no IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        // Preferir direcciones que empiecen con 192.168 o 10.
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
      }
    }
  }
  
  // Si no encuentra una IP preferida, devolver la primera disponible
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
  const ip = getLocalIP();
  console.log(`\n📍 Tu IP local es: ${ip}`);
  console.log(`\n🔗 URL para Expo Go: exp://${ip}:8081\n`);
}

// Exportar para usar en otros scripts
module.exports = { getLocalIP };

