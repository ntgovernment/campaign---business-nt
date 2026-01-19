<div class="container pb-5">
    <div
        class="ntg-quiz"
        id="app"
        data-quiz="business-health-checklist" 
        data-business-logo="/assets/images/territory-business-logo.svg"
        data-ntg-logo="/assets/css-images/logo-ntg-color.svg"
        data-quiz-main-navigation="../assets/business-health-checklist-quiz/mainNavigation.json"
        data-businessOperations="../assets/business-health-checklist-quiz/quizzes/businessOperations.json"
        data-businessStrategy="../assets/business-health-checklist-quiz/quizzes/businessStrategy.json"
        data-financialManagement="../assets/business-health-checklist-quiz/quizzes/financialManagement.json"
        data-manageChangeAndPrepareForDisruptions="../assets/business-health-checklist-quiz/quizzes/manageChangeAndPrepareForDisruptions.json"
        data-staffAndPeopleManagement="../assets/business-health-checklist-quiz/quizzes/staffAndPeopleManagement.json"
        data-understandYourCustomers="../assets/business-health-checklist-quiz/quizzes/understandYourCustomers.json"
        data-ui-messages="../assets/business-health-checklist-quiz/uiMessages.json"
        data-openai-api-key="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"
    >
        <aside class="ntg-quiz-sidebar">
            <h2 class="ntg-quiz-sidebar__title">Business Safety and Security</h2>
            <div class="ntg-quiz-sidebar__links" id="sideLinks">
                <!-- Filled by router.updateSidebarProgress -->
            </div>
            <ul class="ntg-quiz-sidebar__list" id="quizList"></ul>
        </aside>
        <div class="ntg-quiz-body">
            <h2 id="pageTitle">Welcome</h2>
            <section id="quizContent"></section>
        </div>
    </div>
</div>

<!-- Bootstrap Modal -->
<div class="modal fade" id="resumeModal" tabindex="-1" aria-labelledby="resumeModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title" id="resumeModalLabel">Welcome back</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>It looks like you've been here before, would you like to continue or start over?</p>

                <div class="modal-actions">
                    <button type="button" class="btn btn-primary" id="btnResume">Continue</button>
                    <button type="button" class="btn btn-outline-secondary" id="btnFresh">Start over</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- <script src="js/lz-string.min.js"></script> -->
<!-- html2pdf for report generation -->
<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script> -->
<!-- Quiz scripts are loaded via bundle.js in order:
     0-cache.js, 1-lz-string.js, 2-state.js, 3-conditional.js, 
     4-modal.js, 5-ui.js, 6-router.js, 7-app.js, 8-ai-summary.js -->
