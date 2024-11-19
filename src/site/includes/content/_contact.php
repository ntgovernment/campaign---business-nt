<section>
    <div class="container">
        <p>This is a <a href="" data-bs-toggle="modal" data-bs-target="#modal123">link</a> to a modal</p>
    </div>
</section>

<!-- Modal -->
<div class="modal fade" id="modal123" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modal123Label" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title" id="modal123Label">Feedback form</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="mb-3 form-like-dislike__wrapper">
                        <p>Was this page useful?</p>
                        <div class="form-like-dislike">
                            <label class="form-like-dislike__label">
                                <input type="radio" name="thumbsBtn" value="1"> 
                                <span class="form-like-dislike__icon">
                                    <i class="fa-solid fa-thumbs-up"></i>
                                </span>
                            </label>
                            <label class="form-like-dislike__label">
                                <input type="radio" name="thumbsBtn" value="-1"> 
                                <span class="form-like-dislike__icon">
                                    <i class="fa-solid fa-thumbs-down"></i>
                                </span>
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="full_name" class="form-label">First and last name</label>
                        <input type="text" class="form-control" id="full_name" placeholder="Enter name here">
                    </div>
                    <div class="mb-3">
                        <label for="email_address" class="form-label">Email address</label>
                        <input type="email" class="form-control" id="email_address" placeholder="Enter email here">
                    </div>
                    <div class="mb-3">
                        <label for="business" class="form-label">Business</label>
                        <input type="text" class="form-control" id="business" placeholder="Enter business here">
                    </div>
                    <div class="mb-3">
                        <label for="question_textarea" class="form-label">Ask a question here</label>
                        <textarea class="form-control" id="question_textarea" rows="3" placeholder="Leave your questions here"></textarea>
                    </div>
                    <p class="small max-width-input">
                        By providing your contact details, you consent to being contacted by the Business.nt.gov.au to respond to your enquiry or feedback. Your contact details will be retained to assist in providing an enhanced client service in the future.
                    </p>
                    <div>
                        <button type="submit" class="btn btn-dark-blue rounded-pill">Submit</button>
                        <button type="reset" class="btn btn-outline-dark-blue rounded-pill">Reset</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<section>
    <div class="container">
        <ul class="nav nav-tabs" id="tabCT-123" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="tab-1" data-bs-toggle="tab" data-bs-target="#tab-1-pane" type="button" role="tab" aria-controls="tab-1-pane" aria-selected="true">Report an issue</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-2" data-bs-toggle="tab" data-bs-target="#tab-2-pane" type="button" role="tab" aria-controls="tab-2-pane" aria-selected="false">Ask a question</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-3" data-bs-toggle="tab" data-bs-target="#tab-3-pane" type="button" role="tab" aria-controls="tab-3-pane" aria-selected="false">Tab 3</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-4" data-bs-toggle="tab" data-bs-target="#tab-4-pane" type="button" role="tab" aria-controls="tab-4-pane" aria-selected="false">Tab 4</button>
            </li>
        </ul>

        <div class="tab-content" id="tabCTContent-123">
            <div class="tab-pane fade show active" id="tab-1-pane" role="tabpanel" aria-labelledby="tab-1" tabindex="0">
                <h2>Ask a question</h2>

                <form>
                    <div class="mb-3">
                        <label for="full_name" class="form-label">First and last name</label>
                        <input type="text" class="form-control" id="full_name" placeholder="Enter name here">
                    </div>
                    <div class="mb-3">
                        <label for="email_address" class="form-label">Email address</label>
                        <input type="email" class="form-control" id="email_address" placeholder="Enter email here">
                    </div>
                    <div class="mb-3">
                        <label for="business" class="form-label">Business</label>
                        <input type="text" class="form-control" id="business" placeholder="Enter business here">
                    </div>
                    <div class="mb-3">
                        <label for="question_textarea" class="form-label">Ask a question here</label>
                        <textarea class="form-control" id="question_textarea" rows="3" placeholder="Leave your questions here"></textarea>
                    </div>
                    <p class="small max-width-input">
                        By providing your contact details, you consent to being contacted by the Business.nt.gov.au to respond to your enquiry or feedback. Your contact details will be retained to assist in providing an enhanced client service in the future.
                    </p>
                    <div>
                        <button type="submit" class="btn btn-dark-blue rounded-pill">Submit</button>
                        <button type="reset" class="btn btn-outline-dark-blue rounded-pill">Reset</button>
                    </div>
                </form>
            </div>
            <div class="tab-pane fade" id="tab-2-pane" role="tabpanel" aria-labelledby="tab-2" tabindex="0">
                Tab 2
            </div>
            <div class="tab-pane fade" id="tab-3-pane" role="tabpanel" aria-labelledby="tab-3" tabindex="0">
                Tab 3
            </div>
            <div class="tab-pane fade" id="tab-4-pane" role="tabpanel" aria-labelledby="tab-4" tabindex="0">
                Tab 4
            </div>
        </div>
    </div>  
</section>