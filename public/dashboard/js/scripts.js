/*!
    * Start Bootstrap - SB Admin Pro v2.0.4 (https://shop.startbootstrap.com/product/sb-admin-pro)
    * Copyright 2013-2022 Start Bootstrap
    * Licensed under SEE_LICENSE (https://github.com/StartBootstrap/sb-admin-pro/blob/master/LICENSE)
    */
    window.addEventListener('DOMContentLoaded', event => {
    // Activate feather icons if library is loaded
    if (typeof feather !== 'undefined') {
        feather.replace();
    } else {
        // If feather is not loaded yet, try again after a short delay
        setTimeout(() => {
            if (typeof feather !== 'undefined') {
                feather.replace();
            } else {
                // Show fallback icons if feather is still not available
                const fallbackIcons = document.querySelectorAll('.fallback-icon');
                fallbackIcons.forEach(icon => {
                    icon.style.display = 'inline';
                });
            }
        }, 100);
    }

    // Enable tooltips globally
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Enable popovers globally
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Activate Bootstrap scrollspy for the sticky nav component
    const stickyNav = document.body.querySelector('#stickyNav');
    if (stickyNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#stickyNav',
            offset: 82,
        });
    }

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        console.log('Sidebar toggle button found:', sidebarToggle);
        
        // Ensure the button is visible and clickable
        sidebarToggle.style.display = 'block';
        sidebarToggle.style.visibility = 'visible';
        
        // Uncomment Below to persist sidebar toggle between refreshes
        if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
            document.body.classList.toggle('sidenav-toggled');
        }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            console.log('Sidebar toggle clicked');
            document.body.classList.toggle('sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sidenav-toggled'));
            console.log('Sidenav toggled:', document.body.classList.contains('sidenav-toggled'));
        });
    } else {
        console.log('Sidebar toggle button not found');
        // Try to find it again after a short delay
        setTimeout(() => {
            const retrySidebarToggle = document.body.querySelector('#sidebarToggle');
            if (retrySidebarToggle) {
                console.log('Sidebar toggle button found on retry:', retrySidebarToggle);
                retrySidebarToggle.addEventListener('click', event => {
                    event.preventDefault();
                    console.log('Sidebar toggle clicked (retry)');
                    document.body.classList.toggle('sidenav-toggled');
                    localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sidenav-toggled'));
                });
            }
        }, 500);
    }

    // Close side navigation when width < LG
    const sidenavContent = document.body.querySelector('#layoutSidenav_content');
    if (sidenavContent) {
        sidenavContent.addEventListener('click', event => {
            const BOOTSTRAP_LG_WIDTH = 992;
            if (window.innerWidth >= 992) {
                return;
            }
            if (document.body.classList.contains("sidenav-toggled")) {
                document.body.classList.toggle("sidenav-toggled");
            }
        });
    }

    // Add active state to sidebar nav links
    let activatedPath = window.location.pathname;

    // Function to activate the correct nav links based on the current path
    function activateNavLinks() {
        const targetAnchors = document.body.querySelectorAll('.nav-link');

        targetAnchors.forEach(targetAnchor => {
            const href = targetAnchor.getAttribute('href');
            if (href && activatedPath.includes(href)) {
                targetAnchor.classList.add('active');

                // Activate parent links if the current link is a child
                let parentNode = targetAnchor.parentNode;
                while (parentNode !== null && parentNode !== document.documentElement) {
                    if (parentNode.classList.contains('collapse')) {
                        parentNode.classList.add('show');
                        const parentNavLink = document.body.querySelector(
                            '[data-bs-target="#' + parentNode.id + '"]'
                        );
                        if (parentNavLink) {
                            parentNavLink.classList.remove('collapsed');
                            parentNavLink.classList.add('active');
                        }
                    }
                    if (parentNode.classList.contains('nav-link')) {
                        parentNode.classList.add('active'); // Activate parent links
                    }
                    parentNode = parentNode.parentNode;
                }
            }
        });
    }

    // Call the function to activate nav links
    activateNavLinks();
});
