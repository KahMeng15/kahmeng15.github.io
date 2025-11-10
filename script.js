// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  setupEventListeners();
  setupScrollDetection();
  setupSmoothScroll();
}

// ============================================
// EVENT LISTENERS & INTERACTIONS
// ============================================

function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      document.body.classList.toggle('modal-open');
    });
  }
  
  // Close mobile menu when clicking on a link
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('modal-open');
    });
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileMenu && !mobileMenu.contains(e.target) && mobileMenuToggle && !mobileMenuToggle.contains(e.target)) {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  });
  
  // Accordion functionality
  setupAccordion();
  
  // Contact form submission
  setupContactForm();
}

function setupScrollDetection() {
  const header = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  
  function updateActiveLink() {
    // Update header scroll state
    if (header) {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    
    // Update active nav link
    const sections = Array.from(navLinks).map(link => 
      document.getElementById(link.getAttribute('data-section'))
    );
    
    let currentSection = 'home';
    
    sections.forEach(section => {
      if (section) {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 150) {
          currentSection = section.id;
        }
      }
    });
    
    navLinks.forEach(link => {
      const isActive = link.getAttribute('data-section') === currentSection;
      if (isActive) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink(); // Initial call
}


function setupAccordion() {
  const accordion = document.getElementById('experience-accordion');
  if (!accordion) return;
  
  const triggers = accordion.querySelectorAll('.accordion-trigger');
  
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const itemId = trigger.getAttribute('data-accordion-item');
      const content = accordion.querySelector(`[data-accordion-content="${itemId}"]`);
      
      // Close other items
      accordion.querySelectorAll('.accordion-content.active').forEach(item => {
        if (item !== content) {
          item.classList.remove('active');
        }
      });
      
      accordion.querySelectorAll('.accordion-trigger.active').forEach(t => {
        if (t !== trigger) {
          t.classList.remove('active');
        }
      });
      
      // Toggle current item
      trigger.classList.toggle('active');
      content.classList.toggle('active');
    });
  });
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzJr02V_MWWuJvVKx35BJk67zhwPqPgjxkCeGHi7TZU-2QJADrR-sWA4tbmep7dtfAKg/exec';
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = sanitizeInput(capitalizeWords(form.querySelector('#name').value.trim()));
    const email = sanitizeInput(form.querySelector('#email').value.trim().toLowerCase());
    const mobile = sanitizeInput(form.querySelector('#mobile').value.trim());
    const message = sanitizeInput(form.querySelector('#message').value.trim());
    
    // Validation
    let isValid = true;
    
    if (!name || name.length < 2) {
      showError('name', 'Name is required (minimum 2 characters).');
      isValid = false;
    } else {
      clearError('name');
    }
    
    if (!isValidEmail(email)) {
      showError('email', 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError('email');
    }
    
    if (!message || message.length < 10) {
      showError('message', 'Message is required (minimum 10 characters).');
      isValid = false;
    } else {
      clearError('message');
    }
    
    if (!isValid) return;
    
    // Disable submit button to prevent double submission
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    
    try {
      // Get device and browser information
      const deviceInfo = getDeviceInfo();
      
      // Get IP address from public API
      const ipInfo = await getIpInfo();
      
      // Build URL-encoded body to avoid preflight OPTIONS request
      const params = new URLSearchParams();
      params.append('name', name);
      params.append('email', email);
      params.append('mobile', mobile || '');
      params.append('message', message);
      params.append('url', window.location.href);
      params.append('userAgent', navigator.userAgent);
      params.append('timestamp', new Date().toISOString());
      params.append('ipAddress', ipInfo.ip || 'Unknown');
      params.append('country', ipInfo.country || 'Unknown');
      params.append('city', ipInfo.city || 'Unknown');
      params.append('browserName', deviceInfo.browserName);
      params.append('browserVersion', deviceInfo.browserVersion);
      params.append('osName', deviceInfo.osName);
      params.append('osVersion', deviceInfo.osVersion);
      params.append('deviceType', deviceInfo.deviceType);
      
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: params.toString()
      });
      
      const data = await response.json().catch(() => ({ ok: false }));
      
      if (response.ok && data && data.status === 'success') {
        // Show success message
        const successDiv = document.getElementById('form-success');
        if (successDiv) {
          successDiv.textContent = 'Message sent! I\'ll get back to you soon.';
          successDiv.style.display = 'block';
        }
        
        // Reset form
        form.reset();
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          if (successDiv) {
            successDiv.style.display = 'none';
          }
        }, 5000);
      } else {
        const errorMsg = (data && data.message) ? data.message : 'Failed to send message. Please try again.';
        showError('form', errorMsg);
      }
    } catch (err) {
      console.error('Error sending contact form:', err);
      showError('form', 'Network error. Please check your connection and try again.');
    } finally {
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    }
  });
}

// Input sanitization to prevent XSS
function sanitizeInput(str) {
  if (!str) return '';
  return String(str).replace(/[<>&"']/g, function(c) {
    const escaped = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return escaped[c];
  });
}

// Capitalize words in input
function capitalizeWords(str) {
  if (!str) return '';
  return String(str).replace(/\b\w+/g, function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function showError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function clearError(fieldId) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = '';
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get device and browser information
function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
    browserName = 'Internet Explorer';
    browserVersion = ua.match(/MSIE (\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browserName = 'Opera';
    browserVersion = ua.match(/OPR\/(\d+)/)?.[1] || 'Unknown';
  }
  
  // Detect OS
  let osName = 'Unknown';
  let osVersion = 'Unknown';
  
  if (ua.indexOf('Win') > -1) {
    osName = 'Windows';
    if (ua.indexOf('Windows NT 10.0') > -1) osVersion = '10';
    else if (ua.indexOf('Windows NT 6.3') > -1) osVersion = '8.1';
    else if (ua.indexOf('Windows NT 6.2') > -1) osVersion = '8';
  } else if (ua.indexOf('Mac') > -1) {
    osName = 'macOS';
    const macVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
    osVersion = macVersion;
  } else if (ua.indexOf('Linux') > -1) {
    osName = 'Linux';
    osVersion = 'Unknown';
  } else if (ua.indexOf('Android') > -1) {
    osName = 'Android';
    osVersion = ua.match(/Android (\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    osName = 'iOS';
    osVersion = ua.match(/OS (\d+)/)?.[1] || 'Unknown';
  }
  
  // Detect device type
  let deviceType = 'Desktop';
  if (ua.indexOf('Mobile') > -1 || ua.indexOf('Android') > -1) {
    deviceType = 'Mobile';
  } else if (ua.indexOf('iPad') > -1 || ua.indexOf('Tablet') > -1) {
    deviceType = 'Tablet';
  }
  
  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType
  };
}

// Get IP address and location information from public API
async function getIpInfo() {
  try {
    // Using ip-api.com (free tier, no key required)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip || 'Unknown',
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown'
      };
    }
    return { ip: 'Unknown', country: 'Unknown', city: 'Unknown' };
  } catch (err) {
    console.warn('Could not fetch IP info:', err);
    return { ip: 'Unknown', country: 'Unknown', city: 'Unknown' };
  }
}

function setupSmoothScroll() {
  // Add scroll-margin-top to all sections for better scroll positioning with sticky header
  document.querySelectorAll('section').forEach(section => {
    section.style.scrollMarginTop = '5rem';
  });
}

// ============================================
// CAROUSEL
// ============================================

const CAROUSEL_IMAGES = [
  { "filename": "KMLRC20240216-170418-00011-_MG_1730.JPG", "caption": "Karnival Semarak Putra 2024 - Volleyball (UPMS Academic Club Championship)" },
  { "filename": "KMLRC20240218-141229-00085-_MG_3614.JPG", "caption": "Karnival Semarak Putra 2024 - Mobile Legends (UPMS Academic Club Championship)" },
  { "filename": "KMLRC20240218-182611-00111-_MG_4511.JPG", "caption": "Karnival Semarak Putra 2024 - Football (UPMS Academic Club Championship)" },
  { "filename": "KMLRC20240221-222842-00005-_MG_7776.JPG", "caption": "Konsert Aku Memori dan Muzik 2024 - Practice" },
  { "filename": "KMLRC20240224-204539-00120-_MG_9147 copy 2.JPG", "caption": "Konsert Aku Memori dan Muzik 2024" },
  { "filename": "KMLRC20240224-204838-00123-_MG_9160.JPG", "caption": "Konsert Aku Memori dan Muzik 2024" },
  { "filename": "KMLRC20240228-174938-00126-_MG_0961.JPG", "caption": "Karnival Semarak Putra 2024 - Football (UPMS Academic Club Championship)" },
  { "filename": "KMLRC20240301-184514-00064-_MG_1749.JPG", "caption": "Bergempuru Raban Bangsa - Long House Visit at Song, Kapit" },
  { "filename": "KMLRC20240302-212509-00741-_MG_3166.JPG", "caption": "Bergempuru Raban Bangsa - Long House Visit at Song, Kapit" },
  { "filename": "KMLRC20240303-150925-00366-_MG_4232.JPG", "caption": "Bergempuru Raban Bangsa - Long House Visit at Song, Kapit" },
  { "filename": "KMLRC20240316-071558-00006-_MG_4634.JPG", "caption": "Putra Kasih Ramadan" },
  { "filename": "KMLRC20240420-184500-00015-_MG_7177.JPG", "caption": "Majlis Anugerah dan Apresiasi Pelajar Kolej Sri Rajang 2024 (College Award Ceremony)" },
  { "filename": "KMLRC20240420-210955-00239-_MG_7731.JPG", "caption": "Majlis Anugerah dan Apresiasi Pelajar Kolej Sri Rajang 2024 (College Award Ceremony)" },
  { "filename": "KMLRC20240607-224914-00298-_MG_9469C.jpg", "caption": "Youth Biodiversity Science Camp 2024 with MRSM Mukah, Sarawak" },
  { "filename": "KMLRC20240607-231418-00349-_MG_9587C.jpg", "caption": "Youth Biodiversity Science Camp 2024 with MRSM Mukah, Sarawak" },
  { "filename": "KMLRC20240608-170812-00769-_MG_1690C.jpg", "caption": "Youth Biodiversity Science Camp 2024 with MRSM Mukah, Sarawak" },
  { "filename": "KMLRC20240621-104100-00305-_MG_3661.JPG", "caption": "Expecto Patronum - The Magic of Maths and Science with SMK Kidurong 2" },
  { "filename": "KMLRC20240622-113336-00173-_MG_5161.JPG", "caption": "Expecto Patronum - The Magic of Maths and Science with SMK Kidurong 2" },
  { "filename": "KMLRC20240705-152729-00061-_MG_6275.JPG", "caption": "Majlis Watikah Lantikan Jawatankuasa Majlis Perwakilan Kolej 2024 (Appointment Ceremony of the College Representative Council)" },
  { "filename": "KMLRC20240718-102924-00092-_MG_7092.JPG", "caption": "Mukah Segulai Sejalai Pesta Kaul (Visit to Mukah)" },
  { "filename": "KMLRC20240720-110456-00024-_MG_7498.JPG", "caption": "Mukah Segulai Sejalai Pesta Kaul (Visit to Mukah)" },
  { "filename": "KMLRC20240720-134419-00142-_MG_7835.JPG", "caption": "Mukah Segulai Sejalai Pesta Kaul (Visit to Mukah)" },
  { "filename": "KMLRC20240720-141322-00181-_MG_7977.JPG", "caption": "Mukah Segulai Sejalai Pesta Kaul (Visit to Mukah)" },
  { "filename": "KMLRC20240723-080720-00040-_MG_9793.JPG", "caption": "Minggu Perkasa Putra 2024 (Diploma Orientation Week at UPMS) - Morning Preparation" },
  { "filename": "KMLRC20240723-130925-00082-_MG_9924C.JPG", "caption": "Minggu Perkasa Putra 2024 (Diploma Orientation Week at UPMS) - Registration" },
  { "filename": "KMLRC20240723-132617-00118-_MG_0032C.JPG", "caption": "Minggu Perkasa Putra 2024 (Diploma Orientation Week at UPMS) - Transporting Students Item to College Block" },
  { "filename": "KMLRC20240724-211123-00157-_MG_3204C.JPG", "caption": "Minggu Perkasa Putra 2024 (Diploma Orientation Week at UPMS) - Student Pledge Reading" },
  { "filename": "KMLRC20240725-145054-00510-_MG_4212C.JPG", "caption": "Minggu Perkasa Putra 2024 (Diploma Orientation Week at UPMS)" },
  { "filename": "KMLRC20240727-061559-00218-_MG_5828.JPG", "caption": "Minggu Perkasa Putra 2024 (Diploma Orientation Week at UPMS) - Aerobics" },
  { "filename": "KMLRC20240804-222326-00048-_MG_8120C.jpg", "caption": "Malam Warisan Kolej Sri Rajang 2024 (Heritage Night)" },
  { "filename": "KMLRC20240804-233313-00071-_MG_8743C.jpg", "caption": "Malam Warisan Kolej Sri Rajang 2024 (Heritage Night)" },
  { "filename": "KMLRC20240824-092026-00022-_MG_9264.JPG", "caption": "Hasil Your Tax Buddy 2024 with LHDN" },
  { "filename": "KMLRC20240824-092033-00024-_MG_9268.JPG", "caption": "Hasil Your Tax Buddy 2024 with LHDN" },
  { "filename": "KMLRC20240824-193439-00008-_MG_0023.jpg", "caption": "Merdeka Neon Night Run 2024 - Aerobics" },
  { "filename": "KMLRC20240824-200237-00013-_MG_0191.jpg", "caption": "Merdeka Neon Night Run 2024 - Starting" },
  { "filename": "KMLRC20240825-163710-00031-_MG_3391.jpg", "caption": "Semarak Jiwa Merdeka 2024 (Independence Day Celebration)" },
  { "filename": "KMLRC20240827-140545-00030-_MG_3566.JPG", "caption": "Once Upon a Mask (English Literature Program) with SK Sungai Tisang" },
  { "filename": "KMLRC20240827-142037-00067-_MG_3661.JPG", "caption": "Once Upon a Mask (English Literature Program) with SK Sungai Tisang" },
  { "filename": "KMLRC20240928-221218-_MG_7368.jpg", "caption": "Busking: Aram Bersantai! " },
  { "filename": "KMLRC20241013-140143-_MG_0763.jpg", "caption": "Program Kolegrasi 2024 (Degree College Intake Orientation)" },
  { "filename": "KMLRC20241026-134730-_MG_0759.JPG", "caption": "Discover the Harmony of Songs" },
  { "filename": "KMLRC20241026-134946-_MG_0800.JPG", "caption": "Discover the Harmony of Songs" },
  { "filename": "KMLRC20241026-144604-_MG_1276.JPG", "caption": "Discover the Harmony of Songs" },
  { "filename": "KMLRC20241027-201025-_MG_1757.JPG", "caption": "Malaysian Society of Agricultural Engineers Student Club. Prom Night" },
  { "filename": "KMLRC20241028-171920-_MG_3497.jpg", "caption": "An afternoon at Universiti Putra Malaysia Bintulu Campus" },
  { "filename": "KMLRC20241028-174125-_MG_3592.jpg", "caption": "An afternoon at Universiti Putra Malaysia Bintulu Campus" },
  { "filename": "KMLRC20241028-174445-_MG_3629.jpg", "caption": "An afternoon at Universiti Putra Malaysia Bintulu Campus" },
  { "filename": "KMLRC20241028-182732-_MG_3817.jpg", "caption": "An afternoon at Universiti Putra Malaysia Bintulu Campus" },
  { "filename": "KMLRC20241031-142519-DSC03856.JPG", "caption": "UPM 48th Convocation Ceremony (Session 1) - Preparation" },
  { "filename": "KMLRC20241031-145645-DSC03947.JPG", "caption": "UPM 48th Convocation Ceremony (Session 1) - Preparation" },
  { "filename": "KMLRC20241031-162125-DSC04152.JPG", "caption": "UPM 48th Convocation Ceremony (Session 1) - Preparation" },
  { "filename": "KMLRC20241031-212155-DSC04474.JPG", "caption": "Malam Kebudayaan, Pesta Konvokesyen 2024" },
  { "filename": "KMLRC20241031-214429-DSC04548.JPG", "caption": "Malam Kebudayaan, Pesta Konvokesyen 2024" },
  { "filename": "KMLRC20241031-222001-DSC04769.JPG", "caption": "Malam Kebudayaan, Pesta Konvokesyen 2024" },
  { "filename": "KMLRC20241031-223006-DSC04890.JPG", "caption": "Malam Kebudayaan, Pesta Konvokesyen 2024" },
  { "filename": "KMLRC20241101-214246-DSC06214.JPG", "caption": "Malam Kebudayaan, Pesta Konvokesyen 2024" },
  { "filename": "KMLRC20241101-215014-DSC06400.JPG", "caption": "Malam Kebudayaan, Pesta Konvokesyen 2024" },
  { "filename": "KMLRC20241102-102810-DSC07346.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241102-103331-DSC07368.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241102-104051-DSC07376.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241102-112256-DSC07701.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241102-112447-DSC07719.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241102-112757-DSC07797.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241102-120417-DSC08152.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241103-083459-DSC08627.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241103-101329-_MG_8424.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241103-113535-DSC09399.jpg", "caption": "UPM 48th Convocation Ceremony (Session 1)" },
  { "filename": "KMLRC20241127-153314-_MG_1942.JPG", "caption": "Rainy Day at Sri Rajang College" },
  { "filename": "KMLRC20241129-110758-_MG_2227.JPG", "caption": "Reader's Theatre" },
  { "filename": "KMLRC20250117-184154-_MG_4053-DN.JPG", "caption": "Sukan Kolej Sri Rajang 2025 (College Sports Championship)" },
  { "filename": "KMLRC20250117-190000-_MG_4272-DN.JPG", "caption": "Sukan Kolej Sri Rajang 2025 (College Sports Championship)" },
  { "filename": "KMLRC20250118-180840-_MG_4291.JPG", "caption": "Sukan Kolej Sri Rajang 2025 (College Sports Championship)" },
  { "filename": "KMLRC20250119-154952-_MG_4439.JPG", "caption": "Sukan Kolej Sri Rajang 2025 (College Sports Championship)" },
  { "filename": "KMLRC20250119-160719-_MG_4590.JPG", "caption": "Sukan Kolej Sri Rajang 2025 (College Sports Championship)" },
  { "filename": "KMLRC20250215-215203-DSC08557.jpg", "caption": "PutraDansing Fest 2025" },
  { "filename": "KMLRC20250215-223246-DSC08794.jpg", "caption": "PutraDansing Fest 2025" },
  { "filename": "KMLRC20250215-225435-DSC08885.jpg", "caption": "PutraDansing Fest 2025" },
  { "filename": "KMLRC20250216-093725-_MG_8407.jpg", "caption": "Putra Brisk Walk at Jepak, Bintulu" },
  { "filename": "KMLRC20250419-062250-00004-_MG_9396.jpg", "caption": "Putra Drug Free Run 2025" },
  { "filename": "KMLRC20250419-065027-00012-_MG_9596.jpg", "caption": "Putra Drug Free Run 2025" }
];

async function loadCarouselImages() {
  try {
    return CAROUSEL_IMAGES;
  } catch (error) {
    console.error('Error loading carousel images:', error);
    return [];
  }
}

async function setupCarousel() {
  const images = await loadCarouselImages();
  const container = document.getElementById('carousel-container');
  const wrapper = document.getElementById('carousel-wrapper');

  if (!wrapper || !images.length) {
    return;
  }

  // Create slides with captions
  images.forEach((imageData, index) => {
    const slide = document.createElement('div');
    slide.classList.add('carousel-slide');
    
    const img = document.createElement('img');
    img.src = `assets/featuredphotos/${imageData.filename}`;
    img.alt = `Featured photo ${index + 1}`;
    img.classList.add('carousel-image');
    img.loading = 'lazy';
    
    const caption = document.createElement('div');
    caption.classList.add('carousel-caption');
    caption.textContent = imageData.caption;
    
    slide.appendChild(img);
    slide.appendChild(caption);
    wrapper.appendChild(slide);
  });

  // Clone slides for infinite scroll
  images.forEach((imageData, index) => {
    const slide = document.createElement('div');
    slide.classList.add('carousel-slide');
    
    const img = document.createElement('img');
    img.src = `assets/featuredphotos/${imageData.filename}`;
    img.alt = `Featured photo (clone)`;
    img.classList.add('carousel-image');
    img.loading = 'lazy';
    
    const caption = document.createElement('div');
    caption.classList.add('carousel-caption');
    caption.textContent = imageData.caption;
    
    slide.appendChild(img);
    slide.appendChild(caption);
    wrapper.appendChild(slide);
  });

  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const dotsContainer = document.getElementById('carousel-dots');

  // Responsive speeds: allow different speeds on desktop vs mobile
  let autoScrollInterval;
  const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 768px)').matches);
  const IMAGE_SPEED_DESKTOP = 10; // pixels per tick on desktop
  const IMAGE_SPEED_MOBILE = 10;   // pixels per tick on mobile
  const IMAGE_INTERVAL_DESKTOP = 20; // ms per tick on desktop
  const IMAGE_INTERVAL_MOBILE = 1;  // ms per tick on mobile
  const autoScrollSpeed = isCoarsePointer ? IMAGE_SPEED_MOBILE : IMAGE_SPEED_DESKTOP;
  const autoScrollIntervalTime = isCoarsePointer ? IMAGE_INTERVAL_MOBILE : IMAGE_INTERVAL_DESKTOP;
  let isHovering = false;
  let isUserScrolling = false;
  let userScrollTimeout = null;

  // Remove old dots code - we don't need dots for continuous scroll
  if (dotsContainer) {
    dotsContainer.style.display = 'none';
  }

  function autoScroll() {
    if (!isHovering && !isUserScrolling) {
      wrapper.scrollLeft += autoScrollSpeed;
      
      // Check if we've scrolled to near the end, if so, reset to beginning
      if (wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth - 10) {
        wrapper.scrollLeft = 0;
      }
    }
  }

  function startAutoScroll() {
    stopAutoScroll(); // Clear any existing interval
    autoScrollInterval = setInterval(autoScroll, autoScrollIntervalTime);
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Hover detection (desktop)
  if (container) {
    container.addEventListener('mouseenter', () => {
      isHovering = true;
      stopAutoScroll();
    });

    container.addEventListener('mouseleave', () => {
      isHovering = false;
      if (!isUserScrolling) {
        startAutoScroll();
      }
    });
  }

  // Touch detection (mobile/iOS)
  let touchStartX = 0;
  wrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    isUserScrolling = true;
    stopAutoScroll();
    if (userScrollTimeout) {
      clearTimeout(userScrollTimeout);
    }
  }, { passive: true });

  wrapper.addEventListener('touchmove', () => {
    isUserScrolling = true;
    if (userScrollTimeout) {
      clearTimeout(userScrollTimeout);
    }
  }, { passive: true });

  wrapper.addEventListener('touchend', () => {
    if (userScrollTimeout) {
      clearTimeout(userScrollTimeout);
    }
    userScrollTimeout = setTimeout(() => {
      isUserScrolling = false;
      if (!isHovering) {
        startAutoScroll();
      }
    }, 2000);
  }, { passive: true });

  // Detect manual scroll events
  wrapper.addEventListener('scroll', () => {
    // Don't interfere if it's our auto-scroll
    if (!isHovering && !isUserScrolling) {
      return;
    }
  }, { passive: true });

  // Manual navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      wrapper.scrollLeft -= 350;
      isUserScrolling = true;
      stopAutoScroll();
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        if (!isHovering) {
          startAutoScroll();
        }
      }, 2000);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      wrapper.scrollLeft += 350;
      isUserScrolling = true;
      stopAutoScroll();
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        if (!isHovering) {
          startAutoScroll();
        }
      }, 2000);
    });
  }

  // Enable horizontal scrolling with mouse wheel
  wrapper.addEventListener('wheel', (e) => {
    if (e.deltaX !== 0 || e.deltaY !== 0) {
      e.preventDefault();
      wrapper.scrollLeft += e.deltaY > 0 ? 50000 : -50000;
      wrapper.scrollLeft += e.deltaX;
      
      isUserScrolling = true;
      stopAutoScroll();
      
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        if (!isHovering) {
          startAutoScroll();
        }
      }, 1000);
    }
  }, { passive: false });

  // Start auto scroll
  startAutoScroll();
}


// Grid and Fullscreen Modal Functionality
let allImages = [];
let currentFullscreenIndex = 0;

async function setupImageModals() {
  const gridModal = document.getElementById('grid-modal');
  const fullscreenModal = document.getElementById('fullscreen-modal');
  const gridModalClose = document.querySelector('.grid-modal-close');
  const fullscreenModalClose = document.querySelector('.fullscreen-modal-close');
  const imageGrid = document.getElementById('image-grid');
  const fullscreenImage = document.getElementById('fullscreen-image');
  const fullscreenCaption = document.getElementById('fullscreen-caption');
  const fullscreenPrev = document.querySelector('.fullscreen-prev');
  const fullscreenNext = document.querySelector('.fullscreen-next');
  const carouselWrapper = document.getElementById('carousel-wrapper');

  // Check if all required elements exist
  if (!gridModal || !fullscreenModal || !imageGrid || !fullscreenImage) {
    console.warn('Modal elements not found');
    return;
  }

  // Load all images
  allImages = await loadCarouselImages();

  // Populate grid with images
  function populateGrid() {
    imageGrid.innerHTML = '';
    allImages.forEach((imageData, index) => {
      const img = document.createElement('img');
      // Handle both old string format and new object format
      const filename = typeof imageData === 'string' ? imageData : imageData.filename;
      img.src = `assets/featuredphotos/${filename}`;
      img.alt = `Gallery image ${index + 1}`;
      img.dataset.index = index;
      img.addEventListener('click', () => {
        currentFullscreenIndex = index;
        showFullscreenImage();
      });
      imageGrid.appendChild(img);
    });
  }

  // Show fullscreen image
  function showFullscreenImage() {
    const imageData = allImages[currentFullscreenIndex];
    // Handle both old string format and new object format
    const filename = typeof imageData === 'string' ? imageData : imageData.filename;
    const caption = typeof imageData === 'string' ? '' : (imageData.caption || '');
    
    fullscreenImage.src = `assets/featuredphotos/${filename}`;
    if (fullscreenCaption) {
      fullscreenCaption.textContent = caption;
    }
    fullscreenModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  }

  // Close grid modal
  function closeGridModal() {
    gridModal.classList.add('hidden');
    // Remove modal-open class if no other modals are open
    if (fullscreenModal.classList.contains('hidden')) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }

  // Close fullscreen modal
  function closeFullscreenModal() {
    fullscreenModal.classList.add('hidden');
    // Remove modal-open class if no other modals are open
    if (gridModal.classList.contains('hidden')) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }

  // Navigate fullscreen images
  function prevImage() {
    currentFullscreenIndex = (currentFullscreenIndex - 1 + allImages.length) % allImages.length;
    showFullscreenImage();
  }

  function nextImage() {
    currentFullscreenIndex = (currentFullscreenIndex + 1) % allImages.length;
    showFullscreenImage();
  }

  // Event listeners for grid modal
  if (gridModalClose) {
    gridModalClose.addEventListener('click', closeGridModal);
  }
  gridModal.addEventListener('click', (e) => {
    if (e.target === gridModal) {
      closeGridModal();
    }
  });

  // Event listeners for fullscreen modal
  if (fullscreenModalClose) {
    fullscreenModalClose.addEventListener('click', closeFullscreenModal);
  }
  if (fullscreenPrev) {
    fullscreenPrev.addEventListener('click', prevImage);
  }
  if (fullscreenNext) {
    fullscreenNext.addEventListener('click', nextImage);
  }
  fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal) {
      closeFullscreenModal();
    }
  });

  // Keyboard navigation for fullscreen
  document.addEventListener('keydown', (e) => {
    if (fullscreenModal.classList.contains('hidden')) return;
    
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'Escape') closeFullscreenModal();
  });

  // Click on carousel to open grid
  if (carouselWrapper) {
    carouselWrapper.addEventListener('click', (e) => {
      // Check if clicked element is an image or if it's inside a carousel slide
      if (e.target.classList.contains('carousel-image') || 
          e.target.closest('.carousel-slide')) {
        populateGrid();
        gridModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }
    });
  }

  // View All Photos button
  const viewAllPhotosBtn = document.getElementById('view-all-photos');
  if (viewAllPhotosBtn) {
    viewAllPhotosBtn.addEventListener('click', () => {
      populateGrid();
      gridModal.classList.remove('hidden');
      document.body.classList.add('modal-open');
    });
  }
}

// Initialize carousel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupCarousel();
    setupImageModals();
    setupVideosCarousel();
  });
} else {
  setupCarousel();
  setupImageModals();
  setupVideosCarousel();
}

// Setup Videos Carousel (Static HTML)
function setupVideosCarousel() {
  const videosWrapper = document.getElementById('videos-carousel-wrapper');
  const videosContainer = document.getElementById('videos-carousel-container');
  const prevBtnVideos = document.querySelector('.carousel-prev-videos');
  const nextBtnVideos = document.querySelector('.carousel-next-videos');

  if (!videosWrapper || !videosContainer) return;

  // Clone videos for infinite scroll
  const originalSlides = Array.from(videosWrapper.querySelectorAll('.video-slide'));
  originalSlides.forEach((slide) => {
    const clone = slide.cloneNode(true);
    videosWrapper.appendChild(clone);
  });

  // Responsive speeds for videos
  const isCoarsePointerVideos = typeof window !== 'undefined' && window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 768px)').matches);
  const VIDEO_SPEED_DESKTOP = 10; // pixels per tick on desktop
  const VIDEO_SPEED_MOBILE = 6;   // pixels per tick on mobile
  const VIDEO_INTERVAL_DESKTOP = 20; // ms per tick
  const VIDEO_INTERVAL_MOBILE = 30;  // ms per tick
  let videosAutoScrollSpeed = isCoarsePointerVideos ? VIDEO_SPEED_MOBILE : VIDEO_SPEED_DESKTOP;
  let videosAutoScrollInterval;
  let videosIsHovering = false;
  let videosIsUserScrolling = false;
  let videosUserScrollTimeout = null;

  function videosAutoScroll() {
    if (!videosIsHovering && !videosIsUserScrolling) {
      videosWrapper.scrollLeft += videosAutoScrollSpeed;
      
      if (videosWrapper.scrollLeft >= videosWrapper.scrollWidth - videosWrapper.clientWidth - 10) {
        videosWrapper.scrollLeft = 0;
      }
    }
  }

  function videosStartAutoScroll() {
    videosStopAutoScroll(); // Clear any existing interval
    const videosAutoScrollIntervalTime = isCoarsePointerVideos ? VIDEO_INTERVAL_MOBILE : VIDEO_INTERVAL_DESKTOP;
    videosAutoScrollInterval = setInterval(videosAutoScroll, videosAutoScrollIntervalTime);
  }

  function videosStopAutoScroll() {
    if (videosAutoScrollInterval) {
      clearInterval(videosAutoScrollInterval);
      videosAutoScrollInterval = null;
    }
  }

  // Hover detection (desktop)
  videosContainer.addEventListener('mouseenter', () => {
    videosIsHovering = true;
    videosStopAutoScroll();
  });

  videosContainer.addEventListener('mouseleave', () => {
    videosIsHovering = false;
    if (!videosIsUserScrolling) {
      videosStartAutoScroll();
    }
  });

  // Touch detection (mobile/iOS)
  let videosTouchStartX = 0;
  videosWrapper.addEventListener('touchstart', (e) => {
    videosTouchStartX = e.touches[0].clientX;
    videosIsUserScrolling = true;
    videosStopAutoScroll();
    if (videosUserScrollTimeout) {
      clearTimeout(videosUserScrollTimeout);
    }
  }, { passive: true });

  videosWrapper.addEventListener('touchmove', () => {
    videosIsUserScrolling = true;
    if (videosUserScrollTimeout) {
      clearTimeout(videosUserScrollTimeout);
    }
  }, { passive: true });

  videosWrapper.addEventListener('touchend', () => {
    if (videosUserScrollTimeout) {
      clearTimeout(videosUserScrollTimeout);
    }
    videosUserScrollTimeout = setTimeout(() => {
      videosIsUserScrolling = false;
      if (!videosIsHovering) {
        videosStartAutoScroll();
      }
    }, 2000);
  }, { passive: true });

  // Manual navigation buttons
  if (prevBtnVideos) {
    prevBtnVideos.addEventListener('click', () => {
      videosWrapper.scrollLeft -= 350;
      videosIsUserScrolling = true;
      videosStopAutoScroll();
      if (videosUserScrollTimeout) {
        clearTimeout(videosUserScrollTimeout);
      }
      videosUserScrollTimeout = setTimeout(() => {
        videosIsUserScrolling = false;
        if (!videosIsHovering) {
          videosStartAutoScroll();
        }
      }, 2000);
    });
  }

  if (nextBtnVideos) {
    nextBtnVideos.addEventListener('click', () => {
      videosWrapper.scrollLeft += 350;
      videosIsUserScrolling = true;
      videosStopAutoScroll();
      if (videosUserScrollTimeout) {
        clearTimeout(videosUserScrollTimeout);
      }
      videosUserScrollTimeout = setTimeout(() => {
        videosIsUserScrolling = false;
        if (!videosIsHovering) {
          videosStartAutoScroll();
        }
      }, 2000);
    });
  }

  // Enable horizontal scrolling with mouse wheel
  videosWrapper.addEventListener('wheel', (e) => {
    if (e.deltaX !== 0 || e.deltaY !== 0) {
      e.preventDefault();
      videosWrapper.scrollLeft += e.deltaY > 0 ? 50000 : -50000;
      videosWrapper.scrollLeft += e.deltaX;
      
      videosIsUserScrolling = true;
      videosStopAutoScroll();
      
      if (videosUserScrollTimeout) {
        clearTimeout(videosUserScrollTimeout);
      }
      videosUserScrollTimeout = setTimeout(() => {
        videosIsUserScrolling = false;
        if (!videosIsHovering) {
          videosStartAutoScroll();
        }
      }, 1000);
    }
  }, { passive: false });

  // Start auto scroll
  videosStartAutoScroll();

  // Stop auto-scrolling when clicking on a video
  const videoSlides = document.querySelectorAll('.video-slide');
  videoSlides.forEach(slide => {
    slide.addEventListener('click', () => {
      videosStopAutoScroll();
    });
  });

  // Restart auto-scrolling when user moves mouse away from video carousel or after inactivity
  let videoInactivityTimeout;
  const videosCarouselContainer = document.getElementById('videos-carousel-container');
  
  if (videosCarouselContainer) {
    videosCarouselContainer.addEventListener('mouseleave', () => {
      clearTimeout(videoInactivityTimeout);
      videoInactivityTimeout = setTimeout(() => {
        videosStartAutoScroll();
      }, 3000); // Resume after 3 seconds of inactivity
    });

    // Clear timeout and stop auto-scroll on mouse enter
    videosCarouselContainer.addEventListener('mouseenter', () => {
      clearTimeout(videoInactivityTimeout);
      videosStopAutoScroll();
    });
  }
}






