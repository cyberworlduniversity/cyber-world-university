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

  const certificateDescriptions = {
    'Certificate of Completion': [
      'The recipient has completed the learning modules and program requirements presented for this course.',
      'This certificate is a local visual preview and does not confirm attendance, assessment, or academic credit.'
    ],
    'Certificate of Excellence': [
      'The recipient has successfully fulfilled the academic requirements, practical assessments, and ethical standards established by Cyber World University and is recognized for completing the specified training program.',
      'This certificate acknowledges achievement in identifying, analyzing, and mitigating security vulnerabilities while adhering to authorized testing practices and professional cybersecurity standards.'
    ],
    'Certificate of Achievement': [
      'The recipient is recognized for dedication, demonstrated learning, and completion of the selected educational program.',
      'This local preview does not independently confirm assessment outcomes, credentials, or academic standing.'
    ],
    'Professional Cybersecurity Certification': [
      'The recipient is presented as having completed the selected cybersecurity learning program.',
      'Professional certification requires formal review and approval by an authorized issuing body; this local preview does not provide that approval.'
    ],
    'Ethical Hacking Training Certificate': [
      'The recipient is presented as having completed ethical hacking training focused on responsible, authorized security practice.',
      'Security testing must only be performed in approved labs or on systems for which explicit permission has been granted.'
    ],
    'Web Application Penetration Testing Certificate': [
      'The recipient is presented as having completed training in web application security assessment and defensive remediation.',
      'This preview is not proof of competence or authorization to assess any real system.'
    ],
    'Network Security Certificate': [
      'The recipient is presented as having completed learning in network security principles and defensive practice.',
      'This local preview does not validate course completion or any external qualification.'
    ],
    'Digital Forensics Certificate': [
      'The recipient is presented as having completed learning in digital forensics principles and evidence-aware practice.',
      'This local preview does not validate course completion, practical experience, or an external qualification.'
    ],
    'Python for Security Certificate': [
      'The recipient is presented as having completed learning in Python programming for defensive security workflows.',
      'This local preview does not validate course completion or any external qualification.'
    ],
    'Cybersecurity Fundamentals Certificate': [
      'The recipient is presented as having completed foundational learning in cybersecurity principles and defensive practice.',
      'This local preview does not validate course completion or any external qualification.'
    ]
  };
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
    const wording = certificateDescriptions[selectedType] || certificateDescriptions['Certificate of Completion'];
    const heading = certificateHeadings[selectedType] || certificateHeadings['Certificate of Completion'];
    outputs.headingMain.textContent = heading[0];
    outputs.headingSub.textContent = heading[1];
    outputs.studentName.textContent = fields.studentName.value.trim() || 'Student Full Name';
    outputs.courseTitle.textContent = fields.courseTitle.value.trim() || 'COURSE OR CERTIFICATION TITLE';
    outputs.credentialId.textContent = fields.credentialId.value.trim() || 'DEMO-CWU-0000';
    outputs.issueDate.textContent = formattedDate(fields.issueDate.value);
    outputs.signatoryName.textContent = fields.signatoryName.value.trim() || 'Signatory Name';
    outputs.signatoryRole.textContent = fields.signatoryRole.value.trim() || 'Signatory Designation';
    outputs.firstCopy.textContent = wording[0];
    outputs.secondCopy.textContent = wording[1];
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
