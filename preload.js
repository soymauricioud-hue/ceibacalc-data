// preload.js
// Todas las API de Node.js están disponibles en el proceso de precarga.
// Tiene el mismo sandbox que una extensión de Chrome.
window.addEventListener('DOMContentLoaded', () => {
  // Opcionalmente, exponer módulos específicos de forma segura
  // contextBridge.exposeInMainWorld('api', { ... });
});
