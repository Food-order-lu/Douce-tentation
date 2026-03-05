/**
 * Douce Tentation - Gallery & Menu Admin
 * Handles uploading, displaying, and deleting gallery photos and the weekly menu.
 * Uses Supabase Storage and Database.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Supabase Client
    // We use the anon key since we rely on RLS and the staff portal password for access control
    const SUPABASE_URL = 'https://obkxjbljiadirvgadfwj.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_2gPSSJ0iwvm5CiXL03VKCQ_m4EJ7HlJ';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 2. DOM Elements
    // Navigation
    const navGalerie = document.getElementById('navGalerie');
    const navCalendrier = document.getElementById('navCalendrier');
    const galerieView = document.getElementById('galerieView');
    const calendrierView = document.getElementById('calendrierView');
    const commandesView = document.getElementById('commandesView');
    const clientsView = document.getElementById('clientsView');
    const statsView = document.getElementById('statsView');

    // Tabs inside Galerie
    const tabBtns = document.querySelectorAll('.gallery-tab-btn');
    const tabContents = document.querySelectorAll('.gallery-tab-content');

    // Menu Elements
    const menuUpload = document.getElementById('menuUpload');
    const menuProgress = document.getElementById('menuProgress');
    const menuProgressBar = menuProgress?.querySelector('.gallery-progress-bar');
    const menuSuccess = document.getElementById('menuSuccess');
    const menuImage = document.getElementById('menuImage');
    const menuPlaceholder = document.getElementById('menuPlaceholder');

    // Gallery Elements
    const galleryUpload = document.getElementById('galleryUpload');
    const galleryCategory = document.getElementById('galleryCategory');
    const galleryProgress = document.getElementById('galleryProgress');
    const galleryProgressBar = galleryProgress?.querySelector('.gallery-progress-bar');
    const gallerySuccess = document.getElementById('gallerySuccess');
    const galleryGrid = document.getElementById('galleryGrid');

    // Delete Modal
    const deleteModal = document.getElementById('galleryDeleteModal');
    const confirmDeleteBtn = document.getElementById('confirmGalleryDelete');
    const cancelDeleteBtn = document.getElementById('cancelGalleryDelete');
    let imageToDelete = null;

    // 3. Navigation Logic
    if (navGalerie) {
        navGalerie.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state in sidebar
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            navGalerie.classList.add('active');

            // Show galerie view, hide others
            [calendrierView, commandesView, clientsView, statsView].forEach(view => {
                if (view) view.style.display = 'none';
            });
            if (galerieView) galerieView.style.display = 'block';

            // Load initial data
            loadMenuImage();
            loadGalleryImages();
        });
    }

    if (navCalendrier) {
        navCalendrier.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            navCalendrier.classList.add('active');

            [galerieView, commandesView, clientsView, statsView].forEach(view => {
                if (view) view.style.display = 'none';
            });
            if (calendrierView) calendrierView.style.display = 'block';
        });
    }

    // Tabs logic within Galerie view
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-gallery-tab') + 'TabContent';
            document.getElementById(targetId).classList.add('active');
        });
    });

    if (galleryCategory) {
        galleryCategory.addEventListener('change', loadGalleryImages);
    }

    // 4. Menu Upload Logic
    async function loadMenuImage() {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('value')
                .eq('key', 'weekly_menu')
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore not found

            if (data && data.value) {
                menuImage.src = data.value;
                menuImage.style.display = 'block';
                menuPlaceholder.style.display = 'none';
            } else {
                menuImage.style.display = 'none';
                menuPlaceholder.style.display = 'block';
            }
        } catch (err) {
            console.error('Error loading menu:', err);
        }
    }

    if (menuUpload) {
        menuUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show progress
            menuProgress.style.display = 'block';
            if (menuProgressBar) menuProgressBar.style.width = '30%';
            menuSuccess.style.display = 'none';

            try {
                // 1. Upload to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `menu-${Date.now()}.${fileExt}`;
                const filePath = `menus/${fileName}`;

                if (menuProgressBar) menuProgressBar.style.width = '50%';

                const { error: uploadError } = await supabase.storage
                    .from('menu')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                if (menuProgressBar) menuProgressBar.style.width = '80%';

                // 2. Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('menu')
                    .getPublicUrl(filePath);

                // 3. Save to DB
                const { error: dbError } = await supabase
                    .from('site_config')
                    .upsert({
                        key: 'weekly_menu',
                        value: publicUrl,
                        updated_at: new Date().toISOString()
                    });

                if (dbError) throw dbError;

                if (menuProgressBar) menuProgressBar.style.width = '100%';

                // Success
                menuImage.src = publicUrl;
                menuImage.style.display = 'block';
                menuPlaceholder.style.display = 'none';
                menuSuccess.style.display = 'block';

                setTimeout(() => {
                    menuProgress.style.display = 'none';
                    if (menuProgressBar) menuProgressBar.style.width = '0%';
                }, 2000);

            } catch (err) {
                console.error('Upload error:', err);
                alert('Erreur lors de l\'upload du menu: ' + err.message);
                menuProgress.style.display = 'none';
            }

            // Reset input
            menuUpload.value = '';
        });
    }

    // 5. Gallery Logic
    async function loadGalleryImages() {
        if (!galleryGrid) return;

        const category = galleryCategory ? galleryCategory.value : 'plats';
        galleryGrid.innerHTML = '<p class="gallery-placeholder">Chargement...</p>';

        try {
            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .eq('category', category)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                galleryGrid.innerHTML = '<p class="gallery-placeholder">Aucune photo dans cette catégorie</p>';
                return;
            }

            galleryGrid.innerHTML = '';
            data.forEach(img => {
                const item = document.createElement('div');
                item.className = 'gallery-item';

                const emoji = img.category === 'plats' ? '🍰' : '🎉';

                item.innerHTML = `
                    <img src="${img.url}" alt="Gallery image">
                    <button class="gallery-delete-btn" data-id="${img.id}" data-path="${img.storage_path}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="gallery-static-badge">${emoji}</div>
                `;

                // Add delete event listener
                item.querySelector('.gallery-delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteModal(img.id, img.storage_path);
                });

                galleryGrid.appendChild(item);
            });

        } catch (err) {
            console.error('Error loading gallery:', err);
            galleryGrid.innerHTML = '<p class="gallery-placeholder" style="color:red">Erreur de chargement</p>';
        }
    }

    if (galleryUpload) {
        galleryUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const category = galleryCategory ? galleryCategory.value : 'plats';

            // Show progress
            galleryProgress.style.display = 'block';
            if (galleryProgressBar) galleryProgressBar.style.width = '30%';
            gallerySuccess.style.display = 'none';

            try {
                // 1. Upload to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${category}-${Date.now()}.${fileExt}`;
                const filePath = `${category}/${fileName}`;

                if (galleryProgressBar) galleryProgressBar.style.width = '50%';

                const { error: uploadError } = await supabase.storage
                    .from('gallery')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                if (galleryProgressBar) galleryProgressBar.style.width = '80%';

                // 2. Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(filePath);

                // 3. Save to DB
                const { error: dbError } = await supabase
                    .from('gallery_images')
                    .insert({
                        url: publicUrl,
                        storage_path: filePath,
                        category: category
                    });

                if (dbError) throw dbError;

                if (galleryProgressBar) galleryProgressBar.style.width = '100%';

                // Success
                gallerySuccess.style.display = 'block';
                await loadGalleryImages(); // Refresh grid

                setTimeout(() => {
                    galleryProgress.style.display = 'none';
                    if (galleryProgressBar) galleryProgressBar.style.width = '0%';
                    gallerySuccess.style.display = 'none';
                }, 3000);

            } catch (err) {
                console.error('Upload error:', err);
                alert('Erreur lors de l\'upload de la photo: ' + err.message);
                galleryProgress.style.display = 'none';
            }

            // Reset input
            galleryUpload.value = '';
        });
    }

    // 6. Delete Logic
    function showDeleteModal(id, path) {
        imageToDelete = { id, path };
        if (deleteModal) deleteModal.classList.add('active');
    }

    function hideDeleteModal() {
        imageToDelete = null;
        if (deleteModal) deleteModal.classList.remove('active');
    }

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!imageToDelete) return;

            const originalText = confirmDeleteBtn.innerText;
            confirmDeleteBtn.innerText = 'Suppression...';
            confirmDeleteBtn.disabled = true;

            try {
                // 1. Delete from storage
                const { error: storageError } = await supabase.storage
                    .from('gallery')
                    .remove([imageToDelete.path]);

                if (storageError) throw storageError;

                // 2. Delete from DB
                const { error: dbError } = await supabase
                    .from('gallery_images')
                    .delete()
                    .eq('id', imageToDelete.id);

                if (dbError) throw dbError;

                // Success
                hideDeleteModal();
                await loadGalleryImages();

            } catch (err) {
                console.error('Delete error:', err);
                alert('Erreur lors de la suppression: ' + err.message);
            } finally {
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.innerText = originalText;
                    confirmDeleteBtn.disabled = false;
                }
            }
        });
    }

    // Close modal on click outside
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) hideDeleteModal();
        });
    }
});
