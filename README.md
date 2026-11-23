# Focus Tab Closer

A small Chrome extension that keeps only your work tab open. While focus is on, any other tab you open closes right away, so you stay on your work instead of drifting into distractions.

## Install (Chrome or Edge, on computer)

1. Unzip the downloaded file if you got it as a zip. Keep the folder somewhere safe, do not delete it after installing.
2. Open Chrome and go to `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `focus-tab-closer` folder.
5. Pin the extension: click the puzzle piece icon in the toolbar, then pin **Focus Tab Closer**.

This works on a computer browser only, not on phone.

## How to use

1. Open your work tab (the one site you want to stay on).
2. Click the Focus Tab Closer icon.
3. Click **Set this tab as my work tab and start focus**.
   - Every other tab in that window closes.
   - Any new tab you open after that closes instantly.
   - Switching to another tab in that window closes it and brings you back to your work tab.
4. To stop, click the icon and press **Stop focus**. Closing your work tab also turns focus off by itself.

## Allowed sites (optional)

If your work needs a second site, like Google Docs or Gmail, add it in the popup under **Allowed sites**, one per line, for example:

```
docs.google.com
mail.google.com
```

Tabs on allowed sites will not be closed. Leave the box empty for full strict focus.

One thing to know: links that open in a new tab (target blank) will also close while focus is on, unless that site is in your allowed list. That is by design, it keeps you in the one tab.

## Notes

- The green **ON** badge on the icon shows focus is active.
- The popup shows how many tabs were closed in the current focus session.
- Tabs already open in other windows before you start focus are left alone. New tabs opened anywhere during focus still close, unless allowed.
- No data leaves your browser. The extension only stores its own settings locally.

## License

MIT. See the LICENSE file. Anyone can use, copy, modify and share this code, as long as the copyright notice stays in it.
