// ===== CARRUSEL AUTOMÁTICO CON IMÁGENES =====
let currentSlideIndex = 0;

// URLs de imágenes de calidad profesional (usando servicios gratuitos)
const carouselData = [
  {
    icon: '🚀',
    title: 'Bienvenido a Sharee',
    description: 'Conecta con tu comunidad y comparte ideas innovadoras.',
    image: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop")'
  },
  {
    icon: '💡',
    title: 'Comparte Conocimiento',
    description: 'Aprende y crece junto con otros estudiantes y profesionales.',
    image: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop&crop=entropy&cs=tinysrgb")'
  },
  {
    icon: '🌟',
    title: 'Destaca tu Potencial',
    description: 'Muestra tus proyectos y habilidades al mundo.',
    image: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop")'
  },
  {
    icon: '🤝',
    title: 'Colaboración Real',
    description: 'Trabaja en equipo y construye conexiones duraderas.',
    image: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop")'
  }
];

function initCarousel() {
  const wrapper = document.querySelector('.carousel-wrapper');
  const dotsContainer = document.querySelector('.carousel-dots');

  if (wrapper && dotsContainer && wrapper.children.length === 1) {
    carouselData.forEach((data, index) => {
      // Crear items del carrusel
      const item = document.createElement('div');
      item.className = 'carousel-item' + (index === 0 ? ' active' : '');
      item.style.backgroundImage = data.image;
      item.innerHTML = `
        <div class="carousel-content">
          <div class="carousel-item-icon">${data.icon}</div>
          <h2>${data.title}</h2>
          <p>${data.description}</p>
        </div>
      `;
      wrapper.appendChild(item);

      // Crear dots
      const dot = document.createElement('span');
      dot.className = 'dot' + (index === 0 ? ' active' : '');
      dot.onclick = () => currentSlide(index);
      dotsContainer.appendChild(dot);
    });
  }
}

function showSlide(n) {
  const items = document.querySelectorAll('.carousel-item');
  const dotsAll = document.querySelectorAll('.dot');

  if (items.length === 0) return;

  items.forEach((slide, index) => {
    slide.classList.remove('active');
    if (dotsAll[index]) dotsAll[index].classList.remove('active');
  });

  if (items[n]) {
    items[n].classList.add('active');
  }
  if (dotsAll[n]) {
    dotsAll[n].classList.add('active');
  }
}

function nextSlide() {
  const items = document.querySelectorAll('.carousel-item');
  if (items.length === 0) return;
  currentSlideIndex = (currentSlideIndex + 1) % items.length;
  showSlide(currentSlideIndex);
}

function currentSlide(n) {
  currentSlideIndex = n;
  showSlide(currentSlideIndex);
}

// Auto-rotate carrusel cada 5 segundos (solo si el panel está visible)
let carouselInterval;

function startCarouselAutoPlay() {
  if (window.innerWidth >= 1024) {
    carouselInterval = setInterval(nextSlide, 5000);
  }
}

function stopCarouselAutoPlay() {
  clearInterval(carouselInterval);
}

window.addEventListener('resize', () => {
  stopCarouselAutoPlay();
  startCarouselAutoPlay();
});

// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePassword() {
  const passwordInput = document.getElementById("loginPassword");
  const toggleBtn = document.querySelector('.toggle-password');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    passwordInput.type = 'password';
    toggleBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

// ===== MANEJO DE FORMULARIO DE LOGIN =====
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById("loginForm");
  
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let email = document.getElementById("loginEmail").value;
      let password = document.getElementById("loginPassword").value;
      let mensaje = document.getElementById("mensajeLogin");
      let button = document.querySelector('button[type="submit"]');

      // Validación básica
      if (!email || !password) {
        mostrarMensaje("Por favor completa todos los campos", "error");
        return;
      }

      if (!validateEmail(email)) {
        mostrarMensaje("Por favor ingresa un correo válido", "error");
        return;
      }

      if (password.length < 6) {
        mostrarMensaje("La contraseña debe tener al menos 6 caracteres", "error");
        return;
      }

      // Desabilitar botón mientras se envía
      button.disabled = true;
      button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Verificando...';

      // Enviar datos al servidor
      fetch("http://localhost/sharee/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
        .then(res => res.json())
        .then(data => {
          button.disabled = false;
          button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> Iniciar sesión';

          if (data.error) {
            mostrarMensaje(data.error, "error");
          } else {
            mostrarMensaje("¡Inicio de sesión exitoso!", "exito");

            // Guardar datos en localStorage
            localStorage.setItem("usuario_id", data.usuario_id);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);

            // Redireccionar después de 1.5 segundos
            setTimeout(() => {
              window.location.href = "Pagina_Social.html";
            }, 1500);
          }
        })
        .catch(err => {
          console.error("Error:", err);
          button.disabled = false;
          button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> Iniciar sesión';
          mostrarMensaje("Error de conexión. Intenta más tarde.", "error");
        });
    });
  }
});

// ===== VALIDAR EMAIL =====
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ===== MOSTRAR MENSAJE =====
function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById("mensajeLogin");
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;

  // Auto-limpiar mensaje de éxito después de 3 segundos
  if (tipo === "exito") {
    setTimeout(() => {
      mensaje.textContent = "";
      mensaje.className = "mensaje";
    }, 3000);
  }
}

// ===== CARGAR EMAIL RECORDADO Y INICIALIZAR CARRUSEL =====
window.addEventListener("load", function () {
  initCarousel();
  startCarouselAutoPlay();

  const rememberedEmail = localStorage.getItem("rememberedEmail");
  if (rememberedEmail) {
    document.getElementById("loginEmail").value = rememberedEmail;
    document.getElementById("remember").checked = true;
  }

  // Guardar email si se marca "Recuérdame"
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("change", function (e) {
      if (e.target.id === "remember") {
        if (e.target.checked) {
          localStorage.setItem("rememberedEmail", document.getElementById("loginEmail").value);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
      }
    });

    // Actualizar email recordado cuando cambia el input
    document.getElementById("loginEmail").addEventListener("change", function () {
      if (document.getElementById("remember").checked) {
        localStorage.setItem("rememberedEmail", this.value);
      }
    });
  }
});

// ===== PRESIONAR ENTER PARA LOGIN =====
document.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    const form = document.getElementById("loginForm");
    if (form && e.target.tagName === "INPUT") {
      form.dispatchEvent(new Event("submit"));
    }
  }
});

// ===== AGREGAR ESTILOS DE ANIMACIÓN SPIN =====
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
