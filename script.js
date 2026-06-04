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
    // Dispara el radar de encuestas cuando el cliente inicia sesión
    verificarCitasPorCalificar(user.email);
    
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

// ==========================================
// SISTEMA DE CALIFICACIÓN Y SATISFACCIÓN (NPS)
// ==========================================
let idCitaACalificar = null;
let valorEstrellas = 0;

async function verificarCitasPorCalificar(emailUsuario) {
  // Busca si el usuario tiene una cita "Reparada" a la que aún no le haya dado Rating
  const { data, error } = await supabaseClient
    .from('appointments')
    .select('id')
    .eq('client_email', emailUsuario)
    .eq('status', 'Reparado')
    .is('rating', null)
    .limit(1);

  if (data && data.length > 0) {
    idCitaACalificar = data[0].id;
    // Si la encuentra, lanza la ventana emergente al cliente
    const modalRating = document.getElementById("modalRating");
    if(modalRating) {
      modalRating.classList.add("activo");
      modalRating.setAttribute("aria-hidden", "false");
    }
  }
}

// Interacción visual de las estrellas
const estrellas = document.querySelectorAll('.estrella');
estrellas.forEach(estrella => {
  estrella.addEventListener('click', (e) => {
    valorEstrellas = parseInt(e.target.dataset.valor);
    estrellas.forEach(s => {
      if (parseInt(s.dataset.valor) <= valorEstrellas) {
        s.style.color = '#fbbf24'; // Color Dorado
      } else {
        s.style.color = '#cbd5e1'; // Color Gris
      }
    });
  });
});

// Enviar a la base de datos
const btnEnviarRating = document.getElementById("btnEnviarRating");
if(btnEnviarRating) {
  btnEnviarRating.addEventListener("click", async () => {
    if (valorEstrellas === 0) {
      alert("Por favor, selecciona al menos una estrella para calificarnos.");
      return;
    }

    const btn = btnEnviarRating;
    btn.textContent = "Enviando...";
    btn.disabled = true;

    const comentario = document.getElementById("feedbackText").value.trim();

    const { error } = await supabaseClient
      .from('appointments')
      .update({ rating: valorEstrellas, feedback: comentario })
      .eq('id', idCitaACalificar);

    if (error) {
      alert("Hubo un error al guardar tu calificación: " + error.message);
      btn.textContent = "Enviar Calificación";
      btn.disabled = false;
    } else {
      alert("¡Muchas gracias por ayudarnos a mejorar, tu opinión es muy valiosa!");
      document.getElementById("modalRating").classList.remove("activo");
      document.getElementById("modalRating").setAttribute("aria-hidden", "true");
    }
  });
}

// Botón para cerrar la ventana sin calificar
const cerrarRating = document.getElementById("cerrarRating");
if(cerrarRating) {
  cerrarRating.addEventListener("click", () => {
    document.getElementById("modalRating").classList.remove("activo");
    document.getElementById("modalRating").setAttribute("aria-hidden", "true");
  });
}

// ==========================================
// LÓGICA DEL TRIAGE MÉDICO IA (SIMULACIÓN)
// ==========================================
const btnAbrirIA = document.getElementById("btnAbrirIA");
const btnCerrarIA = document.getElementById("btnCerrarIA");
const chatIA = document.getElementById("chatIA");
const chatIABody = document.getElementById("chatIABody");
const inputMensajeIA = document.getElementById("inputMensajeIA");

if (btnAbrirIA && chatIA) {
  btnAbrirIA.addEventListener("click", () => chatIA.classList.add("activo"));
  btnCerrarIA.addEventListener("click", () => chatIA.classList.remove("activo"));
}

window.enviarMensajeIA = function() {
  const mensaje = inputMensajeIA.value.trim();
  if (mensaje === "") return;

  // 1. Mostrar mensaje del usuario
  agregarMensajeAlChat(mensaje, "usuario");
  inputMensajeIA.value = "";

  // 2. Mostrar indicador de "Escribiendo..."
  const escribiendo = document.createElement("div");
  escribiendo.className = "mensaje-ia ia escribiendo";
  escribiendo.id = "indicadorEscribiendo";
  escribiendo.textContent = "Analizando síntomas...";
  chatIABody.appendChild(escribiendo);
  scrollChatIA();

  // 3. Simular tiempo de procesamiento de IA (1.5 segundos)
  setTimeout(() => {
    document.getElementById("indicadorEscribiendo").remove();
    const diagnostico = procesarDiagnosticoIA(mensaje.toLowerCase());
    agregarMensajeAlChat(diagnostico, "ia");
  }, 1500);
}

function agregarMensajeAlChat(texto, emisor) {
  const div = document.createElement("div");
  div.className = `mensaje-ia ${emisor}`;
  div.innerHTML = texto;
  chatIABody.appendChild(div);
  scrollChatIA();
}

function scrollChatIA() {
  chatIABody.scrollTop = chatIABody.scrollHeight;
}

// ------------------------------------------
// MOTOR DE REGLAS (EL "CEREBRO" EXPANDIDO DE LA IA)
// ------------------------------------------
function procesarDiagnosticoIA(texto) {
  // 1. Lentitud y Rendimiento
  if (texto.includes("lenta") || texto.includes("traba") || texto.includes("congela") || texto.includes("tarda") || texto.includes("lag")) {
    return "<strong>Diagnóstico Preliminar:</strong> Posible cuello de botella en almacenamiento o memoria RAM saturada.<br><br><strong>Recomendación:</strong> Te sugiero el servicio de <em>'Instalación de SSD'</em> o <em>'Ampliación de RAM'</em>. Si ya cuentas con SSD, una <em>'Optimización de Windows'</em> lo solucionará. ¿Deseas agendar tu cita abajo?";
  } 
  
  // 2. Sobrecalentamiento (Crítico)
  else if (texto.includes("calienta") || texto.includes("apaga") || texto.includes("ruido") || texto.includes("ventilador") || texto.includes("quema") || texto.includes("herviendo")) {
    return "<strong>Diagnóstico Preliminar:</strong> Problema de disipación térmica. Peligro inminente de daño en el procesador (Thermal Throttling).<br><br><strong>Recomendación:</strong> Es vital realizar una <em>'Limpieza interna + cambio de pasta térmica'</em>. Por favor, deja de usar el equipo en tareas pesadas y agenda el servicio.";
  } 
  
  // 3. Fallas de Sistema Operativo y Virus
  else if (texto.includes("pantalla azul") || texto.includes("reinicia") || texto.includes("error") || texto.includes("virus") || texto.includes("hacker") || texto.includes("publicidad") || texto.includes("lento el internet")) {
    return "<strong>Diagnóstico Preliminar:</strong> Falla crítica del sistema operativo, corrupción de archivos o infección de malware/virus.<br><br><strong>Recomendación:</strong> Necesitamos aplicar una <em>'Reparación del Sistema'</em>. Si la infección es grave, lo ideal es un <em>'Formateo + respaldo de archivos'</em> para dejarla como nueva sin perder tu información.";
  } 
  
  // 4. Hardware Crítico (No da video / No enciende)
  else if (texto.includes("prende") || texto.includes("enciende") || texto.includes("video") || texto.includes("pantalla negra") || texto.includes("pitidos")) {
    return "<strong>Diagnóstico Preliminar:</strong> Falla a nivel de hardware (Puede ser la fuente de poder, un módulo RAM dañado o falla en la Tarjeta Madre).<br><br><strong>Recomendación:</strong> Este problema requiere revisión física con multímetro. Por favor agenda un <em>'Diagnóstico básico'</em> en nuestro formulario para revisarla a nivel electrónica.";
  } 

  // 5. Daño por Líquidos (¡URGENCIA MÁXIMA!)
  else if (texto.includes("agua") || texto.includes("cafe") || texto.includes("liquido") || texto.includes("derramo") || texto.includes("mojó") || texto.includes("jugo")) {
    return "<strong>¡ALERTA URGENTE! ⚠️</strong><br><br><strong>Diagnóstico Preliminar:</strong> Cortocircuito por sulfatación líquida.<br><br><strong>Recomendación Inmediata:</strong> DESCONECTA la batería (si es posible) y NO la intentes encender por nada del mundo. Tráela inmediatamente al taller agendando una <em>'Limpieza profunda'</em> y <em>'Diagnóstico básico'</em>. ¡El tiempo es oro!";
  }

  // 6. Batería y Centro de Carga
  else if (texto.includes("bateria") || texto.includes("carga") || texto.includes("cargador") || texto.includes("conecta")) {
    return "<strong>Diagnóstico Preliminar:</strong> Vida útil de la celda de batería agotada o centro de carga desoldado.<br><br><strong>Recomendación:</strong> Agenda un <em>'Diagnóstico básico'</em> para medir el voltaje. Si es necesario, buscaremos el reemplazo exacto de tu batería o repararemos el puerto de carga.";
  }

  // 7. Periféricos (Teclado / Mouse / Pantalla rota)
  else if (texto.includes("teclado") || texto.includes("tecla") || texto.includes("mouse") || texto.includes("touchpad") || texto.includes("pantalla rota") || texto.includes("display")) {
    return "<strong>Diagnóstico Preliminar:</strong> Daño físico en hardware de entrada/salida.<br><br><strong>Recomendación:</strong> Realizamos reemplazos físicos. Agenda un <em>'Diagnóstico básico'</em> en el formulario y pon el modelo de tu equipo para cotizarte la refacción exacta (teclado o pantalla).";
  }

  // 8. Instalación de Software / Office
  else if (texto.includes("office") || texto.includes("word") || texto.includes("excel") || texto.includes("autocad") || texto.includes("instalar") || texto.includes("programa")) {
    return "<strong>Diagnóstico Preliminar:</strong> Solicitud de configuración de Software.<br><br><strong>Recomendación:</strong> Claro que sí. Tenemos el servicio de <em>'Instalación de programas'</em>. Cuéntanos qué software necesitas en los comentarios de tu cita y nosotros lo dejamos activado y listo para usar.";
  }

  // 9. Contraseñas olvidadas
  else if (texto.includes("contraseña") || texto.includes("password") || texto.includes("clave") || texto.includes("bloqueada") || texto.includes("olvide")) {
    return "<strong>Diagnóstico Preliminar:</strong> Bloqueo de sesión de usuario.<br><br><strong>Recomendación:</strong> Podemos botar la contraseña antigua mediante el servicio de <em>'Reinstalación / reparación del sistema'</em>, garantizando que recuperes el acceso sin perder los archivos que ya tienes guardados.";
  }

  // 10. Saludos y Agradecimientos
  else if (texto.includes("gracias") || texto.includes("ok") || texto.includes("excelente") || texto.includes("perfecto") || texto.includes("hola") || texto.includes("buenas")) {
    return "¡Hola! Soy la IA de Smart System. ¿En qué puedo ayudarte hoy? Dime qué le duele a tu computadora y te diré qué necesita.";
  } 
  
  // 11. Respuesta por Defecto (Catch-All)
  else {
    return "Entiendo. Ese es un síntoma técnico muy específico.<br><br>Para darte una solución exacta y profesional, te sugiero agendar un servicio de <strong>'Diagnóstico básico'</strong> utilizando el formulario de contacto. Nuestros ingenieros revisarán el equipo a fondo en nuestro laboratorio.";
  }
}