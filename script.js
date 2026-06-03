// ==========================================
// CONFIGURACIÓN GLOBAL DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://pohrgobetrcvcbvodjcz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VSRamaBp4uh9SSYhRSVwRg_9f0_sgOy'; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// SELECTORES DE ELEMENTOS DEL DOM
// ==========================================
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const formulario = document.getElementById("formulario");
const contacto = document.getElementById("contacto");
const abrirLogin = document.getElementById("abrirLogin");
const cerrarLogin = document.getElementById("cerrarLogin");
const modalLogin = document.getElementById("modalLogin");
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");
const usuarioLogin = document.getElementById("usuarioLogin");
const nombreRegistro = document.getElementById("nombreRegistro");
const tabLogin = document.getElementById("tabLogin");
const tabRegistro = document.getElementById("tabRegistro");
const tarjetasServicio = document.querySelectorAll(".card-servicio");
const servicioSelect = document.getElementById("servicioSelect");
const listaServiciosSeleccionados = document.getElementById("listaServiciosSeleccionados");
const totalServicios = document.getElementById("totalServicios");
const sinServicios = document.getElementById("sinServicios");

// Nuevos selectores (Sesión, Políticas y Calendario)
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const modalPoliticas = document.getElementById("modalPoliticas");
const btnAbrirPoliticas = document.getElementById("abrirPoliticas");
const btnCerrarPoliticas = document.getElementById("cerrarPoliticas");
const fechaEntregaInput = document.getElementById("fechaEntrega");

// ==========================================
// CONFIGURACIÓN DE CALENDARIO (Bloquear días pasados)
// ==========================================
if(fechaEntregaInput){
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  fechaEntregaInput.min = `${year}-${month}-${day}`; 
}

const PARTICLE_CONFIG = {
  mobileCount: 60,
  desktopCount: 120,
  maxDistance: 145,
  connectionOpacity: 0.52,
  colors: ['#0cd7f2', '#7edfff', '#12a5d0', '#06b3d4']
};

// ==========================================
// LÓGICA DEL RESUMEN DE COTIZACIÓN (FRONTEND)
// ==========================================
function actualizarResumenServicios() {
  if (!servicioSelect || !listaServiciosSeleccionados || !totalServicios || !sinServicios) {
    return;
  }

  const serviciosElegidos = Array.from(servicioSelect.selectedOptions).filter((opt) => opt.value);
  let total = 0;

  listaServiciosSeleccionados.replaceChildren();

  serviciosElegidos.forEach((servicio) => {
    const precio = Number(servicio.value) || 0;
    total += precio;

    const item = document.createElement("li");
    item.textContent = `${servicio.text} - $${precio}`;
    listaServiciosSeleccionados.appendChild(item);
  });

  sinServicios.style.display = serviciosElegidos.length ? "none" : "block";
  totalServicios.textContent = `$${total}`;
}

if (servicioSelect) {
  servicioSelect.addEventListener("change", actualizarResumenServicios);
  actualizarResumenServicios();
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

      // Convertir la hora seleccionada a formato de 24 hrs para comparar
      if (horaEntrega.includes("10:00")) horaCita = 10;
      if (horaEntrega.includes("12:00")) horaCita = 12;
      if (horaEntrega.includes("03:00")) horaCita = 15;
      if (horaEntrega.includes("05:00")) horaCita = 17;

      if (horaCita > 0 && horaCita <= horaActual) {
        alert("⏱️ ¡Incongruencia de horario!\n\nNo puedes agendar una cita en una hora que ya pasó el día de hoy. Por favor, selecciona un horario posterior o cambia la fecha de entrega.");
        return; // Detiene el envío a la base de datos
      }
    }
    // ---------------------------------------------

    // Cálculo y recolección de servicios seleccionados
    const serviciosElegidos = Array.from(servicioSelect.selectedOptions).filter((opt) => opt.value);
    let total = 0;
    let nombresServicios = [];

    serviciosElegidos.forEach((servicio) => {
      total += Number(servicio.value) || 0;
      nombresServicios.push(servicio.text);
    });

    const serviciosTexto = nombresServicios.join(", ") || "Ninguno seleccionado";

    try {
      // 1. Generamos un "Folio" corto aleatorio (ej. #A7B2X)
      const folioGenerado = Math.random().toString(36).substring(2, 7).toUpperCase();

      const { data, error } = await supabaseClient
        .from('appointments')
        .insert([
          {
            client_name: nombre,
            client_email: correo,
            client_phone: telefono,
            device_info: modelo,
            issue_description: falla,
            dropoff_date: fechaEntrega ? fechaEntrega : null,
            dropoff_time: horaEntrega,
            services_requested: serviciosTexto,
            status: 'Pendiente'
          }
        ]);

      if (error) throw error;

      // 2. Alerta de éxito con el Folio
      alert(`¡Cita registrada con éxito en Smart System!\nTu número de folio es: #${folioGenerado}\nTotal Estimado: $${total} MXN.`);
      
      // 3. UX: Le preguntamos al usuario si quiere usar WhatsApp (No invasivo)
      const quiereWhatsapp = confirm("¿Te gustaría enviar esta cotización por WhatsApp al taller para agilizar tu atención?");
      
      if (quiereWhatsapp) {
        // Capturamos el número dinámico desde el HTML
        const selectorSucursal = document.getElementById("sucursalSelect");
        const numeroTallerDinamico = selectorSucursal.value; 

        // Armamos el mensaje predeterminado
        const mensajeWa = `Hola Smart System, acabo de agendar una cita.\n*Folio:* #${folioGenerado}\n*Equipo:* ${modelo}\n*Falla:* ${falla}\n*Servicios:* ${serviciosTexto}\n*Total Estimado:* $${total}`;
        
        // El link se arma con la sucursal elegida
        const urlWa = `https://wa.me/${numeroTallerDinamico}?text=${encodeURIComponent(mensajeWa)}`;
        
        // Abrimos WhatsApp en una nueva pestaña
        window.open(urlWa, '_blank');
      }

      // 4. Limpiamos el formulario
      formulario.reset();
      if (typeof actualizarResumenServicios === "function") {
        actualizarResumenServicios();
      }

    } catch (error) {
      console.error("Error al guardar en Supabase:", error);
      alert(`Hubo un detalle al conectar con la base de datos: ${error.message}`);
    }
  });
}

// ==========================================
// CONTROL DE MENÚ DE NAVEGACIÓN
// ==========================================
if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => {
    menu.classList.toggle("activo");
  });
}

document.querySelectorAll(".menu a").forEach(enlace => {
  enlace.addEventListener("click", () => {
    if (menu) {
      menu.classList.remove("activo");
    }
  });
});

// ==========================================
// CONTROL DE MODAL DE INICIO DE SESIÓN
// ==========================================
function abrirModalLogin() {
  if (!modalLogin) {
    return;
  }
  modalLogin.classList.add("activo");
  modalLogin.setAttribute("aria-hidden", "false");
}

function mostrarVistaAcceso(vista) {
  if (!formLogin || !formRegistro || !tabLogin || !tabRegistro) {
    return;
  }

  const vistaLogin = vista === "login";

  formLogin.classList.toggle("oculto-formulario", !vistaLogin);
  formRegistro.classList.toggle("oculto-formulario", vistaLogin);

  formLogin.setAttribute("aria-hidden", String(!vistaLogin));
  formRegistro.setAttribute("aria-hidden", String(vistaLogin));

  tabLogin.classList.toggle("activo", vistaLogin);
  tabRegistro.classList.toggle("activo", !vistaLogin);

  tabLogin.setAttribute("aria-selected", String(vistaLogin));
  tabRegistro.setAttribute("aria-selected", String(!vistaLogin));
}

function cerrarModalLogin() {
  if (!modalLogin) {
    return;
  }
  modalLogin.classList.remove("activo");
  modalLogin.setAttribute("aria-hidden", "true");
}

if (abrirLogin) {
  abrirLogin.addEventListener("click", () => {
    mostrarVistaAcceso("login");
    abrirModalLogin();
  });
}

if (tabLogin) {
  tabLogin.addEventListener("click", () => {
    mostrarVistaAcceso("login");
  });
}

if (tabRegistro) {
  tabRegistro.addEventListener("click", () => {
    mostrarVistaAcceso("registro");
  });
}

if (cerrarLogin) {
  cerrarLogin.addEventListener("click", cerrarModalLogin);
}

if (modalLogin) {
  modalLogin.addEventListener("click", (event) => {
    if (event.target === modalLogin) {
      cerrarModalLogin();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (modalLogin && modalLogin.classList.contains("activo")) cerrarModalLogin();
    if (modalPoliticas && modalPoliticas.classList.contains("activo")) {
      modalPoliticas.classList.remove("activo");
      modalPoliticas.setAttribute("aria-hidden", "true");
    }
  }
});

// ==========================================
// AUTENTICACIÓN REAL CON SUPABASE (REGISTRO Y LOGIN)
// ==========================================

// --- REGISTRO REAL (CON VERIFICACIÓN DE CORREO Y WHATSAPP) ---
if (formRegistro) {
  formRegistro.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombre = nombreRegistro.value.trim();
    const correo = document.getElementById("correoRegistro").value.trim();
    const telefono = document.getElementById("telefonoRegistro").value.trim(); 
    const password = document.getElementById("passwordRegistro").value;
    const alias = nombre.split(" ")[0] || "cliente";

    try {
      // 1. Mostrar estado de carga para UX
      const btnSubmit = formRegistro.querySelector("button[type='submit']");
      const textoOriginal = btnSubmit.textContent;
      btnSubmit.textContent = "Procesando...";
      btnSubmit.disabled = true;

      // 2. Registrar al usuario en Supabase (Incluye el teléfono)
      const { data, error } = await supabaseClient.auth.signUp({
        email: correo,
        password: password,
        options: {
          data: { 
            full_name: nombre,
            phone: telefono 
          } 
        }
      });

      // 3. Restaurar botón
      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = false;

      if (error) throw error;

      // 4. ALERTA DE VERIFICACIÓN DE CORREO
      alert(`¡Casi listo, ${alias}!\n\nHemos enviado un correo de confirmación a: ${correo}.\n\nPor favor, revisa tu bandeja de entrada (o la carpeta de Spam) y haz clic en el enlace para activar tu cuenta. No podrás iniciar sesión hasta que lo verifiques.`);
      
      formRegistro.reset();
      mostrarVistaAcceso("login"); 

    } catch (error) {
      console.error("Error en el registro:", error);
      
      // Manejo de errores amigable
      let mensajeError = "No se pudo registrar. Intenta de nuevo.";
      if (error.message.includes("User already registered")) {
        mensajeError = "Este correo ya está registrado. Si no has verificado tu cuenta, revisa tu bandeja de entrada.";
      }
      
      alert(mensajeError);
      
      const btnSubmit = formRegistro.querySelector("button[type='submit']");
      btnSubmit.textContent = "Crear cuenta";
      btnSubmit.disabled = false;
    }
  });
}

// --- INICIO DE SESIÓN REAL (CON REDIRECCIÓN INTELIGENTE) ---
if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();

    const correo = usuarioLogin.value.trim();
    const password = document.getElementById("passwordLogin").value;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: correo,
        password: password,
      });

      // Si el correo no ha sido verificado, Supabase lanzará un error aquí
      if (error) throw error;

      // Consultar el rol real en la tabla profiles
      const { data: perfil, error: perfilError } = await supabaseClient
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (perfilError) throw perfilError;

      const alias = perfil?.full_name?.split(" ")[0] || correo.split("@")[0];
      const rol = perfil?.role || 'cliente';

      alert(`¡Autenticación exitosa! Bienvenido de nuevo, ${alias}.`);
      formLogin.reset();
      cerrarModalLogin();

      // Transformación inteligente del botón de navegación
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
          if (contacto) {
            setTimeout(() => {
              contacto.scrollIntoView({ behavior: "smooth" });
            }, 300);
          }
        }
        
        // Mostrar el botón de cerrar sesión
        if(btnCerrarSesion) btnCerrarSesion.classList.remove("oculto-formulario");
      }

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

// ==========================================
// CERRAR SESIÓN Y POLÍTICAS DE PRIVACIDAD
// ==========================================

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

if (btnAbrirPoliticas && modalPoliticas) {
  btnAbrirPoliticas.addEventListener("click", (e) => {
    e.preventDefault();
    modalPoliticas.classList.add("activo");
    modalPoliticas.setAttribute("aria-hidden", "false");
  });
}

if (btnCerrarPoliticas && modalPoliticas) {
  btnCerrarPoliticas.addEventListener("click", () => {
    modalPoliticas.classList.remove("activo");
    modalPoliticas.setAttribute("aria-hidden", "true");
  });
}

// ==========================================
// FONDO DINÁMICO DE PARTÍCULAS (CANVAS 2D)
// ==========================================
class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.particles = [];
    this.particleCount = 0;
    this.animationFrameId = null;
    this.maxDistanceSquared = PARTICLE_CONFIG.maxDistance * PARTICLE_CONFIG.maxDistance;

    this.resizeCanvas();
    this.init();
    this.setupEventListeners();
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    this.particleCount = window.innerWidth < 768 ? PARTICLE_CONFIG.mobileCount : PARTICLE_CONFIG.desktopCount;
    
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.6 + 1.3,
        opacity: Math.random() * 0.28 + 0.66,
        maxOpacity: Math.random() * 0.28 + 0.66,
        color: this.getRandomColor()
      });
    }
  }

  getRandomColor() {
    const { colors } = PARTICLE_CONFIG;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.init();
    });
  }

  update() {
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
      }
      particle.opacity += (Math.random() - 0.5) * 0.03;
      particle.opacity = Math.max(0.5, Math.min(particle.maxOpacity, particle.opacity));
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      this.ctx.shadowBlur = 13;
      this.ctx.shadowColor = this.hexToRgba(particle.color, 0.45);
      this.ctx.fillStyle = this.hexToRgba(particle.color, particle.opacity);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < this.maxDistanceSquared) {
          const distance = Math.sqrt(distanceSquared);
          const opacity = (1 - distance / PARTICLE_CONFIG.maxDistance) * PARTICLE_CONFIG.connectionOpacity;
          this.ctx.strokeStyle = this.hexToRgba('#0cd7f2', opacity);
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  animate() {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new ParticleSystem("particlesCanvas");
  });
} else {
  new ParticleSystem("particlesCanvas");
}

if (contacto) {
  tarjetasServicio.forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => {
      contacto.scrollIntoView({ behavior: "smooth" });
    });
  });
}