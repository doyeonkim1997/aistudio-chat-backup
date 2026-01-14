# Ai Studio Chat Backup

A Chrome extension that saves AI Studio prompt conversations to a TXT file with a single click.

It automatically scrolls through the chat based on AI Studio’s virtual scroll structure, loads older messages, and collects the entire rendered conversation into a text file.

[Korean](./README.ko.md)

### Usage

- Open an AI Studio prompt page  
  (`https://aistudio.google.com/prompts/...`)
- Keep the tab open
- Click the extension icon
- Wait until the auto-scrolling process completes  
  (longer conversations may take more time)
- A TXT file will be downloaded automatically

### Features & Notes

- One-click backup on AI Studio prompt pages
- Automatic loading and collection of long conversations
- Single TXT file output
- Runs locally in the browser
- Do not close or refresh the AI Studio tab during export

### Installation

- Clone or download this repository
- Open `chrome://extensions` in Chrome
- Enable Developer mode
- Click “Load unpacked”
- Select the project folder

### Tech Stack

- JavaScript (Vanilla)
- Chrome Extensions API (Manifest V3)
- DOM parsing
- Virtual scroll handling
- No framework or build process
