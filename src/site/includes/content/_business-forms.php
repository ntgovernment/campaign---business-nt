<div class="container py-5">
        <!-- Header -->
        <header class="mb-4">
            <h1 id="formTitle" class="display-4"></h1>
            <p id="formDescription" class="lead text-muted"></p>
        </header>

        <!-- Progress Bar -->
        <div class="mb-4">
            <div class="progress" style="height: 25px;">
                <div id="progressBar" class="progress-bar progress-bar-striped" role="progressbar" style="width: 0%">
                    <span id="progressText">Page 1 of 1</span>
                </div>
            </div>
        </div>

        <!-- Current Page Info -->
        <div id="pageHeader" class="mb-4">
            <h2 id="pageTitle"></h2>
            <p id="pageDescription" class="text-muted"></p>
        </div>

        <!-- Form Container -->
        <form id="dynamicForm" class="needs-validation" novalidate>
            <div id="formFieldsContainer">
                <!-- Fields will be dynamically generated here -->
            </div>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-content-between mt-4">
                <button type="button" id="prevBtn" class="btn btn-secondary" style="display: none;">
                    <i class="bi bi-arrow-left"></i> Previous
                </button>
                <div class="ms-auto d-flex gap-2">
                    <button type="button" id="nextBtn" class="btn btn-primary">
                        Next <i class="bi bi-arrow-right"></i>
                    </button>
                    <button type="submit" id="submitBtn" class="btn btn-success" style="display: none;">
                        Submit Form
                    </button>
                </div>
            </div>
        </form>

        <!-- Total Points Display -->
        <div class="mt-4">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Points Summary</h5>
                    <div class="d-flex align-items-center gap-2">
                        <button type="button" id="downloadPdfBtn" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-download"></i> Download PDF
                        </button>
                        <span id="totalPoints" class="badge bg-primary fs-5">0</span>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Radar Chart -->
                    <div class="mb-4 d-flex justify-content-center">
                        <div style="position: relative; height: 300px; width: 100%; max-width: 500px;">
                            <canvas id="pointsRadarChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Category Breakdown -->
                    <div id="categoryPointsContainer">
                        <!-- Category breakdowns will be rendered here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Export/Import State -->
        <div class="mt-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Form State Management</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <button type="button" id="exportBtn" class="btn btn-outline-primary">
                            Export Form State
                        </button>
                        <button type="button" id="importBtn" class="btn btn-outline-secondary">
                            Import Form State
                        </button>
                        <button type="button" id="clearBtn" class="btn btn-outline-danger">
                            Clear Form
                        </button>
                    </div>
                    <div id="exportedState" style="display: none;">
                        <div class="mb-3">
                            <label for="shareableUrl" class="form-label fw-bold">Shareable URL:</label>
                            <div class="input-group">
                                <input type="text" id="shareableUrl" class="form-control font-monospace" readonly>
                                <button type="button" id="copyUrlBtn" class="btn btn-outline-success">
                                    Copy URL
                                </button>
                            </div>
                            <small class="text-muted">Share this URL to let others resume your form state</small>
                        </div>
                        <div>
                            <label for="stateString" class="form-label fw-bold">Compressed State String:</label>
                            <textarea id="stateString" class="form-control font-monospace" rows="3" readonly></textarea>
                            <button type="button" id="copyBtn" class="btn btn-sm btn-outline-success mt-2">
                                Copy String
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Resume Session Modal -->
    <div class="modal fade" id="resumeModal" tabindex="-1" aria-labelledby="resumeModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="resumeModalLabel">Resume Previous Session?</h5>
                </div>
                <div class="modal-body">
                    <p>We found a saved form session. Would you like to resume where you left off or start fresh?</p>
                    <p class="text-muted small">Last saved: <span id="lastSavedTime"></span></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="startFreshBtn">Start Fresh</button>
                    <button type="button" class="btn btn-primary" id="resumeBtn">Resume Session</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Import State Modal -->
    <div class="modal fade" id="importModal" tabindex="-1" aria-labelledby="importModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="importModalLabel">Import Form State</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <label for="importStateString" class="form-label">Paste the compressed state string:</label>
                    <textarea id="importStateString" class="form-control font-monospace" rows="5"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmImportBtn">Import</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap 5 JS Bundle -->
    <!-- <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script> -->
    
    <!-- LZ-String Library for compression -->
    <script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
    
    <!-- jsPDF Library for PDF generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- Chart.js Library for radar chart -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    
    <!-- Application Scripts -->
    <!-- <script src="formRenderer.js"></script>
    <script src="conditionalLogic.js"></script>
    <script src="stateManager.js"></script>
    <script src="pageManager.js"></script>
    <script src="app.js"></script> -->