<?php
/**
 * Business Health Checklist Page
 * Displays multiple forms in a two-panel layout with left sidebar navigation
 */
?>
<!DOCTYPE html>
<html lang="en">
    <?php include("includes/_head.php"); ?>

<!-- <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Health Checklist</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" rel="stylesheet">
    <link href="../css/business-health-checklist.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
</head> -->
<body>
    <div id="wrapper">

        <?php
        include("includes/global/_skip-link.php");
        include("includes/global/_mmenu.php");
        include("includes/global/_search-global.php");
        include("includes/global/_header.php");
        include("includes/global/_standard-banner.php");
        include("includes/global/_breadcrumb.php");
        ?>

        <div class="container-fluid" id="app">
            <!-- Header -->
            <nav class="navbar navbar-dark bg-dark sticky-top">
                <div class="container-fluid">
                    <span class="navbar-brand mb-0 h1">
                        <i class="fas fa-briefcase me-2"></i>Business Health Checklist
                    </span>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-light btn-sm" id="exportBtn" title="Export and share your progress">
                            <i class="fas fa-share"></i> Export
                        </button>
                        <button type="button" class="btn btn-outline-light btn-sm" id="importBtn" title="Import previous progress">
                            <i class="fas fa-download"></i> Import
                        </button>
                        <button type="button" class="btn btn-outline-light btn-sm" id="clearBtn" title="Clear all progress">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                        <span id="saveStatus" class="badge bg-success ms-2" style="display:none;">Saved</span>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <div class="row g-0 flex-grow-1 main-content">
                <!-- Left Sidebar - Form List -->
                <div class="col-md-3 bg-light sidebar">
                    <div class="p-3">
                        <h5 class="mb-3">
                            <i class="fas fa-list"></i> Sections
                        </h5>
                        <div class="list-group list-group-flush" id="formList">
                            <!-- Form items will be inserted here -->
                        </div>
                    </div>
                    
                    <!-- Progress Summary -->
                    <div class="p-3 border-top">
                        <h6 class="mb-2">Progress</h6>
                        <div class="progress mb-2" style="height: 24px;">
                            <div class="progress-bar" id="progressBar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                <span id="progressText">0%</span>
                            </div>
                        </div>
                        <small id="progressDetails" class="text-muted">No forms started</small>
                    </div>
                </div>

                <!-- Right Content - Form Display -->
                <div class="col-md-9 content-area">
                    <div id="formContainer" class="p-4">
                        <!-- Form will be rendered here -->
                        <form id="dynamicForm" class="needs-validation" novalidate style="display: none;">
                            <div id="pageTitle" class="form-page-title"></div>
                            <div id="pageDescription" class="form-page-description"></div>
                            <div id="formFieldsContainer"></div>
                            <div class="mt-4 d-flex justify-content-between">
                                <button type="button" class="btn btn-secondary" id="prevBtn">Previous</button>
                                <div>
                                    <button type="button" class="btn btn-primary" id="nextBtn">Next</button>
                                    <button type="submit" class="btn btn-success" id="submitBtn" style="display:none;">Submit Form</button>
                                </div>
                            </div>
                            <div class="mt-3">
                                <div class="progress" style="height: 2px;">
                                    <div class="progress-bar" id="progressBar2" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <small class="text-muted" id="progressText">Page 1 of 1</small>
                            </div>
                        </form>
                        <div class="text-center text-muted py-5 placeholder-start">
                            <p><i class="fas fa-arrow-left"></i> Select a section to begin</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Export Modal -->
        <div class="modal fade" id="exportModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Export & Share Progress</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Copy the link below to share your progress with others:</p>
                        <div class="mb-3">
                            <label class="form-label"><strong>Shareable URL:</strong></label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="shareableUrl" readonly>
                                <button class="btn btn-outline-secondary" type="button" id="copyUrlBtn">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                            </div>
                        </div>
                        <p class="small text-muted">Or copy the compressed state string for backup:</p>
                        <div class="mb-3">
                            <textarea class="form-control" id="stateString" rows="3" readonly></textarea>
                            <button class="btn btn-outline-secondary btn-sm mt-2" type="button" id="copyBtn">
                                <i class="fas fa-copy"></i> Copy State String
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Import Modal -->
        <div class="modal fade" id="importModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Import Progress</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Paste your state string or URL to import previous progress:</p>
                        <textarea class="form-control" id="importStateString" rows="4" placeholder="Paste state string here..."></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmImportBtn">Import</button>
                    </div>
                </div>
            </div>
        </div>

        

        <!-- Form Title & Resume Modal for individual forms -->
        <div id="formTitle" class="text-center mb-3" style="display: none;"></div>
        <div id="formDescription" class="text-muted text-center mb-4" style="display: none;"></div>

        <!-- Resume Modal (for multi-form state) -->
        <div class="modal fade" id="resumeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Resume Previous Session?</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>We found a saved session from <strong id="lastSavedTime"></strong></p>
                        <p>Would you like to resume or start fresh?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="startFreshBtn">Start Fresh</button>
                        <button type="button" class="btn btn-primary" id="resumeBtn">Resume</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scripts -->
        <!-- <script src="../js/forms/1formRenderer.js"></script>
        <script src="../js/forms/2conditionalLogic.js"></script>
        <script src="../js/forms/3stateManager.js"></script>
        <script src="../js/forms/4pageManager.js"></script> -->
        <!-- <script src="../js/forms/business-health-checklist-app.js"></script> -->

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <!-- LZ-String for URL state compression (fallback handled in app) -->
        <script src="https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js"></script>
        <script type="text/javascript" src="js/bundle.js"></script>
</body>
</html>
