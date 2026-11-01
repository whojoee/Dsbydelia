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

        if (type === 'Sale') {
            pageTitle.innerText = "Sale";
            query = query.eq('category', 'Sale');
        } else {
            pageTitle.innerText = "All_Product";
        }

        const { data: products, error } = await query;
        if (error) throw error;

        if (products && products.length > 0) {
            productList.innerHTML = products.map(p => `
                <div class="product-item">
                     <a href="Productview/detail.html?id=${p.id}" class="Product-link">
                        <img class="product-img" src="${p.image_url}" alt="${p.name}">
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            <div class="product-price">IDR ${Number(p.price).toLocaleString('id-ID')}</div>
                        </div>
                     </a>
                </div>
            `).join('');
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