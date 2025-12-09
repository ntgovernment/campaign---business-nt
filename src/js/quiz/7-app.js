/* app.js
   Entry point. Loads navigation, initializes modal and router.
*/
(async function(){
  document.addEventListener('DOMContentLoaded', init);
  function init(){
    Modal.init();
    // if URL contains state param, show modal to resume or start fresh
    const existing = State.loadStateFromUrl();
    if(existing){
      // preload the saved state so UI can render progress immediately
      State.currentState = existing;
      // render UI with saved state populated
      // show modal as a non-blocking prompt so user can still interact with the restored UI
      Modal.show();
      document.addEventListener('modal:resume', ()=>{
        // simply hide modal and re-route to ensure UI focuses correctly
        Router.route();
      }, { once:true });

      document.addEventListener('modal:fresh', ()=>{
        // clear saved state and start fresh
        Modal.hide();
        State.clearState();
        State.currentState = { view: 'start', quizId:null, currentPage:0, answers:{} };
        State.saveStateToUrl(State.currentState);
        Router.route();
      }, { once:true });
    }

    // Initially route
    Router.route();
  }
})();
