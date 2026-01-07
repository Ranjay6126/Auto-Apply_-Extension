# Auto-Apply Extension

A Chrome extension to automatically fill job application forms with your personal details, education, and experience.

## Features
- **Personal Details**: Name, Email, Phone.
- **URLs**: LinkedIn, GitHub, Portfolio.
- **Education**: Degree, University, Graduation Year, CGPA (10th, 12th, Bachelor's).
- **Experience & Skills**: Years of experience and skills list.
- **Smart Autofill**: intelligently matches form fields on various websites.

## How to Install

1. Open Google Chrome.
2. Go to `chrome://extensions/` in the address bar.
3. Toggle **Developer mode** on in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. Select the `AutoApply` folder (the directory where these files are located).
6. The extension icon should appear in your browser toolbar.

## How to Use

1. Click the extension icon in the toolbar.
2. Fill in your details in the popup form.
3. Click **Save Details** to store your information locally.
4. Go to a job application page.
5. Click the extension icon and then click **Autofill Form**.
6. The extension will attempt to fill matching fields automatically.

## Note
- The data is stored locally in your browser (using `chrome.storage.sync`).
- If a field isn't filled automatically, it might have a unique name that the extension doesn't recognize yet.
