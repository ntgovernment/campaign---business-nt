<div class="container pb-5">
    <div id="app">
        <aside class="quiz-sidebar" id="sidebar">
            <div class="brand">Business Quiz</div>
            <div class="side-links" id="sideLinks">
                <!-- Filled by router.updateSidebarProgress -->
            </div>
            <ul id="quizList"></ul>
        </aside>

        <div id="main">
            <header>
                <h1 id="pageTitle">Welcome</h1>
            </header>
            <section id="content"></section>
        </div>
    </div>
</div>

<!-- Modal placeholder -->
<div id="resumeModal" class="modal hidden" role="dialog" aria-modal="true">
    <div class="modal-content">
        <h3>Saved progress detected</h3>
        <p>Would you like to resume where you left off or start fresh?</p>
        <div class="modal-actions">
            <button id="btnResume">Resume</button>
            <button id="btnFresh">Start Fresh</button>
        </div>
    </div>
</div>

<!-- <script src="js/lz-string.min.js"></script> -->
<!-- html2pdf for report generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<!-- <script src="js/state.js"></script>
<script src="js/conditional.js"></script>
<script src="js/modal.js"></script>
<script src="js/ui.js"></script>
<script src="js/router.js"></script>
<script src="js/app.js"></script> -->
