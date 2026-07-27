// ==========================================
// 0. SISTEM NOTIFIKASI CANTIK (TAILWIND)
// ==========================================
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

// 1. Fungsi buat update angka keranjang di Navbar
function updateBagCounter() {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    let totalqty = cart.reduce((sum, item) => sum + item.qty, 0);
    const baglink = document.getElementById('bag-counter');
    if (baglink) baglink.innerText = `Bag (${totalqty})`;
}

// 2. Fungsi utama buat nampilin isi keranjang ke layar
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

// 3. Fungsi buat nambah/ngurangin jumlah barang (+ dan -)
function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    
    if (cart[index]) {
        cart[index].qty += change;
        
        if (cart[index].qty <= 0) {
            cart.splice(index, 1); 
        }
        
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        loadCart(); 
    }
}

// 4. Fungsi buat tombol Remove
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    cart.splice(index, 1); 
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    loadCart();
}

// 5. Fungsi buat ngitung dan nampilin Total Harga
function calculateTotals(cart) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    document.getElementById('cart-subtotal').innerText = `IDR ${total.toLocaleString('id-ID')}`;
    document.getElementById('cart-total').innerText = `IDR ${total.toLocaleString('id-ID')}`;
}

// 6. Fungsi pas tombol Checkout ditekan
async function goToCheckout() {
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

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = "ORDER-" + new Date().getTime(); 

    const itemDetails = cart.map(item => ({
        id: "ITEM-" + Math.floor(Math.random() * 1000), 
        price: item.price,
        quantity: item.qty,
        name: item.name.substring(0, 50) 
    }));

    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: orderId,
                gross_amount: total,
                items: itemDetails,
                customer_details: {
                    first_name: namaPelanggan,
                    email: "customer@example.com", 
                    phone: noWa,               
                    shipping_address: {        
                        first_name: namaPelanggan,
                        phone: noWa,
                        address: alamat
                    }
                },
                alamat_pengiriman: alamat 
            })
        });

        const data = await response.json();

        if (loadingOverlay) loadingOverlay.style.display = 'none';

        if (data.token) {
            window.snap.pay(data.token, {
                onSuccess: function(result){
                    showToast("Pembayaran Berhasil!", "success"); 
                    console.log(result);
                    localStorage.removeItem('shoppingCart');
                    loadCart(); 
                },
                onPending: function(result){
                    showToast("Menunggu Pembayaran!", "warning"); 
                    console.log(result);
                },
                onError: function(result){
                    showToast("Pembayaran Gagal!", "error"); 
                    console.log(result);
                },
                onClose: function(){
                    showToast("Continue the payment!", "warning");
                }
            });
        } else {
            console.error("Token gagal didapat:", data);
            showToast("Sistem pembayaran lagi sibuk bro.", "error");
        }
    } catch (error) {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        console.error("Ada error koneksi:", error);
        showToast("Gagal nyambung ke server!", "error");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadCart();
});