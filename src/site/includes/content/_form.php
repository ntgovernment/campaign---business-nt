<form>
    <fieldset class="sq-form-section">
        <legend class="sq-form-section-title">Inputs</legend>
        <div class="sq-form-question sq-form-question-text sq-form-question-error">
            <label class="sq-form-question-title" for="q990964_q1">Text <abbr class="sq-form-required-field"
                    title="required">*</abbr></label>
            <div class="sq-form-question-answer">
                <input type="text" name="q990964:q1" value="" size="30" maxlength="300" id="q990964_q1"
                    class="sq-form-field" />
            </div>
            <p class="sq-form-error">This field is required. Please enter a value.</p>
        </div>
        <div class="sq-form-question sq-form-question-email-address">
            <label class="sq-form-question-title" for="q990964_q2">Email</label>
            <div class="sq-form-question-answer">
                <input type="email" name="q990964:q2" value="" size="30" maxlength="300" id="q990964_q2"
                    class="sq-form-field" />
            </div>
        </div>
        <div class="sq-form-question sq-form-question-text">
            <label class="sq-form-question-title" for="q990964_q3">Phone</label>
            <div class="sq-form-question-answer">
                <input type="tel" name="q990964:q3" value="" size="30" maxlength="300" id="q990964_q3"
                    class="sq-form-field" />
            </div>
        </div>
        <div class="sq-form-question sq-form-question-text">
            <label class="sq-form-question-title" for="q990965_q4">Text area <abbr class="sq-form-required-field"
                    title="required">*</abbr></label>
            <div class="sq-form-question-answer">
                <textarea name="q990965:q4" id="q990965_q4" cols="30" rows="3" class="sq-form-field"></textarea>
            </div>
        </div>
    </fieldset>

    <fieldset class="sq-form-section">
        <legend class="sq-form-section-title">Radios</legend>
        <div class="sq-form-question sq-form-question-option-list">
            <fieldset>
                <legend class="sq-form-question-title">Radio Label <abbr class="sq-form-required-field"
                        title="required">*</abbr></legend>
                <div class="sq-form-question-answer">
                    <ul>
                        <li><input type="radio" name="q990965:q1" id="q990965_q1_0" value="0" class="sq-form-field" />
                            <label for="q990965_q1_0">Option 1</label></li>
                        <li><input type="radio" name="q990965:q1" id="q990965_q1_1" value="1" class="sq-form-field" />
                            <label for="q990965_q1_1">Option 2</label></li>
                        <li><input type="radio" name="q990965:q1" id="q990965_q1_2" value="2" class="sq-form-field" />
                            <label for="q990965_q1_2">Option 3</label></li>
                        <li><input type="radio" name="q990965:q1" id="q990965_q1_3" value="3" class="sq-form-field" />
                            <label for="q990965_q1_3">Option 4</label></li>
                    </ul>
                </div>
            </fieldset>
        </div>
    </fieldset>

    <fieldset class="sq-form-section">
        <legend class="sq-form-section-title">Checkboxes</legend>
        <div class="sq-form-question sq-form-question-tickbox-list">
            <fieldset>
                <legend class="sq-form-question-title">Checkbox Label <abbr class="sq-form-required-field"
                        title="required">*</abbr></legend>

                <div class="sq-form-question-answer">
                    <ul>
                        <li><input type="checkbox" name="q990965:q2" id="q990965_q2_0" value="0"
                                class="sq-form-field" /> <label for="q990965_q2_0">Option 1</label></li>
                        <li><input type="checkbox" name="q990965:q2" id="q990965_q2_1" value="1"
                                class="sq-form-field" /> <label for="q990965_q2_1">Option 2</label></li>
                        <li><input type="checkbox" name="q990965:q2" id="q990965_q2_2" value="2"
                                class="sq-form-field" /> <label for="q990965_q2_2">Option 3</label></li>
                        <li><input type="checkbox" name="q990965:q2" id="q990965_q2_3" value="3"
                                class="sq-form-field" /> <label for="q990965_q2_3">Option 4</label></li>
                    </ul>
                </div>
            </fieldset>
        </div>
    </fieldset>

    <fieldset class="sq-form-section">
        <legend class="sq-form-section-title">Select</legend>
        <div class="sq-form-question sq-form-question-select">
            <label class="sq-form-question-title" for="q1000093_q4">Select Label <abbr class="sq-form-required-field"
                    title="required">*</abbr></label>
            <div class="sq-form-question-answer">
                <select name="q1000093:q4" id="q1000093_q4" class="sq-form-field">
                    <option value="none" selected="selected">-- Please Select --</option>
                    <option value="option_1">Option 1</option>
                    <option value="option_2">Option 2</option>
                    <option value="option_3">Option 3</option>
                    <option value="option_4">Option 4</option>
                    <option value="option_5">Option 5</option>
                    <option value="option_6">Option 6</option>
                </select>
            </div>
        </div>
    </fieldset>

    <fieldset class="sq-form-section">
        <legend class="sq-form-section-title">Upload</legend>
        <div class="sq-form-question sq-form-question-file-upload">
            <label class="sq-form-question-title" for="q1000383_q1">Upload Label</label>
            <div class="sq-form-question-answer">
                <div class="sq-form-upload-wrapper" id="sq_form_upload_wrapper_q1000383_q1">
                    <div class="sq-form-upload">
                        <input type="file" name="q1000383:q1[]" id="q1000383_q1" class="sq-form-field" />
                    </div>
                    <div class="sq-form-upload">
                        <input type="file" name="q1000383:q1[]" id="q1000383_q1_2" class="sq-form-field">
                        <input type=" button" value="-" title="Delete" class="sq-form-upload-delete-button"
                            onclick="update_file_upload_element_for_q1000383_q1(event, 'delete')" />
                    </div>
                    <div class="sq-form-upload-add-btn-wrapper">
                        <input type="button" value="+" title="Add" class="sq-form-upload-add-btn"
                            onclick="update_file_upload_element_for_q1000383_q1(event, 'add')" />
                    </div>
                </div>
            </div>
        </div>
    </fieldset>

    <div class="sq-form-control">
        <input type="submit" name="form_email_990957_submit" value="Submit" class="sq-form-submit"
            id="form_email_990957_submit" />
    </div>
</form>