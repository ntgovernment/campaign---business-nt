/* router.js
   Simple hash-based router.
   Routes:
     #/start
     #/choose-topic
     #/quiz/{quizId}/page/{pageIndex}
     #/results/{quizId}
   Also supports query ?state=... inside the hash.
*/
(function (global) {
  // Helper function to get quiz URL from data attribute
  function getQuizUrl(quizId) {
    const appEl = document.getElementById('app');
    if (!appEl) {
      return `../assets/data/quizzes/${quizId}.json`;
    }
    
    // Check if it's business health quiz
    const isBusinessHealth = appEl.dataset.quiz === 'business-health-checklist';
    
    if (isBusinessHealth) {
      // Safety quizzes
      if (appEl.dataset[quizId]) {
        return appEl.dataset[quizId];
      }
      // Business health quizzes are in business-health-checklist-quiz/quizzes/
      return `../assets/business-health-checklist-quiz/quizzes/${quizId}.json`;
    } else {
      // Safety quizzes
      if (appEl.dataset[quizId]) {
        return appEl.dataset[quizId];
      }
      return `../assets/data/quizzes/${quizId}.json`;
    }
  }
  
  function parseHash() {
    const raw = window.location.hash || '#/start';
    const [path, q] = raw.split('?');
    const parts = path.replace(/^#\//, '').split('/').filter(Boolean);
    return { raw, path, q, parts };
  }

  async function route() {
    const content = document.getElementById('quizContent');

    // ensure UI is defined
    if (typeof window.UI === 'undefined') {
      setTimeout(route, 50);
      return;
    }

    // load nav JSON for some pages
    const appEl = document.getElementById('app');
    const navUrl = appEl ? appEl.dataset.quizMainNavigation : '../assets/data/mainNavigation.json';
    const navJson = await window.JSONCache.get(navUrl);
    const uiMessagesUrl = appEl ? appEl.dataset.uiMessages : '../assets/data/uiMessages.json';
    const uiMessages = await window.JSONCache.get(uiMessagesUrl);

    // get current view from state
    const view = (window.State && window.State.currentState && window.State.currentState.view) || 'start';

    if (view === 'start') {
      // Always reset to fresh state on Get Started page
      window.State.currentState = { view: 'start', quizId: null, currentPage: 0, answers: {} };
      window.UI.renderStart(content, uiMessages);
    } else if (view === 'choose-topic') {
      window.UI.renderChooseTopic(content, navJson);
    } else if (view === 'quiz') {
      const quizId = (window.State && window.State.currentState && window.State.currentState.quizId) || null;
      const pageIndex = (window.State && window.State.currentState && window.State.currentState.currentPage) || 0;
      if (!quizId) {
        // If no quizId in state, go back to choose-topic
        window.State.currentState.view = 'choose-topic';
        window.State.saveStateToUrl(window.State.currentState);
      } else {
        await window.UI.renderQuizPage(content, quizId, pageIndex);
      }
    } else if (view === 'results') {
      const quizId = (window.State && window.State.currentState && window.State.currentState.quizId) || null;
      if (!quizId) {
        window.State.currentState.view = 'choose-topic';
        window.State.saveStateToUrl(window.State.currentState);
      } else {
        await window.UI.renderResults(content, quizId);
      }
    } else {
      // default
      window.State.currentState.view = 'start';
      window.UI.renderStart(content, uiMessages);
    }
    // update sidebar progress labels
    updateSidebarProgress();
  }

  async function updateSidebarProgress() {
    const appEl = document.getElementById('app');
    const navUrl = appEl ? appEl.dataset.quizMainNavigation : '../assets/data/mainNavigation.json';
    const nav = await window.JSONCache.get(navUrl);
    const ul = document.getElementById('quizList');
    ul.innerHTML = '';
    // top links
    const sideLinks = document.getElementById('sideLinks');
    sideLinks.innerHTML = '';
    const btnStart = document.createElement('button');
    btnStart.textContent = 'Get Started';
    const btnChoose = document.createElement('button');
    btnChoose.textContent = 'Choose a Topic';

    // Get current view state
    const currentView = (window.State && window.State.currentState && window.State.currentState.view) || 'start';

    // Add active class based on current view
    if (currentView === 'start') btnStart.classList.add('active');
    if (currentView === 'choose-topic') btnChoose.classList.add('active');

    btnStart.addEventListener('click', () => {
      window.State.currentState.view = 'start';
      window.State.saveStateToUrl(window.State.currentState);
    });
    btnChoose.addEventListener('click', () => {
      window.State.currentState.view = 'choose-topic';
      window.State.saveStateToUrl(window.State.currentState);
    });
    sideLinks.appendChild(btnStart);
    sideLinks.appendChild(btnChoose);

    // check if a quiz is active
    const activeQuizId = (window.State && window.State.currentState && window.State.currentState.quizId) || null;

    for (const q of nav.quizzes) {
      const li = document.createElement('li');
      const meta = document.createElement('div');
      meta.className = 'quizMeta';
      const titleLink = document.createElement('a');
      titleLink.className = 'quizTitle';
      titleLink.textContent = q.title;
      titleLink.href = '#';
      titleLink.addEventListener('click', (e) => {
        e.preventDefault();
        // set quiz in state and save to URL
        if (window.State) {
          window.State.currentState.view = 'quiz';
          window.State.currentState.quizId = q.id;
          window.State.currentState.currentPage = 0;
          if (!window.State.currentState.answers) window.State.currentState.answers = {};
          window.State.saveStateToUrl(window.State.currentState);
        }
      });
      const prog = document.createElement('div');
      prog.className = 'quizProgress';
      prog.textContent = '0%';
      meta.appendChild(titleLink);
      li.appendChild(meta);
      li.appendChild(prog);

      // Add active class if this quiz is currently active
      if (activeQuizId === q.id) {
        li.classList.add('active');
      }
      // compute progress async and update
      (async () => {
        const p = (await window.UI) && window.UI.renderChooseTopic ? 0 : 0; /* placeholder */
        const percent = await (async () => {
          try {
            const quiz = await window.JSONCache.get(getQuizUrl(q.id));
            const answers = (window.State && window.State.currentState && window.State.currentState.answers) || {};;
            let total = 0;
            let answered = 0;
            for (const page of quiz.pages) {
              for (const question of page.questions) {
                if (question.type === 'group' && question.subQuestions) {
                  for (const subQ of question.subQuestions) {
                    if (!window.Conditional.isVisible(subQ, answers, quiz)) continue;
                    total++;
                    const ans = answers[subQ.id];
                    if (typeof ans !== 'undefined' && ans !== null && ans !== '') {
                      if (Array.isArray(ans)) {
                        if (ans.length > 0) answered++;
                      } else {
                        answered++;
                      }
                    }
                  }
                } else {
                  if (!window.Conditional.isVisible(question, answers, quiz)) continue;
                  total++;
                  const ans = answers[question.id];
                  if (typeof ans !== 'undefined' && ans !== null && ans !== '') {
                    if (Array.isArray(ans)) {
                      if (ans.length > 0) answered++;
                    } else {
                      answered++;
                    }
                  }
                }
              }
            }
            return total ? Math.round((answered / total) * 100) : 0;
          } catch (e) {
            return 0;
          }
        })();
        const isComplete = percent === 100;
        prog.innerHTML = percent + '% ' + (isComplete ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-regular fa-circle"></i>');
      })();
      ul.appendChild(li);

      // if this quiz is active, render its pages nested under the quiz item
      if (activeQuizId === q.id) {
        try {
          const quiz = await window.JSONCache.get(getQuizUrl(q.id));
          const pagesList = document.createElement('ol');
          pagesList.className = 'quiz-pages-list';
          const answers = (window.State.currentState && window.State.currentState.answers) || {};
          const currentPage = (window.State.currentState && window.State.currentState.currentPage) || 0;
          quiz.pages.forEach((p, idx) => {
            const li2 = document.createElement('li');
            li2.className = 'page-item';
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = p.title || `Page ${idx + 1}`;
            pageLink.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.State.currentState.view = 'quiz';
              window.State.currentState.currentPage = idx;
              window.State.saveStateToUrl(window.State.currentState);
            });
            li2.appendChild(pageLink);
            // Only add active class if we're in quiz view and this is the current page
            if (currentView === 'quiz' && idx === currentPage) li2.classList.add('active');
            // compute per-page completion
            let pageComplete = true;
            let pageHasAnswers = false;
            for (const qst of p.questions) {
              if (qst.type === 'group' && qst.subQuestions) {
                for (const subQ of qst.subQuestions) {
                  if (!window.Conditional.isVisible(subQ, answers, quiz)) continue;
                  const ans = answers[subQ.id];
                  if (typeof ans !== 'undefined' && ans !== null && ans !== '') {
                    if (Array.isArray(ans) && ans.length > 0) {
                      pageHasAnswers = true;
                    } else if (!Array.isArray(ans)) {
                      pageHasAnswers = true;
                    }
                  } else {
                    pageComplete = false;
                  }
                }
              } else {
                if (!window.Conditional.isVisible(qst, answers, quiz)) continue; // skip hidden questions
                const ans = answers[qst.id];
                if (typeof ans !== 'undefined' && ans !== null && ans !== '') {
                  if (Array.isArray(ans) && ans.length > 0) {
                    pageHasAnswers = true;
                  } else if (!Array.isArray(ans)) {
                    pageHasAnswers = true;
                  }
                } else {
                  pageComplete = false;
                }
              }
            }
            if (pageComplete && pageHasAnswers) {
              li2.classList.add('completed');
            } else if (pageHasAnswers) {
              li2.classList.add('in-progress');
            }
            pagesList.appendChild(li2);
          });
          // Add "Your results" link
          const liResults = document.createElement('li');
          liResults.className = 'page-item results-item';
          const resultsLink = document.createElement('a');
          resultsLink.href = '#';
          resultsLink.textContent = 'Your results';
          resultsLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.State.currentState.view = 'results';
            window.State.saveStateToUrl(window.State.currentState);
          });
          liResults.appendChild(resultsLink);
          if (currentView === 'results') liResults.classList.add('active');
          pagesList.appendChild(liResults);
          ul.appendChild(pagesList);
        } catch (e) {
          /* ignore */
        }
      }
    }
  }

  window.addEventListener('hashchange', route);
  global.Router = { route };
})(window);
