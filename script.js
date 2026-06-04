// ==========================================
// CONFIGURACIÓN GLOBAL DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://pohrgobetrcvcbvodjcz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VSRamaBp4uh9SSYhRSVwRg_9f0_sgOy'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// SELECTORES GLOBALES
// ==========================================
const menuBtn = document.getElementById("menuBtn"), menu = document.getElementById("menu");
const formulario = document.getElementById("formulario"), contacto = document.getElementById("contacto");
const abrirLogin = document.getElementById("abrirLogin"), cerrarLogin = document.getElementById("cerrarLogin");
const modalLogin = document.getElementById("modalLogin");
const formLogin = document.getElementById("formLogin"), formRegistro = document.getElementById("formRegistro");
const usuarioLogin = document.getElementById("usuarioLogin"), nombreRegistro = document.getElementById("nombreRegistro");
const tabLogin = document.getElementById("tabLogin"), tabRegistro = document.getElementById("tabRegistro");

// Selectores nuevos
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const modalPoliticas = document.getElementById("modalPoliticas");
const btnAbrirPoliticas = document.getElementById("abrirPoliticas");
const btnCerrarPoliticas = document.getElementById("cerrarPoliticas");
const btnCerrarPoliticasAbajo = document.getElementById("btnCerrarPoliticasAbajo");
const btnCerrarLoginAbajo = document.getElementById("btnCerrarLoginAbajo");
const fechaEntregaInput = document.getElementById("fechaEntrega");

// Selectores de Checkboxes (Múltiples servicios)
const checkboxesServicios = document.querySelectorAll('#grupoServicios input[type="checkbox"]');
const listaServiciosSeleccionados = document.getElementById("listaServiciosSeleccionados");
const totalServicios = document.getElementById("totalServicios");
const sinServicios = document.getElementById("sinServicios");
const alertaServicios = document.getElementById("alertaServicios");

// ==========================================
// AUTO-LLENADO DE FORMULARIO SI HAY SESIÓN ACTIVA
// ==========================================
function autoLlenarFormulario(nombre, correo, telefono) {
  const inputNombre = document.getElementById("nombre");
  const inputCorreo = document.getElementById("correo");
  const inputTelefono = document.getElementById("telefono");
  
  if(inputNombre && nombre) inputNombre.value = nombre;
  if(inputCorreo && correo) inputCorreo.value = correo;
  if(inputTelefono && telefono) inputTelefono.value = telefono;
}

window.addEventListener('DOMContentLoaded', async () => {
  // Configurar calendario para bloquear días pasados
  if(fechaEntregaInput){
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    fechaEntregaInput.min = `${year}-${month}-${day}`; 
  }

  // Verificar si hay alguien con sesión iniciada
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    const user = session.user;
    const { data: perfil } = await supabaseClient.from('profiles').select('role, full_name').eq('id', user.id).single();
    
    const rol = perfil?.role || 'cliente';
    const alias = perfil?.full_name?.split(" ")[0] || user.email.split("@")[0];
    const telefono = user.user_metadata?.phone || "";
    
    // 1. Llenamos el formulario de contacto automáticamente
    autoLlenarFormulario(perfil?.full_name, user.email, telefono);
    
    // 2. Modificamos el botón de navegación
    if (abrirLogin) {
      if (rol === 'admin' || rol === 'gerente') {
        abrirLogin.innerHTML = `⚙️ Panel Admin`;
        abrirLogin.classList.add("logueado");
        abrirLogin.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.href = 'admin.html';
        });
      } else {
        abrirLogin.textContent = `Hola, ${alias}`;
        abrirLogin.classList.add("logueado");
      }
      if(btnCerrarSesion) btnCerrarSesion.classList.remove("oculto-formulario");
    }
  }
});

// ==========================================
// LÓGICA DE MULTI-SELECCIÓN DE SERVICIOS
// ==========================================
function actualizarResumenServicios() {
  if (!listaServiciosSeleccionados || !totalServicios || !sinServicios) return;

  let total = 0;
  let seleccionados = 0;
  listaServiciosSeleccionados.replaceChildren();

  checkboxesServicios.forEach((cb) => {
    if (cb.checked) {
      seleccionados++;
      const precio = Number(cb.value) || 0;
      total += precio;

      const item = document.createElement("li");
      item.textContent = `${cb.dataset.nombre} - $${precio}`;
      listaServiciosSeleccionados.appendChild(item);
    }
  });

  sinServicios.style.display = seleccionados > 0 ? "none" : "block";
  totalServicios.textContent = `$${total}`;
  if(seleccionados > 0) alertaServicios.style.display = "none"; // Ocultar alerta si ya eligió algo
}

if (checkboxesServicios.length > 0) {
  checkboxesServicios.forEach(cb => cb.addEventListener("change", actualizarResumenServicios));
}

// ==========================================
// ENVÍO DE FORMULARIO A LA BASE DE DATOS
// ==========================================
if (formulario) {
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura de datos ingresados
    const nombre = document.getElementById("nombre")?.value.trim();
    const correo = document.getElementById("correo")?.value.trim();
    const telefono = document.getElementById("telefono")?.value.trim();
    const modelo = document.getElementById("modelo")?.value.trim() || "No especificado";
    const falla = document.getElementById("falla")?.value.trim() || "Sin descripción";
    const fechaEntrega = fechaEntregaInput?.value;
    const horaEntrega = document.getElementById("horaEntrega")?.value || "No especificada";

    // --- VALIDACIÓN DE INCONGRUENCIA DE TIEMPO ---
    if (fechaEntrega === fechaEntregaInput.min && horaEntrega) {
      const horaActual = new Date().getHours();
      let horaCita = 0;
      if (horaEntrega.includes("10:00")) horaCita = 10;
      if (horaEntrega.includes("12:00")) horaCita = 12;
      if (horaEntrega.includes("03:00")) horaCita = 15;
      if (horaEntrega.includes("05:00")) horaCita = 17;

      if (horaCita > 0 && horaCita <= horaActual) {
        alert("⏱️ ¡Incongruencia de horario!\n\nNo puedes agendar una cita en una hora que ya pasó el día de hoy.");
        return; 
      }
    }

    // --- CÁLCULO DE SERVICIOS SELECCIONADOS (CHECKBOXES) ---
    let total = 0;
    let nombresServicios = [];

    checkboxesServicios.forEach((cb) => {
      if (cb.checked) {
        total += Number(cb.value) || 0;
        nombresServicios.push(cb.dataset.nombre);
      }
    });

    if (nombresServicios.length === 0) {
      alertaServicios.style.display = "block"; // Mostrar advertencia
      return; // Detener envío si no eligió nada
    }

    const serviciosTexto = nombresServicios.join(", ");

    try {
      const folioGenerado = Math.random().toString(36).substring(2, 7).toUpperCase();

      const { data, error } = await supabaseClient
        .from('appointments')
        .insert([{
            client_name: nombre,
            client_email: correo,
            client_phone: telefono,
            device_info: modelo,
            issue_description: falla,
            dropoff_date: fechaEntrega ? fechaEntrega : null,
            dropoff_time: horaEntrega,
            services_requested: serviciosTexto,
            status: 'Pendiente'
        }]);

      if (error) throw error;

      alert(`¡Cita registrada con éxito en Smart System!\nTu número de folio es: #${folioGenerado}\nTotal Estimado: $${total} MXN.`);
      
      const quiereWhatsapp = confirm("¿Te gustaría enviar esta cotización por WhatsApp al taller para agilizar tu atención?");
      if (quiereWhatsapp) {
        const selectorSucursal = document.getElementById("sucursalSelect");
        const numeroTallerDinamico = selectorSucursal.value; 
        const mensajeWa = `Hola Smart System, acabo de agendar una cita.\n*Folio:* #${folioGenerado}\n*Equipo:* ${modelo}\n*Falla:* ${falla}\n*Servicios:* ${serviciosTexto}\n*Total Estimado:* $${total}`;
        window.open(`https://wa.me/${numeroTallerDinamico}?text=${encodeURIComponent(mensajeWa)}`, '_blank');
      }

      formulario.reset();
      actualizarResumenServicios();

    } catch (error) {
      console.error("Error al guardar en Supabase:", error);
      alert(`Hubo un detalle al conectar con la base de datos: ${error.message}`);
    }
  });
}

// ==========================================
// CONTROL DE MENÚ Y MODALES
// ==========================================
if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => menu.classList.toggle("activo"));
}
document.querySelectorAll(".menu a").forEach(enlace => {
  enlace.addEventListener("click", () => { if (menu) menu.classList.remove("activo"); });
});

function cerrarModalLogin() {
  if (modalLogin) {
    modalLogin.classList.remove("activo");
    modalLogin.setAttribute("aria-hidden", "true");
  }
}

if (abrirLogin) {
  abrirLogin.addEventListener("click", () => {
    formLogin.classList.remove("oculto-formulario");
    formRegistro.classList.add("oculto-formulario");
    tabLogin.classList.add("activo");
    tabRegistro.classList.remove("activo");
    modalLogin.classList.add("activo");
    modalLogin.setAttribute("aria-hidden", "false");
  });
}

if (tabLogin && tabRegistro) {
  tabLogin.addEventListener("click", () => {
    formLogin.classList.remove("oculto-formulario");
    formRegistro.classList.add("oculto-formulario");
    tabLogin.classList.add("activo");
    tabRegistro.classList.remove("activo");
  });
  tabRegistro.addEventListener("click", () => {
    formRegistro.classList.remove("oculto-formulario");
    formLogin.classList.add("oculto-formulario");
    tabRegistro.classList.add("activo");
    tabLogin.classList.remove("activo");
  });
}

// Botones de cierre
if (cerrarLogin) cerrarLogin.addEventListener("click", cerrarModalLogin);
if (btnCerrarLoginAbajo) btnCerrarLoginAbajo.addEventListener("click", cerrarModalLogin);

// Modales de Políticas
if (btnAbrirPoliticas && modalPoliticas) {
  btnAbrirPoliticas.addEventListener("click", (e) => {
    e.preventDefault();
    modalPoliticas.classList.add("activo");
    modalPoliticas.setAttribute("aria-hidden", "false");
  });
}

function cerrarPoliticas() {
  modalPoliticas.classList.remove("activo");
  modalPoliticas.setAttribute("aria-hidden", "true");
}
if (btnCerrarPoliticas) btnCerrarPoliticas.addEventListener("click", cerrarPoliticas);
if (btnCerrarPoliticasAbajo) btnCerrarPoliticasAbajo.addEventListener("click", cerrarPoliticas);

// ==========================================
// AUTENTICACIÓN REAL CON SUPABASE
// ==========================================
if (formRegistro) {
  formRegistro.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombre = nombreRegistro.value.trim();
    const correo = document.getElementById("correoRegistro").value.trim();
    const telefono = document.getElementById("telefonoRegistro").value.trim(); 
    const password = document.getElementById("passwordRegistro").value;
    const alias = nombre.split(" ")[0] || "cliente";

    try {
      const btnSubmit = formRegistro.querySelector("button[type='submit']");
      const textoOriginal = btnSubmit.textContent;
      btnSubmit.textContent = "Procesando...";
      btnSubmit.disabled = true;

      const { data, error } = await supabaseClient.auth.signUp({
        email: correo,
        password: password,
        options: { data: { full_name: nombre, phone: telefono } }
      });

      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = false;

      if (error) throw error;

      alert(`¡Casi listo, ${alias}!\nHemos enviado un correo de confirmación a: ${correo}.\nRevisa tu bandeja de entrada o Spam y haz clic en el enlace para activar tu cuenta.`);
      formRegistro.reset();
      tabLogin.click(); // Cambiar a la pestaña de login automáticamente

    } catch (error) {
      console.error("Error en el registro:", error);
      let mensajeError = "No se pudo registrar. Intenta de nuevo.";
      if (error.message.includes("User already registered")) mensajeError = "Este correo ya está registrado. Revisa tu bandeja de entrada si no lo has verificado.";
      alert(mensajeError);
      formRegistro.querySelector("button[type='submit']").disabled = false;
    }
  });
}

if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();

    const correo = usuarioLogin.value.trim();
    const password = document.getElementById("passwordLogin").value;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email: correo, password: password });
      if (error) throw error;

      alert("¡Autenticación exitosa! La página se recargará para llenar tus datos.");
      window.location.reload(); // Recargamos para que el auto-llenado haga su magia inmediatamente

    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      let mensajeError = "Credenciales incorrectas.";
      if (error.message.toLowerCase().includes("email not confirmed")) {
        mensajeError = "Debes verificar tu correo electrónico antes de iniciar sesión. Por favor, revisa tu bandeja de entrada.";
      }
      alert(mensajeError);
    }
  });
}

if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener("click", async () => {
    try {
      await supabaseClient.auth.signOut();
      alert("Has cerrado sesión exitosamente.");
      window.location.reload(); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  });
}

// ==========================================
// FONDO DINÁMICO DE PARTÍCULAS (CANVAS 2D)
// ==========================================
// (El sistema de partículas se mantiene igual, no es necesario cambiar su lógica para que siga luciendo increíble).
const PARTICLE_CONFIG = { mobileCount: 60, desktopCount: 120, maxDistance: 145, connectionOpacity: 0.52, colors: ['#0cd7f2', '#7edfff', '#12a5d0', '#06b3d4'] };

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxDistanceSquared = PARTICLE_CONFIG.maxDistance * PARTICLE_CONFIG.maxDistance;
    this.resizeCanvas();
    this.init();
    window.addEventListener('resize', () => { this.resizeCanvas(); this.init(); });
    this.animate();
  }
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  init() {
    this.particles = [];
    let count = window.innerWidth < 768 ? PARTICLE_CONFIG.mobileCount : PARTICLE_CONFIG.desktopCount;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.6 + 1.3, opacity: Math.random() * 0.28 + 0.66,
        maxOpacity: Math.random() * 0.28 + 0.66, color: PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)]
      });
    }
  }
  update() {
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
    });
  }
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      this.ctx.fillStyle = this.hexToRgba(p.color, p.opacity);
      this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); this.ctx.fill();
    });
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x, dy = this.particles[i].y - this.particles[j].y;
        const distSq = dx * dx + dy * dy;
        if (distSq < this.maxDistanceSquared) {
          const opacity = (1 - Math.sqrt(distSq) / PARTICLE_CONFIG.maxDistance) * PARTICLE_CONFIG.connectionOpacity;
          this.ctx.strokeStyle = this.hexToRgba('#0cd7f2', opacity);
          this.ctx.beginPath(); this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y); this.ctx.stroke();
        }
      }
    }
  }
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  animate() { this.update(); this.draw(); requestAnimationFrame(() => this.animate()); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => new ParticleSystem("particlesCanvas"));
else new ParticleSystem("particlesCanvas");