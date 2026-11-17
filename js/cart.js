import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 0. KONEKSI SUPABASE & NOTIFIKASI
// ==========================================
const supabaseUrl = 'https://krnaolsztrnesmymbmmu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybmFvbHN6dHJuZXNteW1ibW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTk0NDMsImV4cCI6MjA5OTg3NTQ0M30.ddZAXArx9A97-nhxw9d7_Xwur3jBq_jhquZEvti-AP8';
const supabase = createClient(supabaseUrl, supabaseKey);

function showToast(message, type = 'success') {
    let container = document.getElementById('ds-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ds-toast-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-black' : (type === 'warning' ? 'bg-yellow-600' : 'bg-red-600');
    toast.className = `px-6 py-3 rounded shadow-lg transform transition-all duration-300 translate-x-full opacity-0 ${bgColor} text-white font-medium text-sm flex items-center gap-2 pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000); 
}

// ==========================================
// 1. FUNGSI KERANJANG BELANJA
// ==========================================
function updateBagCounter() {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    let totalqty = cart.reduce((sum, item) => sum + item.qty, 0);
    const baglink = document.getElementById('bag-counter');
    if (baglink) baglink.innerText = `Bag (${totalqty})`;
}

function loadCart() {
    const cartContainer = document.getElementById('cart-items-container');
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Shopping Cart Is Empty</p>
                <a href="index.html">Return Shopping <- </a>
            </div>
        `;
        document.querySelector('.cart-summary').style.display = 'none'; 
        updateBagCounter();
        return;
    }

    document.querySelector('.cart-summary').style.display = 'block';
    
    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image.replace('../', '')}" alt="${item.name}">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">IDR ${Number(item.price).toLocaleString('id-ID')}</div>
                
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
                
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>
            <div class="item-total">
                IDR ${Number(item.price * item.qty).toLocaleString('id-ID')}
            </div>
        </div>
    `).join('');

    calculateTotals(cart);
    updateBagCounter();
}

window.updateQty = function(index, change) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1); 
        }
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        loadCart(); 
    }
};

window.removeItem = function(index) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    cart.splice(index, 1); 
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    loadCart();
};

function calculateTotals(cart) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cart-subtotal').innerText = `IDR ${total.toLocaleString('id-ID')}`;
    document.getElementById('cart-total').innerText = `IDR ${total.toLocaleString('id-ID')}`;
}

// ==========================================
// 2. CHECKOUT: SIMPAN KE SUPABASE + BUKA WA
// ==========================================
window.goToCheckout = async function() {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    
    if (cart.length === 0) {
        showToast("Shopping Cart Is Empty!", "error");
        return;
    }

    const namaPelanggan = document.getElementById('customerName').value.trim();
    const noWa = document.getElementById('customerPhone').value.trim();
    const alamat = document.getElementById('customerAddress').value.trim();

    if (!namaPelanggan || !noWa || !alamat) {
        showToast("Please fill in your Shipping Information first!", "error");
        return;
    }

    let itemListText = "";
    let grandTotal = 0;
    const formattedItemsForDB = [];

    cart.forEach((item, index) => {
        const subtotal = Number(item.price) * item.qty;
        grandTotal += subtotal;
        
        const detailVarian = [item.size, item.color].filter(Boolean).join(' - ');
        const varianText = detailVarian ? ` (${detailVarian})` : '';

        itemListText += `${index + 1}. ${item.name}${varianText}\n`;
        itemListText += `   Qty: ${item.qty} x IDR ${Number(item.price).toLocaleString('id-ID')} = IDR ${subtotal.toLocaleString('id-ID')}\n`;

        // Format item agar rapi saat dibaca di halaman Admin
        formattedItemsForDB.push({
            name: `${item.name}${varianText}`,
            price: Number(item.price),
            quantity: item.qty
        });
    });

    const orderId = "DS-" + new Date().getTime().toString().slice(-6);

    showToast("Memproses pesanan...", "success");

    try {
        // 1. SIMPAN DATA PESANAN KE TABEL 'orders' SUPABASE
        const { error } = await supabase
            .from('orders')
            .insert([{
                order_id: orderId,
                customer_name: namaPelanggan,
                customer_phone: noWa,
                shipping_address: alamat,
                items: formattedItemsForDB,
                total_price: grandTotal,
                payment_status: 'pending'
            }]);

        if (error) {
            console.error("Gagal simpan ke Supabase:", error.message);
            // Tetap lanjut buka WA meskipun database gagal, biar pembeli tetap bisa order
        }
    } catch (err) {
        console.error("Error koneksi:", err);
    }

    // 2. SUSUN PESAN & ALIHKAN KE WHATSAPP ADMIN
    const pesanWA = `Halo Admin DS by Delia Septianti, saya mau order:\n\n` +
                    `*No. Order:* #${orderId}\n` +
                    `*Detail Pesanan:*\n` +
                    `${itemListText}\n` +
                    `*Total Produk:* IDR ${grandTotal.toLocaleString('id-ID')}\n` +
                    `*(Belum termasuk ongkir)*\n\n` +
                    `*Data Pengiriman:*\n` +
                    `• Nama: ${namaPelanggan}\n` +
                    `• No. WA: ${noWa}\n` +
                    `• Alamat: ${alamat}\n\n` +
                    `Mohon info ketersediaan stok dan total ongkirnya ya kak. Terima kasih!`;

    const adminWhatsApp = "6281285952703"; 
    const whatsappURL = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(pesanWA)}`;

    localStorage.removeItem('shoppingCart');

    setTimeout(() => {
        window.location.href = whatsappURL;
    }, 500);
};

window.addEventListener("DOMContentLoaded", () => {
    loadCart();
});