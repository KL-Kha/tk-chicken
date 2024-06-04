/** @odoo-module **/

var html = document.documentElement;

import { cookie } from "@web/core/browser/cookie";

var website_id = html.getAttribute('data-website-id') | 0;
// Detects if device is on iOS
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test( userAgent );
}
// Detects if device is in standalone mode
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

if ('serviceWorker' in navigator) {
    if(!navigator.onLine){
        var dv_offline = $('.ept_is_offline');
        if(dv_offline){
            dv_offline.show();
        }
    }
    navigator.serviceWorker.register('/service_worker').then(res => {
        console.info('service worker registered : ', res)}
    ).catch(error => {
      console.log('ServiceWorker registration failed: ', error)
    });
}

