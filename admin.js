// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://pohrgobetrcvcbvodjcz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VSRamaBp4uh9SSYhRSVwRg_9f0_sgOy'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Selectores
const contenedorCitas = document.getElementById("contenedorCitas");
const contenedorUsuarios = document.getElementById("contenedorUsuarios");
const adminNombre = document.getElementById("adminNombre");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");

// Control de Pestañas
const tabCitas = document.getElementById("tabCitas");
const tabUsuarios = document.getElementById("tabUsuarios");
const seccionCitas = document.getElementById("seccionCitas");
const seccionUsuarios = document.getElementById("seccionUsuarios");

tabCitas.addEventListener("click", () => {
  tabCitas.classList.add("activo");
  tabUsuarios.classList.remove("activo");
  seccionCitas.classList.add("activa");
  seccionUsuarios.classList.remove("activa");
  cargarCitas();
});

tabUsuarios.addEventListener("click", () => {
  tabUsuarios.classList.add("activo");
  tabCitas.classList.remove("activo");
  seccionUsuarios.classList.add("activa");
  seccionCitas.classList.remove("activa");
  cargarUsuarios();
});

// ==========================================
// 1. GUARDIÁN DE SEGURIDAD (AUTH GUARD)
// ==========================================
async function verificarAccesoAdmin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    alert("Acceso denegado. Debes iniciar sesión.");
    window.location.href = "index.html";
    return;
  }

  // Consultar si es administrador
  const { data: perfil, error } = await supabaseClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single();

  if (error || (perfil.role !== 'admin' && perfil.role !== 'gerente')) {
    alert("Acceso Restringido: No tienes privilegios de Administrador para ver este panel.");
    window.location.href = "index.html";
    return;
  }

  // Si pasó los filtros, le damos la bienvenida y cargamos los datos
  adminNombre.textContent = `Panel de: ${perfil.full_name.split(" ")[0]}`;
  cargarCitas();
}

// Cerrar sesión
btnCerrarSesion.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
});

// ==========================================
// 2. GESTIÓN DE CITAS (CRUD)
// ==========================================
async function cargarCitas() {
  contenedorCitas.innerHTML = "<p>Cargando base de datos...</p>";
  
  // Traemos las citas ordenadas de la más nueva a la más vieja
  const { data: citas, error } = await supabaseClient
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    contenedorCitas.innerHTML = `<p style="color:red;">Error al cargar citas: ${error.message}</p>`;
    return;
  }

  if (citas.length === 0) {
    contenedorCitas.innerHTML = "<p>No hay citas registradas en el sistema.</p>";
    return;
  }

  contenedorCitas.innerHTML = "";
  citas.forEach(cita => {
    // Formatear la fecha para que se vea bonita
    const fecha = cita.created_at ? new Date(cita.created_at).toLocaleDateString() : 'Sin fecha';
    
    const card = document.createElement("div");
    card.className = "card-admin";
    card.innerHTML = `
      <div class="card-header">
        <h3>Folio: #${cita.id.toString().padStart(4, '0')}</h3>
        <select class="estado-select" onchange="cambiarEstadoCita('${cita.id}', this.value)">
          <option value="Pendiente" ${cita.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="En Revisión" ${cita.status === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
          <option value="Reparado" ${cita.status === 'Reparado' ? 'selected' : ''}>Reparado / Entregado</option>
        </select>
      </div>
      <p><strong>Cliente:</strong> ${cita.client_name}</p>
      <p><strong>Contacto:</strong> ${cita.client_phone} | ${cita.client_email}</p>
      <p><strong>Equipo:</strong> ${cita.device_info}</p>
      <p><strong>Falla:</strong> ${cita.issue_description}</p>
      <p><strong>Servicios:</strong> ${cita.services_requested}</p>
      <p><strong>Agendada para:</strong> ${cita.dropoff_date} a las ${cita.dropoff_time}</p>
      
      <div class="acciones-card">
        <button class="btn-peligro" onclick="eliminarCita('${cita.id}')">🗑️ Eliminar Cita</button>
      </div>
    `;
    contenedorCitas.appendChild(card);
  });
}

window.cambiarEstadoCita = async function(idCita, nuevoEstado) {
  const { error } = await supabaseClient
    .from('appointments')
    .update({ status: nuevoEstado })
    .eq('id', idCita);

  if (error) alert("Error al actualizar el estado: " + error.message);
}

window.eliminarCita = async function(idCita) {
  if (!confirm("⚠️ ¿Estás seguro de que deseas eliminar esta cita de forma permanente? Esta acción no se puede deshacer.")) return;

  const { error } = await supabaseClient.from('appointments').delete().eq('id', idCita);

  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    cargarCitas(); // Recargar la lista
  }
}

// ==========================================
// 3. GESTIÓN DE USUARIOS (Roles y Baja Lógica)
// ==========================================
async function cargarUsuarios() {
  contenedorUsuarios.innerHTML = "<p>Cargando perfiles...</p>";
  
  const { data: usuarios, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    contenedorUsuarios.innerHTML = `<p style="color:red;">Error al cargar usuarios: ${error.message}</p>`;
    return;
  }

  contenedorUsuarios.innerHTML = "";
  usuarios.forEach(user => {
    // Para identificar visualmente roles y baneos
    const esAdmin = user.role === 'admin';
    const esBloqueado = user.estado === 'bloqueado';
    
    let claseCard = "card-admin usuario";
    if (esBloqueado) claseCard += " bloqueado";

    const card = document.createElement("div");
    card.className = claseCard;
    
    card.innerHTML = `
      <div class="card-header">
        <h3>${user.full_name || 'Sin nombre'}</h3>
        <span style="font-size: 12px; font-weight: bold; background: ${esAdmin ? '#eef2ff' : '#f1f5f9'}; color: ${esAdmin ? 'var(--azul-principal)' : '#4c6879'}; padding: 4px 8px; border-radius: 6px;">
          ${esAdmin ? 'ADMINISTRADOR' : 'CLIENTE'}
        </span>
      </div>
      <p><strong>ID Sistema:</strong> ${user.id.substring(0,8)}...</p>
      <p><strong>Estado:</strong> ${esBloqueado ? '🔴 Suspendido' : '🟢 Activo'}</p>
      
      <div class="acciones-card">
        ${!esBloqueado ? `<button class="btn-peligro" onclick="bloquearUsuario('${user.id}')">🚫 Bloquear</button>` : `<button class="btn-accion" onclick="desbloquearUsuario('${user.id}')">✅ Desbloquear</button>`}
        
        ${!esAdmin ? `<button class="btn-accion" onclick="cambiarRol('${user.id}', 'admin')">⭐ Hacer Admin</button>` : `<button class="btn-peligro" onclick="cambiarRol('${user.id}', 'cliente')" style="background:transparent; border-color:#7b93a8; color:#7b93a8;">Quitar Admin</button>`}
      </div>
    `;
    contenedorUsuarios.appendChild(card);
  });
}

window.cambiarRol = async function(idUsuario, nuevoRol) {
  if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${nuevoRol.toUpperCase()}?`)) return;

  const { error } = await supabaseClient.from('profiles').update({ role: nuevoRol }).eq('id', idUsuario);
  if (error) alert("Error al cambiar rol: " + error.message);
  else cargarUsuarios();
}

window.bloquearUsuario = async function(idUsuario) {
  if (!confirm("¿Deseas aplicar una BAJA LÓGICA? El usuario ya no podrá operar en el sistema.")) return;

  const { error } = await supabaseClient.from('profiles').update({ estado: 'bloqueado' }).eq('id', idUsuario);
  if (error) alert("Error al bloquear: " + error.message);
  else cargarUsuarios();
}

window.desbloquearUsuario = async function(idUsuario) {
  const { error } = await supabaseClient.from('profiles').update({ estado: 'activo' }).eq('id', idUsuario);
  if (error) alert("Error al desbloquear: " + error.message);
  else cargarUsuarios();
}

// Iniciar el guardián al cargar la página
window.addEventListener('DOMContentLoaded', verificarAccesoAdmin);