---
group:
  title: Introduction
title: FAQ
order: 2
---

## Why is "header name" reduced to lowercase?

[RFC 2616](https://tools.ietf.org/html/rfc2616.html#section-4.2) says:

> Each header field consists of a name followed by a colon `(":")` and the field value. Field names are case-insensitive.

So, since 4.0.0, Header Editor will reduce "header name" to lowercase. Except for custom functions: the custom function will still get the original header (except that it has been modified by other rules)

## Can I delete a header in a simple way?

Yes, just modify it to `_header_editor_remove_`

## Rules disappear

As we know, the rules will disappear or not work

**Note: Before doing all of the following, please back up your Chrome/Firefox profile folder!**

### Not work in Private Mode

Popup panel and management page is not work in Private Mode of Firefox. But the main features are available

#### Chrome

* Open `chrome://extensions/?id=eningockdidmgiojffjmkdblpjocbhgh`, enable "Enabled in incognito mode"

#### Firefox

* Open about:debugging, find the Internal UUID of Header Editor (e.g. d52e1cf2-22e5-448d-a882-e68f3211fa76).
* Open Firefox options.
* Go to Privacy & Security.
* Set History mode to "Use custom settings".
* Click "Exceptions".
* Paste our URL: `moz-extension://{Internal UUID}/` (the `{Internal UUID}` is the Internal UUID of Header Editor you found in step one), for example, `moz-extension://d52e1cf2-22e5-448d-a882-e68f3211fa76/`, Then click 'Allow'.
* Click "Save Changes".

### Rules automatically deleted in Firefox

Thanks to [Thorin-Oakenpants](https://github.com/Thorin-Oakenpants) and [henshin](https://github.com/henshin)

* Open `about:config`, make sure that `dom.indexedDB.enabled` is `true`
* Try to change `extensions.webextensions.keepUuidOnUninstall` into true, is your problem solved?
* Open your Firefox profile folder, if there are many files (about a thousand or more) named prefs-xxxx.js files with 0 bytes, closed firefox and deleted them.

## Other questions?

Just [submit a issue](https://github.com/FirefoxBar/HeaderEditor/issues/new/choose)
