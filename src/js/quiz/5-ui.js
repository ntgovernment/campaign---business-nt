/* ui.js
   Renders Start, Choose Topic, Quiz pages and Results pages.
   Uses data JSON files under /data.
*/
(function(global){
  async function fetchJSON(path){
    const res = await fetch(path);
    return res.json();
  }

  async function renderStart(contentEl, uiMessages){
    document.getElementById('pageTitle').textContent = 'Get Started';
    contentEl.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    const h = document.createElement('h2'); h.textContent = uiMessages.introTitle || 'Welcome';
    const p = document.createElement('p'); p.textContent = uiMessages.introText || 'Start the quizzes to assess your business safety.';
    const btn = document.createElement('button'); btn.className='primary'; btn.textContent='Start';
    btn.addEventListener('click', ()=>{
      window.State.currentState.view = 'choose-topic';
      window.State.saveStateToUrl(window.State.currentState);
    });
    wrapper.appendChild(h); wrapper.appendChild(p); wrapper.appendChild(btn);
    contentEl.appendChild(wrapper);
  }

  async function renderChooseTopic(contentEl, navJson){
    document.getElementById('pageTitle').textContent = 'Choose a Topic';
    contentEl.innerHTML = '';
    const grid = document.createElement('div'); grid.className='cards';
    for(const q of navJson.quizzes){
      const card = document.createElement('div'); card.className='card';
      const title = document.createElement('h3'); title.textContent = q.title;
      const desc = document.createElement('p'); desc.textContent = q.description;
      const footer = document.createElement('div'); footer.className='card-footer';
      const progressWrap = document.createElement('div'); progressWrap.className='progress';
      const prog = document.createElement('i'); progressWrap.appendChild(prog);
      // compute progress if state exists
      const percent = await computeProgress(q.id);
      prog.style.width = percent + '%';
      const percentLabel = document.createElement('div'); percentLabel.textContent = percent + '%'; percentLabel.style.marginTop = '6px'; percentLabel.style.fontSize = '12px'; percentLabel.style.color = '#666';
      const startBtn = document.createElement('button'); startBtn.className='primary'; startBtn.textContent='Open';
      startBtn.addEventListener('click', ()=>{
        // Set quiz id and start at page 0 in state, then save to URL
        if(window.State){
          window.State.currentState.view = 'quiz';
          window.State.currentState.quizId = q.id;
          window.State.currentState.currentPage = 0;
          if(!window.State.currentState.answers) window.State.currentState.answers = {};
          window.State.saveStateToUrl(window.State.currentState);
        }
      });

      footer.appendChild(progressWrap); footer.appendChild(percentLabel); footer.appendChild(startBtn);
      card.appendChild(title); card.appendChild(desc); card.appendChild(footer);
      grid.appendChild(card);
    }
    contentEl.appendChild(grid);
  }

  async function computeProgress(quizId){
    try{
      const q = await fetch(`/project/../assets/data/quizzes/${quizId}.json`.replace('/project',''));
    }catch(e){/* ignore */}
    // Try to fetch quiz JSON from ./data
    try{
      const quiz = await fetchJSON(`../assets/data/quizzes/${quizId}.json`);
      const answers = (window.State && window.State.currentState && window.State.currentState.answers) || {};
      // count only visible questions (respect conditionals)
      let total = 0; let answered = 0;
      for(const page of quiz.pages){
        for(const question of page.questions){
          if(question.type === 'group' && question.subQuestions){
            // Count sub-questions in a group
            for(const subQ of question.subQuestions){
              if(!Conditional.isVisible(subQ, answers)) continue;
              total++;
              const ans = answers[subQ.id];
              if(typeof ans !== 'undefined' && ans !== null && ans !== ''){
                if(Array.isArray(ans)){
                  if(ans.length > 0) answered++;
                } else {
                  answered++;
                }
              }
            }
          } else {
            // Regular question
            if(!Conditional.isVisible(question, answers)) continue;
            total++;
            const ans = answers[question.id];
            if(typeof ans !== 'undefined' && ans !== null && ans !== ''){
              if(Array.isArray(ans)){
                if(ans.length > 0) answered++;
              } else {
                answered++;
              }
            }
          }
        }
      }
      return total? Math.round((answered/total)*100) : 0;
    }catch(e){ return 0; }
  }

  function isPageCompleted(page, answers){
    // check if all visible questions in a page are answered
    for(const q of page.questions){
      if(q.type === 'group' && q.subQuestions){
        // Check all sub-questions in the group
        for(const subQ of q.subQuestions){
          if(!Conditional.isVisible(subQ, answers)) continue;
          const ans = answers[subQ.id];
          if(typeof ans === 'undefined' || ans === null || ans === '') return false;
          if(Array.isArray(ans) && ans.length === 0) return false;
        }
      } else {
        if(!Conditional.isVisible(q, answers)) continue; // skip conditionally hidden
        const ans = answers[q.id];
        if(typeof ans === 'undefined' || ans === null || ans === '') return false;
        if(Array.isArray(ans) && ans.length === 0) return false;
      }
    }
    return page.questions.length > 0 && page.questions.some(q => {
      if(q.type === 'group' && q.subQuestions) return q.subQuestions.some(subQ => Conditional.isVisible(subQ, answers));
      return Conditional.isVisible(q, answers);
    });
  }

  // Helper: render inline message for a question based on selected value
  function showInlineMessageForQuestion(question, questionEl, value){
    if(!questionEl) return;
    const msgDiv = questionEl.querySelector('.inline-message');
    if(!msgDiv) return;
    msgDiv.style.display = 'none'; msgDiv.innerHTML = '';
    if(!question.messageOnSelect) return;

    // messageOnSelect can be a mapping from value -> string|object, or a default string
    let payload = null;
    if(typeof question.messageOnSelect === 'string'){
      payload = question.messageOnSelect;
    } else if(value && question.messageOnSelect[value]){
      payload = question.messageOnSelect[value];
    } else if(question.messageOnSelect['*']){
      // wildcard
      payload = question.messageOnSelect['*'];
    }

    if(!payload) return;

    // payload may be string (HTML) or object { title, body, html, class }
    if(typeof payload === 'string'){
      msgDiv.innerHTML = payload;
      msgDiv.classList.remove('info-box');
      msgDiv.style.display = 'block';
      return;
    }
    // object
    const cls = payload.class || 'info-box';
    msgDiv.className = 'inline-message ' + cls;
    if(payload.html) msgDiv.innerHTML = payload.html;
    else {
      let out = '';
      if(payload.title) out += `<strong>${payload.title}</strong>`;
      if(payload.body) out += `<div>${payload.body}</div>`;
      msgDiv.innerHTML = out;
    }
    msgDiv.style.display = 'block';
  }

  async function renderQuizPage(contentEl, quizId, pageIndex){
    document.getElementById('pageTitle').textContent = 'Quiz';
    contentEl.innerHTML = '';
    const quiz = await fetchJSON(`../assets/data/quizzes/${quizId}.json`);
    if(!quiz) { contentEl.textContent = 'Quiz not found.'; return; }
    // set currentState quizId
    if(window.State) window.State.currentState.quizId = quizId;

    // Stepper (page steps) - show all pages with completion status
    const stepper = document.createElement('div'); stepper.className='stepper';
    const answers = window.State.currentState.answers || {};
    quiz.pages.forEach((p, idx)=>{
      const s = document.createElement('div'); s.className='step'; s.textContent = p.title || `Page ${idx+1}`;
      const pageComplete = isPageCompleted(p, answers);
      // detect if any visible question on this page has an answer
      let pageHasAnswers = false;
      for(const q of p.questions){
        if(q.type === 'group' && q.subQuestions){
          // Check sub-questions in the group
          for(const subQ of q.subQuestions){
            if(!Conditional.isVisible(subQ, answers)) continue;
            const a = answers[subQ.id];
            if(typeof a !== 'undefined' && a !== null && a !== ''){
              if(Array.isArray(a) && a.length > 0){ pageHasAnswers = true; break; }
              else if(!Array.isArray(a)){ pageHasAnswers = true; break; }
            }
          }
          if(pageHasAnswers) break;
        } else {
          if(!Conditional.isVisible(q, answers)) continue;
          const a = answers[q.id];
          if(typeof a !== 'undefined' && a !== null && a !== ''){
            if(Array.isArray(a) && a.length > 0){ pageHasAnswers = true; break; }
            else if(!Array.isArray(a)){ pageHasAnswers = true; break; }
          }
        }
      }
      if(pageComplete) {
        s.classList.add('completed');
      } else if(pageHasAnswers) {
        s.classList.add('in-progress');
      }
      if(idx === pageIndex) s.classList.add('active');
      s.addEventListener('click', ()=>{
        window.State.currentState.view = 'quiz';
        window.State.currentState.currentPage = idx;
        window.State.saveStateToUrl(window.State.currentState);
      });
      stepper.appendChild(s);
    });
    contentEl.appendChild(stepper);

    const page = quiz.pages[pageIndex];
    const pageTitle = document.createElement('div'); pageTitle.className='page-title'; pageTitle.textContent = page.title;
    contentEl.appendChild(pageTitle);

    // Helper function to create a single question element
    function createQuestionElement(question, isSubQuestion = false){
      const qwrap = document.createElement('div'); 
      qwrap.className = isSubQuestion ? 'sub-question' : 'question';
      qwrap.dataset.qid = question.id;
      
      // Create label wrapper with info icon if helpText exists
      if(question.helpText){
        const labelWrapper = document.createElement('div'); labelWrapper.className='question-label-wrapper';
        const label = document.createElement('label'); label.textContent = question.label || question.id;
        const helpIcon = document.createElement('i'); helpIcon.className='help-icon'; helpIcon.textContent='i';
        const tooltip = document.createElement('span'); tooltip.className='help-tooltip'; tooltip.textContent = question.helpText;
        helpIcon.appendChild(tooltip);
        labelWrapper.appendChild(label);
        labelWrapper.appendChild(helpIcon);
        qwrap.appendChild(labelWrapper);
      } else {
        const label = document.createElement('label'); label.textContent = question.label || question.id;
        qwrap.appendChild(label);
      }

      const optionsWrap = document.createElement('div'); optionsWrap.className='options';
      // expose minScore for checkbox scoring
      if(typeof question.minScore !== 'undefined') qwrap.dataset.minScore = question.minScore;
      // check conditional visibility
      const visible = Conditional.isVisible(question, window.State.currentState.answers || {});
      if(!visible){ qwrap.style.display='none'; }

      if(question.type === 'radio'){
        question.options.forEach(opt=>{
          const isObj = typeof opt === 'object' && opt !== null;
          const optionLabel = isObj ? (opt.label || opt.value) : String(opt);
          const optionValue = isObj ? (opt.value || opt.label) : String(opt);
          const optScore = isObj && typeof opt.score !== 'undefined' ? Number(opt.score) : (String(optionLabel).toLowerCase() === 'yes' ? 1 : 0);
          const id = `${question.id}__${optionValue}`.replace(/\s+/g,'_');
          const div = document.createElement('div');
          const inp = document.createElement('input'); inp.type='radio'; inp.name=question.id; inp.value=optionValue; inp.id=id; inp.dataset.score = String(optScore);
          const lab = document.createElement('label'); lab.htmlFor=id; lab.textContent=optionLabel;
          div.appendChild(inp); div.appendChild(lab);
          optionsWrap.appendChild(div);
        });
      } else if(question.type === 'checkbox'){
        question.options.forEach(opt=>{
          const optionValue = String(opt);
          const id = `${question.id}__${optionValue}`.replace(/\s+/g,'_');
          const div = document.createElement('div');
          const inp = document.createElement('input'); inp.type='checkbox'; inp.name=question.id; inp.value=optionValue; inp.id=id;
          const lab = document.createElement('label'); lab.htmlFor=id; lab.textContent=optionValue;
          div.appendChild(inp); div.appendChild(lab);
          optionsWrap.appendChild(div);
        });
      } else if(question.type === 'number' || question.type === 'text'){
        const inp = document.createElement('input'); inp.type = question.type === 'number' ? 'number' : 'text'; inp.name=question.id; inp.className='text-input';
        optionsWrap.appendChild(inp);
      }

      qwrap.appendChild(optionsWrap);

      // inline message placeholder
      const messageDiv = document.createElement('div'); messageDiv.className='inline-message'; messageDiv.style.display='none'; qwrap.appendChild(messageDiv);

      return qwrap;
    }

    // Build question elements first (do not append yet) so we can group conditional questions
    const qwraps = [];
    page.questions.forEach((question)=>{
      if(question.type === 'group'){
        // Handle grouped questions
        const groupWrap = document.createElement('div'); 
        groupWrap.className='question-group';
        groupWrap.dataset.qid = question.id;
        
        // Group header
        const groupHeader = document.createElement('div');
        groupHeader.className = 'question-group-header';
        
        if(question.helpText){
          const labelWrapper = document.createElement('div'); labelWrapper.className='question-label-wrapper';
          const label = document.createElement('label'); label.textContent = question.label || question.id;
          const helpIcon = document.createElement('i'); helpIcon.className='help-icon'; helpIcon.textContent='i';
          const tooltip = document.createElement('span'); tooltip.className='help-tooltip'; tooltip.textContent = question.helpText;
          helpIcon.appendChild(tooltip);
          labelWrapper.appendChild(label);
          labelWrapper.appendChild(helpIcon);
          groupHeader.appendChild(labelWrapper);
        } else {
          const label = document.createElement('label'); label.textContent = question.label || question.id;
          groupHeader.appendChild(label);
        }
        
        groupWrap.appendChild(groupHeader);
        
        // Sub-questions - group them by conditional relationships
        if(question.subQuestions && question.subQuestions.length > 0){
          // Build map of parent -> children for conditionals within this group
          const subQMap = {};
          question.subQuestions.forEach((subQ, idx) => {
            subQMap[subQ.id] = idx;
          });
          
          const conditionalGroups = {};
          question.subQuestions.forEach((subQ, idx) => {
            if(subQ.conditional && subQ.conditional.showWhen){
              const parentId = Object.keys(subQ.conditional.showWhen)[0];
              if(subQMap[parentId] !== undefined){
                const parentIdx = subQMap[parentId];
                conditionalGroups[parentIdx] = conditionalGroups[parentIdx] || [];
                conditionalGroups[parentIdx].push(idx);
              }
            }
          });
          
          const processed = new Set();
          question.subQuestions.forEach((subQ, idx) => {
            if(processed.has(idx)) return;
            
            if(conditionalGroups[idx]){
              // This sub-question has conditional children - wrap them together
              const condWrapper = document.createElement('div');
              condWrapper.className = 'conditional-subquestion-group';
              
              // Add parent
              const parentEl = createQuestionElement(subQ, true);
              condWrapper.appendChild(parentEl);
              processed.add(idx);
              
              // Add children
              conditionalGroups[idx].forEach(childIdx => {
                const childEl = createQuestionElement(question.subQuestions[childIdx], true);
                condWrapper.appendChild(childEl);
                processed.add(childIdx);
              });
              
              groupWrap.appendChild(condWrapper);
            } else {
              // Regular sub-question without conditional children
              const subQEl = createQuestionElement(subQ, true);
              groupWrap.appendChild(subQEl);
              processed.add(idx);
            }
          });
        }
        
        qwraps.push(groupWrap);
      } else {
        // Regular question
        qwraps.push(createQuestionElement(question, false));
      }
    });

    // Map question id to index on this page
    const idToIndex = {};
    page.questions.forEach((q, i)=> idToIndex[q.id] = i);

    // Build groups: parentIndex -> [childIndex,...]
    const groups = {};
    page.questions.forEach((q, i)=>{
      if(q.conditional && q.conditional.showWhen){
        const keys = Object.keys(q.conditional.showWhen || {});
        if(keys.length){
          const parentId = keys[0];
          const pIdx = idToIndex[parentId];
          if(typeof pIdx !== 'undefined'){
            groups[pIdx] = groups[pIdx] || [];
            groups[pIdx].push(i);
          }
        }
      }
    });

    // Append qwraps to the content, grouping conditional children with their parent when possible
    const appended = new Set();
    for(let i=0;i<page.questions.length;i++){
      if(appended.has(i)) continue;
      if(groups[i]){
        // If the parent has only one dependent child, append parent and child without the group wrapper
        const childIndices = (groups[i]||[]).slice().sort((a,b)=>a-b);
        if(childIndices.length === 1){
          // single child - only show the group border when both parent and child are visible
          const ci = childIndices[0];
          const parentQ = page.questions[i];
          const childQ = page.questions[ci];
          const parentVisible = Conditional.isVisible(parentQ, window.State.currentState.answers || {});
          const childVisible = Conditional.isVisible(childQ, window.State.currentState.answers || {});
          if(parentVisible && childVisible){
            const groupDiv = document.createElement('div'); groupDiv.className = 'conditional-group';
            groupDiv.appendChild(qwraps[i]); appended.add(i);
            if(!appended.has(ci)){ groupDiv.appendChild(qwraps[ci]); appended.add(ci); }
            contentEl.appendChild(groupDiv);
          } else {
            // append without border
            contentEl.appendChild(qwraps[i]); appended.add(i);
            if(!appended.has(ci)){ contentEl.appendChild(qwraps[ci]); appended.add(ci); }
          }
        } else {
          const groupDiv = document.createElement('div'); groupDiv.className = 'conditional-group';
          // parent
          groupDiv.appendChild(qwraps[i]); appended.add(i);
          // children sorted ascending
          childIndices.forEach(ci=>{ if(!appended.has(ci)){ groupDiv.appendChild(qwraps[ci]); appended.add(ci); } });
          contentEl.appendChild(groupDiv);
        }
      } else {
        // ensure this index is not a child of some earlier group
        let isChild = false;
        for(const pIdx in groups){ if(groups[pIdx].includes(i)){ isChild = true; break; } }
        if(isChild){ continue; }
        contentEl.appendChild(qwraps[i]); appended.add(i);
      }
    }

    // Page messages section (positive messages and recommendations)
    const messagesSection = document.createElement('div');
    messagesSection.className = 'page-messages';
    messagesSection.id = 'pageMessages';
    contentEl.appendChild(messagesSection);

    // nav
    const nav = document.createElement('div'); nav.className='nav-buttons';
    const back = document.createElement('button'); back.className='secondary'; back.textContent='Back';
    const next = document.createElement('button'); next.className='primary'; next.textContent='Next';
    back.disabled = pageIndex === 0;
    back.addEventListener('click', ()=>{
      const prev = Math.max(0, pageIndex-1);
      // update state and save to URL
      window.State.currentState.view = 'quiz';
      window.State.currentState.currentPage = prev;
      window.State.saveStateToUrl(window.State.currentState);
    });
    next.addEventListener('click', ()=>{
      const nextPage = Math.min(quiz.pages.length-1, pageIndex+1);
      if(nextPage === pageIndex){
        // go to results view - set view and save state
        window.State.currentState.view = 'results';
        window.State.saveStateToUrl(window.State.currentState);
      } else {
        window.State.currentState.view = 'quiz';
        window.State.currentState.currentPage = nextPage;
        window.State.saveStateToUrl(window.State.currentState);
      }
    });
    nav.appendChild(back); nav.appendChild(next); contentEl.appendChild(nav);

    // populate inputs from state and attach change handlers
    const stateAnswers = window.State.currentState.answers || {};
    for(const qEl of contentEl.querySelectorAll('.question, .sub-question')){
      const qid = qEl.dataset.qid;
      const question = findQuestionInQuiz(quiz, qid);
      if(!question) continue;
      // fill values
      if(question.type === 'radio'){
        const val = stateAnswers[qid];
        if(val){ const inp = qEl.querySelector(`input[type=radio][value="${val}"]`); if(inp) inp.checked=true; }
      } else if(question.type === 'checkbox'){
        const val = stateAnswers[qid] || [];
        qEl.querySelectorAll('input[type=checkbox]').forEach(ch=>{ ch.checked = val.includes(ch.value); });
      } else {
        const val = stateAnswers[qid];
        const inp = qEl.querySelector('input'); if(inp && typeof val !== 'undefined') inp.value = val;
      }

      // show inline message for pre-filled values (on load)
      const currentVal = (function(){
        if(question.type === 'radio'){
          const sel = qEl.querySelector(`input[type=radio]:checked`); return sel?sel.value:null;
        } else if(question.type === 'checkbox'){
          const arr = []; qEl.querySelectorAll('input[type=checkbox]:checked').forEach(c=>arr.push(c.value)); return arr;
        } else {
          const inp = qEl.querySelector('input'); return inp?inp.value:null;
        }
      })();
      showInlineMessageForQuestion(question, qEl, currentVal);

      // change handler
      qEl.addEventListener('change', (ev)=>{
        handleInputChange(ev, quiz, pageIndex);
        // after handling input change, show inline message for the changed value
        const val = (function(){
          if(question.type === 'radio'){
            const sel = qEl.querySelector(`input[type=radio]:checked`); return sel?sel.value:null;
          } else if(question.type === 'checkbox'){
            const arr = []; qEl.querySelectorAll('input[type=checkbox]:checked').forEach(c=>arr.push(c.value)); return arr;
          } else { const inp = qEl.querySelector('input'); return inp?inp.value:null; }
        })();
        showInlineMessageForQuestion(question, qEl, val);
        // Update page messages
        updatePageMessages(quiz, page);
      });
    }
    
    // Initialize conditional-subquestion-group wrapper visibility on page load
    updateConditionalGroupBorders(quiz);
    // Initialize page messages
    updatePageMessages(quiz, page);
  }
  
  function updatePageMessages(quiz, page){
    const messagesSection = document.getElementById('pageMessages');
    if(!messagesSection) return;
    
    const answers = window.State.currentState.answers || {};
    const messages = { positive: [], recommendation: [] };
    
    // Check each question on the page
    for(const q of page.questions){
      if(q.type === 'group' && q.subQuestions){
        // For groups, check if any sub-question has Yes answer (positive) or No/Unsure (recommendation)
        let hasPositive = false;
        let hasNegative = false;
        
        for(const subQ of q.subQuestions){
          if(!Conditional.isVisible(subQ, answers)) continue;
          const ans = answers[subQ.id];
          if(subQ.type === 'radio'){
            if(ans === 'Yes') hasPositive = true;
            if(ans === 'No' || ans === 'Unsure') hasNegative = true;
          }
        }
        
        if(hasPositive && q.positiveMessage){
          messages.positive.push(q.positiveMessage);
        }
        if(hasNegative && q.recommendation){
          messages.recommendation.push(q.recommendation);
        }
      } else {
        // Regular question
        if(!Conditional.isVisible(q, answers)) continue;
        const ans = answers[q.id];
        
        if(q.type === 'radio'){
          if(ans === 'Yes' && q.positiveMessage){
            messages.positive.push(q.positiveMessage);
          }
          if((ans === 'No' || ans === 'Unsure') && q.recommendation){
            messages.recommendation.push(q.recommendation);
          }
        }
      }
    }
    
    // Generate message keys for comparison
    const newMessageKeys = JSON.stringify(messages);
    const currentMessageKeys = messagesSection.dataset.messageKeys || '';
    
    // Only update DOM if messages have changed
    if(newMessageKeys === currentMessageKeys) return;
    
    messagesSection.dataset.messageKeys = newMessageKeys;
    messagesSection.innerHTML = '';
    
    // Display messages if there are any
    if(messages.positive.length > 0 || messages.recommendation.length > 0){
      const heading = document.createElement('h3');
      heading.textContent = 'Feedback';
      messagesSection.appendChild(heading);
      
      messages.positive.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-item positive';
        const title = document.createElement('div');
        title.className = 'message-title';
        title.textContent = msg.title;
        const body = document.createElement('div');
        body.className = 'message-body';
        body.innerHTML = msg.body; // Allow HTML content
        msgDiv.appendChild(title);
        msgDiv.appendChild(body);
        messagesSection.appendChild(msgDiv);
      });
      
      messages.recommendation.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-item recommendation';
        const title = document.createElement('div');
        title.className = 'message-title';
        title.textContent = msg.title;
        const body = document.createElement('div');
        body.className = 'message-body';
        body.innerHTML = msg.body; // Allow HTML content
        msgDiv.appendChild(title);
        msgDiv.appendChild(body);
        messagesSection.appendChild(msgDiv);
      });
    }
  }

  function findQuestionInQuiz(quiz, qid){
    for(const page of quiz.pages){
      for(const q of page.questions){
        if(q.id === qid) return q;
        // Check in subQuestions for grouped questions
        if(q.type === 'group' && q.subQuestions){
          for(const subQ of q.subQuestions){
            if(subQ.id === qid) return subQ;
          }
        }
      }
    }
    return null;
  }

  function handleInputChange(ev, quiz, pageIndex){
    const target = ev.target;
    const questionEl = target.closest('.question, .sub-question');
    if(!questionEl) return;
    const qid = questionEl.dataset.qid;
    const question = findQuestionInQuiz(quiz, qid);
    if(!question) return;

    // collect value
    let value;
    if(question.type === 'radio'){
      const sel = questionEl.querySelector(`input[type=radio]:checked`);
      value = sel ? sel.value : null;
    } else if(question.type === 'checkbox'){
      const arr = [];
      questionEl.querySelectorAll('input[type=checkbox]:checked').forEach(ch=>arr.push(ch.value));
      value = arr;
    } else {
      const inp = questionEl.querySelector('input'); value = inp ? inp.value : null;
      if(question.type === 'number' && value!=='') value = Number(value);
    }

    // save to state
    if(!window.State.currentState.answers) window.State.currentState.answers = {};
    window.State.currentState.answers[qid] = value;
    window.State.currentState.currentPage = pageIndex;
    // inline messageOnSelect
    if(question.messageOnSelect){
      const msgDiv = questionEl.querySelector('.inline-message');
      let shown = false;
      if(typeof value === 'string' && question.messageOnSelect[value]){
        msgDiv.textContent = question.messageOnSelect[value]; msgDiv.style.display='block'; shown=true;
      } else if(Array.isArray(value)){
        // show first matching
        for(const v of value) if(question.messageOnSelect[v]){ msgDiv.textContent = question.messageOnSelect[v]; msgDiv.style.display='block'; shown=true; break; }
      }
      if(!shown) msgDiv.style.display='none';
    }

    // Re-evaluate conditionals for this page: show/hide other questions
    for(const other of document.querySelectorAll('.question, .sub-question')){
      const otherId = other.dataset.qid;
      const q = findQuestionInQuiz(quiz, otherId);
      if(!q) continue;
      const visible = Conditional.isVisible(q, window.State.currentState.answers || {});
      other.style.display = visible ? '' : 'none';
      if(!visible){ delete window.State.currentState.answers[otherId]; }
    }
    
    // Update conditional-subquestion-group wrapper visibility
    updateConditionalGroupBorders(quiz);

    // auto-save state to URL
    window.State.saveStateToUrl(window.State.currentState);
  }
  
  function updateConditionalGroupBorders(quiz){
    const wrappers = document.querySelectorAll('.conditional-subquestion-group');
    wrappers.forEach(wrapper => {
      const subQuestions = wrapper.querySelectorAll('.sub-question');
      let hasVisibleConditional = false;
      subQuestions.forEach(sq => {
        const sqId = sq.dataset.qid;
        const sqQuestion = findQuestionInQuiz(quiz, sqId);
        if(sqQuestion && sqQuestion.conditional && sqQuestion.conditional.showWhen){
          // Check if the element is actually visible (not display:none)
          if(sq.style.display !== 'none'){
            hasVisibleConditional = true;
          }
        }
      });
      
      // Only update class if it needs to change
      const hasClass = wrapper.classList.contains('has-visible-conditional');
      if(hasVisibleConditional && !hasClass){
        wrapper.classList.add('has-visible-conditional');
      } else if(!hasVisibleConditional && hasClass){
        wrapper.classList.remove('has-visible-conditional');
      }
    });
  }

  async function renderResults(contentEl, quizId){
    document.getElementById('pageTitle').textContent = 'Results';
    contentEl.innerHTML = '';
    const quiz = await fetch(`../assets/data/quizzes/${quizId}.json`).then(r=>r.json());
    const answers = window.State.currentState.answers || {};
    
    // Calculate overall and per-page scores
    let totalScore = 0;
    let totalPossible = 0;
    const pageScores = [];
    
    for(const page of quiz.pages){
      let pageScore = 0;
      let pagePossible = 0;
      
      for(const q of page.questions){
        if(q.type === 'group' && q.subQuestions){
          for(const subQ of q.subQuestions){
            // Only count if question is visible (respects conditionals)
            if(!Conditional.isVisible(subQ, answers)) continue;
            
            // Add to possible score
            if(subQ.type === 'radio' && subQ.options){
              const maxScore = Math.max(...subQ.options.map(opt => {
                if(typeof opt === 'object' && typeof opt.score !== 'undefined') return Number(opt.score);
                return 1;
              }));
              pagePossible += maxScore;
            }
            
            // Calculate actual score
            let qScore = 0;
            if(subQ.type === 'radio'){
              const val = answers[subQ.id];
              if(typeof val !== 'undefined' && val !== null){
                const opt = (subQ.options || []).find(o=>{
                  if(typeof o === 'object') return (o.value || o.label) == val || o.label == val;
                  return o == val;
                });
                if(opt){
                  if(typeof opt === 'object' && typeof opt.score !== 'undefined') qScore = Number(opt.score);
                  else qScore = (String(val).toLowerCase() === 'yes') ? 1 : 0;
                }
              }
            }
            pageScore += qScore;
          }
        } else {
          // Regular question
          if(!Conditional.isVisible(q, answers)) continue;
          
          // Add to possible score
          if(q.type === 'radio' && q.options){
            const maxScore = Math.max(...q.options.map(opt => {
              if(typeof opt === 'object' && typeof opt.score !== 'undefined') return Number(opt.score);
              return 1;
            }));
            pagePossible += maxScore;
          } else if(q.type === 'checkbox' && typeof q.minScore !== 'undefined'){
            pagePossible += Number(q.minScore);
          }
          
          // Calculate actual score
          let qScore = 0;
          if(q.type === 'radio'){
            const val = answers[q.id];
            if(typeof val !== 'undefined' && val !== null){
              const opt = (q.options || []).find(o=>{
                if(typeof o === 'object') return (o.value || o.label) == val || o.label == val;
                return o == val;
              });
              if(opt){
                if(typeof opt === 'object' && typeof opt.score !== 'undefined') qScore = Number(opt.score);
                else qScore = (String(val).toLowerCase() === 'yes') ? 1 : 0;
              }
            }
          } else if(q.type === 'checkbox'){
            const val = answers[q.id] || [];
            const count = Array.isArray(val) ? val.length : 0;
            if(typeof q.minScore !== 'undefined' && q.minScore){
              if(count >= Number(q.minScore)) qScore = Number(q.minScore);
            }
          }
          pageScore += qScore;
        }
      }
      
      totalScore += pageScore;
      totalPossible += pagePossible;
      pageScores.push({
        title: page.title,
        score: pageScore,
        possible: pagePossible,
        percentage: pagePossible > 0 ? Math.round((pageScore / pagePossible) * 100) : 0
      });
    }
    
    // Overall Health Score Card
    const overallCard = document.createElement('div');
    overallCard.className = 'card';
    const overallTitle = document.createElement('h3');
    overallTitle.textContent = 'Overall Health';
    overallCard.appendChild(overallTitle);
    
    const healthScoreLabel = document.createElement('div');
    healthScoreLabel.textContent = 'Health Score';
    healthScoreLabel.style.fontSize = '14px';
    healthScoreLabel.style.color = '#666';
    healthScoreLabel.style.marginTop = '12px';
    overallCard.appendChild(healthScoreLabel);
    
    const scoreCircle = document.createElement('div');
    scoreCircle.style.width = '120px';
    scoreCircle.style.height = '120px';
    scoreCircle.style.borderRadius = '50%';
    scoreCircle.style.border = '8px solid #0078d4';
    scoreCircle.style.display = 'flex';
    scoreCircle.style.flexDirection = 'column';
    scoreCircle.style.alignItems = 'center';
    scoreCircle.style.justifyContent = 'center';
    scoreCircle.style.margin = '16px 0';
    const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const percentText = document.createElement('div');
    percentText.textContent = overallPercentage + '%';
    percentText.style.fontSize = '32px';
    percentText.style.fontWeight = '700';
    const strengthText = document.createElement('div');
    strengthText.textContent = 'Strengths';
    strengthText.style.fontSize = '12px';
    strengthText.style.color = '#666';
    scoreCircle.appendChild(percentText);
    scoreCircle.appendChild(strengthText);
    overallCard.appendChild(scoreCircle);
    
    // Page scores
    pageScores.forEach(ps => {
      const scoreSection = document.createElement('div');
      scoreSection.style.marginTop = '16px';
      
      const scoreTitle = document.createElement('div');
      scoreTitle.textContent = ps.title + ' Score';
      scoreTitle.style.fontSize = '14px';
      scoreTitle.style.marginBottom = '4px';
      scoreSection.appendChild(scoreTitle);
      
      const scoreValue = document.createElement('div');
      scoreValue.textContent = `${ps.score}/${ps.possible}`;
      scoreValue.style.fontSize = '12px';
      scoreValue.style.color = '#666';
      scoreValue.style.marginBottom = '6px';
      scoreSection.appendChild(scoreValue);
      
      const progressBar = document.createElement('div');
      progressBar.className = 'progress';
      progressBar.style.height = '8px';
      const progressFill = document.createElement('i');
      progressFill.style.width = ps.percentage + '%';
      progressBar.appendChild(progressFill);
      scoreSection.appendChild(progressBar);
      
      overallCard.appendChild(scoreSection);
    });
    
    contentEl.appendChild(overallCard);
    
    // Recommendations section grouped by page
    const recommendationsCard = document.createElement('div');
    recommendationsCard.className = 'card';
    recommendationsCard.style.marginTop = '16px';
    const recTitle = document.createElement('h3');
    recTitle.textContent = 'Recommendations';
    recommendationsCard.appendChild(recTitle);
    
    let hasRecommendations = false;
    
    for(const page of quiz.pages){
      const pageRecs = { positive: [], recommendation: [] };
      
      for(const q of page.questions){
        if(q.type === 'group' && q.subQuestions){
          let hasPositive = false;
          let hasNegative = false;
          
          for(const subQ of q.subQuestions){
            if(!Conditional.isVisible(subQ, answers)) continue;
            const ans = answers[subQ.id];
            if(subQ.type === 'radio'){
              if(ans === 'Yes') hasPositive = true;
              if(ans === 'No' || ans === 'Unsure') hasNegative = true;
            }
          }
          
          if(hasPositive && q.positiveMessage){
            pageRecs.positive.push(q.positiveMessage);
          }
          if(hasNegative && q.recommendation){
            pageRecs.recommendation.push(q.recommendation);
          }
        } else {
          if(!Conditional.isVisible(q, answers)) continue;
          const ans = answers[q.id];
          
          if(q.type === 'radio'){
            if(ans === 'Yes' && q.positiveMessage){
              pageRecs.positive.push(q.positiveMessage);
            }
            if((ans === 'No' || ans === 'Unsure') && q.recommendation){
              pageRecs.recommendation.push(q.recommendation);
            }
          }
        }
      }
      
      // Display this page's recommendations if any
      if(pageRecs.recommendation.length > 0){
        hasRecommendations = true;
        const pageSection = document.createElement('div');
        pageSection.style.marginBottom = '16px';
        
        const pageHeading = document.createElement('h4');
        pageHeading.textContent = page.title;
        pageHeading.style.marginBottom = '8px';
        pageHeading.style.fontSize = '15px';
        pageSection.appendChild(pageHeading);
        
        pageRecs.recommendation.forEach(msg => {
          const msgDiv = document.createElement('div');
          msgDiv.className = 'message-item recommendation';
          msgDiv.style.marginBottom = '8px';
          const title = document.createElement('div');
          title.className = 'message-title';
          title.textContent = msg.title;
          const body = document.createElement('div');
          body.className = 'message-body';
          body.innerHTML = msg.body; // Allow HTML content
          msgDiv.appendChild(title);
          msgDiv.appendChild(body);
          pageSection.appendChild(msgDiv);
        });
        
        recommendationsCard.appendChild(pageSection);
      }
    }
    
    if(hasRecommendations){
      contentEl.appendChild(recommendationsCard);
    }
    
    // Results actions: Download PDF, Copy Link, Print
    const actionsWrap = document.createElement('div'); actionsWrap.style.marginTop='12px'; actionsWrap.style.display='flex'; actionsWrap.style.gap='8px';
    const pdfBtn = document.createElement('button'); pdfBtn.className='primary'; pdfBtn.textContent='Download report';
    const copyBtn = document.createElement('button'); copyBtn.className='secondary'; copyBtn.textContent='Copy link to this report';
    const printBtn = document.createElement('button'); printBtn.className='secondary'; printBtn.textContent='Print results';

    // PDF generation using html2pdf
    pdfBtn.addEventListener('click', ()=>{
      if(!window.html2pdf){ alert('html2pdf not loaded'); return; }
      
      // Clone the content element
      const contentEl = document.getElementById('content');
      const clone = contentEl.cloneNode(true);
      
      // Remove the action buttons from the clone
      const actionsWrap = clone.querySelector('div[style*="marginTop"]');
      if(actionsWrap && actionsWrap.querySelector('button')){
        actionsWrap.remove();
      }
      
      // Configure PDF options
      const opt = {
        margin: 10,
        filename: `${quiz.title || 'report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate PDF
      html2pdf().set(opt).from(clone).save();
    });

    copyBtn.addEventListener('click', async ()=>{
      try{
        const encoded = window.State.encodeState(window.State.currentState);
        const link = window.location.origin + window.location.pathname + `#?state=${encoded}`;
        if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(link); alert('Link copied to clipboard'); }
        else {
          const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('Link copied to clipboard');
        }
      }catch(e){ alert('Copy failed: '+e.message); }
    });

    printBtn.addEventListener('click', ()=>{
      // Clone content and remove action buttons
      const contentEl = document.getElementById('content');
      const clone = contentEl.cloneNode(true);
      
      // Remove the action buttons from the clone
      const actionsWrap = clone.querySelector('div[style*="marginTop"]');
      if(actionsWrap && actionsWrap.querySelector('button')){
        actionsWrap.remove();
      }
      
      // Open a new window with the content for printing
      const newWin = window.open('', '_blank');
      if(!newWin) { alert('Unable to open print window'); return; }
      const styles = Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(l=>`<link rel="stylesheet" href="${l.href}">`).join('\n');
      const html = `<!doctype html><html><head><meta charset="utf-8">${styles}<title>Print - ${quiz.title}</title></head><body>${clone.innerHTML}</body></html>`;
      newWin.document.open(); newWin.document.write(html); newWin.document.close();
      newWin.focus();
      // give it a little time to render styles
      setTimeout(()=>{ newWin.print(); /* newWin.close(); */ }, 500);
    });

    actionsWrap.appendChild(pdfBtn); actionsWrap.appendChild(copyBtn); actionsWrap.appendChild(printBtn);
    contentEl.appendChild(actionsWrap);
    // Prev / Next quiz navigation
    try{
      const nav = await fetch('../assets/data/mainNavigation.json').then(r=>r.json());
      const ids = nav.quizzes.map(q=>q.id);
      const idx = ids.indexOf(quizId);
      const navWrap = document.createElement('div'); navWrap.style.marginTop='12px'; navWrap.style.display='flex'; navWrap.style.justifyContent='space-between';
      const prevBtn = document.createElement('button'); prevBtn.className='secondary'; prevBtn.textContent='Previous Quiz';
      const nextBtn = document.createElement('button'); nextBtn.className='secondary'; nextBtn.textContent='Next Quiz';
      prevBtn.disabled = idx <= 0; nextBtn.disabled = idx === -1 || idx >= ids.length-1;
      prevBtn.addEventListener('click', ()=>{
        if(idx>0){ const prevId = ids[idx-1]; window.State.currentState.view = 'quiz'; window.State.currentState.quizId = prevId; window.State.currentState.currentPage = 0; window.State.saveStateToUrl(window.State.currentState); }
      });
      nextBtn.addEventListener('click', ()=>{
        if(idx < ids.length-1){ const nextId = ids[idx+1]; window.State.currentState.view = 'quiz'; window.State.currentState.quizId = nextId; window.State.currentState.currentPage = 0; window.State.saveStateToUrl(window.State.currentState); }
      });
      navWrap.appendChild(prevBtn); navWrap.appendChild(nextBtn); contentEl.appendChild(navWrap);
    }catch(e){ /* ignore */ }
  }

  global.UI = {
    renderStart, renderChooseTopic, renderQuizPage, renderResults
  };
})(window);
