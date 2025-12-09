/* modal.js
   Shows modal to resume or start fresh when a saved state is detected in the URL.
*/
(function(global){
  const Modal = {
    init(){
      this.modal = document.getElementById('resumeModal');
      this.btnResume = document.getElementById('btnResume');
      this.btnFresh = document.getElementById('btnFresh');

      this.btnResume.addEventListener('click', ()=>{
        this.hide();
        document.dispatchEvent(new CustomEvent('modal:resume'));
      });
      this.btnFresh.addEventListener('click', ()=>{
        this.hide();
        document.dispatchEvent(new CustomEvent('modal:fresh'));
      });
    },

    show(){ this.modal.classList.remove('hidden'); },
    hide(){ this.modal.classList.add('hidden'); }
  };

  global.Modal = Modal;
})(window);
