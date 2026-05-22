// ==========================================
// CONFIGURACIÓN GLOBAL DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://pohrgobetrcvcbvodjcz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VSRamaBp4uh9SSYhRSVwRg_9f0_sgOy'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos del DOM
const contenedorCitas = document.getElementById('contenedorCitas');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

// ==========================================
// 1. VERIFICAR SEGURIDAD (SESIÓN Y ROL)
// ==========================================
async function verificarSesion() {
  // 1. ¿Tiene sesión iniciada en el navegador?
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    alert('Acceso denegado. Debes iniciar sesión.');
    window.location.href = 'index.html';
    return;
  }

  try {
    // 2. Consultar el rol real del usuario en la tabla profiles
    const { data: perfil, error } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(); // Trae un solo registro coincidente

    if (error) throw error;

    // 3. Validar si el rol es el correcto (admin o gerente)
    if (!perfil || (perfil.role !== 'admin' && perfil.role !== 'gerente')) {
      alert('Acceso denegado. Tu cuenta no tiene permisos de Administrador.');
      // Lo deslogueamos para limpiar el estado y evitar bucles
      await supabaseClient.auth.signOut(); 
      window.location.href = 'index.html';
    } else {
      // ¡Permiso concedido! Es un usuario autorizado, cargamos las citas
      console.log(`Bienvenido al panel. Rol verificado: ${perfil.role}`);
      cargarCitas();
    }
  } catch (err) {
    console.error("Error verificando permisos de perfil:", err);
    alert("Error de seguridad al validar tu perfil. Verifica que tengas las políticas RLS activas.");
    window.location.href = 'index.html';
  }
}

// ==========================================
// 2. CARGAR CITAS DESDE SUPABASE
// ==========================================
async function cargarCitas() {
  contenedorCitas.innerHTML = '<p>Conectando con la base de datos...</p>';

  try {
    const { data: citas, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (citas.length === 0) {
      contenedorCitas.innerHTML = '<p>No hay citas registradas aún.</p>';
      return;
    }

    contenedorCitas.innerHTML = ''; 

    citas.forEach(cita => {
      const card = document.createElement('div');
      card.className = 'cita-card';
      
      const fecha = cita.dropoff_date ? new Date(cita.dropoff_date).toLocaleDateString() : 'Sin fecha';
      const estadoActual = cita.status || 'Pendiente';

      card.innerHTML = `
        <div class="cita-header">
          <h3>${cita.client_name}</h3>
          <select class="estado-select" onchange="cambiarEstado('${cita.id}', this.value)">
            <option value="Pendiente" ${estadoActual === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="En revisión" ${estadoActual === 'En revisión' ? 'selected' : ''}>En revisión</option>
            <option value="En reparación" ${estadoActual === 'En reparación' ? 'selected' : ''}>En reparación</option>
            <option value="Entregado" ${estadoActual === 'Entregado' ? 'selected' : ''}>Entregado</option>
            <option value="Cancelado" ${estadoActual === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
        <p><strong>📱 Contacto:</strong> ${cita.client_phone} | ${cita.client_email}</p>
        <p><strong>💻 Equipo:</strong> ${cita.device_info}</p>
        <p><strong>⚠️ Problema:</strong> ${cita.issue_description}</p>
        <p><strong>🔧 Servicios:</strong> ${cita.services_requested}</p>
        <p><strong>📅 Entrega:</strong> ${fecha} a las ${cita.dropoff_time || '--'}</p>
      `;
      
      contenedorCitas.appendChild(card);
    });

  } catch (error) {
    console.error('Error al cargar citas:', error);
    contenedorCitas.innerHTML = `<p style="color: red;">Error cargando citas: ${error.message}</p>`;
  }
}

// ==========================================
// 3. ACTUALIZAR ESTADO EN SUPABASE (CRUD - UPDATE)
// ==========================================
window.cambiarEstado = async function(idCita, nuevoEstado) {
  try {
    const { error } = await supabaseClient
      .from('appointments')
      .update({ status: nuevoEstado })
      .eq('id', idCita); 

    if (error) throw error;
    
    console.log(`Cita ${idCita} actualizada con éxito a: ${nuevoEstado}`);
    
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    alert('Hubo un error al cambiar el estado: ' + error.message);
    cargarCitas(); // Recarga las tarjetas para restaurar el valor visual real
  }
};

// ==========================================
// 4. CERRAR SESIÓN
// ==========================================
btnCerrarSesion.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
});

// Arrancar el proceso de verificación de seguridad en cuanto cargue el script
verificarSesion();