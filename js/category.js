// Pakai window.supabaseClient biar gak bentrok sama variabel bawaan CDN
if (!window.supabaseClient) {
    const SUPABASE_URL = 'https://krnaolsztrnesmymbmmu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybmFvbHN6dHJuZXNteW1ibW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTk0NDMsImV4cCI6MjA5OTg3NTQ0M30.ddZAXArx9A97-nhxw9d7_Xwur3jBq_jhquZEvti-AP8';
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function updateBagCounter() {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    let totalqty = cart.reduce((sum, item) => sum + item.qty, 0);
    const baglink = document.getElementById('bag-counter');
    if (baglink) baglink.innerText = `Bag (${totalqty})`;
}

async function loadCategory() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'all'; 

    const pageTitle = document.getElementById('page-title');
    const productList = document.getElementById('product-list');

    if (!pageTitle || !productList) return; 

    try {
        // Panggil menggunakan window.supabaseClient
        let query = window.supabaseClient.from('products').select('*');
        const cleanType = type.toLowerCase().replace(/_/g, '');

        if (cleanType === 'newarrival') {
            pageTitle.innerText = "New Arrival";
            query = query.eq('category', 'New_Arrival');
              
        } else if (cleanType === 'sale') { // TYPO FIXED: 'Sale' diubah jadi 'sale'
            pageTitle.innerText = "Sale";
            query = query.eq('category', 'Sale');
        } else {
            pageTitle.innerText = "All Product";
        }

        const { data: products, error } = await query;
        if (error) throw error;

        if (products && products.length > 0) {
            productList.innerHTML = products.map(p => {
                let priceHTML = '';

                // Cek apakah produk ini kategori Sale DAN punya nilai di original_price di database
                if (p.category === 'Sale' && p.original_price) {
                    priceHTML = `
                        <div class="price-container">
                            <span class="original-price">IDR ${Number(p.original_price).toLocaleString('id-ID')}</span>
                            <span class="sale-price">IDR ${Number(p.price || 0).toLocaleString('id-ID')}</span>
                        </div>
                    `;
                } else {
                    // Tampilan default untuk produk tanpa harga coret
                    priceHTML = `<div class="product-price">IDR ${Number(p.price || 0).toLocaleString('id-ID')}</div>`;
                }

                return `
                <div class="product-item">
                     <a href="Productview/detail.html?id=${p.id}" class="Product-link">
                        <img class="product-img" src="${p.image_url}" alt="${p.name}">
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            
                            <!-- Harga dirender otomatis pakai kondisi di atas -->
                            ${priceHTML}
                            
                        </div>
                     </a>
                </div>
                `;
            }).join('');
        } else {
            productList.innerHTML = "<p>Belum ada produk di kategori ini bro.</p>";
        }
    } catch (err) {
        console.error("Gagal load kategori:", err.message);
        if (pageTitle) pageTitle.innerText = "Gagal memuat produk";
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadCategory();
    updateBagCounter();
});