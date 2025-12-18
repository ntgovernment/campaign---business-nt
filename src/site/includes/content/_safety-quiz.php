<div class="container pb-5">
    <div class="ntg-quiz" id="app" data-quiz-main-navigation="../assets/data/mainNavigation.json" data-propertySafety="../assets/data/quizzes/property-safety-quiz.json" data-staffSafety="../assets/data/quizzes/staffSafetyquiz.json"
         data-mobileBusiness="../assets/data/quizzes/mobileBusiness.json" data-vehicleSafety="../assets/data/quizzes/vehicleSafety.json" data-ui-messages="../assets/data/uiMessages.json">
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
                <h2 class="modal-title" id="resumeModalLabel">Welcome back?</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>It looks like you've been here before, would you like to continue or start over?</p>

                <div class="d-flex">
                    <button type="button" class="btn btn-primary rounded-pill py-1 me-2" id="btnFresh">Start over</button>
                    <button type="button" class="btn btn-primary rounded-pill py-1" id="btnResume">Continue</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- <script src="js/lz-string.min.js"></script> -->
<!-- html2pdf for report generation -->
<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script> -->
<!-- <script src="js/state.js"></script>
<script src="js/conditional.js"></script>
<script src="js/modal.js"></script>
<script src="js/ui.js"></script>
<script src="js/router.js"></script>
<script src="js/app.js"></script> -->