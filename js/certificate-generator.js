(function () {
  const form = document.getElementById('certificate-form');
  const preview = document.getElementById('certificate-preview');
  if (!form || !preview) return;

  const fields = {
    studentName: document.getElementById('student-name'),
    courseTitle: document.getElementById('course-title'),
    certificateType: document.getElementById('certificate-type'),
    credentialId: document.getElementById('credential-id'),
    issueDate: document.getElementById('issue-date'),
    signatoryName: document.getElementById('signatory-name'),
    signatoryRole: document.getElementById('signatory-role'),
    signatureImage: document.getElementById('signature-upload'),
    studentPhoto: document.getElementById('student-photo-upload')
  };
  const outputs = {
    headingMain: document.getElementById('preview-heading-main'),
    headingSub: document.getElementById('preview-heading-sub'),
    studentName: document.getElementById('preview-student-name'),
    courseTitle: document.getElementById('preview-course-title'),
    credentialId: document.getElementById('preview-credential-id'),
    issueDate: document.getElementById('preview-issue-date'),
    signatoryName: document.getElementById('preview-signatory-name'),
    signatoryRole: document.getElementById('preview-signatory-role'),
    firstCopy: document.getElementById('preview-copy-one'),
    secondCopy: document.getElementById('preview-copy-two')
  };
  const status = document.getElementById('form-status');
  const previewStatus = document.getElementById('preview-status');
  const signaturePreview = document.getElementById('preview-signature-image');
  const signaturePlaceholder = document.getElementById('signature-placeholder');
  const studentPhotoWrap = document.getElementById('student-photo-wrap');
  const studentPhotoPreview = document.getElementById('preview-student-photo');
  let signatureObjectUrl = '';
  let studentPhotoObjectUrl = '';

  const certificateHeadings = {
    'Certificate of Completion': ['CERTIFICATE', 'OF COMPLETION'],
    'Certificate of Excellence': ['CERTIFICATE', 'OF EXCELLENCE'],
    'Certificate of Achievement': ['CERTIFICATE', 'OF ACHIEVEMENT'],
    'Professional Cybersecurity Certification': ['PROFESSIONAL', 'CYBERSECURITY CERTIFICATION'],
    'Ethical Hacking Training Certificate': ['ETHICAL HACKING', 'TRAINING CERTIFICATE'],
    'Web Application Penetration Testing Certificate': ['WEB APPLICATION', 'PENETRATION TESTING CERTIFICATE'],
    'Network Security Certificate': ['NETWORK SECURITY', 'CERTIFICATE'],
    'Digital Forensics Certificate': ['DIGITAL FORENSICS', 'CERTIFICATE'],
    'Python for Security Certificate': ['PYTHON FOR SECURITY', 'CERTIFICATE'],
    'Cybersecurity Fundamentals Certificate': ['CYBERSECURITY FUNDAMENTALS', 'CERTIFICATE']
  };

  function formattedDate(value) {
    if (!value) return 'Date not provided';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Date not provided';
    return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  }

  function updateImagePreview(input, image, placeholder, currentUrl, onUrlChange) {
    const file = input.files && input.files[0];
    if (!file) {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      image.removeAttribute('src');
      image.hidden = true;
      if (placeholder) placeholder.hidden = false;
      onUrlChange('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      status.textContent = 'Choose a valid image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      input.value = '';
      status.textContent = 'Image files must be 5 MB or smaller.';
      return;
    }

    if (currentUrl) URL.revokeObjectURL(currentUrl);
    const objectUrl = URL.createObjectURL(file);
    image.src = objectUrl;
    image.hidden = false;
    if (placeholder) placeholder.hidden = true;
    onUrlChange(objectUrl);
  }

  function updatePreview() {
    const selectedType = fields.certificateType.value;
    const heading = certificateHeadings[selectedType] || certificateHeadings['Certificate of Completion'];
    outputs.headingMain.textContent = heading[0];
    outputs.headingSub.textContent = heading[1];
    outputs.studentName.textContent = fields.studentName.value.trim() || 'Student Full Name';
    outputs.courseTitle.textContent = fields.courseTitle.value.trim() || 'COURSE OR CERTIFICATION TITLE';
    outputs.credentialId.textContent = fields.credentialId.value.trim() || 'DEMO-CWU-0000';
    outputs.issueDate.textContent = formattedDate(fields.issueDate.value);
    outputs.signatoryName.textContent = fields.signatoryName.value.trim() || 'Signatory Name';
    outputs.signatoryRole.textContent = fields.signatoryRole.value.trim() || 'Signatory Designation';
    outputs.firstCopy.textContent = 'Preview/sample only. This text does not assert course completion, an award, or a professional qualification.';
    outputs.secondCopy.textContent = 'No official certificate has been issued, registered, or verified by this frontend.';
    previewStatus.textContent = 'Preview updated';
  }

  function processForm(event) {
    if (event) event.preventDefault();
    if (!form.reportValidity()) return;
    updatePreview();
    status.textContent = 'Preview generated locally. No credential was issued or saved.';
  }

  Object.entries(fields).forEach(([key, field]) => {
    if (key === 'signatureImage' || key === 'studentPhoto') return;
    field.addEventListener('input', updatePreview);
    field.addEventListener('change', updatePreview);
  });

  fields.signatureImage.addEventListener('change', () => {
    updateImagePreview(fields.signatureImage, signaturePreview, signaturePlaceholder, signatureObjectUrl, (url) => {
      signatureObjectUrl = url;
    });
  });
  fields.studentPhoto.addEventListener('change', () => {
    updateImagePreview(fields.studentPhoto, studentPhotoPreview, null, studentPhotoObjectUrl, (url) => {
      studentPhotoObjectUrl = url;
      studentPhotoWrap.hidden = !url;
    });
  });

  form.addEventListener('submit', processForm);
  document.getElementById('update-preview').addEventListener('click', processForm);
  document.getElementById('print-certificate').addEventListener('click', () => {
    updatePreview();
    window.print();
  });
  document.getElementById('save-pdf').addEventListener('click', () => {
    updatePreview();
    status.textContent = 'In the print dialog, choose “Save as PDF” to create a local PDF.';
    window.print();
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      if (signatureObjectUrl) URL.revokeObjectURL(signatureObjectUrl);
      if (studentPhotoObjectUrl) URL.revokeObjectURL(studentPhotoObjectUrl);
      signatureObjectUrl = '';
      studentPhotoObjectUrl = '';
      signaturePreview.removeAttribute('src');
      signaturePreview.hidden = true;
      signaturePlaceholder.hidden = false;
      studentPhotoPreview.removeAttribute('src');
      studentPhotoWrap.hidden = true;
      status.textContent = 'Form reset to demo values.';
      updatePreview();
    }, 0);
  });

  updatePreview();
}());
