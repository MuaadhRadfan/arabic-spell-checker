// Navigation and UI functionality
class NavigationManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.themeToggle = document.getElementById('themeToggle');
        this.fullscreenToggle = document.getElementById('fullscreenToggle');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.handleResponsive();
    }
    
    setupEventListeners() {
        // Sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }
        
        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Fullscreen toggle
        if (this.fullscreenToggle) {
            this.fullscreenToggle.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !this.mobileMenuToggle.contains(e.target)) {
                    this.sidebar.classList.remove('mobile-show');
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResponsive();
        });
        
        // Close alerts
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('alert-close')) {
                e.target.closest('.alert').remove();
            }
        });
    }
    
    toggleSidebar() {
        if (window.innerWidth > 768) {
            this.sidebar.classList.toggle('collapsed');
            this.saveSidebarState();
        }
    }
    
    toggleMobileSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('mobile-show');
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme toggle icon
        const icon = this.themeToggle.querySelector('i');
        if (newTheme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.fullscreenToggle.querySelector('i').className = 'fas fa-compress';
            });
        } else {
            document.exitFullscreen().then(() => {
                this.fullscreenToggle.querySelector('i').className = 'fas fa-expand';
            });
        }
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme toggle icon
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (savedTheme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
    
    saveSidebarState() {
        const isCollapsed = this.sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
    
    loadSidebarState() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && window.innerWidth > 768) {
            this.sidebar.classList.add('collapsed');
        }
    }
    
    handleResponsive() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('collapsed');
            this.sidebar.classList.add('mobile-hidden');
        } else {
            this.sidebar.classList.remove('mobile-hidden', 'mobile-show');
            this.loadSidebarState();
        }
    }
}

// Notification system
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            this.createContainer();
        }
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        this.container.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification);
        });
        
        return notification;
    }
    
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutLeft 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }
    
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Loading manager
class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
    }
    
    show(message = 'جاري المعالجة...') {
        if (this.overlay) {
            const messageElement = this.overlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            this.overlay.classList.add('show');
        }
    }
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
        }
    }
}

// Utility functions
const Utils = {
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Format numbers
    formatNumber(num) {
        return new Intl.NumberFormat('ar-EG').format(num);
    },
    
    // Format dates
    formatDate(date) {
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },
    
    // Validate Arabic text
    isArabicText(text) {
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicRegex.test(text);
    },
    
    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    },
    
    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    window.navigationManager = new NavigationManager();
    
    // Initialize notification system
    window.notificationManager = new NotificationManager();
    
    // Initialize loading manager
    window.loadingManager = new LoadingManager();
    
    // Make utilities globally available
    window.Utils = Utils;
    
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                Utils.scrollToElement(target, 100);
            }
        });
    });
    
    // Add loading states to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
            }
        });
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager, NotificationManager, LoadingManager, Utils };
}

