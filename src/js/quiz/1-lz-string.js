/* Lightweight wrapper named LZString providing the two methods used in this project.
   NOTE: This is a simple encode/decode wrapper using base64 + encodeURIComponent
   rather than the original lz-string algorithm, but exposes the same API calls
   `compressToEncodedURIComponent` and `decompressFromEncodedURIComponent`.
   If you prefer the original library, replace this file with the official
   lz-string.js from https://github.com/pieroxy/lz-string
*/
var LZString = (function(){
  return {
    compressToEncodedURIComponent: function(input){
      if (input == null) return "";
      // encode -> UTF-8 percent-encoding -> btoa safe string -> URI encode
      try{
        var encoded = unescape(encodeURIComponent(input));
        var b64 = btoa(encoded);
        return encodeURIComponent(b64);
      }catch(e){
        console.warn('LZString fallback compress failed', e);
        return encodeURIComponent(input);
      }
    },
    decompressFromEncodedURIComponent: function(input){
      if (input == null) return null;
      try{
        var b64 = decodeURIComponent(input);
        var str = atob(b64);
        return decodeURIComponent(escape(str));
      }catch(e){
        console.warn('LZString fallback decompress failed', e);
        try{ return decodeURIComponent(input); }catch(e2){ return input; }
      }
    }
  };
})();
