/* state.js
   Handles encoding/decoding of state to URL using LZString.
   Exposes functions: saveStateToUrl, loadStateFromUrl, clearState, encodeState, decodeState
   and holds the in-memory `currentState` object.
*/
(function(global){
  const State = {
    currentState: {
      view: 'start', // 'start', 'choose-topic', 'quiz', 'results'
      quizId: null,
      currentPage: 0,
      answers: {}
    },

    encodeState(stateObj){
      const json = JSON.stringify(stateObj);
      return LZString.compressToEncodedURIComponent(json);
    },

    decodeState(str){
      if(!str) return null;
      try{
        const json = LZString.decompressFromEncodedURIComponent(str);
        return JSON.parse(json);
      }catch(e){ console.warn('Failed to decode state', e); return null; }
    },

    saveStateToUrl(stateObj){
      const compressed = this.encodeState(stateObj);
      // Always use single root path with state in query param
      // Save current scroll position
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      window.location.hash = `#?state=${compressed}`;
      // Restore scroll position to prevent unwanted scrolling
      window.scrollTo(scrollX, scrollY);
    },

    loadStateFromUrl(){
      const hash = window.location.hash || '';
      const parts = hash.split('?');
      if(parts.length < 2) return null;
      const q = parts[1];
      const params = new URLSearchParams(q);
      const s = params.get('state');
      if(!s) return null;
      return this.decodeState(s);
    },

    clearState(){
      window.location.hash = '#';
    }
  };

  global.State = State;
})(window);
