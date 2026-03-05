/**
 * Douce Tentation - Public Gallery & Menu
 * Fetches and displays the gallery photos and weekly menu from Supabase.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Supabase Client
    const SUPABASE_URL = 'https://obkxjbljiadirvgadfwj.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_2gPSSJ0iwvm5CiXL03VKCQ_m4EJ7HlJ';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 2. DOM Elements
    const menuImage = document.getElementById('public-menu-img');
    const menuPlaceholder = document.getElementById('public-menu-placeholder');

    const galleryGrid = document.getElementById('public-gallery-grid');
    const filterBtns = document.querySelectorAll('.public-filter-btn');

    let currentCategory = 'plats';

    // 3. Load Weekly Menu
    async function loadWeeklyMenu() {
        if (!menuImage) return;

        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('value')
                .eq('key', 'weekly_menu')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data && data.value) {
                menuImage.src = data.value;
                menuImage.style.display = 'block';
                if (menuPlaceholder) menuPlaceholder.style.display = 'none';
            } else {
                menuImage.style.display = 'none';
                if (menuPlaceholder) menuPlaceholder.style.display = 'block';
            }
        } catch (err) {
            console.error('Error loading weekly menu:', err);
        }
    }

    // 4. Load Gallery Images
    async function loadGalleryImages() {
        if (!galleryGrid) return;

        galleryGrid.innerHTML = '<div class="gallery-placeholder">Chargement des photos...</div>';

        try {
            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .eq('category', currentCategory)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                galleryGrid.innerHTML = '<div class="gallery-placeholder">Aucune photo pour le moment.</div>';
                return;
            }

            galleryGrid.innerHTML = '';
            data.forEach((img, index) => {
                const item = document.createElement('div');
                item.className = 'public-gallery-item';
                // Staggered animation delay
                item.style.animationDelay = `${index * 0.1}s`;

                item.innerHTML = `
                    <img src="${img.url}" alt="Création Douce Tentation" loading="lazy">
                `;

                galleryGrid.appendChild(item);
            });

        } catch (err) {
            console.error('Error loading gallery:', err);
            galleryGrid.innerHTML = '<div class="gallery-placeholder" style="color:red">Erreur lors du chargement des images.</div>';
        }
    }

    // 5. Filter Logic
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Load new category
                currentCategory = btn.getAttribute('data-filter');
                loadGalleryImages();
            });
        });
    }

    // 6. Initialize
    loadWeeklyMenu();
    loadGalleryImages();
});
