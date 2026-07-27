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

    // Kalau keranjang kosong
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Shopping Cart Is Empty</p>
                <a href="index.html">Return Shopping <- </a>
            </div>
        `;
        document.querySelector('.cart-summary').style.display = 'none'; // Sembunyikan summary
        updateBagCounter();
        return;
    }

    // Kalau ada isinya, munculin ringkasan harga dan render itemnya
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
        
        // Kalau jumlahnya 0, otomatis hapus barang dari keranjang
        if (cart[index].qty <= 0) {
            cart.splice(index, 1); 
        }
        
        // Simpan data terbaru ke localStorage dan render ulang
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        loadCart(); 
    }
}

// 4. Fungsi buat tombol Remove
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    cart.splice(index, 1); // Hapus 1 data di posisi index tersebut
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    loadCart();
}

// 5. Fungsi buat ngitung dan nampilin Total Harga
function calculateTotals(cart) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    document.getElementById('cart-subtotal').innerText = `IDR ${total.toLocaleString('id-ID')}`;
    document.getElementById('cart-total').innerText = `IDR ${total.toLocaleString('id-ID')}`;
}

// 6. Fungsi pas tombol Checkout ditekan (Di-update untuk Midtrans + Form Pengiriman)
async function goToCheckout() {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    
    // Cek kalau keranjang kosong
    if (cart.length === 0) {
        alert("Shopping Cart Is Empty!");
        return;
    }

    // Ambil nilai form pengiriman
    const namaPelanggan = document.getElementById('customerName').value.trim();
    const noWa = document.getElementById('customerPhone').value.trim();
    const alamat = document.getElementById('customerAddress').value.trim();

    // Validasi form gak boleh kosong
    if (!namaPelanggan || !noWa || !alamat) {
        alert("Please fill in your Shipping Information first!");
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    // 6a. Siapin data total harga
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = "ORDER-" + new Date().getTime(); 

    // 6b. Susun data barang sesuai format yang diminta API
    const itemDetails = cart.map(item => ({
        id: "ITEM-" + Math.floor(Math.random() * 1000), 
        price: item.price,
        quantity: item.qty,
        name: item.name.substring(0, 50) 
    }));

    try {
        // 6c. Tembak API Vercel lu pakai POST
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

        // 6d. Munculin Popup Midtrans kalau dapet token
        if (data.token) {
            window.snap.pay(data.token, {
                onSuccess: function(result){
                    alert("Pembayaran Berhasil!"); 
                    console.log(result);
                    localStorage.removeItem('shoppingCart');
                    loadCart(); 
                },
                onPending: function(result){
                    alert("Menunggu Pembayaran!"); 
                    console.log(result);
                },
                onError: function(result){
                    alert("Pembayaran Gagal!"); 
                    console.log(result);
                },
                onClose: function(){
                    alert('Continue the payment!');
                }
            });
        } else {
            console.error("Token gagal didapat:", data);
            alert("Sistem pembayaran lagi sibuk bro.");
        }
    } catch (error) {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        console.error("Ada error koneksi:", error);
        alert("Gagal nyambung ke server!");
    }
}

// 7. Jalankan fungsi loadCart saat halaman cart.html dibuka
window.addEventListener("DOMContentLoaded", () => {
    loadCart();
});