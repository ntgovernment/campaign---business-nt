/* ui.js
   Renders Start, Choose Topic, Quiz pages and Results pages.
   Uses data JSON files under /data.
*/
(function (global) {
    async function fetchJSON(path) {
        return window.JSONCache.get(path);
    }

    // Helper function to get quiz URL from data attribute
    function getQuizUrl(quizId) {
        const appEl = document.getElementById('app');
        if (appEl && appEl.dataset[quizId]) {
            return appEl.dataset[quizId];
        }
        // Fallback to default path
        return `../assets/data/quizzes/${quizId}.json`;
    }

    async function renderStart(contentEl, uiMessages) {
        document.getElementById('pageTitle').textContent = uiMessages.introTitle || 'Get Started';
        contentEl.innerHTML = '';
        const wrapper = document.createElement('div');
        // const h = document.createElement('h2'); h.textContent = uiMessages.introTitle || 'Welcome';
        const p = document.createElement('div');
        p.innerHTML = uiMessages.introText || 'Start the quizzes to assess your business safety.'; // Allow HTML content
        const nav = document.createElement('div');
        nav.className = 'nav-buttons';
        const btn = document.createElement('button');
        btn.className = 'primary';
        btn.textContent = 'Choose a topic';
        btn.addEventListener('click', () => {
            window.State.currentState.view = 'choose-topic';
            window.State.saveStateToUrl(window.State.currentState);
            // Scroll to quiz body
            const quizBody = document.querySelector('.ntg-quiz-body');
            if (quizBody) {
                quizBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        nav.appendChild(btn);
        wrapper.appendChild(p);
        wrapper.appendChild(nav);
        contentEl.appendChild(wrapper);
    }

    async function renderChooseTopic(contentEl, navJson) {
        document.getElementById('pageTitle').textContent = 'Choose a Topic';
        contentEl.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'cards';
        for (const q of navJson.quizzes) {
            const card = document.createElement('div');
            card.className = 'card quiz-card';

            // Left side - Image
            const imageWrap = document.createElement('div');
            imageWrap.className = 'card-image';
            const img = document.createElement('img');
            img.src = q.icon || '../assets/images/quiz-placeholder.jpg';
            img.alt = q.title;
            imageWrap.appendChild(img);

            // Middle - Content
            const content = document.createElement('div');
            content.className = 'card-content';
            const title = document.createElement('h3');
            title.textContent = q.title;
            const desc = document.createElement('p');
            desc.textContent = q.description;
            const startBtn = document.createElement('a');
            startBtn.className = 'card-link';
            startBtn.textContent = 'Take the Questionnaire';
            startBtn.innerHTML = 'Take the Questionnaire <i class="fa-solid fa-chevron-right"></i>';
            startBtn.href = '#';
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Set quiz id and start at page 0 in state, then save to URL
                if (window.State) {
                    window.State.currentState.view = 'quiz';
                    window.State.currentState.quizId = q.id;
                    window.State.currentState.currentPage = 0;
                    if (!window.State.currentState.answers) window.State.currentState.answers = {};
                    window.State.saveStateToUrl(window.State.currentState);
                }
            });
            content.appendChild(title);
            content.appendChild(desc);
            content.appendChild(startBtn);

            // Right side - Circular progress
            const progressWrap = document.createElement('div');
            progressWrap.className = 'card-progress';
            const percent = await computeProgress(q.id);
            const circleProgress = document.createElement('div');
            circleProgress.className = 'circle-progress';
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100');
            svg.setAttribute('height', '100');
            svg.setAttribute('viewBox', '0 0 100 100');

            const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circleBg.setAttribute('cx', '50');
            circleBg.setAttribute('cy', '50');
            circleBg.setAttribute('r', '45');
            circleBg.setAttribute('fill', 'none');
            circleBg.setAttribute('stroke', '#e0e0e0');
            circleBg.setAttribute('stroke-width', '8');

            const circleFill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circleFill.setAttribute('cx', '50');
            circleFill.setAttribute('cy', '50');
            circleFill.setAttribute('r', '45');
            circleFill.setAttribute('fill', 'none');
            circleFill.setAttribute('stroke', '#0093b8');
            circleFill.setAttribute('stroke-width', '8');
            circleFill.setAttribute('stroke-dasharray', '283');
            circleFill.setAttribute('stroke-dashoffset', String(283 - (283 * percent) / 100));
            circleFill.setAttribute('transform', 'rotate(-90 50 50)');

            svg.appendChild(circleBg);
            svg.appendChild(circleFill);

            const percentLabel = document.createElement('div');
            percentLabel.className = 'percent-label';
            percentLabel.innerHTML = `<strong>${percent}%</strong><br><span>Complete</span>`;

            circleProgress.appendChild(svg);
            circleProgress.appendChild(percentLabel);
            progressWrap.appendChild(circleProgress);

            card.appendChild(imageWrap);
            card.appendChild(content);
            card.appendChild(progressWrap);
            grid.appendChild(card);
        }
        contentEl.appendChild(grid);
    }

    async function computeProgress(quizId) {
        try {
            const quiz = await fetchJSON(getQuizUrl(quizId));
            const answers = (window.State && window.State.currentState && window.State.currentState.answers) || {};
            // count only visible questions (respect conditionals)
            let total = 0;
            let answered = 0;
            for (const page of quiz.pages) {
                for (const question of page.questions) {
                    if (question.type === 'group' && question.subQuestions) {
                        // Count sub-questions in a group
                        for (const subQ of question.subQuestions) {
                            if (!Conditional.isVisible(subQ, answers)) continue;
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
                        // Regular question
                        if (!Conditional.isVisible(question, answers)) continue;
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
    }

    function isPageCompleted(page, answers) {
        // check if all visible questions in a page are answered
        for (const q of page.questions) {
            if (q.type === 'group' && q.subQuestions) {
                // Check all sub-questions in the group
                for (const subQ of q.subQuestions) {
                    if (!Conditional.isVisible(subQ, answers)) continue;
                    const ans = answers[subQ.id];
                    if (typeof ans === 'undefined' || ans === null || ans === '') return false;
                    if (Array.isArray(ans) && ans.length === 0) return false;
                }
            } else {
                if (!Conditional.isVisible(q, answers)) continue; // skip conditionally hidden
                const ans = answers[q.id];
                if (typeof ans === 'undefined' || ans === null || ans === '') return false;
                if (Array.isArray(ans) && ans.length === 0) return false;
            }
        }
        return (
            page.questions.length > 0 &&
            page.questions.some((q) => {
                if (q.type === 'group' && q.subQuestions) return q.subQuestions.some((subQ) => Conditional.isVisible(subQ, answers));
                return Conditional.isVisible(q, answers);
            })
        );
    }

    // Helper: render inline message for a question based on selected value
    function showInlineMessageForQuestion(question, questionEl, value) {
        if (!questionEl) return;
        const msgDiv = questionEl.querySelector('.inline-message');
        if (!msgDiv) return;
        msgDiv.style.display = 'none';
        msgDiv.innerHTML = '';
        if (!question.messageOnSelect) return;

        // messageOnSelect can be a mapping from value -> string|object, or a default string
        let payload = null;
        if (typeof question.messageOnSelect === 'string') {
            payload = question.messageOnSelect;
        } else if (value && question.messageOnSelect[value]) {
            payload = question.messageOnSelect[value];
        } else if (question.messageOnSelect['*']) {
            // wildcard
            payload = question.messageOnSelect['*'];
        }

        if (!payload) return;

        // payload may be string (HTML) or object { title, body, html, class }
        if (typeof payload === 'string') {
            msgDiv.innerHTML = payload;
            msgDiv.classList.remove('info-box');
            msgDiv.style.display = 'block';
            return;
        }
        // object
        const cls = payload.class || 'info-box';
        msgDiv.className = 'inline-message ' + cls;
        if (payload.html) msgDiv.innerHTML = payload.html;
        else {
            let out = '';
            if (payload.title) out += `<strong>${payload.title}</strong>`;
            if (payload.body) out += `<div>${payload.body}</div>`;
            msgDiv.innerHTML = out;
        }
        msgDiv.style.display = 'block';
    }

    async function renderQuizPage(contentEl, quizId, pageIndex) {
        document.getElementById('pageTitle').textContent = 'Quiz';
        contentEl.innerHTML = '';
        const quiz = await fetchJSON(getQuizUrl(quizId));
        if (!quiz) {
            contentEl.textContent = 'Quiz not found.';
            return;
        }
        // set currentState quizId
        if (window.State) window.State.currentState.quizId = quizId;

        // Stepper (page steps) - show all pages with completion status
        const stepper = document.createElement('div');
        stepper.className = 'stepper';
        const answers = window.State.currentState.answers || {};
        quiz.pages.forEach((p, idx) => {
            const s = document.createElement('a');
            s.href = '#';
            s.className = 'step';
            s.textContent = p.title || `Page ${idx + 1}`;
            const pageComplete = isPageCompleted(p, answers);
            // detect if any visible question on this page has an answer
            let pageHasAnswers = false;
            for (const q of p.questions) {
                if (q.type === 'group' && q.subQuestions) {
                    // Check sub-questions in the group
                    for (const subQ of q.subQuestions) {
                        if (!Conditional.isVisible(subQ, answers)) continue;
                        const a = answers[subQ.id];
                        if (typeof a !== 'undefined' && a !== null && a !== '') {
                            if (Array.isArray(a) && a.length > 0) {
                                pageHasAnswers = true;
                                break;
                            } else if (!Array.isArray(a)) {
                                pageHasAnswers = true;
                                break;
                            }
                        }
                    }
                    if (pageHasAnswers) break;
                } else {
                    if (!Conditional.isVisible(q, answers)) continue;
                    const a = answers[q.id];
                    if (typeof a !== 'undefined' && a !== null && a !== '') {
                        if (Array.isArray(a) && a.length > 0) {
                            pageHasAnswers = true;
                            break;
                        } else if (!Array.isArray(a)) {
                            pageHasAnswers = true;
                            break;
                        }
                    }
                }
            }
            if (pageComplete) {
                s.classList.add('completed');
            } else if (pageHasAnswers) {
                s.classList.add('in-progress');
            }
            if (idx === pageIndex) {
                s.classList.add('active');
            } else if (idx < pageIndex) {
                s.classList.add('completed');
            }
            s.addEventListener('click', (e) => {
                e.preventDefault();
                window.State.currentState.view = 'quiz';
                window.State.currentState.currentPage = idx;
                window.State.saveStateToUrl(window.State.currentState);
            });
            stepper.appendChild(s);
        });

        // Add "Your results" step
        const resultsStep = document.createElement('a');
        resultsStep.href = '#';
        resultsStep.className = 'step';
        resultsStep.textContent = 'Your results';
        resultsStep.addEventListener('click', (e) => {
            e.preventDefault();
            window.State.currentState.view = 'results';
            window.State.saveStateToUrl(window.State.currentState);
        });
        stepper.appendChild(resultsStep);

        contentEl.appendChild(stepper);

        // Dispatch event to update progress bar
        window.dispatchEvent(new CustomEvent('stepperUpdated'));

        const page = quiz.pages[pageIndex];
        const pageTitle = document.createElement('div');
        pageTitle.className = 'page-title';
        pageTitle.textContent = page.title;
        contentEl.appendChild(pageTitle);

        // Helper function to create a single question element
        function createQuestionElement(question, isSubQuestion = false) {
            const qwrap = document.createElement('div');
            qwrap.className = isSubQuestion ? 'sub-question' : 'question';
            qwrap.dataset.qid = question.id;

            // Create label wrapper with info icon if helpText exists
            if (question.helpText) {
                const labelWrapper = document.createElement('div');
                labelWrapper.className = 'question-label-wrapper';
                const label = document.createElement('label');
                label.textContent = question.label || question.id;
                const helpIcon = document.createElement('button');
                helpIcon.type = 'button';
                helpIcon.className = 'help-icon';
                helpIcon.textContent = 'i';
                helpIcon.setAttribute('data-bs-toggle', 'tooltip');
                helpIcon.setAttribute('data-bs-placement', 'top');
                helpIcon.setAttribute('data-bs-title', question.helpText);
                labelWrapper.appendChild(label);
                labelWrapper.appendChild(helpIcon);
                qwrap.appendChild(labelWrapper);
            } else {
                const label = document.createElement('label');
                label.textContent = question.label || question.id;
                qwrap.appendChild(label);
            }

            const optionsWrap = document.createElement('div');
            optionsWrap.className = 'options';
            // expose minScore for checkbox scoring
            if (typeof question.minScore !== 'undefined') qwrap.dataset.minScore = question.minScore;
            // check conditional visibility
            const visible = Conditional.isVisible(question, window.State.currentState.answers || {});
            if (!visible) {
                qwrap.style.display = 'none';
            }

            if (question.type === 'radio') {
                question.options.forEach((opt) => {
                    const isObj = typeof opt === 'object' && opt !== null;
                    const optionLabel = isObj ? opt.label || opt.value : String(opt);
                    const optionValue = isObj ? opt.value || opt.label : String(opt);
                    const optScore = isObj && typeof opt.score !== 'undefined' ? Number(opt.score) : String(optionLabel).toLowerCase() === 'yes' ? 1 : 0;
                    const id = `${question.id}__${optionValue}`.replace(/\s+/g, '_');
                    const div = document.createElement('div');
                    const inp = document.createElement('input');
                    inp.type = 'radio';
                    inp.name = question.id;
                    inp.value = optionValue;
                    inp.id = id;
                    inp.dataset.score = String(optScore);
                    const lab = document.createElement('label');
                    lab.htmlFor = id;
                    lab.textContent = optionLabel;
                    div.appendChild(inp);
                    div.appendChild(lab);
                    optionsWrap.appendChild(div);
                });
            } else if (question.type === 'checkbox') {
                question.options.forEach((opt) => {
                    const optionValue = String(opt);
                    const id = `${question.id}__${optionValue}`.replace(/\s+/g, '_');
                    const div = document.createElement('div');
                    const inp = document.createElement('input');
                    inp.type = 'checkbox';
                    inp.name = question.id;
                    inp.value = optionValue;
                    inp.id = id;
                    const lab = document.createElement('label');
                    lab.htmlFor = id;
                    lab.textContent = optionValue;
                    div.appendChild(inp);
                    div.appendChild(lab);
                    optionsWrap.appendChild(div);
                });
            } else if (question.type === 'number' || question.type === 'text') {
                const inp = document.createElement('input');
                inp.type = question.type === 'number' ? 'number' : 'text';
                inp.name = question.id;
                inp.className = 'text-input';
                optionsWrap.appendChild(inp);
            }

            qwrap.appendChild(optionsWrap);

            // inline message placeholder
            const messageDiv = document.createElement('div');
            messageDiv.className = 'inline-message';
            messageDiv.style.display = 'none';
            qwrap.appendChild(messageDiv);

            // question message placeholder (for positive/recommendation messages)
            const questionMessageDiv = document.createElement('div');
            questionMessageDiv.className = 'question-message';
            questionMessageDiv.dataset.qid = question.id;
            qwrap.appendChild(questionMessageDiv);

            return qwrap;
        }

        // Build question elements first (do not append yet) so we can group conditional questions
        const qwraps = [];
        page.questions.forEach((question) => {
            if (question.type === 'group') {
                // Handle grouped questions
                const groupWrap = document.createElement('div');
                groupWrap.className = 'question-group';
                groupWrap.dataset.qid = question.id;

                // Group header
                const groupHeader = document.createElement('div');
                groupHeader.className = 'question-group-header';

                if (question.helpText) {
                    const labelWrapper = document.createElement('div');
                    labelWrapper.className = 'question-label-wrapper';
                    const label = document.createElement('label');
                    label.textContent = question.label || question.id;
                    const helpIcon = document.createElement('button');
                    helpIcon.type = 'button';
                    helpIcon.className = 'help-icon';
                    helpIcon.textContent = 'i';
                    helpIcon.setAttribute('data-bs-toggle', 'tooltip');
                    helpIcon.setAttribute('data-bs-placement', 'top');
                    helpIcon.setAttribute('data-bs-title', question.helpText);
                    labelWrapper.appendChild(label);
                    labelWrapper.appendChild(helpIcon);
                    groupHeader.appendChild(labelWrapper);
                } else {
                    const label = document.createElement('label');
                    label.textContent = question.label || question.id;
                    groupHeader.appendChild(label);
                }

                groupWrap.appendChild(groupHeader);

                // Sub-questions - group them by conditional relationships
                if (question.subQuestions && question.subQuestions.length > 0) {
                    // Build map of parent -> children for conditionals within this group
                    const subQMap = {};
                    question.subQuestions.forEach((subQ, idx) => {
                        subQMap[subQ.id] = idx;
                    });

                    const conditionalGroups = {};
                    question.subQuestions.forEach((subQ, idx) => {
                        if (subQ.conditional && subQ.conditional.showWhen) {
                            const parentId = Object.keys(subQ.conditional.showWhen)[0];
                            if (subQMap[parentId] !== undefined) {
                                const parentIdx = subQMap[parentId];
                                conditionalGroups[parentIdx] = conditionalGroups[parentIdx] || [];
                                conditionalGroups[parentIdx].push(idx);
                            }
                        }
                    });

                    const processed = new Set();
                    question.subQuestions.forEach((subQ, idx) => {
                        if (processed.has(idx)) return;

                        if (conditionalGroups[idx]) {
                            // This sub-question has conditional children - wrap them together
                            const condWrapper = document.createElement('div');
                            condWrapper.className = 'conditional-subquestion-group';

                            // Add parent
                            const parentEl = createQuestionElement(subQ, true);
                            condWrapper.appendChild(parentEl);
                            processed.add(idx);

                            // Add children
                            conditionalGroups[idx].forEach((childIdx) => {
                                const childEl = createQuestionElement(question.subQuestions[childIdx], true);
                                condWrapper.appendChild(childEl);
                                processed.add(childIdx);
                            });

                            // Add conditional group message placeholder
                            const conditionalGroupMessageDiv = document.createElement('div');
                            conditionalGroupMessageDiv.className = 'conditional-group-message';
                            conditionalGroupMessageDiv.dataset.parentQid = subQ.id;
                            condWrapper.appendChild(conditionalGroupMessageDiv);

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
        page.questions.forEach((q, i) => (idToIndex[q.id] = i));

        // Build groups: parentIndex -> [childIndex,...]
        const groups = {};
        page.questions.forEach((q, i) => {
            if (q.conditional && q.conditional.showWhen) {
                const keys = Object.keys(q.conditional.showWhen || {});
                if (keys.length) {
                    const parentId = keys[0];
                    const pIdx = idToIndex[parentId];
                    if (typeof pIdx !== 'undefined') {
                        groups[pIdx] = groups[pIdx] || [];
                        groups[pIdx].push(i);
                    }
                }
            }
        });

        // Append qwraps to the content, grouping conditional children with their parent when possible
        const appended = new Set();
        for (let i = 0; i < page.questions.length; i++) {
            if (appended.has(i)) continue;
            if (groups[i]) {
                // If the parent has only one dependent child, append parent and child without the group wrapper
                const childIndices = (groups[i] || []).slice().sort((a, b) => a - b);

                if (childIndices.length == 1) {
                    // single child - always apply conditional-group class since there's a conditional relationship
                    const ci = childIndices[0];
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'conditional-group';
                    groupDiv.appendChild(qwraps[i]);
                    appended.add(i);
                    if (!appended.has(ci)) {
                        groupDiv.appendChild(qwraps[ci]);
                        appended.add(ci);
                    }
                    // Add message container for conditional group messages
                    const conditionalGroupMessageDiv = document.createElement('div');
                    conditionalGroupMessageDiv.className = 'conditional-group-message';
                    conditionalGroupMessageDiv.dataset.parentQid = page.questions[i].id;
                    groupDiv.appendChild(conditionalGroupMessageDiv);
                    contentEl.appendChild(groupDiv);
                } else {
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'conditional-group';
                    // parent
                    groupDiv.appendChild(qwraps[i]);
                    appended.add(i);
                    // children sorted ascending
                    childIndices.forEach((ci) => {
                        if (!appended.has(ci)) {
                            groupDiv.appendChild(qwraps[ci]);
                            appended.add(ci);
                        }
                    });
                    // Add message container for conditional group messages
                    const conditionalGroupMessageDiv = document.createElement('div');
                    conditionalGroupMessageDiv.className = 'conditional-group-message';
                    conditionalGroupMessageDiv.dataset.parentQid = page.questions[i].id;
                    groupDiv.appendChild(conditionalGroupMessageDiv);
                    contentEl.appendChild(groupDiv);
                }
            } else {
                // ensure this index is not a child of some earlier group
                let isChild = false;
                for (const pIdx in groups) {
                    if (groups[pIdx].includes(i)) {
                        isChild = true;
                        break;
                    }
                }
                if (isChild) {
                    continue;
                }
                contentEl.appendChild(qwraps[i]);
                appended.add(i);
            }
        }

        // Page messages section (positive messages and recommendations)
        const messagesSection = document.createElement('div');
        messagesSection.className = 'page-messages';
        messagesSection.id = 'pageMessages';
        contentEl.appendChild(messagesSection);

        // nav
        const nav = document.createElement('div');
        nav.className = 'nav-buttons';
        const back = document.createElement('button');
        back.className = 'secondary';
        back.textContent = 'Previous page';
        const next = document.createElement('button');
        next.className = 'primary';
        next.textContent = 'Next page';
        back.disabled = pageIndex === 0;
        back.addEventListener('click', () => {
            const prev = Math.max(0, pageIndex - 1);
            // update state and save to URL
            window.State.currentState.view = 'quiz';
            window.State.currentState.currentPage = prev;
            window.State.saveStateToUrl(window.State.currentState);
        });
        next.addEventListener('click', () => {
            const nextPage = Math.min(quiz.pages.length - 1, pageIndex + 1);
            if (nextPage === pageIndex) {
                // go to results view - set view and save state
                window.State.currentState.view = 'results';
                window.State.saveStateToUrl(window.State.currentState);
            } else {
                window.State.currentState.view = 'quiz';
                window.State.currentState.currentPage = nextPage;
                window.State.saveStateToUrl(window.State.currentState);
            }
        });
        nav.appendChild(back);
        nav.appendChild(next);
        contentEl.appendChild(nav);

        // populate inputs from state and attach change handlers
        const stateAnswers = window.State.currentState.answers || {};
        for (const qEl of contentEl.querySelectorAll('.question, .sub-question')) {
            const qid = qEl.dataset.qid;
            const question = findQuestionInQuiz(quiz, qid);
            if (!question) continue;
            // fill values
            if (question.type === 'radio') {
                const val = stateAnswers[qid];
                if (val) {
                    const inp = qEl.querySelector(`input[type=radio][value="${val}"]`);
                    if (inp) inp.checked = true;
                }
            } else if (question.type === 'checkbox') {
                const val = stateAnswers[qid] || [];
                qEl.querySelectorAll('input[type=checkbox]').forEach((ch) => {
                    ch.checked = val.includes(ch.value);
                });
            } else {
                const val = stateAnswers[qid];
                const inp = qEl.querySelector('input');
                if (inp && typeof val !== 'undefined') inp.value = val;
            }

            // show inline message for pre-filled values (on load)
            const currentVal = (function () {
                if (question.type === 'radio') {
                    const sel = qEl.querySelector(`input[type=radio]:checked`);
                    return sel ? sel.value : null;
                } else if (question.type === 'checkbox') {
                    const arr = [];
                    qEl.querySelectorAll('input[type=checkbox]:checked').forEach((c) => arr.push(c.value));
                    return arr;
                } else {
                    const inp = qEl.querySelector('input');
                    return inp ? inp.value : null;
                }
            })();
            showInlineMessageForQuestion(question, qEl, currentVal);

            // change handler
            qEl.addEventListener('change', (ev) => {
                // Save the focused input ID before DOM manipulation
                const focusedInputId = ev.target ? ev.target.id : null;
                
                handleInputChange(ev, quiz, pageIndex);
                // after handling input change, show inline message for the changed value
                const val = (function () {
                    if (question.type === 'radio') {
                        const sel = qEl.querySelector(`input[type=radio]:checked`);
                        return sel ? sel.value : null;
                    } else if (question.type === 'checkbox') {
                        const arr = [];
                        qEl.querySelectorAll('input[type=checkbox]:checked').forEach((c) => arr.push(c.value));
                        return arr;
                    } else {
                        const inp = qEl.querySelector('input');
                        return inp ? inp.value : null;
                    }
                })();
                showInlineMessageForQuestion(question, qEl, val);
                // Update page messages and inline question messages
                updatePageMessages(quiz, page);
                updateInlineQuestionMessages(quiz, page);
                updateConditionalGroupMessages(quiz, page);
                
                // Restore focus after ALL DOM updates are complete
                if (focusedInputId) {
                    setTimeout(() => {
                        const inputToFocus = document.getElementById(focusedInputId);
                        if (inputToFocus) {
                            inputToFocus.focus();
                        }
                    }, 10); // Slightly longer delay to ensure all DOM updates complete
                }
            });
        }

        // Initialize conditional-subquestion-group wrapper visibility on page load
        updateConditionalGroupBorders(quiz);
        // Initialize page messages and inline question messages
        updatePageMessages(quiz, page);
        updateInlineQuestionMessages(quiz, page);
        updateConditionalGroupMessages(quiz, page);
        
        // Initialize Bootstrap tooltips
        if (window.bootstrap && window.bootstrap.Tooltip) {
            const tooltipTriggerList = contentEl.querySelectorAll('[data-bs-toggle="tooltip"]');
            [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl));
        }
    }

    function updatePageMessages(quiz, page) {
        const messagesSection = document.getElementById('pageMessages');
        if (!messagesSection) return;

        const answers = window.State.currentState.answers || {};
        const messages = { positive: [], recommendation: [] };

        // Check each question on the page - ONLY for group-level messages
        for (const q of page.questions) {
            if (q.type === 'group' && q.subQuestions) {
                // For groups, check group-level messages only
                let hasPositive = false;
                let hasNegative = false;

                for (const subQ of q.subQuestions) {
                    if (!Conditional.isVisible(subQ, answers)) continue;
                    const ans = answers[subQ.id];
                    if (subQ.type === 'radio') {
                        if (shouldShowMessage(subQ, ans, 'positive')) hasPositive = true;
                        if (shouldShowMessage(subQ, ans, 'recommendation')) hasNegative = true;
                    }
                }

                if (hasPositive && q.positiveMessage) {
                    messages.positive.push(q.positiveMessage);
                }
                if (hasNegative && q.recommendation) {
                    messages.recommendation.push(q.recommendation);
                }
            }
            // Regular questions are handled by updateInlineQuestionMessages
        }

        // Generate message keys for comparison
        const newMessageKeys = JSON.stringify(messages);
        const currentMessageKeys = messagesSection.dataset.messageKeys || '';

        // Only update DOM if messages have changed
        if (newMessageKeys === currentMessageKeys) return;

        messagesSection.dataset.messageKeys = newMessageKeys;
        messagesSection.innerHTML = '';

        // Display messages if there are any
        if (messages.positive.length > 0 || messages.recommendation.length > 0) {
            const heading = document.createElement('h3');
            heading.textContent = 'Feedback';
            messagesSection.appendChild(heading);

            messages.positive.forEach((msg) => {
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

            messages.recommendation.forEach((msg) => {
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

    // Helper function to determine if answer should trigger positive or recommendation message
    function shouldShowMessage(question, answer, messageType) {
        if (!answer) return false;
        
        // Check if question has custom trigger values
        if (messageType === 'positive' && question.positiveMessageOn) {
            return question.positiveMessageOn.includes(answer);
        }
        if (messageType === 'recommendation' && question.recommendationOn) {
            return question.recommendationOn.includes(answer);
        }
        
        // Fallback to default Yes/No logic for backward compatibility
        if (question.type === 'radio') {
            if (messageType === 'positive') {
                return question.showRecommendationOnYes ? (answer === 'No') : (answer === 'Yes');
            }
            if (messageType === 'recommendation') {
                return question.showRecommendationOnYes ? (answer === 'Yes') : (answer === 'No' || answer === 'Unsure');
            }
        }
        
        return false;
    }

    // Update inline question messages (for regular questions without subQuestions)
    function updateInlineQuestionMessages(quiz, page) {
        const answers = window.State.currentState.answers || {};

        // Find all regular questions (not in groups)
        for (const q of page.questions) {
            // Skip group questions
            if (q.type === 'group' && q.subQuestions) continue;

            // Find the question element
            const qEl = document.querySelector(`.question[data-qid="${q.id}"]`);
            if (!qEl) continue;

            const messageContainer = qEl.querySelector('.question-message');
            if (!messageContainer) continue;

            // Check if question is visible
            if (!Conditional.isVisible(q, answers)) {
                messageContainer.innerHTML = '';
                continue;
            }

            const ans = answers[q.id];
            let messageToShow = null;

            if (q.type === 'radio') {
                // Check if positive message should be shown
                if (shouldShowMessage(q, ans, 'positive') && q.positiveMessage) {
                    messageToShow = { ...q.positiveMessage, type: 'positive' };
                } else if (shouldShowMessage(q, ans, 'recommendation') && q.recommendation) {
                    messageToShow = { ...q.recommendation, type: 'recommendation' };
                }
            }

            // Update the message container
            if (messageToShow) {
                const newMessageKey = JSON.stringify(messageToShow);
                const currentMessageKey = messageContainer.dataset.messageKey || '';

                if (newMessageKey !== currentMessageKey) {
                    messageContainer.dataset.messageKey = newMessageKey;
                    messageContainer.innerHTML = '';

                    const msgDiv = document.createElement('div');
                    msgDiv.className = `message-item ${messageToShow.type}`;
                    const title = document.createElement('div');
                    title.className = 'message-title';
                    title.textContent = messageToShow.title;
                    const body = document.createElement('div');
                    body.className = 'message-body';
                    body.innerHTML = messageToShow.body;
                    msgDiv.appendChild(title);
                    msgDiv.appendChild(body);
                    messageContainer.appendChild(msgDiv);
                }
            } else {
                messageContainer.innerHTML = '';
                messageContainer.dataset.messageKey = '';
            }
        }
    }

    // Update conditional group messages (for .conditional-subquestion-group and .conditional-group)
    function updateConditionalGroupMessages(quiz, page) {
        const answers = window.State.currentState.answers || {};

        // Find all conditional group message containers
        const conditionalGroups = document.querySelectorAll('.conditional-group-message');
        
        conditionalGroups.forEach((messageContainer) => {
            const parentQid = messageContainer.dataset.parentQid;
            if (!parentQid) return;

            // Find the parent question - could be a regular question or a sub-question in a group
            let parentQuestion = null;
            
            // First check if it's a regular question
            parentQuestion = page.questions.find((q) => q.id === parentQid);
            
            // If not found, check if it's a sub-question in a group
            if (!parentQuestion) {
                for (const q of page.questions) {
                    if (q.type === 'group' && q.subQuestions) {
                        parentQuestion = q.subQuestions.find((sq) => sq.id === parentQid);
                        if (parentQuestion) break;
                    }
                }
            }

            if (!parentQuestion) return;

            // Collect messages to show (both positive and recommendation)
            const messages = { positive: [], recommendation: [] };

            // Check all conditional children of this parent
            let shouldShowPositive = false;
            let shouldShowRecommendation = false;

            // Find the wrapper - could be .conditional-subquestion-group or .conditional-group
            const wrapper = messageContainer.closest('.conditional-subquestion-group, .conditional-group');
            if (wrapper) {
                const childQuestions = wrapper.querySelectorAll('.sub-question, .question');
                childQuestions.forEach((childEl) => {
                    const childQid = childEl.dataset.qid;
                    // Skip the parent question itself
                    if (childQid === parentQid) return;
                    
                    const childQuestion = findQuestionInQuiz(quiz, childQid);
                    
                    // Skip if not conditional or not depending on this parent
                    if (!childQuestion || !childQuestion.conditional || !childQuestion.conditional.showWhen) return;
                    const dependsOnId = Object.keys(childQuestion.conditional.showWhen)[0];
                    if (dependsOnId !== parentQid) return;

                    // Check if child is visible
                    if (!Conditional.isVisible(childQuestion, answers)) return;

                    const ans = answers[childQid];
                    if (childQuestion.type === 'radio') {
                        if (shouldShowMessage(childQuestion, ans, 'positive')) shouldShowPositive = true;
                        if (shouldShowMessage(childQuestion, ans, 'recommendation')) shouldShowRecommendation = true;
                    }
                });
            }

            // Add messages to arrays (only once each)
            if (shouldShowPositive && parentQuestion.conditionalQuestionGroupPositiveMessage) {
                if (!messages.positive.some((m) => m.title === parentQuestion.conditionalQuestionGroupPositiveMessage.title)) {
                    messages.positive.push(parentQuestion.conditionalQuestionGroupPositiveMessage);
                }
            }
            if (shouldShowRecommendation && parentQuestion.conditionalQuestionGroupRecommendation) {
                if (!messages.recommendation.some((m) => m.title === parentQuestion.conditionalQuestionGroupRecommendation.title)) {
                    messages.recommendation.push(parentQuestion.conditionalQuestionGroupRecommendation);
                }
            }

            // Generate message keys for comparison
            const newMessageKeys = JSON.stringify(messages);
            const currentMessageKeys = messageContainer.dataset.messageKey || '';

            // Only update DOM if messages have changed
            if (newMessageKeys === currentMessageKeys) return;

            messageContainer.dataset.messageKey = newMessageKeys;
            messageContainer.innerHTML = '';

            // Display messages if there are any
            if (messages.positive.length > 0 || messages.recommendation.length > 0) {
                messages.positive.forEach((msg) => {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'message-item positive';
                    const title = document.createElement('div');
                    title.className = 'message-title';
                    title.textContent = msg.title;
                    const body = document.createElement('div');
                    body.className = 'message-body';
                    body.innerHTML = msg.body;
                    msgDiv.appendChild(title);
                    msgDiv.appendChild(body);
                    messageContainer.appendChild(msgDiv);
                });

                messages.recommendation.forEach((msg) => {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'message-item recommendation';
                    const title = document.createElement('div');
                    title.className = 'message-title';
                    title.textContent = msg.title;
                    const body = document.createElement('div');
                    body.className = 'message-body';
                    body.innerHTML = msg.body;
                    msgDiv.appendChild(title);
                    msgDiv.appendChild(body);
                    messageContainer.appendChild(msgDiv);
                });
            }
        });
    }

    function findQuestionInQuiz(quiz, qid) {
        for (const page of quiz.pages) {
            for (const q of page.questions) {
                if (q.id === qid) return q;
                // Check in subQuestions for grouped questions
                if (q.type === 'group' && q.subQuestions) {
                    for (const subQ of q.subQuestions) {
                        if (subQ.id === qid) return subQ;
                    }
                }
            }
        }
        return null;
    }

    function handleInputChange(ev, quiz, pageIndex) {
        const target = ev.target;
        const questionEl = target.closest('.question, .sub-question');
        if (!questionEl) return;
        const qid = questionEl.dataset.qid;
        const question = findQuestionInQuiz(quiz, qid);
        if (!question) return;

        // Save the currently focused input for restoration later
        const focusedInput = target;
        const focusedInputId = focusedInput.id;

        // collect value
        let value;
        if (question.type === 'radio') {
            const sel = questionEl.querySelector(`input[type=radio]:checked`);
            value = sel ? sel.value : null;
        } else if (question.type === 'checkbox') {
            const arr = [];
            questionEl.querySelectorAll('input[type=checkbox]:checked').forEach((ch) => arr.push(ch.value));
            value = arr;
        } else {
            const inp = questionEl.querySelector('input');
            value = inp ? inp.value : null;
            if (question.type === 'number' && value !== '') value = Number(value);
        }

        // save to state
        if (!window.State.currentState.answers) window.State.currentState.answers = {};
        window.State.currentState.answers[qid] = value;
        window.State.currentState.currentPage = pageIndex;
        // inline messageOnSelect
        if (question.messageOnSelect) {
            const msgDiv = questionEl.querySelector('.inline-message');
            let shown = false;
            if (typeof value === 'string' && question.messageOnSelect[value]) {
                msgDiv.textContent = question.messageOnSelect[value];
                msgDiv.style.display = 'block';
                shown = true;
            } else if (Array.isArray(value)) {
                // show first matching
                for (const v of value)
                    if (question.messageOnSelect[v]) {
                        msgDiv.textContent = question.messageOnSelect[v];
                        msgDiv.style.display = 'block';
                        shown = true;
                        break;
                    }
            }
            if (!shown) msgDiv.style.display = 'none';
        }

        // Re-evaluate conditionals for this page: show/hide other questions
        for (const other of document.querySelectorAll('.question, .sub-question')) {
            const otherId = other.dataset.qid;
            const q = findQuestionInQuiz(quiz, otherId);
            if (!q) continue;
            const visible = Conditional.isVisible(q, window.State.currentState.answers || {});
            other.style.display = visible ? '' : 'none';
            if (!visible) {
                delete window.State.currentState.answers[otherId];
            }
        }

        // Update conditional-subquestion-group wrapper visibility
        updateConditionalGroupBorders(quiz);

        // Restore focus to the input that triggered the change
        if (focusedInputId) {
            // Use setTimeout to ensure DOM updates are complete
            setTimeout(() => {
                const inputToFocus = document.getElementById(focusedInputId);
                if (inputToFocus) {
                    inputToFocus.focus();
                }
            }, 0);
        }

        // auto-save state to URL without triggering hashchange/re-render
        window.State.saveStateToUrl(window.State.currentState, true);
    }

    function updateConditionalGroupBorders(quiz) {
        const wrappers = document.querySelectorAll('.conditional-subquestion-group');
        wrappers.forEach((wrapper) => {
            const subQuestions = wrapper.querySelectorAll('.sub-question');
            let hasConditional = false;
            subQuestions.forEach((sq) => {
                const sqId = sq.dataset.qid;
                const sqQuestion = findQuestionInQuiz(quiz, sqId);
                if (sqQuestion && sqQuestion.conditional && sqQuestion.conditional.showWhen) {
                    // Always apply class if conditional question exists, regardless of visibility
                    hasConditional = true;
                }
            });

            // Only update class if it needs to change
            const hasClass = wrapper.classList.contains('has-visible-conditional');
            if (hasConditional && !hasClass) {
                wrapper.classList.add('has-visible-conditional');
            } else if (!hasConditional && hasClass) {
                wrapper.classList.remove('has-visible-conditional');
            }
        });
    }

    async function renderResults(contentEl, quizId) {
        document.getElementById('pageTitle').textContent = 'Results';
        contentEl.innerHTML = '';
        const quiz = await window.JSONCache.get(getQuizUrl(quizId));
        const answers = window.State.currentState.answers || {};

        // Stepper (page steps) - show all pages with completion status
        const stepper = document.createElement('div');
        stepper.className = 'stepper';
        quiz.pages.forEach((p, idx) => {
            const s = document.createElement('a');
            s.href = '#';
            s.className = 'step';
            s.textContent = p.title || `Page ${idx + 1}`;
            const pageComplete = isPageCompleted(p, answers);
            // detect if any visible question on this page has an answer
            let pageHasAnswers = false;
            for (const q of p.questions) {
                if (q.type === 'group' && q.subQuestions) {
                    // Check sub-questions in the group
                    for (const subQ of q.subQuestions) {
                        if (!Conditional.isVisible(subQ, answers)) continue;
                        const a = answers[subQ.id];
                        if (typeof a !== 'undefined' && a !== null && a !== '') {
                            if (Array.isArray(a) && a.length > 0) {
                                pageHasAnswers = true;
                                break;
                            } else if (!Array.isArray(a)) {
                                pageHasAnswers = true;
                                break;
                            }
                        }
                    }
                    if (pageHasAnswers) break;
                } else {
                    if (!Conditional.isVisible(q, answers)) continue;
                    const a = answers[q.id];
                    if (typeof a !== 'undefined' && a !== null && a !== '') {
                        if (Array.isArray(a) && a.length > 0) {
                            pageHasAnswers = true;
                            break;
                        } else if (!Array.isArray(a)) {
                            pageHasAnswers = true;
                            break;
                        }
                    }
                }
            }
            if (pageComplete) {
                s.classList.add('completed');
            } else if (pageHasAnswers) {
                s.classList.add('in-progress');
            }
            // All page steps should be marked as completed when viewing results
            s.classList.add('completed');
            s.addEventListener('click', (e) => {
                e.preventDefault();
                window.State.currentState.view = 'quiz';
                window.State.currentState.currentPage = idx;
                window.State.saveStateToUrl(window.State.currentState);
            });
            stepper.appendChild(s);
        });

        // Add "Your results" step (active)
        const resultsStep = document.createElement('a');
        resultsStep.href = '#';
        resultsStep.className = 'step active';
        resultsStep.textContent = 'Your results';
        stepper.appendChild(resultsStep);

        contentEl.appendChild(stepper);

        // Dispatch event to update progress bar
        window.dispatchEvent(new CustomEvent('stepperUpdated'));

        // Calculate overall and per-page scores
        let totalScore = 0;
        let totalPossible = 0;
        const pageScores = [];

        for (const page of quiz.pages) {
            let pageScore = 0;
            let pagePossible = 0;

            for (const q of page.questions) {
                if (q.type === 'group' && q.subQuestions) {
                    for (const subQ of q.subQuestions) {
                        // Only count if question is visible (respects conditionals)
                        if (!Conditional.isVisible(subQ, answers)) continue;

                        // Add to possible score
                        if (subQ.type === 'radio' && subQ.options) {
                            const maxScore = Math.max(
                                ...subQ.options.map((opt) => {
                                    if (typeof opt === 'object' && typeof opt.score !== 'undefined') return Number(opt.score);
                                    return 1;
                                })
                            );
                            pagePossible += maxScore;
                        }

                        // Calculate actual score
                        let qScore = 0;
                        if (subQ.type === 'radio') {
                            const val = answers[subQ.id];
                            if (typeof val !== 'undefined' && val !== null) {
                                const opt = (subQ.options || []).find((o) => {
                                    if (typeof o === 'object') return (o.value || o.label) == val || o.label == val;
                                    return o == val;
                                });
                                if (opt) {
                                    if (typeof opt === 'object' && typeof opt.score !== 'undefined') qScore = Number(opt.score);
                                    else qScore = String(val).toLowerCase() === 'yes' ? 1 : 0;
                                }
                            }
                        }
                        pageScore += qScore;
                    }
                } else {
                    // Regular question
                    if (!Conditional.isVisible(q, answers)) continue;

                    // Add to possible score
                    if (q.type === 'radio' && q.options) {
                        const maxScore = Math.max(
                            ...q.options.map((opt) => {
                                if (typeof opt === 'object' && typeof opt.score !== 'undefined') return Number(opt.score);
                                return 1;
                            })
                        );
                        pagePossible += maxScore;
                    } else if (q.type === 'checkbox' && typeof q.minScore !== 'undefined') {
                        pagePossible += Number(q.minScore);
                    }

                    // Calculate actual score
                    let qScore = 0;
                    if (q.type === 'radio') {
                        const val = answers[q.id];
                        if (typeof val !== 'undefined' && val !== null) {
                            const opt = (q.options || []).find((o) => {
                                if (typeof o === 'object') return (o.value || o.label) == val || o.label == val;
                                return o == val;
                            });
                            if (opt) {
                                if (typeof opt === 'object' && typeof opt.score !== 'undefined') qScore = Number(opt.score);
                                else qScore = String(val).toLowerCase() === 'yes' ? 1 : 0;
                            }
                        }
                    } else if (q.type === 'checkbox') {
                        const val = answers[q.id] || [];
                        const count = Array.isArray(val) ? val.length : 0;
                        if (typeof q.minScore !== 'undefined' && q.minScore) {
                            if (count >= Number(q.minScore)) qScore = Number(q.minScore);
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
                percentage: pagePossible > 0 ? Math.round((pageScore / pagePossible) * 100) : 0,
            });
        }

        // Results
        const overallCard = document.createElement('div');
        overallCard.className = 'quiz-results';
        const overallTitle = document.createElement('h3');
        overallTitle.textContent = 'Overall Health';
        overallCard.appendChild(overallTitle);

        const healthScoreLabel = document.createElement('div');
        healthScoreLabel.classList.add('health-score-label');
        healthScoreLabel.textContent = 'Health Score';
        overallCard.appendChild(healthScoreLabel);

        const scoreCircle = document.createElement('div');
        scoreCircle.classList.add('score-circle');
        const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        scoreCircle.style.setProperty('--score-percentage', `${overallPercentage}`);

        const percentText = document.createElement('div');
        percentText.textContent = overallPercentage + '%';
        percentText.classList.add('percent-text');

        const strengthText = document.createElement('div');
        strengthText.textContent = 'Strengths';
        strengthText.classList.add('strength-text');

        scoreCircle.appendChild(percentText);
        scoreCircle.appendChild(strengthText);
        overallCard.appendChild(scoreCircle);

        // Page scores
        pageScores.forEach((ps) => {
            const scoreSection = document.createElement('div');
            scoreSection.classList.add('page-score-section');

            const scoreTitle = document.createElement('div');
            scoreTitle.textContent = ps.title + ' Score';
            scoreTitle.classList.add('page-score-title');
            scoreSection.appendChild(scoreTitle);

            const progressBar = document.createElement('div');
            progressBar.className = 'progress';
            // progressBar.style.height = '8px';

            const progressFill = document.createElement('i');
            progressFill.style.width = ps.percentage + '%';

            progressBar.appendChild(progressFill);
            scoreSection.appendChild(progressBar);

            const scoreValue = document.createElement('div');
            scoreValue.textContent = `${ps.score}/${ps.possible}`;
            scoreValue.classList.add('page-score-value');
            scoreSection.appendChild(scoreValue);

            overallCard.appendChild(scoreSection);
        });

        contentEl.appendChild(overallCard);

        const contactBtn = document.createElement('a');
        contactBtn.href = '#';
        contactBtn.className = 'btn btn-primary mb-4';
        contactBtn.textContent = 'Contact a Territory Business Advisor';

        // Manually trigger modal since the button is dynamically generated
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalEl = document.getElementById('floatingContact');
            if (modalEl && window.bootstrap && window.bootstrap.Modal) {
                const modal = new window.bootstrap.Modal(modalEl);
                modal.show();
            } else {
                // Fallback if modal doesn't exist
                window.location.href = 'https://business.nt.gov.au/contact';
            }
        });

        contentEl.appendChild(contactBtn);

        // AI-generated summary
        const aiSummarySection = document.createElement('div');
        aiSummarySection.classList.add('ai-summary-section');
        aiSummarySection.innerHTML =
            '<div class="summary-loading"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div><span class="ms-2">Generating AI summary...</span></div>';
        overallCard.appendChild(aiSummarySection);

        // Generate AI summary asynchronously
        (async () => {
            if (window.AISummaryGenerator) {
                window.AISummaryGenerator.initFromDataAttribute();
                const summary = await window.AISummaryGenerator.generateSummary({
                    quizId,
                    quizTitle: quiz.title || 'Business Health Assessment',
                    overallPercentage,
                    pageScores,
                    answers,
                    quiz,
                });

                if (summary) {
                    aiSummarySection.innerHTML = '';
                    const summaryTitle = document.createElement('h4');
                    summaryTitle.textContent = summary.title;
                    summaryTitle.classList.add('summary-title');
                    const summaryContent = document.createElement('p');
                    summaryContent.textContent = summary.content;
                    summaryContent.classList.add('summary-content');
                    aiSummarySection.appendChild(summaryTitle);
                    aiSummarySection.appendChild(summaryContent);
                } else {
                    // Remove loading indicator if AI summary fails
                    aiSummarySection.remove();
                }
            } else {
                // Remove if AI generator not available
                aiSummarySection.remove();
            }
        })();

        // Recommendations section grouped by page
        const recommendationsCard = document.createElement('div');
        recommendationsCard.className = 'quiz-recommendations';
        const recTitle = document.createElement('h3');
        recTitle.textContent = 'Recommendations';
        recommendationsCard.appendChild(recTitle);

        let hasRecommendations = false;

        for (const page of quiz.pages) {
            const pageRecs = { positive: [], recommendation: [] };

            for (const q of page.questions) {
                if (q.type === 'group' && q.subQuestions) {
                    let hasPositive = false;
                    let hasNegative = false;

                    for (const subQ of q.subQuestions) {
                        if (!Conditional.isVisible(subQ, answers)) continue;
                        const ans = answers[subQ.id];
                        if (subQ.type === 'radio') {
                            if (ans === 'Yes') hasPositive = true;
                            if (ans === 'No' || ans === 'Unsure') hasNegative = true;
                        }
                    }

                    if (hasPositive && q.positiveMessage) {
                        pageRecs.positive.push(q.positiveMessage);
                    }
                    if (hasNegative && q.recommendation) {
                        pageRecs.recommendation.push(q.recommendation);
                    }

                    // Also check each subQuestion for its own messages
                    for (const subQ of q.subQuestions) {
                        if (!Conditional.isVisible(subQ, answers)) continue;
                        const ans = answers[subQ.id];

                        if (subQ.type === 'radio') {
                            // Check if this is a conditional question
                            const isConditional = subQ.conditional && subQ.conditional.showWhen;

                            // Find the parent question this depends on
                            let parentQuestion = null;
                            if (isConditional) {
                                const dependsOnId = Object.keys(subQ.conditional.showWhen)[0];
                                parentQuestion = q.subQuestions.find((sq) => sq.id === dependsOnId);
                            }

                            // Check if positive message should be shown on No (when showRecommendationOnYes is true, behavior is inverted)
                            const shouldShowPos = subQ.showRecommendationOnYes ? (ans === 'No') : (ans === 'Yes');
                            
                            if (shouldShowPos) {
                                // Use conditionalQuestionGroupPositiveMessage from parent if it's a conditional question
                                if (isConditional && parentQuestion && parentQuestion.conditionalQuestionGroupPositiveMessage) {
                                    // Only add once per parent question
                                    if (!pageRecs.positive.some((m) => m.title === parentQuestion.conditionalQuestionGroupPositiveMessage.title)) {
                                        pageRecs.positive.push(parentQuestion.conditionalQuestionGroupPositiveMessage);
                                    }
                                } else if (subQ.positiveMessage) {
                                    pageRecs.positive.push(subQ.positiveMessage);
                                }
                            }

                            // Check if recommendation should be shown on Yes (special case for questions like cashOnsite)
                            const shouldShowRec = subQ.showRecommendationOnYes ? (ans === 'Yes') : (ans === 'No' || ans === 'Unsure');
                            
                            if (shouldShowRec) {
                                // Use conditionalQuestionGroupRecommendation from parent if it's a conditional question
                                if (isConditional && parentQuestion && parentQuestion.conditionalQuestionGroupRecommendation) {
                                    // Only add once per parent question
                                    if (!pageRecs.recommendation.some((m) => m.title === parentQuestion.conditionalQuestionGroupRecommendation.title)) {
                                        pageRecs.recommendation.push(parentQuestion.conditionalQuestionGroupRecommendation);
                                    }
                                } else if (subQ.recommendation) {
                                    pageRecs.recommendation.push(subQ.recommendation);
                                }
                            }
                        }
                    }
                } else {
                    if (!Conditional.isVisible(q, answers)) continue;
                    const ans = answers[q.id];

                    if (q.type === 'radio') {
                        // Check if this is a conditional question
                        const isConditional = q.conditional && q.conditional.showWhen;

                        // Find the parent question this depends on
                        let parentQuestion = null;
                        if (isConditional) {
                            const dependsOnId = Object.keys(q.conditional.showWhen)[0];
                            parentQuestion = page.questions.find((pq) => pq.id === dependsOnId);
                        }

                        // Check if positive message should be shown on No (when showRecommendationOnYes is true, behavior is inverted)
                        const shouldShowPos = q.showRecommendationOnYes ? (ans === 'No') : (ans === 'Yes');
                        
                        if (shouldShowPos) {
                            // Use conditionalQuestionGroupPositiveMessage from parent if it's a conditional question
                            if (isConditional && parentQuestion && parentQuestion.conditionalQuestionGroupPositiveMessage) {
                                // Only add once per parent question
                                if (!pageRecs.positive.some((m) => m.title === parentQuestion.conditionalQuestionGroupPositiveMessage.title)) {
                                    pageRecs.positive.push(parentQuestion.conditionalQuestionGroupPositiveMessage);
                                }
                            } else if (q.positiveMessage) {
                                pageRecs.positive.push(q.positiveMessage);
                            }
                        }

                        // Check if recommendation should be shown on Yes (special case for questions like cashOnsite)
                        const shouldShowRec = q.showRecommendationOnYes ? (ans === 'Yes') : (ans === 'No' || ans === 'Unsure');
                        
                        if (shouldShowRec) {
                            // Use conditionalQuestionGroupRecommendation from parent if it's a conditional question
                            if (isConditional && parentQuestion && parentQuestion.conditionalQuestionGroupRecommendation) {
                                // Only add once per parent question
                                if (!pageRecs.recommendation.some((m) => m.title === parentQuestion.conditionalQuestionGroupRecommendation.title)) {
                                    pageRecs.recommendation.push(parentQuestion.conditionalQuestionGroupRecommendation);
                                }
                            } else if (q.recommendation) {
                                pageRecs.recommendation.push(q.recommendation);
                            }
                        }
                    }
                }
            }

            // Display this page's recommendations if any
            if (pageRecs.recommendation.length > 0) {
                hasRecommendations = true;
                const pageSection = document.createElement('div');
                pageSection.className = 'page-recommendations';

                const pageHeading = document.createElement('h4');
                pageHeading.textContent = page.title;
                pageSection.appendChild(pageHeading);

                pageRecs.recommendation.forEach((msg) => {
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
                    pageSection.appendChild(msgDiv);
                });

                recommendationsCard.appendChild(pageSection);
            }
        }

        if (hasRecommendations) {
            contentEl.appendChild(recommendationsCard);
        }

        // Results actions: Download PDF, Copy Link, Print
        const actionsWrap = document.createElement('div');
        actionsWrap.classList.add('results-actions');
        const copyBtn = document.createElement('button');
        copyBtn.className = 'secondary';
        copyBtn.insertAdjacentHTML('afterbegin', `<i class="fa-solid fa-link"></i><span>Copy link to this report</span>`);

        const printBtn = document.createElement('button');
        printBtn.className = 'secondary';
        printBtn.insertAdjacentHTML('afterbegin', `<i class="fa-solid fa-print"></i><span>Print results</span>`);

        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'primary';
        pdfBtn.textContent = 'Download report';

        // PDF generation using html2pdf
        pdfBtn.addEventListener('click', async () => {
            if (!window.html2pdf) {
                alert('html2pdf not loaded');
                return;
            }

            // Clone content and remove action buttons
            const contentEl = document.getElementById('quizContent');
            const clone = contentEl.cloneNode(true);

            // Remove the action buttons from the clone
            const actionsWrap = clone.querySelector('.results-actions');
            if (actionsWrap && actionsWrap.querySelector('button')) {
                actionsWrap.remove();
            }

            // Remove the stepper from the clone
            const stepper = clone.querySelector('.stepper');
            if (stepper) {
                stepper.remove();
            }

            // Remove quiz navigation buttons
            const navButtons = clone.querySelector('.quiz-nav-buttons');
            if (navButtons) {
                navButtons.remove();
            }

            // Remove contact button
            const contactButton = clone.querySelector('.btn.btn-primary.mb-4');
            if (contactButton) {
                contactButton.remove();
            }

            // Add quiz title at the top
            const titleElement = document.createElement('h1');
            titleElement.textContent = quiz.title || 'Business Health Report';
            titleElement.style.fontSize = '24px';
            titleElement.style.fontWeight = '700';
            titleElement.style.marginBottom = '20px';
            clone.insertBefore(titleElement, clone.firstChild);

            // Get all stylesheets
            const styles = Array.from(document.querySelectorAll('link[rel=stylesheet]'))
                .map((l) => `<link rel="stylesheet" href="${l.href}">`)
                .join('\n');

            // Get inline styles from style tags
            const inlineStyles = Array.from(document.querySelectorAll('style'))
                .map((s) => `<style>${s.innerHTML}</style>`)
                .join('\n');

            // Create a complete HTML document with styles
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8">
                    ${styles}
                    ${inlineStyles}
                    <title>${quiz.title || 'Business Health Report'}</title>
                </head>
                <body>
                    <div class="ntg-quiz-body">
                        ${clone.innerHTML}
                    </div>
                </body>
                </html>
            `;

            // Configure PDF options
            const opt = {
                margin: 10,
                filename: `${quiz.title || 'report'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            };

            // Generate PDF from the complete HTML
            html2pdf().set(opt).from(wrapper).save();
        });

        copyBtn.addEventListener('click', async () => {
            try {
                const encoded = window.State.encodeState(window.State.currentState);
                const link = window.location.origin + window.location.pathname + `#?state=${encoded}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(link);
                    alert('Link copied to clipboard');
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = link;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    alert('Link copied to clipboard');
                }
            } catch (e) {
                alert('Copy failed: ' + e.message);
            }
        });

        printBtn.addEventListener('click', () => {
            // Clone content and remove action buttons
            const contentEl = document.getElementById('quizContent');
            const clone = contentEl.cloneNode(true);

            // Remove the action buttons from the clone
            const actionsWrap = clone.querySelector('.results-actions');
            if (actionsWrap && actionsWrap.querySelector('button')) {
                actionsWrap.remove();
            }

            
            // Remove the action buttons from the clone
            const stepper = clone.querySelector('.stepper');
            if (stepper) {
                stepper.remove();
            }

            // Remove quiz navigation buttons
            const navButtons = clone.querySelector('.quiz-nav-buttons');
            if (navButtons) {
                navButtons.remove();
            }

            // Remove contact button
            const contactButton = clone.querySelector('.btn.btn-primary.mb-4');
            if (contactButton) {
                contactButton.remove();
            }

            // Add quiz title at the top
            const titleElement = document.createElement('h1');
            titleElement.textContent = quiz.title || 'Business Health Report';
            titleElement.style.fontSize = '24px';
            titleElement.style.fontWeight = '700';
            titleElement.style.marginBottom = '20px';
            clone.insertBefore(titleElement, clone.firstChild);

            // Open a new window with the content for printing
            const newWin = window.open('', '_blank');
            if (!newWin) {
                alert('Unable to open print window');
                return;
            }

            // Get all stylesheets
            const styles = Array.from(document.querySelectorAll('link[rel=stylesheet]'))
                .map((l) => `<link rel="stylesheet" href="${l.href}">`)
                .join('\n');

            // Get inline styles from style tags
            const inlineStyles = Array.from(document.querySelectorAll('style'))
                .map((s) => `<style>${s.innerHTML}</style>`)
                .join('\n');

            // Add print-specific styles
            const printStyles = `
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                    }
                </style>
            `;

            const html = `<!doctype html><html><head><meta charset="utf-8">${styles}${inlineStyles}${printStyles}<title>Print - ${quiz.title}</title></head><body><div class="ntg-quiz-body">${clone.innerHTML}</div></body></html>`;
            newWin.document.open();
            newWin.document.write(html);
            newWin.document.close();
            newWin.focus();
            // give it a little time to render styles
            setTimeout(() => {
                newWin.print(); /* newWin.close(); */
            }, 1000);
        });

        actionsWrap.appendChild(copyBtn);
        actionsWrap.appendChild(printBtn);
        actionsWrap.appendChild(pdfBtn);

        document.getElementById('pageTitle').appendChild(actionsWrap);
        // contentEl.appendChild(actionsWrap);
        // Prev / Next quiz navigation
        try {
            const appEl = document.getElementById('app');
            const navUrl = appEl ? appEl.dataset.quizMainNavigation : '../assets/data/mainNavigation.json';
            const nav = await window.JSONCache.get(navUrl);
            const idx = nav.quizzes.findIndex((q) => q.id === quizId);
            const navWrap = document.createElement('div');
            navWrap.className = 'quiz-nav-buttons';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'secondary';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'secondary';

            if (idx > 0) {
                prevBtn.textContent = nav.quizzes[idx - 1].title;
            } else {
                prevBtn.textContent = 'Previous Quiz';
                prevBtn.disabled = true;
            }

            if (idx !== -1 && idx < nav.quizzes.length - 1) {
                nextBtn.textContent = nav.quizzes[idx + 1].title;
            } else {
                nextBtn.textContent = 'Next Quiz';
                nextBtn.disabled = true;
            }

            prevBtn.addEventListener('click', () => {
                if (idx > 0) {
                    const prevId = nav.quizzes[idx - 1].id;
                    window.State.currentState.view = 'quiz';
                    window.State.currentState.quizId = prevId;
                    window.State.currentState.currentPage = 0;
                    window.State.saveStateToUrl(window.State.currentState);
                    // Scroll to quiz body
                    setTimeout(() => {
                        const quizBody = document.querySelector('.ntg-quiz-body');
                        if (quizBody) {
                            quizBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            });
            nextBtn.addEventListener('click', () => {
                if (idx < nav.quizzes.length - 1) {
                    const nextId = nav.quizzes[idx + 1].id;
                    window.State.currentState.view = 'quiz';
                    window.State.currentState.quizId = nextId;
                    window.State.currentState.currentPage = 0;
                    window.State.saveStateToUrl(window.State.currentState);
                    // Scroll to quiz body
                    setTimeout(() => {
                        const quizBody = document.querySelector('.ntg-quiz-body');
                        if (quizBody) {
                            quizBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            });
            navWrap.appendChild(prevBtn);
            navWrap.appendChild(nextBtn);
            contentEl.appendChild(navWrap);
        } catch (e) {
            /* ignore */
        }
    }

    global.UI = {
        renderStart,
        renderChooseTopic,
        renderQuizPage,
        renderResults,
    };
})(window);
