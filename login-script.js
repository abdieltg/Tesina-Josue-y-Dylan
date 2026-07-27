// ===== CARRUSEL AUTOMÁTICO =====
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.carousel-item');
const dots = document.querySelectorAll('.dot');
const carousel = document.querySelector('.carousel');

function showSlide(n) {
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        dots[index].classList.remove('active');
    });
    
    slides[n].classList.add('active');
    dots[n].classList.add('active');
    
    carousel.style.transform = `translateX(-${n * 100}%)`;
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    showSlide(currentSlideIndex);
}

function currentSlide(n) {
    currentSlideIndex = n;
    showSlide(currentSlideIndex);
}

// Auto-rotate carrusel cada 5 segundos
setInterval(nextSlide, 5000);

// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePassword() {
    const passwordInput = document.getElementById('password');
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
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validación simple
    if (!email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Por favor ingresa un correo válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Simulación de login (aquí iría la lógica real)
    showToast('Iniciando sesión...', 'info');
    
    // Simular envío de datos al servidor
    setTimeout(() => {
        if (remember) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        showToast('¡Bienvenido! Redirigiendo...', 'success');
        
        // Aquí iría la redirección a la página principal
        // window.location.href = '/dashboard';
    }, 1500);
}

// ===== VALIDAR EMAIL =====
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== MOSTRAR TOAST =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Cambiar color según tipo
    switch(type) {
        case 'success':
            toast.style.background = '#4CAF50';
            break;
        case 'error':
            toast.style.background = '#f44336';
            break;
        case 'info':
            toast.style.background = '#2196F3';
            break;
        default:
            toast.style.background = '#333';
    }
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== CARGAR EMAIL RECORDADO =====
window.addEventListener('load', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember').checked = true;
        
        // Mostrar label del email
        document.getElementById('email').dispatchEvent(new Event('focus'));
        document.getElementById('email').dispatchEvent(new Event('blur'));
    }
    
    // Mostrar slide inicial
    showSlide(0);
});

// ===== PRESIONAR ENTER PARA LOGIN =====
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.login-form');
    form.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
});

// ===== EFECTOS DE ENTRADA =====
document.addEventListener('DOMContentLoaded', () => {
    // Animar elementos al cargar
    const loginBox = document.querySelector('.login-box');
    loginBox.style.animation = 'slideInRight 0.6s ease-out';
});
