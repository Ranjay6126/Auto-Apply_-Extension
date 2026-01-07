document.getElementById("save").addEventListener("click", () => {
  const data = {
    name: name.value,
    email: email.value,
    phone: phone.value,
    skills: skills.value,
    experience: experience.value
  };

  chrome.storage.sync.set({ jobData: data }, () => {
    alert("Details saved");
  });
});

document.getElementById("fill").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: autofill
    });
  });
});

function autofill() {
  chrome.storage.sync.get("jobData", ({ jobData }) => {
    if (!jobData) return;

    document.querySelectorAll("input, textarea").forEach(input => {
      const name = input.name?.toLowerCase() || "";
      const id = input.id?.toLowerCase() || "";
      const placeholder = input.placeholder?.toLowerCase() || "";

      if (name.includes("name") || id.includes("name") || placeholder.includes("name"))
        input.value = jobData.name;

      if (name.includes("email") || id.includes("email"))
        input.value = jobData.email;

      if (name.includes("phone") || id.includes("phone"))
        input.value = jobData.phone;

      if (name.includes("skill"))
        input.value = jobData.skills;

      if (name.includes("experience"))
        input.value = jobData.experience;
    });
  });
}

