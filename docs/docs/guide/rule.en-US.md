---
group:
  title: Basic features
  order: 2
title: Rule
order: 1
---

## Rule

### Match type

Rules will apply to the URL that meets the matching criteria

* All: Correspond to all urls, including the Header Editor itself
* Regular expression
	* Supports standard JS regular expressions. For example, the regular expression you entered is `str`, then, in fact, the program will use the internal `new RegExp(str)` to initialize the regular expression.
	* If the match rule is a regular expression, the modification result (currently including redirect to) supports the use placeholder like `$1`
	* Learn more about regular expression on [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
* URL prefix: Including `http://` URL prefix
* Domain name: The full domain name that contains the subdomain
* URL: Including "?" And the full address of all subsequent content

### Exclude

The rule will not take effect on the URL which is match the "exclude".

### Custom function

Through a custom function to realize a more flexible function, the specific use please see [here](./custom-function.md)

## Other special features

* When using "Modify request header" or "Modify response header", set the header content to `_header_editor_remove_` will remove this header (valid since 3.0.5)

* When using "Redirect request" with custom function, return `_header_editor_cancel_` will cancel this request  (valid since 4.0.3)

## Other considerations

* If you want to set a header content to empty, different browsers have different behaviors. Chrome will keep this header but its content will be empty. Firefox will remove this header

## A common feature example

The following example is not guaranteed to be valid, only as an example to help users familiarize themselves with the rules of the Header Editor

### Redirect requests

For example, the Google public library is redirected to the mirror image of University of Science and Technology of China:

Regular expressions is `^http(s?)://(ajax|fonts)\.googleapis\.com/(.*)`, redirect to `https://$2.proxy.ustclug.org/$3`

Redirect all HTTP requests of `sale.jd.com`, `item.jd.com` and `www.jd.com` to the HTTPS:

Regular expressions is `http://(sale|item|www).jd.com`, redirect to `https://$1.jd.com`

Redirect all wikipedia's HTTP requests to HTTPS:

Regular expressions is `^http://([^\/]+\.wikipedia\.org/.+)`, redirect to `https://$1`

### Camouflage UA

Just modify the request header named User-Agent, but the function can only affect the ability of the server to determine UA, which can not be pseudo in local through JS
