---
group:
  title: Basic features
title: Cloud backup
order: 2
---

## Summary

Support for cloud backup started with Header Editor 4.0.5.

**Important: To use cloud backup, you should login your browser's account (like Firefox account, Google account, etc), and enable synchronize in browser's setting.**

Cloud backup is supported through your browser's sync feature, as in Firefox Sync, or Chrome Sync, i.e. It means that HE has no server to storage your backup, your backup is storage at your browser's provider's server (like Mozilla, Google, etc). If your browser does not support sync, this feature will take no effect.

## What contents can be backup?

Your setting will be synchronize automatically, the backup feature only backup your rules, include groups.

## Limit

Both Chrome and Firefox have its space limit, about 100KB. If you have too many rules, upload will be failed, but you can use the export normally.

As I know, Chrome has limits on the number of operations per unit of time. It means that you **can not** upload frequently.

## Other caveats

### Chrome/Chromium

* See [chrome.storage API](https://developer.chrome.com/extensions/storage#property-sync) for more technical details.

### Firefox

* It seems that Firefox Sync is executed regularly, however if you want to force the cloud export you've to launch Firefox Sync manually.
![](https://user-images.githubusercontent.com/886325/41821498-e081fe7e-77e1-11e8-81de-03a09d826cb9.png)
* A new installation may cause cloud storage data to be blanked.
* See [browser.storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) for more technical details.
