(function () {
  const certificatePreview = document.getElementById('print-certificate');
  if (certificatePreview) {
    const image = document.createElement('img');
    image.className = 'certificate-artwork';
    image.src = '../assets/certificates/certificate.png';
    image.alt = 'Certificate artwork supplied with Cyber World University assets, displayed as provided';
    image.decoding = 'async';

    const caption = document.createElement('p');
    caption.textContent = 'Supplied certificate artwork, displayed as provided. This website does not issue or validate the certificate shown.';
    certificatePreview.replaceChildren(image, caption);

    const notice = certificatePreview.previousElementSibling;
    if (notice && notice.classList.contains('notice')) {
      notice.textContent = 'Certificate artwork preview only. The certificate shown is not issued or validated by this frontend.';
    }

    const verificationLink = document.querySelector('.inline-actions a[href*="verify-certificate"]');
    if (verificationLink) verificationLink.textContent = 'Open demo certificate lookup';
  }

  const printButton = document.getElementById('print-certificate-button');
  if (printButton) printButton.addEventListener('click', () => window.print());

  const form = document.getElementById('certificate-lookup');
  if (!form) return;
  const result = document.getElementById('verification-result');
  const idOutput = document.getElementById('verified-id');
  result.hidden = true;
  const queryId = new URLSearchParams(window.location.search).get('id');
  if (queryId) form.elements.id.value = queryId;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const certificateId = form.elements.id.value.trim().toUpperCase();
    idOutput.textContent = certificateId;
    result.hidden = certificateId !== 'CWU-2026-CS-000001';
    if (result.hidden) window.CWU.showToast('No matching sample record. Live verification is not available.');
  });
}());
