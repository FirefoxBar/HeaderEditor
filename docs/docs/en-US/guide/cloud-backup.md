---
title: Cloud backup
---

## Summary

Support for cloud backup started with Header Editor 4.0.5.

**Important: To use cloud backup, you should log in to your browser account (like Firefox account, Google account, etc), and enable sync in the browser settings.**

Cloud backup is supported through your browser's sync feature, as in Firefox Sync, or Chrome Sync. It means that HE has no server to store your backup, your backup is stored on your browser provider's server (like Mozilla, Google, etc). If your browser does not support sync, this feature will take no effect.

## What contents will be backed up?

Your settings will be synchronized automatically, the backup feature only backs up your rules, including groups.

## Limit

Both Chrome and Firefox have its space limit, about 100KB. If you have too many rules, the upload may fail, but you can still import and export in the traditional way.

As I know, Chrome has limits on the number of operations per unit of time. It means that you **can not** upload frequently.

## Other technical details

### Chrome/Chromium

* See [chrome.storage API](https://developer.chrome.com/extensions/storage#property-sync) for more technical details.

### Firefox

* It seems that Firefox Sync is executed regularly, however if you want to force the cloud export you've to launch Firefox Sync manually.
![](https://img12.360buyimg.com/ddimg/jfs/t1/331038/40/854/2134/68a4ab75Fcd087439/c89009381abc82ea.jpg)
* A new installation may cause cloud storage data to be blanked.
* See [browser.storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) for more technical details.
