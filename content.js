console.log("Auto-Apply content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    console.log("Autofill requested");
    fillForm();
  }
});

function fillForm() {
  chrome.storage.sync.get("jobData", ({ jobData }) => {
    if (!jobData) {
      console.log("No job data found");
      return;
    }

    console.log("Filling form with data:", jobData);
    const inputs = document.querySelectorAll("input, textarea, select");
    
    inputs.forEach(input => {
      if (input.type === 'hidden') return;
      
      // Match helpers
      const type = input.type ? input.type.toLowerCase() : "text";
      const name = input.name ? input.name.toLowerCase() : "";
      const id = input.id ? input.id.toLowerCase() : "";
      const placeholder = input.placeholder ? input.placeholder.toLowerCase() : "";
      const label = findLabel(input).toLowerCase();
      const attributes = `${name} ${id} ${placeholder} ${label}`;
      
      const matches = (keywords) => keywords.some(k => attributes.includes(k));

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
      if (matches(['permanent']) || !matches(['current', 'present', 'temporary', 'correspondence'])) {
        if (matches(['address line 1', 'address 1', 'house no', 'street'])) setValue(input, jobData.permAddress1);
        else if (matches(['state'])) setValue(input, jobData.permState);
        else if (matches(['city', 'district'])) setValue(input, jobData.permCity);
        else if (matches(['pincode', 'pin code', 'zip', 'postal'])) setValue(input, jobData.permPincode);
        else if (matches(['country'])) setValue(input, jobData.permCountry);
        else if (matches(['address']) && !matches(['email'])) setValue(input, jobData.permAddress1); // Fallback generic "Address"
      }
      
      // Current / Temporary
      if (matches(['current', 'present', 'temporary', 'correspondence'])) {
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
      if (matches(['registration', 'reg no', 'enrollment'])) setValue(input, jobData.univRegNo);

      // 12th
      if (matches(['12th', 'hsc', 'intermediate']) && matches(['school', 'college'])) setValue(input, jobData.college12);
      if (matches(['12th', 'hsc']) && matches(['year'])) setValue(input, jobData.year12);
      
      // 10th
      if (matches(['10th', 'ssc', 'matric']) && matches(['school', 'college'])) setValue(input, jobData.college10);
      if (matches(['10th', 'ssc']) && matches(['year'])) setValue(input, jobData.year10);

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
      if (matches(['cover letter'])) setValue(input, jobData.coverLetter);
      else if (matches(['tell us about yourself', 'about you', 'bio'])) setValue(input, jobData.aboutSelf);
      
      if (matches(['why should we hire'])) setValue(input, jobData.whyHire);
      if (matches(['why do you want to join'])) setValue(input, jobData.whyJoin);
      if (matches(['challenge'])) setValue(input, jobData.challenge);
      if (matches(['career goal'])) setValue(input, jobData.careerGoals);
      
      // --- Preferences ---
      if (matches(['current salary', 'ctc'])) setValue(input, jobData.currentSalary || ''); 
      if (matches(['expected salary', 'ctc'])) setValue(input, jobData.expectedSalary);
      if (matches(['notice period'])) setValue(input, jobData.noticePeriod);

      // --- Experience Level & Total ---
      if (matches(['total experience', 'years of experience', 'relevant experience'])) setValue(input, jobData.totalExperience);
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
        if (matches(['employer', 'company']) && !matches(['internship']) && !input.value) setValue(input, exp.company);
        if (matches(['job title', 'designation', 'role']) && !matches(['project']) && !input.value) setValue(input, exp.role);
      }

      // Certifications
      if (jobData.certification && jobData.certification.length > 0) {
        const cert = jobData.certification[0];
        if (matches(['certification name', 'certificate name']) && !input.value) setValue(input, cert.name);
        if (matches(['issuing organization', 'issued by']) && !input.value) setValue(input, cert.org);
      }
    });
  });
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
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
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