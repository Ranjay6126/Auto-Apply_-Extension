if (!window.__autoApplyListenerAttached) {
  window.__autoApplyListenerAttached = true;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillAndReview") {
      fillForm().then(sendResponse).catch(error => sendResponse({ error: error.message }));
      return true;
    }
  });
}

function fillForm() {
  return new Promise((resolve, reject) => chrome.storage.sync.get("jobData", ({ jobData }) => {
    if (!jobData) {
      reject(new Error("Save your profile before filling a form."));
      return;
    }

    let filled = 0;
    const inputs = document.querySelectorAll("input, textarea, select");
    
    inputs.forEach(input => {
      if (input.type === 'hidden') return;
      const valueBefore = input.value;
      
      // Match helpers
      const type = input.type ? input.type.toLowerCase() : "text";
      const name = input.name ? input.name.toLowerCase() : "";
      const id = input.id ? input.id.toLowerCase() : "";
      const placeholder = input.placeholder ? input.placeholder.toLowerCase() : "";
      const label = findLabel(input).toLowerCase();
      const attributes = `${name} ${id} ${placeholder} ${label}`;
      
      const matches = (keywords) => keywords.some(k => attributes.includes(k));

      // Local files cannot be assigned by an extension: make upload fields easy to find
      // while still filling a public document URL wherever the form provides one.
      if (type === 'file' && matches(['resume', 'cv', 'cover letter', 'coverletter', 'photo', 'profile', 'picture', 'image', 'document', 'upload', 'attachment'])) {
        input.style.outline = '3px solid #f59e0b';
        input.style.outlineOffset = '1px';
        input.title = 'Choose your document/photo here. Browsers do not allow extensions to select local files automatically.';
        return;
      }

      // --- Personal ---
      if (matches(['full name', 'fullname'])) setValue(input, jobData.fullName);
      else if (matches(['first name', 'firstname', 'f_name'])) setValue(input, jobData.firstName);
      else if (matches(['middle name', 'middlename'])) setValue(input, jobData.middleName);
      else if (matches(['last name', 'lastname', 'surname', 'l_name'])) setValue(input, jobData.lastName);
      // Fallback for just "Name" -> Full Name if no specific parts matched
      else if (matches(['name']) && !matches(['user', 'file', 'project', 'company', 'school', 'cert', 'middle', 'last', 'first'])) {
        setValue(input, jobData.fullName || `${jobData.firstName} ${jobData.lastName}`);
      }

      if (matches(['email', 'e-mail']) && !matches(['password'])) setValue(input, jobData.email);
      if (matches(['password']) && !matches(['wifi'])) setValue(input, jobData.sitePassword);
      
      // Phone & WhatsApp
      if (matches(['whatsapp']) && matches(['number'])) setValue(input, jobData.whatsappNumber);
      else if (matches(['phone', 'mobile', 'contact'])) setValue(input, jobData.phone);
      
      // DOB
      if (matches(['birth', 'dob'])) {
        if (type === 'date') setValue(input, jobData.dob);
        else setValue(input, jobData.dob); 
      }

      // Gender (Select or Radio)
      if (matches(['gender', 'sex'])) {
        if (type === 'radio') {
          if (input.value.toLowerCase() === jobData.gender.toLowerCase()) input.click();
        } else if (input.tagName === 'SELECT') {
          setSelectValue(input, jobData.gender);
        }
      }

      // IDs
      if (matches(['aadhaar', 'adhar', 'uid'])) setValue(input, jobData.aadhaar);
      if (matches(['pan card', 'pancard', 'pan no'])) setValue(input, jobData.pan);

      // Address
      // Permanent
      if (matches(['permanent']) || !matches(['current', 'present', 'temporary', 'correspondence', 'location'])) {
        if (matches(['address line 1', 'address 1', 'house no', 'street'])) setValue(input, jobData.permAddress1);
        else if (matches(['state'])) setValue(input, jobData.permState);
        else if (matches(['city', 'district'])) setValue(input, jobData.permCity);
        else if (matches(['pincode', 'pin code', 'zip', 'postal'])) setValue(input, jobData.permPincode);
        else if (matches(['country'])) setValue(input, jobData.permCountry);
        else if (matches(['address']) && !matches(['email'])) setValue(input, jobData.permAddress1); // Fallback generic "Address"
      }
      
      // Current / Temporary
      // Prefer the dedicated current location for location questions, then current address.
      if (matches(['current location', 'present location', 'current city', 'present city', 'your location', 'location'])) {
        if (matches(['city', 'district'])) setValue(input, jobData.tempCity || jobData.currentLocation);
        else if (matches(['state'])) setValue(input, jobData.tempState);
        else if (matches(['country'])) setValue(input, jobData.tempCountry);
        else setValue(input, jobData.currentLocation || jobData.tempCity);
      } else if (matches(['current', 'present', 'temporary', 'correspondence'])) {
        if (matches(['address line 1', 'address 1', 'house no', 'street'])) setValue(input, jobData.tempAddress1);
        else if (matches(['state'])) setValue(input, jobData.tempState);
        else if (matches(['city', 'district'])) setValue(input, jobData.tempCity);
        else if (matches(['pincode', 'pin code', 'zip', 'postal'])) setValue(input, jobData.tempPincode);
        else if (matches(['country'])) setValue(input, jobData.tempCountry);
        else if (matches(['address']) && !matches(['email'])) setValue(input, jobData.tempAddress1);
      }

      // --- Education ---
      // Graduation
      if (matches(['graduation', 'bachelor', 'degree']) && matches(['college', 'university', 'institute'])) setValue(input, jobData.gradCollege);
      if (matches(['graduation', 'bachelor']) && matches(['year'])) setValue(input, jobData.gradYear);
      if (matches(['graduation', 'bachelor']) && matches(['month'])) setValue(input, jobData.gradMonth);
      if (matches(['graduation', 'bachelor']) && matches(['date'])) setValue(input, jobData.gradDate);
      if (matches(['graduation', 'bachelor', 'college']) && matches(['start', 'from', 'begin'])) setValue(input, jobData.gradStartDate);
      if (matches(['graduation', 'bachelor', 'college']) && matches(['end', 'to', 'completion', 'passed'])) setValue(input, jobData.gradEndDate);
      if (matches(['registration', 'reg no', 'enrollment'])) setValue(input, jobData.univRegNo);
      if (matches(['graduation', 'bachelor', 'degree']) && matches(['specialization', 'branch', 'stream', 'major'])) setValue(input, jobData.gradBranch);
      if (matches(['graduation', 'bachelor']) && matches(['percentage', 'cgpa', 'marks', 'grade'])) setValue(input, jobData.gradPercentage);
      if (matches(['degree']) && !matches(['college', 'university', 'institute', 'specialization', 'branch', 'stream', 'major', 'percentage', 'cgpa', 'marks', 'grade'])) setValue(input, jobData.gradDegree);

      // 12th
      if (matches(['12th', 'hsc', 'intermediate']) && matches(['school', 'college'])) setValue(input, jobData.college12);
      if (matches(['12th', 'hsc', 'intermediate']) && matches(['board'])) setValue(input, jobData.board12);
      if (matches(['12th', 'hsc', 'intermediate']) && matches(['percentage', 'marks', 'grade'])) setValue(input, jobData.percentage12);
      if (matches(['12th', 'hsc']) && matches(['year'])) setValue(input, jobData.year12);
      if (matches(['12th', 'hsc', 'intermediate']) && matches(['start', 'from', 'begin'])) setValue(input, jobData.education12StartDate);
      if (matches(['12th', 'hsc', 'intermediate']) && matches(['end', 'to', 'completion', 'passed'])) setValue(input, jobData.education12EndDate);
      
      // 10th
      if (matches(['10th', 'ssc', 'matric']) && matches(['school', 'college'])) setValue(input, jobData.college10);
      if (matches(['10th', 'ssc', 'matric']) && matches(['board'])) setValue(input, jobData.board10);
      if (matches(['10th', 'ssc', 'matric']) && matches(['percentage', 'marks', 'grade'])) setValue(input, jobData.percentage10);
      if (matches(['10th', 'ssc']) && matches(['year'])) setValue(input, jobData.year10);
      if (matches(['10th', 'ssc', 'matric']) && matches(['start', 'from', 'begin'])) setValue(input, jobData.education10StartDate);
      if (matches(['10th', 'ssc', 'matric']) && matches(['end', 'to', 'completion', 'passed'])) setValue(input, jobData.education10EndDate);

      // Yes/No Questions (Radios)
      if (matches(['gap in education', 'education gap'])) setRadio(input, jobData.gapEducation);
      if (matches(['backlog'])) setRadio(input, jobData.backlog);
      if (matches(['whatsapp']) && matches(['consent'])) setRadio(input, jobData.whatsappConsent);
      if (matches(['disability', 'disabled', 'impairment'])) setRadio(input, jobData.disability);

      // --- Skills & Links ---
      if (matches(['skill', 'technology']) && !matches(['soft', 'spoken'])) setValue(input, `${jobData.languages}, ${jobData.frameworks}`);
      
      // Spoken Languages
      if (matches(['language']) && !matches(['programming', 'coding', 'technical'])) {
         if (type === 'checkbox') {
             const spoken = (jobData.spokenLanguages || "").toLowerCase();
             const label = findLabel(input).toLowerCase();
             if (spoken.includes(label)) {
                 input.checked = true;
                 input.dispatchEvent(new Event('change', { bubbles: true }));
             }
         } else {
             setValue(input, jobData.spokenLanguages);
         }
      }

      if (matches(['linkedin'])) setValue(input, jobData.linkedin || '');
      if (matches(['github', 'git']) && !matches(['project'])) setValue(input, jobData.github || '');
      if (matches(['hackerrank'])) setValue(input, jobData.hackerrank || '');
      if (matches(['leetcode'])) setValue(input, jobData.leetcode || '');
      if (matches(['twitter', 'x.com'])) setValue(input, jobData.twitter || '');
      
      if (matches(['resume', 'cv']) && !type.includes('file')) setValue(input, jobData.resumeLink);
      if (matches(['portfolio', 'website']) && !type.includes('file')) setValue(input, jobData.portfolioLink);
      if (matches(['interest'])) setValue(input, jobData.areaOfInterest);

      // --- Long Text ---
      if (matches(['cover letter']) && !type.includes('file')) setValue(input, jobData.coverLetter);
      else if (matches(['tell us about yourself', 'about you', 'bio'])) setValue(input, jobData.aboutSelf);
      
      if (matches(['why should we hire'])) setValue(input, jobData.whyHire);
      if (matches(['why do you want to join'])) setValue(input, jobData.whyJoin);
      if (matches(['challenge'])) setValue(input, jobData.challenge);
      if (matches(['career goal'])) setValue(input, jobData.careerGoals);
      if (matches(['how can we help', 'how may we help', 'how can we assist', 'last message', 'message for us'])) setValue(input, jobData.helpMessage);
      if (matches(['anything else', 'additional information', 'additional comments', 'other information'])) setValue(input, jobData.anythingElse);
      if (matches(['why this role', 'why are you interested in this role', 'why this position', 'interest in this role'])) setValue(input, jobData.whyThisRole || jobData.whyJoin);
      
      // --- Preferences ---
      if (matches(['desired role', 'job role', 'position applying', 'role applying'])) setValue(input, jobData.desiredRole);
      if (matches(['current salary', 'current ctc'])) setValue(input, jobData.currentSalary || jobData.prefCurrentSalary || '');
      if (matches(['expected salary', 'expected ctc'])) setValue(input, jobData.expectedSalary || jobData.prefExpectedSalary);
      if (matches(['notice period', 'available to join', 'availability', 'joining date'])) {
        const availVal = jobData.availabilityJoin || jobData.noticePeriod;
        if (input.tagName === 'SELECT') setSelectValue(input, availVal);
        else if (type === 'radio') setRadio(input, availVal);
        else setValue(input, availVal);
      }
      if (matches(['work mode', 'work arrangement', 'remote', 'hybrid', 'onsite', 'work location type'])) {
        if (input.tagName === 'SELECT') setSelectValue(input, jobData.workMode);
        else if (type === 'radio') setRadio(input, jobData.workMode);
        else setValue(input, jobData.workMode);
      }
      if (matches(['work authorization', 'authorized to work', 'legally authorized'])) {
        const authVal = jobData.legallyAuthorized || jobData.workAuthorization;
        if (input.tagName === 'SELECT') setSelectValue(input, authVal);
        else if (type === 'radio') setRadio(input, authVal);
        else setValue(input, authVal);
      }
      if (matches(['sponsorship', 'visa sponsor'])) {
        if (input.tagName === 'SELECT') setSelectValue(input, jobData.sponsorshipNeeded);
        else if (type === 'radio') setRadio(input, jobData.sponsorshipNeeded);
        else setValue(input, jobData.sponsorshipNeeded);
      }
      if (matches(['relocat', 'relocate'])) {
        if (input.tagName === 'SELECT') setSelectValue(input, jobData.willingToRelocate);
        else if (type === 'radio') setRadio(input, jobData.willingToRelocate);
        else setValue(input, jobData.willingToRelocate);
      }

      // --- Additional / Family & Personal ---
      if (matches(['father', 'dad']) && matches(['name'])) setValue(input, jobData.fatherName);
      if (matches(['mother', 'mom']) && matches(['name'])) setValue(input, jobData.motherName);
      if (matches(['marital', 'marriage'])) {
        if (input.tagName === 'SELECT') setSelectValue(input, jobData.maritalStatus);
        else if (type === 'radio') setRadio(input, jobData.maritalStatus);
        else setValue(input, jobData.maritalStatus);
      }
      if (matches(['blood group', 'blood type', 'bloodgroup'])) {
        if (input.tagName === 'SELECT') setSelectValue(input, jobData.bloodGroup);
        else setValue(input, jobData.bloodGroup);
      }
      if (matches(['passport']) && matches(['no', 'number', 'id'])) setValue(input, jobData.passportNumber);
      if (matches(['passport']) && matches(['expiry', 'expire', 'valid'])) setValue(input, jobData.passportExpiry);
      if (matches(['driving license', 'driver license', 'licence no', 'license no'])) setValue(input, jobData.drivingLicense);
      if (matches(['category', 'reservation', 'caste', 'general', 'obc', 'sc', 'st', 'ews'])) {
        if (input.tagName === 'SELECT') setSelectValue(input, jobData.category);
        else if (type === 'radio') setRadio(input, jobData.category);
        else setValue(input, jobData.category);
      }
      // Emergency Contact
      if (matches(['emergency']) && matches(['name', 'contact person'])) setValue(input, jobData.emergencyName);
      if (matches(['emergency']) && matches(['phone', 'mobile', 'contact no', 'number'])) setValue(input, jobData.emergencyPhone);
      if (matches(['emergency']) && matches(['relation', 'relationship'])) setValue(input, jobData.emergencyRelation);

      // References (first reference)
      if (jobData.reference && jobData.reference.length > 0) {
        const ref = jobData.reference[0];
        if (matches(['reference']) && matches(['name'])) setValue(input, ref.name);
        if (matches(['reference']) && (matches(['title', 'designation', 'position']))) setValue(input, ref.title);
        if (matches(['reference']) && matches(['company', 'organisation', 'organization'])) setValue(input, ref.company);
        if (matches(['reference']) && matches(['email'])) setValue(input, ref.email);
        if (matches(['reference']) && matches(['phone', 'mobile', 'contact'])) setValue(input, ref.phone);
        if (matches(['reference']) && matches(['relation', 'relationship'])) setValue(input, ref.relation);
      }

      // --- Experience Level & Total ---
      if (matches(['experience in months', 'experience months', 'total months'])) setValue(input, jobData.totalExperienceMonths);
      else if (matches(['total experience', 'years of experience', 'relevant experience', 'experience in years', 'experience years'])) setValue(input, jobData.totalExperience);
      if (matches(['experience level', 'fresher', 'experienced'])) {
         if (type === 'radio') {
             // Heuristic: Check if label contains "Fresher" and user is Fresher
             const label = findLabel(input).toLowerCase();
             if (jobData.experienceLevel === 'Fresher' && (label.includes('fresher') || label.includes('0') || label.includes('no'))) {
                 input.click();
             } else if (jobData.experienceLevel === 'Experienced' && (label.includes('experienced') || label.includes('yes'))) {
                 input.click();
             }
         }
      }

      // --- Dynamic Lists (Simple Heuristic) ---
      // Experience
      if (jobData.experience && jobData.experience.length > 0) {
        const exp = jobData.experience[0];
        if (matches(['employer', 'company', 'organisation', 'organization', 'current employer', 'present employer', 'current company', 'present company', 'current organization', 'most recent employer']) && !matches(['internship']) && !input.value) setValue(input, exp.company || jobData.currentCompany);
        if (matches(['job title', 'designation', 'role']) && !matches(['project']) && !input.value) setValue(input, exp.role);
      }
      // Many forms ask for employer outside an experience section (especially freshers).
      if (matches(['current employer', 'present employer', 'current company', 'present company', 'current organization', 'current organisation', 'employer name', 'organization name', 'organisation name', 'most recent company', 'latest company']) && !input.value) {
        setValue(input, jobData.currentCompany || 'NA');
      }

      // Certifications
      if (jobData.certification && jobData.certification.length > 0) {
        const cert = jobData.certification[0];
        if (matches(['certification name', 'certificate name']) && !input.value) setValue(input, cert.name);
        if (matches(['issuing organization', 'issued by']) && !input.value) setValue(input, cert.org);
      }
      if (input.value !== valueBefore && input.value) filled += 1;
    });

    const result = scanRequiredFields();
    renderReviewPanel(result);
    resolve({ filled, missingRequired: result.missing.length });
  }));
}

function scanRequiredFields() {
  const controls = Array.from(document.querySelectorAll('input, textarea, select'))
    .filter(input => input.type !== 'hidden' && !input.disabled);
  const required = controls.filter(input => input.required || input.getAttribute('aria-required') === 'true');
  const missing = required.filter(input => {
    if (input.type === 'checkbox' || input.type === 'radio') return !input.checked && !document.querySelector(`input[name="${CSS.escape(input.name)}"]:checked`);
    return !String(input.value || '').trim();
  });
  return { missing, total: required.length };
}

function renderReviewPanel(result) {
  installReviewStyles();
  installSubmitGuards();
  document.getElementById('autoapply-review-panel')?.remove();
  const panel = document.createElement('aside');
  panel.id = 'autoapply-review-panel';
  panel.innerHTML = `<strong>AutoApply review</strong><span>${result.missing.length ? `${result.missing.length} required field(s) still need attention.` : 'All detected required fields are complete.'}</span><button type="button" data-action="apply">Review and Apply</button><button type="button" data-action="close" aria-label="Close review">Close</button>`;
  const list = document.createElement('ul');
  result.missing.slice(0, 12).forEach(input => {
    const item = document.createElement('li');
    item.textContent = getFieldLabel(input);
    list.appendChild(item);
  });
  if (list.children.length) panel.insertBefore(list, panel.querySelector('[data-action="apply"]'));
  panel.querySelector('[data-action="close"]').addEventListener('click', () => panel.remove());
  panel.querySelector('[data-action="apply"]').addEventListener('click', () => {
    const current = scanRequiredFields();
    if (current.missing.length) {
      alert(`Complete the ${current.missing.length} required field(s) listed in the review panel before applying.`);
      return;
    }
    const form = document.querySelector('form');
    if (!form) {
      alert('No application form was detected on this page.');
      return;
    }
    if (confirm('All detected required fields are complete. Submit this application now?')) {
      window.__autoApplyConfirmedSubmit = true;
      form.requestSubmit();
      window.__autoApplyConfirmedSubmit = false;
    }
  });
  document.body.appendChild(panel);
}

function installSubmitGuards() {
  if (window.__autoApplySubmitGuardsInstalled) return;
  window.__autoApplySubmitGuardsInstalled = true;
  document.addEventListener('submit', event => {
    if (window.__autoApplyConfirmedSubmit) return;
    event.preventDefault();
    alert('Review the filled answers and use the AutoApply review panel to confirm submission.');
  }, true);
}

function installReviewStyles() {
  if (document.getElementById('autoapply-review-styles')) return;
  const style = document.createElement('style');
  style.id = 'autoapply-review-styles';
  style.textContent = `
    #autoapply-review-panel { position: fixed; z-index: 2147483647; top: 16px; right: 16px; width: min(360px, calc(100vw - 32px)); padding: 16px; background: #fff; border: 1px solid #cbd5e1; border-left: 4px solid #176b3a; box-shadow: 0 8px 24px rgba(15,23,42,.18); color: #172033; font: 14px/1.4 system-ui,sans-serif; }
    #autoapply-review-panel strong, #autoapply-review-panel span { display: block; margin-bottom: 8px; }
    #autoapply-review-panel ul { max-height: 180px; overflow: auto; margin: 8px 0 12px; padding-left: 20px; }
    #autoapply-review-panel button { margin: 4px 6px 0 0; padding: 8px 12px; border: 0; background: #176b3a; color: #fff; cursor: pointer; }
    #autoapply-review-panel button[data-action="close"] { background: #64748b; }
  `;
  document.head.appendChild(style);
}

function getFieldLabel(input) {
  return (findLabel(input).replace(/\s+/g, ' ').trim() || input.name || input.id || 'Required field').slice(0, 120);
}

// --- Helpers ---

function findLabel(input) {
  let labelText = "";
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) labelText += label.innerText;
  }
  const parentLabel = input.closest('label');
  if (parentLabel) labelText += parentLabel.innerText;
  
  if (input.getAttribute('aria-label')) labelText += input.getAttribute('aria-label');
  if (input.getAttribute('aria-labelledby')) {
    const ids = input.getAttribute('aria-labelledby').split(' ');
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) labelText += " " + el.innerText;
    });
  }

  // Fallback: parent text
  let current = input;
  for(let i=0; i<3; i++) {
    if(!current.parentElement) break;
    current = current.parentElement;
    const text = current.innerText;
    if(text.length < 200) labelText += " " + text;
  }
  
  return labelText;
}

function setValue(input, value) {
  if (!value) return;
  // Profile dates use YY/MM/DD; native web date inputs require YYYY-MM-DD.
  if (input.type === 'date') value = toNativeDate(value);
  const descriptor = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value');
  if (descriptor && descriptor.set) descriptor.set.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

function toNativeDate(value) {
  const match = String(value).trim().match(/^(\d{2}|\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return value;
  const year = match[1].length === 2 ? `20${match[1]}` : match[1];
  return `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function setSelectValue(select, value) {
  if (!value) return;
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].text.toLowerCase().includes(value.toLowerCase()) || 
        select.options[i].value.toLowerCase().includes(value.toLowerCase())) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      break;
    }
  }
}

function setRadio(input, userValue) {
    if (!userValue) return;
    if (input.type !== 'radio') return;

    const valStr = String(userValue).toLowerCase(); // "yes" or "no"
    const inputVal = input.value.toLowerCase();     // value="yes", value="no", value="1", etc.
    const label = findLabel(input).toLowerCase();   // "Yes", "No"

    // Logic: 
    // 1. If input value matches user value (e.g. value="yes" matches user="yes")
    // 2. If label matches user value (e.g. label "Yes" matches user="yes")
    
    if (inputVal === valStr || label.includes(valStr)) {
        input.click();
    }
}
