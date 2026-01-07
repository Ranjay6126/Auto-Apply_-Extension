document.addEventListener('DOMContentLoaded', () => {
  // --- Tab Logic ---
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // --- Address Copy Logic ---
  const sameAddrCheckbox = document.getElementById('sameAddress');
  if (sameAddrCheckbox) {
    sameAddrCheckbox.addEventListener('change', () => {
      if (sameAddrCheckbox.checked) {
        document.getElementById('tempAddress1').value = document.getElementById('permAddress1').value;
        document.getElementById('tempCity').value = document.getElementById('permCity').value;
        document.getElementById('tempState').value = document.getElementById('permState').value;
        document.getElementById('tempPincode').value = document.getElementById('permPincode').value;
        document.getElementById('tempCountry').value = document.getElementById('permCountry').value;
      }
    });
  }

  // --- Dynamic Lists Logic ---
  const lists = {
    experience: document.getElementById('experienceList'),
    internship: document.getElementById('internshipList'),
    project: document.getElementById('projectList'),
    certification: document.getElementById('certList')
  };

  // Templates for dynamic items
  const templates = {
    experience: (data = {}) => `
      <div class="item-row">
        <button class="remove-btn">&times;</button>
        <input type="text" class="exp-role" placeholder="Job Title" value="${data.role || ''}">
        <input type="text" class="exp-company" placeholder="Company Name" value="${data.company || ''}">
        <select class="exp-type">
          <option value="">Type</option>
          <option value="Full-time" ${data.type === 'Full-time' ? 'selected' : ''}>Full-time</option>
          <option value="Part-time" ${data.type === 'Part-time' ? 'selected' : ''}>Part-time</option>
          <option value="Contract" ${data.type === 'Contract' ? 'selected' : ''}>Contract</option>
          <option value="Internship" ${data.type === 'Internship' ? 'selected' : ''}>Internship</option>
        </select>
        <div style="display:flex; gap:5px;">
          <input type="text" class="exp-start" placeholder="Start Date" value="${data.start || ''}">
          <input type="text" class="exp-end" placeholder="End Date" value="${data.end || ''}">
        </div>
        <label><input type="checkbox" class="exp-current" ${data.current ? 'checked' : ''}> Currently Working</label>
        <input type="text" class="exp-location" placeholder="Location" value="${data.location || ''}">
        <textarea class="exp-desc" placeholder="Responsibilities/Achievements">${data.desc || ''}</textarea>
      </div>
    `,
    internship: (data = {}) => `
      <div class="item-row">
        <button class="remove-btn">&times;</button>
        <input type="text" class="int-title" placeholder="Internship Title" value="${data.title || ''}">
        <input type="text" class="int-company" placeholder="Company/Org" value="${data.company || ''}">
        <input type="text" class="int-duration" placeholder="Duration" value="${data.duration || ''}">
        <input type="text" class="int-skills" placeholder="Skills Used" value="${data.skills || ''}">
        <input type="text" class="int-link" placeholder="Certificate Link" value="${data.link || ''}">
      </div>
    `,
    project: (data = {}) => `
      <div class="item-row">
        <button class="remove-btn">&times;</button>
        <input type="text" class="proj-title" placeholder="Project Title" value="${data.title || ''}">
        <textarea class="proj-desc" placeholder="Description">${data.desc || ''}</textarea>
        <input type="text" class="proj-tech" placeholder="Technologies Used" value="${data.tech || ''}">
        <input type="text" class="proj-link" placeholder="Link (GitHub/Demo)" value="${data.link || ''}">
      </div>
    `,
    certification: (data = {}) => `
      <div class="item-row">
        <button class="remove-btn">&times;</button>
        <input type="text" class="cert-name" placeholder="Certification Name" value="${data.name || ''}">
        <input type="text" class="cert-org" placeholder="Issuing Organization" value="${data.org || ''}">
        <input type="text" class="cert-date" placeholder="Issue Date" value="${data.date || ''}">
        <input type="text" class="cert-link" placeholder="Credential URL" value="${data.link || ''}">
      </div>
    `
  };

  function addItem(type, data = {}) {
    const div = document.createElement('div');
    div.innerHTML = templates[type](data);
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    lists[type].appendChild(div.firstElementChild);
  }

  document.getElementById('addExperience').addEventListener('click', () => addItem('experience'));
  document.getElementById('addInternship').addEventListener('click', () => addItem('internship'));
  document.getElementById('addProject').addEventListener('click', () => addItem('project'));
  document.getElementById('addCert').addEventListener('click', () => addItem('certification'));

  // --- Save / Load Logic ---
  
  // Load saved data
  chrome.storage.sync.get('jobData', (result) => {
    const data = result.jobData;
    if (!data) return;

    // Load simple fields
    const inputs = document.querySelectorAll('input:not(.item-row input), select:not(.item-row select), textarea:not(.item-row textarea)');
    inputs.forEach(input => {
      if (input.type === 'radio') {
        if (input.value === data[input.name]) {
          input.checked = true;
        }
      } else if (input.type === 'checkbox') {
        input.checked = data[input.id] || false;
      } else {
        input.value = data[input.id] || '';
      }
    });

    // Load dynamic lists
    if (data.experience) data.experience.forEach(item => addItem('experience', item));
    if (data.internship) data.internship.forEach(item => addItem('internship', item));
    if (data.project) data.project.forEach(item => addItem('project', item));
    if (data.certification) data.certification.forEach(item => addItem('certification', item));
  });

  document.getElementById('save').addEventListener('click', () => {
    const data = {};

    // Save simple fields
    const inputs = document.querySelectorAll('input:not(.item-row input), select:not(.item-row select), textarea:not(.item-row textarea)');
    inputs.forEach(input => {
      if (input.type === 'radio') {
        if (input.checked) {
          data[input.name] = input.value;
        }
      } else if (input.type === 'checkbox') {
        data[input.id] = input.checked;
      } else {
        data[input.id] = input.value;
      }
    });

    // Save dynamic lists
    data.experience = Array.from(lists.experience.children).map(row => ({
      role: row.querySelector('.exp-role').value,
      company: row.querySelector('.exp-company').value,
      type: row.querySelector('.exp-type').value,
      start: row.querySelector('.exp-start').value,
      end: row.querySelector('.exp-end').value,
      current: row.querySelector('.exp-current').checked,
      location: row.querySelector('.exp-location').value,
      desc: row.querySelector('.exp-desc').value
    }));

    data.internship = Array.from(lists.internship.children).map(row => ({
      title: row.querySelector('.int-title').value,
      company: row.querySelector('.int-company').value,
      duration: row.querySelector('.int-duration').value,
      skills: row.querySelector('.int-skills').value,
      link: row.querySelector('.int-link').value
    }));

    data.project = Array.from(lists.project.children).map(row => ({
      title: row.querySelector('.proj-title').value,
      desc: row.querySelector('.proj-desc').value,
      tech: row.querySelector('.proj-tech').value,
      link: row.querySelector('.proj-link').value
    }));

    data.certification = Array.from(lists.certification.children).map(row => ({
      name: row.querySelector('.cert-name').value,
      org: row.querySelector('.cert-org').value,
      date: row.querySelector('.cert-date').value,
      link: row.querySelector('.cert-link').value
    }));

    chrome.storage.sync.set({ jobData: data }, () => {
      const btn = document.getElementById('save');
      const originalText = btn.innerText;
      btn.innerText = 'Saved!';
      setTimeout(() => btn.innerText = originalText, 1500);
    });
  });

  // --- Autofill Trigger ---
  document.getElementById('fill').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'autofill' }).catch(err => {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, () => {
            setTimeout(() => {
               chrome.tabs.sendMessage(tabs[0].id, { action: 'autofill' });
            }, 500);
          });
        });
      }
    });
  });
});