/**
 * main.js — Sidebar active-link highlight
 *
 * Uses IntersectionObserver to track which section is currently
 * in view and reflects that in the sidebar navigation.
 */

const navLinks = document.querySelectorAll('#sidebar nav a[href^="#"]');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => link.classList.remove('active'));

      const activeLink = document.querySelector(
        `#sidebar nav a[href="#${entry.target.id}"]`
      );
      if (activeLink) activeLink.classList.add('active');
    });
  },
  { rootMargin: '-20% 0px -70% 0px' }
);

document.querySelectorAll('[id]').forEach((el) => observer.observe(el));
