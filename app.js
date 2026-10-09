// =============================================================================
// ASTEROID AVENGERS - NASA RESEARCH HUB
// Production-grade client-side NASA Open API integration
// =============================================================================

// --- Global State & API Key Management ---
let currentTab = 'images';

function getApiKey() {
    const customKey = localStorage.getItem('nasa_custom_key');
    return (customKey && customKey.trim().length > 0) ? customKey.trim() : 'DEMO_KEY';
}

function updateKeyIndicator() {
    const indicator = document.getElementById('key-status-indicator');
    const input = document.getElementById('user-api-key');
    const savedKey = localStorage.getItem('nasa_custom_key');

    if (savedKey && savedKey.trim().length > 0) {
        if (input) input.value = savedKey;
        if (indicator) {
            indicator.className = "text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/60";
            indicator.textContent = "Custom Key Active";
        }
    } else {
        if (input) input.value = '';
        if (indicator) {
            indicator.className = "text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60";
            indicator.textContent = "DEMO_KEY Active";
        }
    }
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');
    const toastContent = document.getElementById('toast-content');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) toastIcon.textContent = isError ? '⚠️' : '✨';

    if (isError) {
        toastContent.className = "bg-rose-950 border border-rose-600 text-rose-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm";
    } else {
        toastContent.className = "bg-slate-900 border border-cyan-500/60 text-cyan-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm";
    }

    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');
    }, 3500);
}

function saveApiKey() {
    const keyInput = document.getElementById('user-api-key');
    const val = keyInput ? keyInput.value.trim() : '';

    if (!val) {
        showToast('Please enter a valid NASA API Key.', true);
        return;
    }

    localStorage.setItem('nasa_custom_key', val);
    updateKeyIndicator();
    showToast('NASA API Key saved & applied successfully!');

    // Automatically re-trigger data loading for the current active tab immediately
    reloadCurrentTab();
}

function clearApiKey() {
    localStorage.removeItem('nasa_custom_key');
    updateKeyIndicator();
    showToast('Reset to DEMO_KEY.');
    reloadCurrentTab();
}

function reloadCurrentTab() {
    if (currentTab === 'images') fetchImageData(currentImagePage);
    else if (currentTab === 'apod') fetchApodPage(apodPage);
    else if (currentTab === 'epic') fetchEpicData();
    else if (currentTab === 'weather') fetchWeatherData();
    else if (currentTab === 'fireball') fetchFireballData();
}

// --- Tab Navigation Switcher ---
function switchTab(tabName) {
    currentTab = tabName;

    // Toggle section visibility
    document.querySelectorAll('.space-section').forEach(sec => sec.classList.add('hidden'));
    const targetSection = document.getElementById(`tab-${tabName}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // Update active tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.className = "tab-btn px-4 py-2 rounded-xl bg-cyan-700 text-white text-sm font-semibold transition flex items-center gap-2 shadow-sm";
        } else {
            btn.className = "tab-btn px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition flex items-center gap-2";
        }
    });

    reloadCurrentTab();
}

// Window Initialization
window.addEventListener('DOMContentLoaded', () => {
    updateKeyIndicator();
    
    // Add ESC key listener for modal closing
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Close modal on backdrop click
    const modal = document.getElementById('media-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Default to Image library tab
    fetchImageData(currentImagePage);
});


// =============================================================================
// TAB 1: NASA IMAGE & VIDEO LIBRARY (images-api.nasa.gov)
// =============================================================================
let currentQuery = 'Opportunity Rover';
let currentMediaType = '';
let currentImagePage = 1;

function changeQuery(query) {
    currentQuery = query;
    currentImagePage = 1;
    const searchInput = document.getElementById('image-search-input');
    if (searchInput) searchInput.value = query;
    fetchImageData(currentImagePage);
}

function handleCustomSearch() {
    const searchInput = document.getElementById('image-search-input');
    const val = searchInput ? searchInput.value.trim() : '';
    if (val) {
        currentQuery = val;
        currentImagePage = 1;
        fetchImageData(currentImagePage);
    }
}

function changeMediaType(mediaType) {
    currentMediaType = mediaType;
    currentImagePage = 1;
    fetchImageData(currentImagePage);
}

function changeImagePage(direction) {
    currentImagePage += direction;
    if (currentImagePage < 1) currentImagePage = 1;
    fetchImageData(currentImagePage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchImageData(page) {
    const grid = document.getElementById('gallery-grid');
    const loading = document.getElementById('images-loading');
    const pagination = document.getElementById('images-pagination');
    
    if (!grid) return;
    grid.innerHTML = '';
    if (loading) loading.classList.remove('hidden');
    if (pagination) pagination.classList.add('hidden');

    let url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(currentQuery)}&page_size=6&page=${page}`;
    if (currentMediaType) {
        url += `&media_type=${encodeURIComponent(currentMediaType)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to load image library`);
        const data = await response.json();
        const items = data.collection?.items || [];
        
        if (loading) loading.classList.add('hidden');

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
                    <p class="text-slate-400 text-base">No media records found for "<span class="text-cyan-300 font-medium">${escapeHtml(currentQuery)}</span>".</p>
                    <button onclick="changeQuery('Opportunity Rover')" class="mt-4 bg-slate-800 hover:bg-cyan-600 text-cyan-300 hover:text-white px-4 py-2 rounded-xl text-xs font-medium transition">
                        Reset to Opportunity Rover
                    </button>
                </div>
            `;
            return;
        }

        items.forEach(item => {
            const dataObj = item.data?.[0] || {};
            const title = dataObj.title || 'Untitled NASA Asset';
            const description = dataObj.description || 'Historical record from NASA research archives.';
            const nasaId = dataObj.nasa_id || '';
            const mediaType = dataObj.media_type || 'image';
            const dateCreated = dataObj.date_created ? dataObj.date_created.split('T')[0] : '';
            const previewUrl = item.links?.[0]?.href || '';

            const card = document.createElement('div');
            card.className = "media-card bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-cyan-950/30 transition-all duration-300 group cursor-pointer";
            
            // Safe JSON dataset attribute for modal view
            card.addEventListener('click', () => {
                openMediaDetails(nasaId, title, description, mediaType, previewUrl, dateCreated, dataObj.center || 'NASA');
            });

            card.innerHTML = `
                <div class="relative overflow-hidden bg-black/60 h-52">
                    ${previewUrl 
                        ? `<img src="${previewUrl}" alt="${escapeHtml(title)}" class="media-card-img w-full h-full object-cover">`
                        : `<div class="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">No Preview Available</div>`
                    }
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
                    <span class="absolute top-3 right-3 bg-slate-950/80 text-cyan-300 text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider border border-cyan-800/80 backdrop-blur-sm">
                        ${mediaType === 'video' ? '🎬 VIDEO' : '📷 IMAGE'}
                    </span>
                    ${dateCreated ? `<span class="absolute bottom-2 left-3 text-[11px] text-slate-300/90 font-medium">${dateCreated}</span>` : ''}
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition line-clamp-1">${escapeHtml(title)}</h3>
                        <p class="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">${escapeHtml(description)}</p>
                    </div>
                    <div class="pt-4 mt-3 border-t border-slate-800/70 flex items-center justify-between">
                        <span class="text-xs font-mono text-slate-500 truncate max-w-[140px]">${escapeHtml(nasaId)}</span>
                        <span class="text-cyan-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            Inspect Files →
                        </span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        if (pagination) {
            pagination.classList.remove('hidden');
            const indicator = document.getElementById('img-page-indicator');
            const prevBtn = document.getElementById('img-prev-btn');
            if (indicator) indicator.textContent = `Page ${currentImagePage}`;
            if (prevBtn) prevBtn.disabled = currentImagePage <= 1;
        }

    } catch (error) {
        if (loading) loading.classList.add('hidden');
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-rose-950/30 rounded-2xl border border-rose-800/60 p-6">
                <p class="text-rose-300 font-medium">Failed to connect to NASA Image Library.</p>
                <p class="text-slate-400 text-xs mt-1">${escapeHtml(error.message)}</p>
                <button onclick="fetchImageData(${page})" class="mt-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-4 py-2 rounded-xl text-xs font-semibold transition border border-slate-700">
                    ↻ Retry Query
                </button>
            </div>
        `;
    }
}

async function openMediaDetails(nasaId, title, description, mediaType, defaultPreview, dateCreated, center) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = `
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3"></div>
            <p class="text-cyan-400 text-sm font-medium">Fetching real-time asset manifest & download files...</p>
        </div>
    `;

    let mediaContainer = '';
    let downloadLinks = '';

    try {
        const res = await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const assetData = await res.json();
        const items = assetData.collection?.items || [];

        // Check for video or high-res images
        let videoFile = null;
        let origImage = null;
        let largeImage = null;
        let mediumImage = null;

        items.forEach(asset => {
            const href = asset.href || '';
            const lowerHref = href.toLowerCase();

            if (lowerHref.endsWith('.mp4') || lowerHref.endsWith('.mov')) {
                if (!videoFile || lowerHref.includes('orig') || lowerHref.includes('large')) {
                    videoFile = href;
                }
            }
            if (lowerHref.endsWith('~orig.jpg') || lowerHref.endsWith('~orig.png') || lowerHref.endsWith('.tif')) {
                origImage = href;
            } else if (lowerHref.endsWith('~large.jpg') || lowerHref.endsWith('~large.png')) {
                largeImage = href;
            } else if (lowerHref.endsWith('~medium.jpg')) {
                mediumImage = href;
            }

            const fileName = href.split('/').pop();
            downloadLinks += `
                <a href="${href}" target="_blank" rel="noopener" download class="bg-slate-800/90 hover:bg-cyan-700 text-cyan-200 hover:text-white text-xs p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition truncate group">
                    <span class="truncate font-mono text-[11px]">${fileName}</span>
                    <span class="ml-2 font-sans font-semibold text-cyan-400 group-hover:text-white">⬇ Download</span>
                </a>
            `;
        });

        if (mediaType === 'video' && videoFile) {
            mediaContainer = `
                <div class="bg-black rounded-xl overflow-hidden mb-4 aspect-video flex items-center justify-center">
                    <video controls autoplay class="w-full h-full object-contain">
                        <source src="${videoFile}">
                        Your browser does not support HTML5 video playback.
                    </video>
                </div>
            `;
        } else {
            const displayImg = origImage || largeImage || mediumImage || defaultPreview;
            mediaContainer = `
                <div class="bg-black/90 rounded-xl overflow-hidden mb-4 max-h-96 flex items-center justify-center border border-slate-800">
                    <img src="${displayImg}" alt="${escapeHtml(title)}" class="max-h-96 w-full object-contain">
                </div>
            `;
        }

    } catch (e) {
        // Fallback preview if manifest fetch fails
        mediaContainer = `
            <div class="bg-black/90 rounded-xl overflow-hidden mb-4 max-h-96 flex items-center justify-center border border-slate-800">
                <img src="${defaultPreview}" alt="${escapeHtml(title)}" class="max-h-96 w-full object-contain">
            </div>
        `;
        downloadLinks = `<p class="text-xs text-slate-500 col-span-full">Direct asset manifest unavailable. <a href="${defaultPreview}" target="_blank" class="text-cyan-400 underline">View thumbnail asset</a></p>`;
    }

    content.innerHTML = `
        ${mediaContainer}
        <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">${escapeHtml(nasaId)}</span>
            ${center ? `<span class="text-xs text-slate-400 font-medium">Center: ${escapeHtml(center)}</span>` : ''}
            ${dateCreated ? `<span class="text-xs text-slate-400">• ${dateCreated}</span>` : ''}
        </div>
        <h3 class="text-xl font-bold text-slate-100 mb-2">${escapeHtml(title)}</h3>
        <p class="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed max-h-48 overflow-y-auto pr-2">${escapeHtml(description)}</p>
        
        <div class="border-t border-slate-800 pt-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <span>📁</span> Direct High-Resolution Assets & Downloads
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                ${downloadLinks || '<p class="text-xs text-slate-500">No downloadable files detected for this item.</p>'}
            </div>
        </div>
    `;
}

function closeModal() {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    if (modal) modal.classList.add('hidden');
    // Stop any playing video
    if (content) content.innerHTML = '';
}


// =============================================================================
// TAB 2: APOD (ASTRONOMY PICTURE OF THE DAY)
// 9 distinct real astronomical assets per page + multi-page pagination
// Zero placeholder images, real high-resolution images & iframe video embeds
// =============================================================================
let apodPage = 1;

function changeApodPage(direction) {
    apodPage += direction;
    if (apodPage < 1) apodPage = 1;
    fetchApodPage(apodPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchApodPage(page) {
    const grid = document.getElementById('apod-grid');
    const loading = document.getElementById('apod-loading');
    const pagination = document.getElementById('apod-pagination');

    if (!grid) return;
    grid.innerHTML = '';
    if (loading) loading.classList.remove('hidden');
    if (pagination) pagination.classList.add('hidden');

    const apiKey = getApiKey();
    let apods = [];
    let fetchSuccess = false;

    // Strategy A: Direct NASA Official APOD Feed (science.nasa.gov WordPress live API)
    // This official NASA endpoint reliably provides live astronomical data with per_page=9 & page pagination,
    // avoiding 429 rate limit issues on DEMO_KEY while delivering 100% authentic APOD captures.
    try {
        const wpUrl = `https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=9&page=${page}`;
        const wpRes = await fetch(wpUrl);
        if (wpRes.ok) {
            const wpData = await wpRes.json();
            if (Array.isArray(wpData) && wpData.length > 0) {
                apods = wpData.map(item => {
                    // Extract true high-resolution image URL from hdurl or basic_html
                    let imageSrc = item.hdurl || '';
                    if (!imageSrc && item.basic_html) {
                        const imgMatch = item.basic_html.match(/<IMG\s+SRC="([^"]+)"/i);
                        if (imgMatch && imgMatch[1]) imageSrc = imgMatch[1];
                    }
                    if (!imageSrc && item.url && !item.url.includes('/image-article/')) {
                        imageSrc = item.url;
                    }

                    // Clean plain text explanation
                    let cleanExplanation = item.explanation || '';
                    cleanExplanation = cleanExplanation.replace(/<[^>]+>/g, '').replace(/^Explanation:\s*/i, '').trim();

                    return {
                        date: item.date || '',
                        title: item.title || 'Astronomy Picture of the Day',
                        explanation: cleanExplanation,
                        media_type: item.media_type || 'image',
                        url: imageSrc || item.permalink || '',
                        hdurl: item.hdurl || imageSrc || '',
                        copyright: item.copyright ? item.copyright.replace(/<[^>]+>/g, '').trim() : ''
                    };
                });
                fetchSuccess = true;
            }
        }
    } catch (e) {
        // Fall through to Strategy B
    }

    // Strategy B: Official api.nasa.gov/planetary/apod with computed valid past date range
    if (!fetchSuccess) {
        try {
            // Compute a 9-day contiguous window in the past
            // e.g. Starting from 1 day ago to prevent future date 400 errors
            const msPerDay = 86400000;
            const now = new Date();
            const daysOffsetStart = 1 + (page - 1) * 9;
            const daysOffsetEnd = daysOffsetStart + 8;

            const endDateObj = new Date(now.getTime() - daysOffsetStart * msPerDay);
            const startDateObj = new Date(now.getTime() - daysOffsetEnd * msPerDay);

            const endDate = endDateObj.toISOString().split('T')[0];
            const startDate = startDateObj.toISOString().split('T')[0];

            const apodApiUrl = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}&start_date=${startDate}&end_date=${endDate}`;
            const res = await fetch(apodApiUrl);
            
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    // Filter out any entries where the image URL is the generic placeholder meatball logo
                    apods = data.filter(item => {
                        const u = item.url || '';
                        return !u.includes('nasa-logo@2x.png') && !u.includes('editor-page-nasa-logo');
                    }).reverse(); // Latest dates first
                    fetchSuccess = true;
                }
            } else if (res.status === 429) {
                // Rate limit notice
                throw new Error("NASA API rate limit exceeded on DEMO_KEY. Please add your personal NASA API Key in the top bar.");
            }
        } catch (e) {
            // Check if error was rate limit
            if (e.message && e.message.includes('rate limit')) {
                throw e;
            }
        }
    }

    // Strategy C: Count query fallback if date window was empty or failed
    if (!fetchSuccess) {
        try {
            const countUrl = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}&count=9`;
            const countRes = await fetch(countUrl);
            if (countRes.ok) {
                const countData = await countRes.json();
                if (Array.isArray(countData) && countData.length > 0) {
                    apods = countData.filter(item => {
                        const u = item.url || '';
                        return !u.includes('nasa-logo@2x.png') && !u.includes('editor-page-nasa-logo');
                    });
                    fetchSuccess = true;
                }
            } else if (countRes.status === 429) {
                throw new Error("NASA API rate limit exceeded on DEMO_KEY. Enter your personal NASA API Key above.");
            }
        } catch (e) {
            if (e.message && e.message.includes('rate limit')) throw e;
        }
    }

    if (loading) loading.classList.add('hidden');

    if (!fetchSuccess || apods.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                <p class="text-rose-300 font-medium">Unable to load APOD captures.</p>
                <p class="text-slate-400 text-xs mt-2 max-w-md mx-auto">
                    NASA API rate limit reached or server unresponsive. Please enter your personal NASA API Key in the top header input.
                </p>
                <div class="mt-4 flex justify-center gap-3">
                    <button onclick="fetchApodPage(${page})" class="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-4 py-2 rounded-xl transition font-medium">
                        ↻ Retry Feed
                    </button>
                    <a href="https://api.nasa.gov/" target="_blank" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs px-4 py-2 rounded-xl transition border border-slate-700">
                        Get Free NASA Key ↗
                    </a>
                </div>
            </div>
        `;
        return;
    }

    // Render 9 APOD cards
    apods.forEach(apod => {
        const isVideo = apod.media_type === 'video' || (apod.url && (apod.url.includes('youtube.com') || apod.url.includes('vimeo.com')));
        const imageUrl = apod.hdurl || apod.url || '';
        const title = apod.title || 'Astronomy Picture of the Day';
        const explanation = apod.explanation || 'Authentic astronomical capture provided by NASA APOD.';
        const date = apod.date || '';

        const card = document.createElement('div');
        card.className = "media-card bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-cyan-950/30 transition-all duration-300 group";

        let mediaRender = '';
        if (isVideo) {
            mediaRender = `
                <div class="w-full h-52 bg-black rounded-t-2xl overflow-hidden">
                    <iframe src="${apod.url}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        } else {
            mediaRender = `
                <div class="relative overflow-hidden bg-black/80 h-52">
                    <img src="${imageUrl}" alt="${escapeHtml(title)}" class="media-card-img w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
                    <span class="absolute top-3 right-3 bg-slate-950/80 text-cyan-300 text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider border border-cyan-800/80 backdrop-blur-sm">
                        🔭 APOD
                    </span>
                    <span class="absolute bottom-2 left-3 text-[11px] text-slate-300/90 font-mono font-medium">${date}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div>
                ${mediaRender}
                <div class="p-5">
                    <h3 class="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition line-clamp-1">${escapeHtml(title)}</h3>
                    ${apod.copyright ? `<p class="text-[11px] text-slate-500 mt-1">Credit: ${escapeHtml(apod.copyright)}</p>` : ''}
                    <p class="text-slate-400 text-xs mt-2.5 leading-relaxed line-clamp-3">${escapeHtml(explanation)}</p>
                </div>
            </div>
            <div class="p-5 pt-0">
                <a href="${apod.hdurl || apod.url}" target="_blank" rel="noopener" class="w-full text-center bg-slate-800/90 hover:bg-cyan-700 text-cyan-300 hover:text-white text-xs py-2 rounded-xl transition font-semibold flex items-center justify-center gap-1.5 border border-slate-700">
                    <span>🔍</span> View Full Resolution High-Res
                </a>
            </div>
        `;

        grid.appendChild(card);
    });

    if (pagination) {
        pagination.classList.remove('hidden');
        const indicator = document.getElementById('apod-page-indicator');
        const prevBtn = document.getElementById('apod-prev-btn');
        if (indicator) indicator.textContent = `Page ${page}`;
        if (prevBtn) prevBtn.disabled = page <= 1;
    }
}


// =============================================================================
// TAB 3: DSCOVR EPIC CAMERA (api.nasa.gov/EPIC)
// Natural color Earth imagery from Lagrange Point L1
// Real coordinates (lat, lon), caption, full-resolution PNG download
// =============================================================================
async function fetchEpicData() {
    const grid = document.getElementById('epic-grid');
    const loading = document.getElementById('epic-loading');
    if (!grid) return;

    grid.innerHTML = '';
    if (loading) loading.classList.remove('hidden');

    const apiKey = getApiKey();
    let data = null;

    // Resilient fallback chain for EPIC metadata
    const epicEndpoints = [
        `https://api.nasa.gov/EPIC/api/natural/images?api_key=${encodeURIComponent(apiKey)}`,
        `https://api.nasa.gov/EPIC/api/natural?api_key=${encodeURIComponent(apiKey)}`,
        `https://epic.gsfc.nasa.gov/api/natural/images`,
        `https://epic.gsfc.nasa.gov/api/natural`
    ];

    for (const endpoint of epicEndpoints) {
        try {
            const res = await fetch(endpoint);
            if (res.ok) {
                const parsed = await res.json();
                if (Array.isArray(parsed) && parsed.length > 0) {
                    data = parsed;
                    break;
                }
            }
        } catch (err) {
            // Try next candidate
        }
    }

    if (loading) loading.classList.add('hidden');

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                <p class="text-rose-300 font-medium">Failed to load EPIC imagery.</p>
                <p class="text-slate-400 text-xs mt-2 max-w-md mx-auto">
                    Verify your NASA API Key or check if the DSCOVR ground downlink is undergoing scheduled calibration.
                </p>
                <button onclick="fetchEpicData()" class="mt-4 bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-4 py-2 rounded-xl transition font-medium">
                    ↻ Retry EPIC Feed
                </button>
            </div>
        `;
        return;
    }

    // Render up to 9 recent Earth captures
    data.slice(0, 9).forEach(item => {
        // Date parsing (YYYY-MM-DD)
        const dateStr = item.date ? item.date.split(' ')[0] : '';
        const [year, month, day] = dateStr.split('-');

        // Official NASA API direct image URL structure:
        // https://api.nasa.gov/EPIC/archive/natural/${YYYY}/${MM}/${DD}/png/${image_name}.png?api_key=${apiKey}
        const apiImagePngUrl = `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${item.image}.png?api_key=${encodeURIComponent(apiKey)}`;
        
        // Backup GSFC direct URL in case api.nasa.gov rate limits or drops PNG connection
        const directGsfcPngUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${item.image}.png`;

        const lat = item.centroid_coordinates?.lat != null ? item.centroid_coordinates.lat.toFixed(2) : '0.00';
        const lon = item.centroid_coordinates?.lon != null ? item.centroid_coordinates.lon.toFixed(2) : '0.00';
        const caption = item.caption || 'DSCOVR Polychromatic natural color Earth observation disc.';

        const card = document.createElement('div');
        card.className = "media-card bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-5 flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-cyan-950/30 transition-all duration-300 group";

        card.innerHTML = `
            <div>
                <div class="relative bg-black rounded-xl overflow-hidden mb-4 h-60 flex items-center justify-center border border-slate-800/80">
                    <img src="${apiImagePngUrl}" 
                         alt="DSCOVR Earth Disc ${item.image}" 
                         class="media-card-img w-full h-full object-contain"
                         onerror="this.onerror=null; this.src='${directGsfcPngUrl}';">
                    <span class="absolute top-2.5 right-2.5 bg-slate-950/80 text-cyan-300 text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider border border-cyan-800 backdrop-blur-sm">
                        L1 LAGRANGE
                    </span>
                </div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-cyan-400 font-mono font-semibold">${item.date}</span>
                    <span class="text-[11px] text-slate-500 font-mono">${escapeHtml(item.image)}</span>
                </div>
                <h3 class="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition mt-1">Earth Polychromatic Disc</h3>
                <p class="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">${escapeHtml(caption)}</p>
                
                <div class="mt-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                        <span class="text-slate-500 block">Sub-Solar Lat:</span>
                        <span class="font-mono text-cyan-300 font-medium">${lat}°</span>
                    </div>
                    <div>
                        <span class="text-slate-500 block">Sub-Solar Lon:</span>
                        <span class="font-mono text-cyan-300 font-medium">${lon}°</span>
                    </div>
                </div>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-800/70">
                <a href="${directGsfcPngUrl}" target="_blank" rel="noopener" download="${item.image}.png" 
                   class="w-full text-center bg-cyan-700 hover:bg-cyan-600 text-white text-xs py-2.5 rounded-xl transition font-semibold flex items-center justify-center gap-2 shadow hover:shadow-cyan-900">
                    <span>⬇</span> Download Original Full PNG
                </a>
            </div>
        `;

        grid.appendChild(card);
    });
}


// =============================================================================
// TAB 4: MARS INSIGHT WEATHER (api.nasa.gov/insight_weather)
// Live surface meteorology per Sol (Temperature, Wind, Pressure, Season)
// Gracefully handles empty sensor periods
// =============================================================================
async function fetchWeatherData() {
    const container = document.getElementById('weather-container');
    const loading = document.getElementById('weather-loading');
    if (!container) return;

    container.innerHTML = '';
    if (loading) loading.classList.remove('hidden');

    const apiKey = getApiKey();
    const url = `https://api.nasa.gov/insight_weather/?api_key=${encodeURIComponent(apiKey)}&feedtype=json&ver=1.0`;

    try {
        const res = await fetch(url);
        if (loading) loading.classList.add('hidden');

        if (res.status === 429) {
            throw new Error("Rate limit exceeded on DEMO_KEY. Please save your free NASA API Key in the top header.");
        }
        if (!res.ok) {
            throw new Error(`Mars meteorological station responded with HTTP ${res.status}`);
        }

        const data = await res.json();
        const solKeys = data.sol_keys || [];

        if (solKeys.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                    <p class="text-slate-400 font-medium">No active sensor telemetry currently recorded for this Martian cycle.</p>
                    <p class="text-slate-500 text-xs mt-1">The InSight lander mission concluded in late 2022; historical telemetry feeds periodically stream archive calibrations.</p>
                </div>
            `;
            return;
        }

        // Render each Sol card
        solKeys.forEach(sol => {
            const solData = data[sol] || {};
            const dateStr = solData.First_UTC ? solData.First_UTC.split('T')[0] : 'N/A';
            const season = solData.Season ? solData.Season.toUpperCase() : 'N/A';

            // Temperature metrics
            const tempAvg = solData.AT?.av != null ? `${solData.AT.av.toFixed(1)} °C` : null;
            const tempMin = solData.AT?.mn != null ? `${solData.AT.mn.toFixed(1)} °C` : null;
            const tempMax = solData.AT?.mx != null ? `${solData.AT.mx.toFixed(1)} °C` : null;

            // Wind metrics
            const windAvg = solData.HWS?.av != null ? `${solData.HWS.av.toFixed(1)} m/s` : null;

            // Pressure metrics
            const pressAvg = solData.PRE?.av != null ? `${solData.PRE.av.toFixed(1)} Pa` : null;

            const card = document.createElement('div');
            card.className = "bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between";

            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                        <span class="bg-cyan-950 text-cyan-300 text-xs px-3 py-1 rounded-full font-bold border border-cyan-800">
                            Sol ${sol}
                        </span>
                        <span class="text-xs text-slate-400 font-mono">${dateStr}</span>
                    </div>

                    <div class="space-y-3 text-xs">
                        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                            <span class="text-slate-400 flex items-center gap-1.5">🌡️ Temp (Avg)</span>
                            <span class="font-mono font-bold ${tempAvg ? 'text-cyan-300' : 'text-slate-600'}">
                                ${tempAvg || 'Sensor Offline'}
                            </span>
                        </div>
                        ${(tempMin && tempMax) ? `
                            <div class="flex items-center justify-between text-[11px] text-slate-500 px-2">
                                <span>Min: ${tempMin}</span>
                                <span>Max: ${tempMax}</span>
                            </div>
                        ` : ''}

                        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                            <span class="text-slate-400 flex items-center gap-1.5">💨 Wind Speed</span>
                            <span class="font-mono font-bold ${windAvg ? 'text-emerald-300' : 'text-slate-600'}">
                                ${windAvg || 'Sensor Offline'}
                            </span>
                        </div>

                        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                            <span class="text-slate-400 flex items-center gap-1.5">🎈 Pressure</span>
                            <span class="font-mono font-bold ${pressAvg ? 'text-amber-300' : 'text-slate-600'}">
                                ${pressAvg || 'Sensor Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800/70 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Elysium Planitia</span>
                    <span class="text-cyan-400 font-medium uppercase tracking-wider">${season}</span>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (e) {
        if (loading) loading.classList.add('hidden');
        container.innerHTML = `
            <div class="col-span-full text-center py-12 bg-rose-950/30 rounded-2xl border border-rose-800/60 p-6">
                <p class="text-rose-300 font-medium">Failed to downlink Mars InSight telemetry.</p>
                <p class="text-slate-400 text-xs mt-1">${escapeHtml(e.message)}</p>
                <button onclick="fetchWeatherData()" class="mt-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-4 py-2 rounded-xl text-xs font-semibold transition border border-slate-700">
                    ↻ Retry Connection
                </button>
            </div>
        `;
    }
}


// =============================================================================
// TAB 5: FIREBALL & BOLIDE TELEMETRY (ssd-api.jpl.nasa.gov)
// Resilient CORS proxy fallback + strict dynamic fields mapping
// Date (UTC), Latitude, Longitude, Altitude, Radiated Energy, Impact Energy
// =============================================================================
async function fetchFireballData() {
    const container = document.getElementById('fireball-container');
    const loading = document.getElementById('fireball-loading');
    if (!container) return;

    container.innerHTML = '';
    if (loading) loading.classList.remove('hidden');

    const targetUrl = 'https://ssd-api.jpl.nasa.gov/fireball.api?limit=25';

    // Resilient fallback chain for CORS-blocked endpoints
    const proxyCandidates = [
        // 1. Direct fetch attempt
        async () => {
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        },
        // 2. corsproxy.org
        async () => {
            const res = await fetch(`https://corsproxy.org/?${encodeURIComponent(targetUrl)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        },
        // 3. corsproxy.io
        async () => {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        },
        // 4. allorigins raw
        async () => {
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        },
        // 5. codetabs proxy
        async () => {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        },
        // 6. allorigins JSON wrapper
        async () => {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const wrap = await res.json();
            return JSON.parse(wrap.contents);
        }
    ];

    let data = null;
    let lastError = null;

    for (const attempt of proxyCandidates) {
        try {
            data = await attempt();
            if (data && data.data && Array.isArray(data.data)) {
                break;
            }
        } catch (err) {
            lastError = err;
        }
    }

    if (loading) loading.classList.add('hidden');

    if (!data || !data.data || data.data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-rose-300 font-medium">Failed to connect to JPL Fireball database.</p>
                <p class="text-slate-400 text-xs mt-1">CORS constraint or temporary network timeout: ${escapeHtml(lastError?.message || 'Network Error')}</p>
                <button onclick="fetchFireballData()" class="mt-4 bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-4 py-2 rounded-xl transition font-medium">
                    ↻ Retry Connection
                </button>
            </div>
        `;
        return;
    }

    // Dynamic schema column mapping based on data.fields from CNEOS
    // Official fields: ['date', 'energy', 'impact-e', 'lat', 'lat-dir', 'lon', 'lon-dir', 'alt', 'vel']
    const fields = data.fields || [];
    const dateIdx = fields.indexOf('date');
    const energyIdx = fields.indexOf('energy');
    const impactIdx = fields.indexOf('impact-e');
    const latIdx = fields.indexOf('lat');
    const latDirIdx = fields.indexOf('lat-dir');
    const lonIdx = fields.indexOf('lon');
    const lonDirIdx = fields.indexOf('lon-dir');
    const altIdx = fields.indexOf('alt');

    let tableHtml = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div>
                <span class="text-xs text-slate-400">Total Telemetry Events Logged: </span>
                <span class="text-xs font-mono font-bold text-cyan-300">${data.count || data.data.length}</span>
            </div>
            <span class="text-[11px] text-slate-500 font-mono">Source: NASA/JPL CNEOS High-Energy Atmospheric Impacts</span>
        </div>
        <table class="w-full text-left text-xs sm:text-sm text-slate-300 min-w-[720px]">
            <thead class="bg-slate-950 text-cyan-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                    <th class="p-3.5">Peak Date (UTC)</th>
                    <th class="p-3.5">Latitude</th>
                    <th class="p-3.5">Longitude</th>
                    <th class="p-3.5">Altitude</th>
                    <th class="p-3.5">Total Radiated Energy</th>
                    <th class="p-3.5">Impact Energy</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 font-mono">
    `;

    data.data.forEach(row => {
        const peakDate = (dateIdx !== -1 && row[dateIdx]) ? row[dateIdx] : 'N/A';
        const latVal = (latIdx !== -1 && row[latIdx]) ? row[latIdx] : '';
        const latDir = (latDirIdx !== -1 && row[latDirIdx]) ? row[latDirIdx] : '';
        const latStr = latVal ? `${latVal}° ${latDir}` : '<span class="text-slate-600">-</span>';

        const lonVal = (lonIdx !== -1 && row[lonIdx]) ? row[lonIdx] : '';
        const lonDir = (lonDirIdx !== -1 && row[lonDirIdx]) ? row[lonDirIdx] : '';
        const lonStr = lonVal ? `${lonVal}° ${lonDir}` : '<span class="text-slate-600">-</span>';

        const altVal = (altIdx !== -1 && row[altIdx]) ? `${row[altIdx]} km` : '<span class="text-slate-600">N/A</span>';
        const energyVal = (energyIdx !== -1 && row[energyIdx]) ? `${row[energyIdx]} × 10¹⁰ J` : '<span class="text-slate-600">N/A</span>';
        const impactVal = (impactIdx !== -1 && row[impactIdx]) ? `${row[impactIdx]} kt` : '<span class="text-slate-600">N/A</span>';

        tableHtml += `
            <tr class="hover:bg-slate-800/50 transition">
                <td class="p-3.5 text-cyan-300 font-semibold text-xs">${peakDate}</td>
                <td class="p-3.5 text-slate-300">${latStr}</td>
                <td class="p-3.5 text-slate-300">${lonStr}</td>
                <td class="p-3.5 text-slate-300">${altVal}</td>
                <td class="p-3.5 text-slate-300">${energyVal}</td>
                <td class="p-3.5 font-bold text-amber-400">${impactVal}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}


// --- Utility Helpers ---
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}