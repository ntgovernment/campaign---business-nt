var formValidation = (function() {
    
    function setupFormValidation(form, extraRules) {
        
        // initial form setup
        $(form).validate({
            errorClass: 'mt-2 alert alert-danger',
            onkeyup: false,
            errorPlacement: function(error, element) {
                if(element.attr('type') == 'checkbox' || element.attr('type') == 'radio' || element.attr('type') == 'file') {
                    error.appendTo(element.closest('.sq-form-question-answer'));
                } else if(element.is('[name*="_value[d]"]') || element.is('[name*="_value[m]"]') || element.is('[name*="_value[y]"]')) {
                    error.appendTo(element.closest('fieldset'));
                } else if(element.is('[data-date]')) {
                    error.insertAfter(element.closest('.sq-form-question-answer'));
                } else {
                    error.insertAfter(element);
                }
            },
            highlight: function(element, errorClass, validClass) {
                $(element).addClass('sq-form-error');
            },
            unhighlight: function(element, errorClass, validClass) {
                $(element).removeClass('sq-form-error');
            },
            groups: getGroups(form),
            rules: extraRules || {}
        });
        
    }
    
    // groups the 3 select inputs of the DOB field to ensure only 1 error shows
    function getGroups(form) {
     
        var result = {};
        
        $('.sq-form-question-datetime').each(function(index) {
            
            var dob = '';
            
            // makes sure only date of birth fields are being added to group
            $(this).find('select[data-dob]').each(function(index) {
                dob += $(this).attr('name') + ' ';
            });
            
            result[index] = dob.trim();
            
        });
        
        return result;
        
    }
    
    function setInitialRequired(form) {
        
        var $visible_form_inputs = $(form).find(':input').not(':button, :submit, :reset, :hidden');
        
        $visible_form_inputs.each(function(index) {
           
            var $form_input = $(this);
           
            if($form_input[0].hasAttribute('data-required')) {
                $form_input.attr('required', true);
            }
            
        });
        
    }
    
    // set custom error messages for each form
    function setupValidityMessages(form) {
        
        // retrieve all inputs except squiz matrix hidden inputs
        var $all_form_inputs = $(form).find(':input').not(':button, :submit, :reset, [type="hidden"]');
        
        var $standard_inputs = $all_form_inputs.not('select, :radio, :checkbox, :file');
        var $select_inputs = $all_form_inputs.filter('select').not('[data-dob]');
        var $checkbox_inputs = $all_form_inputs.filter(':checkbox');
        var $radio_inputs = $all_form_inputs.filter(':radio');
        var $file_inputs = $all_form_inputs.filter(':file');
        var $date_inputs = $all_form_inputs.filter('[data-date]');
        var $time_inputs = $all_form_inputs.filter('[data-time]');
        var $dob_inputs = $all_form_inputs.filter('[data-dob]');
        
        if($standard_inputs.length) {
            
            $.validator.methods.email = function( value, element ) {
                return this.optional( element ) || /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i.test( value );
            }
            
            $standard_inputs.each(function(index) {
                
                var $standard_input = $(this);
                
                $($standard_input).rules('add', {
                    messages: {
                        required: "This is a required field.",
                        number: "This must only feature numbers.",
                        email: "Oops this doesn't look like an email. Please check and try again.",
                        minlength: jQuery.validator.format("Please, at least {0} characters are necessary."),
                        maxlength: jQuery.validator.format("Please, no more than {0} characters are necessary."),
                        min: jQuery.validator.format("This number must be a minimum of {0}."),
                        max: jQuery.validator.format("This number must be a maximum of {0}.")
                    }
                });
            });
            
        }
        
        if($select_inputs.length) {
            
            $.validator.addMethod("selectRequired", function(value, element, arg){
                return arg != value;
            });
            
            $select_inputs.each(function(index) {
                
                var $select_input = $(this);
                
                $($select_input).rules('add', {
                    selectRequired: "--",
                    messages: {
                        selectRequired: "Please select a valid option.", 
                        required: "Please select a valid option."
                    }
                });
                
            });
            
        }
        
        if($checkbox_inputs.length) {
            
            $checkbox_inputs.each(function(index) {
                
                var $checkbox_input = $(this);
                
                $($checkbox_input).rules('add', {
                    messages: {
                        required: "This is a required field.",
                        minlength: "Please make sure that you confirm all of the options above."
                    }
                });
                 
            });
            
        }
        
        if($radio_inputs.length) {
            
            $radio_inputs.each(function(index) {
                
                var $radio_input = $(this);
                
                $($radio_input).rules('add', {
                    messages: {
                        required: "Please select from the options above."
                    }
                });
                 
            });
            
        }
        
        if($file_inputs.length) {
            
            $file_inputs.each(function(index) {
                
                var $file_input = $(this);
                
                // when previous_page_button is clicked, will check to see if a file has been uploaded to the file input
                // if so, this will remove the jquery required validation from the input
                var formSaved = $($file_input).closest('.sq-form-question-answer').find('p');
                if(formSaved.length > 0) {
                    $($file_input).removeAttr('data-required');
                    $($file_input).removeAttr('required');
                    
                    formSaved[0].innerHTML = formSaved[0].innerHTML.replace(' Clear?', '');
                    
                }
                
                $($file_input).rules('add', {
                    extension: "doc|docx|xls|xlsx|csv|pdf|txt|msg|jpg|jpeg|png|zip",
                    messages: {
                        required: "This is a required field.",
                        extension: "Please upload a valid file type."
                    }
                });
                 
            });
            
        }
        
        if($date_inputs.length) {
            
            // ensures the format is in DD/MM/YYYY
            $.validator.addMethod('dateFormat', function(value, element) {
                return this.optional(element) || /^(?:(?:(?:(?:31\/(?:0?[13578]|1[02]))|(?:(?:29|30)\/(?:0?[13-9]|1[0-2])))\/(?:1[6-9]|[2-9]\d)\d{2})|(?:29\/0?2\/(?:(?:(1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))|(?:0?[1-9]|1\d|2[0-8])\/(?:(?:0?[1-9])|(?:1[0-2]))\/(?:(?:1[6-9]|[2-9]\d)\d{2}))$/.test(value);
            });
            
            // will only allow todays date and future dates to be selected if [data-date-future] is specified on the input
            $.validator.addMethod('checkDateFuture', function(value, element) {
                
                var futureAttr = $(element).attr('data-date-future');
                
                if(typeof futureAttr !== typeof undefined && futureAttr !== false) {
                    
                    var dateParts = value.split("/");
                    var now = new Date();
                    
                    var selectedDate = new Date(Date.UTC(+dateParts[2], dateParts[1] - 1, +dateParts[0]));
                    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    
                    // if value is specified with attribute, changes starting date from today to a future date based on the number of days given by value
                    if($(element).data('date-future') != '') {
                        var numOfDays = $(element).data('date-future');
                        var startingDate = new Date(today.setDate(today.getDate() + numOfDays));
                        
                        return selectedDate.getTime() >= startingDate.getTime();
                    }
                    
                    return selectedDate.getTime() >= today.getTime();
                    
                }
                
                return true;
                
            }, function(params, element) { // custom error messages depending on whether the attribute has a value specified
                if($(element).data('date-future') != '') {
                    return "Please ensure your date is at least " + $(element).data('date-future') + " days in the future.";
                } else {
                    return "Please ensure your date is not in the past.";
                }
            });
            
            // will only allow todays date and previous dates to be selected if [data-date-past] is specified on the input
            // [[SUPPORT-248021 - ]] - Update to fix an issue where UTC time was incorrectly failing validation for todays date

            $.validator.addMethod('checkDatePast', function(value, element) {
                
                var pastAttr = $(element).attr('data-date-past');
                
                if(typeof pastAttr !== typeof undefined && pastAttr !== false) {
                    
                    var dateParts = value.split("/");
                    var now = new Date();
                    
                    var selectedDate = new Date(Date.UTC(+dateParts[2], dateParts[1] - 1, +dateParts[0]));
                    var today = new Date(Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    
                    return selectedDate.getDay() <= today.getDay();
                    
                }
                
                return true;
            
            });
            
            // ensures the past date range doesn't go back further than specified
            $.validator.addMethod('checkDatePastRange', function(value, element) {
                
                var pastRangeAttr = $(element).attr('data-date-past-range');
                
                if(typeof pastRangeAttr !== typeof undefined && pastRangeAttr !== false) {
                    
                    var pastRangeValue = $(element).data('date-past-range');
                
                    var dateParts = value.split("/");
                    var now = new Date();
                    
                    var selectedDate = new Date(Date.UTC(+dateParts[2], dateParts[1] - 1, +dateParts[0]));
                    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    
                    var minimumDate = new Date(today.setDate(today.getDate() - pastRangeValue));
                    
                    return selectedDate.getTime() > minimumDate.getTime();
                
                }
                
                return true;
                
            });
            
            // ensures the future date range doesn't go further than specified
            // will only allow todays date and previous dates to be selected if [data-date-past] is specified on the input
            $.validator.addMethod('checkDateFutureRange', function(value, element) {
                
                var futureRangeAttr = $(element).attr('data-date-future-range');
                
                if(typeof futureRangeAttr !== typeof undefined && futureRangeAttr !== false) {
                    
                    var futureRangeValue = $(element).data('date-future-range');
                
                    var dateParts = value.split("/");
                    var now = new Date();
                    
                    var selectedDate = new Date(Date.UTC(+dateParts[2], dateParts[1] - 1, +dateParts[0]));
                    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    
                    var maximumDate = new Date(today.setDate(today.getDate() + futureRangeValue));
                    
                    return selectedDate.getTime() > maximumDate.getTime();
                
                }
                
                return true;
                
            });
            
            // ensures the past date range doesn't go back further than specified
            $.validator.addMethod('checkDateWeekday', function(value, element) {
                
                var weekdayAttr = $(element).attr('data-date-weekday');
                
                if(typeof weekdayAttr !== typeof undefined && weekdayAttr !== false) {
                
                    var dateParts = value.split("/");
                    
                    var selectedDate = new Date(Date.UTC(+dateParts[2], dateParts[1] - 1, +dateParts[0]));
                    
                    return selectedDate.getDay() != 6 && selectedDate.getDay() != 0;
                
                }
                
                return true;
                
            });
            
            $date_inputs.each(function(index) {
                
                var $date_input = $(this);
                
                $($date_input).rules('add', {
                    dateFormat: true,
                    checkDateFuture: true,
                    checkDatePast: true,
                    checkDatePastRange: true,
                    checkDateFutureRange: true,
                    checkDateWeekday: true,
                    messages: {
                        dateFormat: "Please enter a date in the format DD/MM/YYYY.",
                        checkDatePast: "Please ensure your date is not in the future.",
                        checkDatePastRange: jQuery.validator.format("Please ensure your date is not over {0} days ago.", $($date_input).data('date-past-range')),
                        checkDateFutureRange: jQuery.validator.format("Please ensure your date is not over {0} days in the future.", $($date_input).data('date-future-range')),
                        checkDateWeekday: "Please ensure you only select a date on Mon - Fri."
                    }
                });
                 
            });
            
        }
        
        if($time_inputs.length) {
            
            $time_inputs.each(function(index) {
                
                var $time_input = $(this);
                
                $($time_input).rules('add', {
                    time12h: true,
                    messages: {
                        time12h: "Please enter a time in the format HH:MM AM/PM for example 10:30AM."
                    }
                });
                 
            });
            
        }
        
        if($dob_inputs.length) {
            
            // makes sure the Matrix date fields have the correct date validation (e.g. you cannot select 31/02/2000)
            $.validator.addMethod('validateDOB', function(value, element, args) {
                var day = $(element).closest('.sq-form-question-datetime').find('select[name*="_value[d]"]').val();
                var month = $(element).closest('.sq-form-question-datetime').find('select[name*="_value[m]"]').val();
                var year = $(element).closest('.sq-form-question-datetime').find('select[name*="_value[y]"]').val();
                
                if ((day.length >= 1) && (month.length >= 1) && (year.length > 3)) {
                    
                var date = day + '/' + month + '/' + year;
                
                return date.match(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
                    
                }
                
                return true;
                
            });
            
            $dob_inputs.each(function(index) {
                
                var $dob_input = $(this);
                
                var $dob_year = $(this).is('[name*="_value[y]"]');
                
                // remove the first 16 years from option list
                if(typeof $dob_year !== typeof undefined && $dob_year !== false) {
                    var $reverse = $($dob_input).find('option').get().reverse();
                    $($reverse).each(function(index, value) {
                        if(index == 16) {
                            return false;
                        }
                        $(value).remove();
                    });
                }
                
                // makes sure first option value of select fields is always empty so validation works as intended
                $dob_input.children().first().val('');
                
                $($dob_input).rules('add', {
                    validateDOB: true,
                    messages: {
                        required: "Please enter your full date of birth.",
                        validateDOB: "This is not a valid date of birth."
                    }
                });
                
            });
            
        }
        
    }
    
    function setupFormDates(form) {
        
        // Set Global options
        datePickerController.setGlobalOptions({
            dateparsefallback: false,
            lang: "en"
        });
        
        var $datepicker_inputs = $(form).find('[data-date]');
        
        if($datepicker_inputs.length) {
            
            $datepicker_inputs.each(function(index) {
                
                var $datepicker_input_future = $(this).attr('data-date-future');
                var $datepicker_input_future_range = $(this).attr('data-date-future-range');
                var $datepicker_input_past = $(this).attr('data-date-past');
                var $datepicker_input_past_range = $(this).attr('data-date-past-range');
                var $datepicker_input_weekday = $(this).attr('data-date-weekday');
                var $datepicker_input_id = $(this).attr('id');
                
                // Workaround for using a variable in an object
                var $formElements = {};
                $formElements[$datepicker_input_id] = "%d/%m/%Y";
                
                // ensures only weekdays can be selected if present on the input
                if(typeof $datepicker_input_weekday !== typeof undefined && $datepicker_input_weekday !== false) {
                    
                    datePickerController.createDatePicker({
                        formElements: $formElements,
                        noFadeEffect: true,
                        disabledDays: [0,0,0,0,0,1,1]
                    });
                    
                } else {
                    
                    datePickerController.createDatePicker({
                        formElements: $formElements,
                        noFadeEffect: true
                    });
                    
                }
                
                // ensures only todays date and future dates can be selected if [data-date-future] is present on the input
                if(typeof $datepicker_input_future !== typeof undefined && $datepicker_input_future !== false) {
                    
                    // if value is specified with attribute, changes starting date from today to a future date based on the number of days given by value
                    if($($datepicker_input_future).data('date-future') != '') {
                        
                        var numOfDays = $(this).data('date-future');
                        
                        var now = new Date();
                        var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                        var startingDate = new Date(today.setDate(today.getDate() + numOfDays));
                        
                        datePickerController.setRangeLow($datepicker_input_id, startingDate);
                        
                        return;
                    }
                    
                    datePickerController.setRangeLow($datepicker_input_id, new Date());
                }
                
                // ensures only todays date and past dates can be selected if [data-date-past] is present on the input
                if(typeof $datepicker_input_past !== typeof undefined && $datepicker_input_past !== false) {
                    datePickerController.setRangeHigh($datepicker_input_id, new Date());
                }
                
                // ensures a limit is set on what days can be selected from the past if [data-date-past-range] is present on the input
                if(typeof $datepicker_input_past_range !== typeof undefined && $datepicker_input_past_range !== false) {
                    
                    var pastRangeValue = $(this).data('date-past-range');
                    
                    var now = new Date();
                    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    var minimumDate = new Date(today.setDate(today.getDate() - pastRangeValue + 1));
                    
                    datePickerController.setRangeLow($datepicker_input_id, minimumDate);
                    datePickerController.setRangeHigh($datepicker_input_id, new Date());
                }
                
                // ensures a limit is set on what days can be selected from the future if [data-date-future-range] is present on the input
                if(typeof $datepicker_input_future_range !== typeof undefined && $datepicker_input_futuret_range !== false) {
                    
                    var futureRangeValue = $(this).data('date-future-range');
                    
                    var now = new Date();
                    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    var maximumDate = new Date(today.setDate(today.getDate() + futureRangeValue + 1));
                    
                    datePickerController.setRangeLow($datepicker_input_id, new Date());
                    datePickerController.setRangeHigh($datepicker_input_id, maximumDate);
                }
                
            });
            
        }
        
    }
    
    function setupFormConfirmation(form) {
        
        var table = $(form).find('table');
        
        $(table).find('strong').closest('tr').addClass('confirmation__header');
        
        $(table).find('td').addClass('confirmation__cell');
        
        // remove empty rows
        var $td_empty = $(table).find('td:empty');
        $td_empty.each(function(index) {
            
            $(this).parent().remove();
             
        });
        
        // remove empty file uploads based on the text 'No file uploaded'
        var $td_fileupload = $(table).find('td:contains("No file uploaded")');
        $td_fileupload.each(function(index) {
            
            $(this).parent().remove();
             
        });
        
        // remove empty dates based on the text '--'
        var $td_datetime = $(table).find('td:contains("--")');
        $td_datetime.each(function(index) {
            
            $(this).parent().remove();
             
        });
        
        // remove headers that have no content underneath
        var $headers = $('.confirmation__header');
        $headers.each(function(index) {
           
            if($(this).next().is('.confirmation__header') || $(this).is(':last-child')) {
                $(this).remove();
            }
            
        });
        
        // removes any anchor tags from the text
        var $td_anchors = $(table).find('td:contains("<a href=")');
        $td_anchors.each(function(index) {
            
            var rawText = $(this).text();
            var strippedText = rawText.replace(/<\/?[^>]+>/gi, '');
            
            $(this).text(strippedText);
            
        });
        
        var $td_questions = $(table).find('td:contains("::")');
        
        $td_questions.each(function(index) {
           
            var rawText = $(this).text();
            var strippedText = rawText.replace('::', ':');
            
            $(this).text(strippedText);
            
        });
    }
    
    function init() {
        
        // ensures the payment form can run its own form validation
        $('.main__content form:not("#pwc-payment-form")').each(function(index) {
           
            var form = $(this)[index];
            
            // checks for confirmation page and modifies table
            setupFormConfirmation(form);
           
           
            if($("#startChatForm")) {
                const extraRules = {
                    confemail: {
                        equalTo: "#chat_email"
                    }
                }
                
                setupFormValidation(form, extraRules);
                
                $("#chat_confirmemail").rules('add', {
                    messages: {
                        equalTo: "Email and confirm email address donot match."
                    }
                })
            } else {
                // initial validation setup
                setupFormValidation(form);
            }

            
            // initalize datepicker
            setupFormDates(form);
            
            // applies custom messages
            setupValidityMessages(form);
            
            // apply required on page load when data-required is present
            setInitialRequired(form);
            
            // connection-disconnection form customization to only have 1 google recaptcha
            if(form.id === 'form_email_4127' || form.id === 'form_email_15101') {
                var section = $(form).find('.sq-form-section')[0];
                $(section).on('change', function() {
                    
                    var questionOneValue = $(this).find('select').filter(':first').val();
                    var questionTwoValue = $(this).find('select').filter(':last').val();
                    
                    if((questionOneValue == '0' || questionOneValue == '1') && questionTwoValue == '6') {
                        $('#custom-captcha').css('display', 'block');
                    } else if((questionOneValue == '2' || questionOneValue == '3') && questionTwoValue.length) {
                        $('#custom-captcha').css('display', 'block');
                    } else {
                        $('#custom-captcha').css('display', 'none');
                    }
                });
            }
            
            
            // IE11 fix to ensure characters cannot be entered into number input fields
            $('input[type="number"]').on("keydown", function (e) {
                var key = (window.event) ? event.keyCode : event.which;

                var keys = [8,37,39,46,96,97,98,99,100,101,102,103,104,105];

                var x = (keys.indexOf(key) > -1);

                if (x != true) {

                    if (isNaN(String.fromCharCode(key))) { 
                        return false;
                    }

                }
            });
            
        });
        
    }
    
    return {
        
        init: init,
        
        // for use with ajaxforms
        setupFormConfirmation: setupFormConfirmation
        
    }
    
}());

// (function() {
//     formValidation.init();
// }());