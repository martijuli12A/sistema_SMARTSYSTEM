// Configuración real de tu proyecto en Supabase
const SUPABASE_URL = 'https://pohrgobetrcvcbvodjcz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_Ad-nh4W_vgTMRb6PEJiFZA_Y_JQyumu';

// Inicializar la conexión
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

const PARTICLE_CONFIG = {
  mobileCount: 60,
  desktopCount: 120,
  maxDistance: 145,
  connectionOpacity: 0.52,
  colors: ['#0cd7f2', '#7edfff', '#12a5d0', '#06b3d4']
};

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

if (formulario) {
  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const total = totalServicios ? totalServicios.textContent : "$0";
    alert(`Tu solicitud fue enviada de forma visual. Total estimado: ${total}. Después se puede conectar a Firebase o PHP.`);
  });
}

if (servicioSelect) {
  servicioSelect.addEventListener("change", actualizarResumenServicios);
  actualizarResumenServicios();
}

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
    cerrarModalLogin();
  }
});

if (formLogin) {
  formLogin.addEventListener("submit", (event) => {
    event.preventDefault();

    const usuario = usuarioLogin && usuarioLogin.value ? usuarioLogin.value.trim() : "cliente";
    const alias = usuario.includes("@") ? usuario.split("@")[0] : usuario;

    if (abrirLogin) {
      abrirLogin.textContent = `Hola, ${alias}`;
      abrirLogin.classList.add("logueado");
    }

    alert(`Bienvenido, ${alias}. Inicio de sesión visual completado.`);
    formLogin.reset();
    cerrarModalLogin();

    if (contacto) {
      setTimeout(() => {
        contacto.scrollIntoView({ behavior: "smooth" });

        const primerCampoCita = formulario
          ? formulario.querySelector("input, select, textarea")
          : null;

        if (primerCampoCita && typeof primerCampoCita.focus === "function") {
          primerCampoCita.focus();
        }
      }, 120);
    }
  });
}

if (formRegistro) {
  formRegistro.addEventListener("submit", (event) => {
    event.preventDefault();

    const nombre = nombreRegistro && nombreRegistro.value ? nombreRegistro.value.trim() : "cliente";
    const alias = nombre.split(" ")[0] || "cliente";

    if (abrirLogin) {
      abrirLogin.textContent = `Hola, ${alias}`;
      abrirLogin.classList.add("logueado");
    }

    alert(`Registro completado. Bienvenido, ${alias}.`);
    formRegistro.reset();
    mostrarVistaAcceso("login");
    cerrarModalLogin();

    if (contacto) {
      setTimeout(() => {
        contacto.scrollIntoView({ behavior: "smooth" });

        const primerCampoCita = formulario
          ? formulario.querySelector("input, select, textarea")
          : null;

        if (primerCampoCita && typeof primerCampoCita.focus === "function") {
          primerCampoCita.focus();
        }
      }, 120);
    }
  });
}

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      return;
    }

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
    
    this.particleCount = window.innerWidth < 768
      ? PARTICLE_CONFIG.mobileCount
      : PARTICLE_CONFIG.desktopCount;
    
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
