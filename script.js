// ==========================================
// 1. INIȚIALIZARE FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDDNH1J_X9qldqQP4LYmpfwtAkwLiMXV6I",
    authDomain: "my-website-5f664.firebaseapp.com",
    projectId: "my-website-5f664",
    storageBucket: "my-website-5f664.firebasestorage.app",
    messagingSenderId: "1040584946697",
    appId: "1:1040584946697:web:402d5a1b197ce49f1cb4d8",
    measurementId: "G-92QLTW6HV5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 2. CONTROL MODAL (DESCHIDERE / ÎNCHIDERE)
// ==========================================
window.openModal = function(packageName = 'Contact General', price = 0) {
    const modal = document.getElementById('checkout-modal');
    const formContent = document.getElementById('modal-form-content');
    const successContent = document.getElementById('modal-success-content');
    const packageTitle = document.getElementById('modal-package-title');
    const notes = document.getElementById('order-notes');

    if (formContent) formContent.style.display = 'block';
    if (successContent) successContent.style.display = 'none';

    if (packageTitle) {
        packageTitle.innerText = packageName !== 'Contact General' ? `Pachet selectat: ${packageName}` : 'Consultanță Generală Nexora';
    }
    
    if (notes) {
        if (packageName !== 'Contact General') {
            notes.value = `Pachet vizat: ${packageName} (Preț: ${price} Lei)`;
        } else {
            notes.value = 'Cerere Ofertă Generală';
        }
    }

    if (modal) modal.classList.add('show');
};

window.closeModal = function() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('show');
};

// ==========================================
// 3. COMUTARE TAB-URI SERVICII
// ==========================================
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active'); 
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
};

// ==========================================
// 4. EVENIMENTE LA DOMCONTENTLOADED
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

    // Efect de fundal pentru meniul de navigare la scroll
    const navbar = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }
    });

    // Animații la scroll (Reveal)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) entry.target.classList.add('active'); 
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(el => observer.observe(el));

    // Ascundere Loader inițial
    window.addEventListener('load', () => { 
        setTimeout(() => { 
            const loader = document.getElementById('intro-loader');
            if (loader) loader.classList.add('hidden'); 
        }, 600); 
    });

    // Trimiterea Formularului Principal de Lead-uri (orders)
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('btn-submit-order');
            submitBtn.disabled = true; 
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se trimite...';

            const orderData = {
                customerName: document.getElementById('order-name').value.trim(),
                customerEmail: document.getElementById('order-email').value.trim(),
                customerPhone: document.getElementById('order-phone').value.trim(),
                projectDescription: document.getElementById('order-address').value.trim(),
                packageInterested: document.getElementById('order-notes').value.trim(),
                status: 'lead_nou', 
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                // Salvare în colecția orders
                await db.collection('orders').add(orderData);
                
                // Eveniment conversie Google Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'generate_lead', { currency: 'RON', value: 100 });
                }
                
                // Afișează ecranul dedicat de succes și curăță câmpurile
                const formContent = document.getElementById('modal-form-content');
                const successContent = document.getElementById('modal-success-content');
                if (formContent) formContent.style.display = 'none';
                if (successContent) successContent.style.display = 'block';

                checkoutForm.reset();
            } catch (error) {
                console.error("Eroare la trimitere:", error);
                alert("A apărut o problemă la conexiune. Verifică datele și reîncearcă!");
            } finally {
                submitBtn.disabled = false; 
                submitBtn.innerHTML = 'Trimite Solicitarea';
            }
        });
    }

    // Trimiterea Formularului de "Audit Gratuit" din Footer (subscribers)
    const footForm = document.getElementById('footer-form');
    if (footForm) {
        footForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            const btn = footForm.querySelector('button');
            btn.disabled = true; 
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se trimite...';
            
            try {
                await db.collection('subscribers').add({ 
                    name: document.getElementById('foot-name').value.trim(), 
                    email: document.getElementById('foot-email').value.trim(), 
                    type: 'solicitare_audit_gratuit',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                });
                
                footForm.innerHTML = `
                    <div style="text-align:center; background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #10b981;">
                        <h3 style="color:#10b981; margin-bottom: 5px;"><i class="fas fa-check"></i> Audit Solicitat!</h3>
                        <p style="color: var(--text-main); font-size:0.9rem;">Te vom contacta pe email în maximum 24h.</p>
                    </div>`;
            } catch(err) { 
                console.error("Eroare audit:", err);
                btn.disabled = false; 
                btn.innerHTML = 'Eroare. Reîncearcă'; 
            }
        });
    }
});

// ==========================================
// 5. ÎNCĂRCARE DINAMICĂ PACHETE DIN FIRESTORE
// ==========================================
db.collection('products').where('active', '==', true).onSnapshot(snapshot => {
    const gridPrezentare = document.getElementById('menu-grid-prezentare');
    const gridEcommerce = document.getElementById('menu-grid-ecommerce');
    const gridCustom = document.getElementById('menu-grid-custom');
    const gridMentenanta = document.getElementById('menu-grid-mentenanta');
    
    if (gridPrezentare) gridPrezentare.innerHTML = ''; 
    if (gridEcommerce) gridEcommerce.innerHTML = '';
    if (gridCustom) gridCustom.innerHTML = '';
    if (gridMentenanta) gridMentenanta.innerHTML = '';

    snapshot.forEach(doc => {
        const p = doc.data(); 
        
        let btnText = "Cere ofertă exactă";
        let displayPrice = "";
        
        if (p.category === 'custom') {
            displayPrice = `<span class="price" style="font-size:1.8rem; margin-bottom:15px; display:block;">Pe bază de proiect</span>`;
            btnText = "Programează Consultanță";
        } else if (p.category === 'mentenanta') {
            displayPrice = `<span class="price" style="font-size:2rem; margin-bottom:15px; display:block;">de la ${p.price} Lei/lună</span>`;
            btnText = "Solicită Suport";
        } else {
            displayPrice = `<span style="font-size:1.1rem; color:var(--text-muted); display:block; margin-bottom:5px;">Preț de la</span><span class="price" style="font-size:2.2rem; margin-bottom:20px; display:block; font-weight:800;">${p.price} Lei</span>`;
        }

        let formattedDesc = (p.description || '')
            .replace(/✔️/g, '<li style="margin-bottom:10px; display:flex; gap:10px; align-items:flex-start;"><i class="fas fa-check" style="color:var(--success); margin-top:4px;"></i> <span>')
            .replace(/<br\s*\/?>/gi, '</span></li>');
        
        if (formattedDesc.includes('<li')) {
            formattedDesc = `<ul style="list-style:none; padding:0; margin-bottom:30px; color:var(--text-main); font-size:0.95rem;">${formattedDesc}</span></li></ul>`;
        }

        const safeName = (p.name || '').replace(/'/g, "\\'");

        const cardHTML = `
        <div class="menu-card reveal-up">
            <div class="card-info" style="height:100%; display:flex; flex-direction:column;">
                ${p.badge ? `<span class="hero-badge" style="margin-bottom:20px; display:inline-block; font-size:0.75rem;">${p.badge}</span>` : ''}
                <h3 style="font-size: 1.6rem; color:white; margin-bottom:15px;">${p.name}</h3>
                ${displayPrice}
                ${formattedDesc}
                <div class="card-bottom" style="margin-top:auto;">
                    <button onclick="openModal('${safeName}', ${p.price || 0})" class="btn-primary" style="width:100%; border-radius:8px;">${btnText}</button>
                </div>
            </div>
        </div>`;
        
        if (p.category === 'ecommerce' && gridEcommerce) gridEcommerce.insertAdjacentHTML('beforeend', cardHTML);
        else if (p.category === 'custom' && gridCustom) gridCustom.insertAdjacentHTML('beforeend', cardHTML);
        else if (p.category === 'mentenanta' && gridMentenanta) gridMentenanta.insertAdjacentHTML('beforeend', cardHTML);
        else if (gridPrezentare) gridPrezentare.insertAdjacentHTML('beforeend', cardHTML);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) entry.target.classList.add('active'); 
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.menu-card.reveal-up').forEach(el => observer.observe(el));
});
