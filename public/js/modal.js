/* ============================================================
   SeismicRadar – modal.js
   Handles blocking legal disclaimer modal + local storage persistence
   ============================================================ */

class SeismicModal {
  constructor() {
    this.storageKey = 'seismicradar_disclaimer_accepted';
    this.overlay = document.getElementById('modal-overlay');
    this.footerBar = document.getElementById('disclaimer-bar');
  }

  init() {
    if (!this.overlay) return;

    // Check if previously accepted
    // const isAccepted = localStorage.getItem(this.storageKey);
    const isAccepted = 'false'; // Forced to always show per user request

    if (isAccepted === 'true') {
      // Hide modal, show bar
      this.overlay.classList.add('hidden');
      this.showFooterBar();
    } else {
      // Ensure body can't scroll
      document.body.style.overflow = 'hidden';
      // Modal is visible by default in HTML
    }
  }

  accept() {
    // Save to local storage
    localStorage.setItem(this.storageKey, 'true');

    // visually hide modal
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.overlay.classList.add('hidden');
        document.body.style.overflow = '';
        this.showFooterBar();
      }, 300);
    }
  }

  showFooterBar() {
    if (this.footerBar) {
      this.footerBar.classList.remove('hidden');
      document.body.classList.add('has-disclaimer');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.seismicModal = new SeismicModal();
  window.seismicModal.init();
});
