// source --> https://www.suzuki.tn/wp-content/plugins/bookme/assets/front/js/bookme.js?ver=4.3.3 
(function ($) {
    window.bookme = function (form_id, attributes, skip_steps, booking_status) {
        var $booking_wrapper = $('#bookme-booking-form-' + form_id),
            timeZone = typeof Intl === 'object' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
            timeZoneOffset = new Date().getTimezoneOffset();

 
        if (Bookme.stripe.enabled) {
            // insert stripe js if enabled
            var stripe_script = document.createElement("script");
            stripe_script.type = "text\/javascript";
            stripe_script.async = true;
            document.head.appendChild(stripe_script);
            stripe_script.src = "https://js.stripe.com/v3/";
        }

        if (booking_status.status == 'finished') {
            render_done_step();
        } else if (booking_status.status == 'cancelled') {
            render_detail_step();
        } else {
            render_service_step({reset_sequence: true});
        }

        function render_service_step(_data) {

            var data = $.extend({
                action: 'bookme_get_service_step',
                csrf_token: Bookme.csrf_token,
                form_id: form_id,
                time_zone: timeZone,
                time_zone_offset: timeZoneOffset
            }, _data);

            $.ajax({
                url: Bookme.ajaxurl,
                data: data,
                dataType: 'json',
                xhrFields: {withCredentials: true},
                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                success: function (response) {
                    if (response.success) {
                        Bookme.csrf_token = response.csrf_token;
                        $booking_wrapper.html(response.html);

                        if (_data === undefined) {
                            scrollTo($booking_wrapper);
                        }

                        var $category_field = $('.bookme-category', $booking_wrapper),
                            $service_field = $('.bookme-service', $booking_wrapper),
                            $employee_field = $('.bookme-employee', $booking_wrapper),
                            $nop_field = $('.bookme-number-of-persons', $booking_wrapper),
                            $calendar = $('.bookme-calendar', $booking_wrapper),
                            $date = $('.bookme-date', $booking_wrapper),
                            $next_button = $('.bookme-next', $booking_wrapper),
                            categories = response.categories,
                            services = response.services,
                            staff = response.staff,
                            data = response.data,
                            category_selected = false;

                        // init calendar
                        $calendar.clndr({
                            selectedDate: $date.val(),
                            monthsLabel: Bookme.months,
                            daysOfTheWeek: Bookme.daysShort,
                            weekOffset: Bookme.start_of_week,
                            constraints: {
                                startDate: response.date_min,
                                endDate: response.date_max
                            },
                            multiDayEvents: {
                                startDate: 'startDate',
                                endDate: 'endDate'
                            },
                            showAdjacentMonths: true,
                            adjacentDaysChangeMonth: false,
                            clickEvents: {
                                click: function (target) {
                                    var $day = $(target.element);
                                    if (!$day.hasClass('inactive') && !$day.hasClass("past") && !$day.hasClass("adjacent-month")) {
                                        $calendar.find(".day").removeClass('selected');
                                        $day.addClass('selected');
                                        $date.val($day.data('date'));
                                    }
                                },
                                nextMonth: get_availability,
                                previousMonth: get_availability
                            }
                        });

                        $booking_wrapper.off('click').off('change');

                        $booking_wrapper.on('change', '.bookme-category', function () {
                            var category_id = this.value,
                                service_id = $service_field.val(),
                                staff_id = $employee_field.val();

                            if (category_id) {
                                category_selected = true;
                                if (service_id) {
                                    if (services[service_id].category_id != category_id) {
                                        service_id = '';
                                    }
                                }
                                if (staff_id) {
                                    var valid = false;
                                    $.each(staff[staff_id].services, function (id) {
                                        if (services[id].category_id == category_id) {
                                            valid = true;
                                            return false;
                                        }
                                    });
                                    if (!valid) {
                                        staff_id = '';
                                    }
                                }
                            } else {
                                category_selected = false;
                            }
                            set_selects(category_id, service_id, staff_id);
                        });

                        $booking_wrapper.on('change', '.bookme-service', function () {
                            var category_id = category_selected ? $category_field.val() : '',
                                service_id = this.value,
                                staff_id = $employee_field.val();

                            if (service_id) {
                                if (staff_id && !staff[staff_id].services.hasOwnProperty(service_id)) {
                                    staff_id = '';
                                }
                            }
                            set_selects(category_id, service_id, staff_id);
                            if (service_id) {
                                $category_field.val(services[service_id].category_id);
                                get_availability();
                            }
                        });

                        $booking_wrapper.on('change', '.bookme-employee', function () {
                            var category_id = $category_field.val(),
                                service_id = $service_field.val(),
                                staff_id = this.value;

                            set_selects(category_id, service_id, staff_id);
                            get_availability();
                        });

                        $('.bookme-cart', $booking_wrapper).on('click', function (e) {
                            e.preventDefault();
                            $(this).addClass('bookme-loader').prop('disabled',true);
                            render_cart_step({from_step: 'service'});
                        });

                        $next_button.on('click', function (e) {
                            e.preventDefault();
                            var $this = $(this);
                            if (validate_service_step()) {
                                var staff_ids = [];
                                if ($employee_field.val()) {
                                    staff_ids.push($employee_field.val());
                                } else {
                                    $employee_field.find('option').each(function () {
                                        if (this.value) {
                                            staff_ids.push(this.value);
                                        }
                                    });
                                }

                                var sequence = {
                                    0 : {
                                        service_id: $service_field.val(),
                                        staff_ids: staff_ids,
                                        number_of_persons: $nop_field.val()
                                    }
                                };

                                $this.addClass('bookme-loader').prop('disabled',true);
                                render_time_step({sequence: sequence, date: $date.val()});
                            }
                        });

                        if (attributes.show_service_duration) {
                            $.each(services, function (id, service) {
                                service.name = service.name + ' ( ' + service.duration + ' )';
                            });
                        }

                        set_select($category_field, categories);
                        set_select($service_field, services);
                        set_select($employee_field, staff);
                        $category_field.closest('.bookme-form-group').toggle(!attributes.hide_categories);
                        $service_field.closest('.bookme-form-group').toggle(!(attributes.hide_services && attributes.service_id));
                        $employee_field.closest('.bookme-form-group').toggle(!attributes.hide_staff_members);
                        $nop_field.closest('.bookme-form-group').toggle(attributes.show_number_of_persons);
                        $('.bookme-service-step-left', $booking_wrapper).toggle(!skip_steps.service_left);
                        if(skip_steps.service_left){
                            $('.bookme-service-step-right', $booking_wrapper).removeClass('bookme-col-md-6').addClass('bookme-col-md-12');
                        }

                        if (attributes.category_id) {
                            $category_field.val(attributes.category_id).trigger('change');
                        }
                        if (attributes.service_id) {
                            $service_field.val(attributes.service_id).trigger('change');
                        }
                        if (attributes.staff_member_id) {
                            $employee_field.val(attributes.staff_member_id).trigger('change');
                        }

                        if(data.service_id){
                            $service_field.val(data.service_id).trigger('change');
                            if (attributes.hide_categories) {
                                $category_field.val('');
                            }
                        }
                        if (!attributes.hide_staff_members && data.staff_ids.length == 1 && data.staff_ids[0]) {
                            $employee_field.val(data.staff_ids[0]).trigger('change');
                        }
                        if (data.number_of_persons > 1) {
                            $nop_field.val(data.number_of_persons);
                        }

                        function validate_service_step() {
                            $('.bookme-service-error', $booking_wrapper).hide();
                            $('.bookme-employee-error', $booking_wrapper).hide();

                            var valid = true,
                                $scroll_to = null;

                                $service_field.removeClass('bookme-error');
                                $employee_field.removeClass('bookme-error');

                                // service validation
                                if (!$service_field.val()) {
                                    valid = false;
                                    $service_field.addClass('bookme-error');
                                    $('.bookme-service-error', $booking_wrapper).show();
                                    $scroll_to = $service_field;
                                }
                                if (Bookme.required.staff && !$employee_field.val()) {
                                    valid = false;
                                    $employee_field.addClass('bookme-error');
                                    $('.bookme-employee-error', $booking_wrapper).show();
                                    $scroll_to = $employee_field;
                                }


                            if ($scroll_to !== null) {
                                scrollTo($scroll_to);
                            }

                            return valid;
                        }

                        function get_availability() {
                            if (!$service_field.val())
                                return;

                            $calendar.css('opacity', 0.5).addClass('bookme-loader');

                            var staff_ids = [];
                            if ($employee_field.val()) {
                                staff_ids.push($employee_field.val());
                            } else {
                                $employee_field.find('option').each(function () {
                                    if (this.value) {
                                        staff_ids.push(this.value);
                                    }
                                });
                            }

                            var sequence = {
                                0 : {
                                    service_id: $service_field.val(),
                                    staff_ids: staff_ids,
                                    number_of_persons: $nop_field.val()
                                }
                            };

                            $.ajax({
                                type: 'POST',
                                url: Bookme.ajaxurl,
                                data: {
                                    action: 'bookme_get_availability',
                                    csrf_token: Bookme.csrf_token,
                                    form_id: form_id,
                                    sequence: sequence,
                                    date: $calendar.data('date')
                                },
                                dataType: 'json',
                                xhrFields: {withCredentials: true},
                                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                success: function (response) {
                                    if (response.success) {
                                        Bookme.csrf_token = response.csrf_token;
                                        var slots = response.availability;
                                        //initTooltip();
                                        $('.bookme-calendar').find('.day').each(function () {
                                            if (!$(this).hasClass("past") && !$(this).hasClass("adjacent-month")) {
                                                var caldate = $(this).data('date');
                                                if (slots[caldate] != undefined) {
                                                    $(this).attr("title", slots[caldate]);
                                                    $(this).removeClass('bookme-hide');
                                                } else {
                                                    $(this).attr("title", Bookme.not_available);
                                                    $(this).addClass('bookme-hide');
                                                }
                                                $(this).bookme_tooltip();
                                            }
                                        });
                                    }
                                    $calendar.css('opacity', 1).removeClass('bookme-loader');
                                }
                            });

                        }

                        function set_select($select, data, value) {
                            // reset select
                            $('option:not([value=""])', $select).remove();
                            // and fill the new data
                            var docFragment = document.createDocumentFragment();

                            function valuesToArray(obj) {
                                return Object.keys(obj).map(function (key) {
                                    return obj[key];
                                });
                            }

                            function compare(a, b) {
                                if (parseInt(a.position) < parseInt(b.position))
                                    return -1;
                                if (parseInt(a.position) > parseInt(b.position))
                                    return 1;
                                return 0;
                            }

                            // sort select by position
                            data = valuesToArray(data).sort(compare);

                            $.each(data, function (key, object) {
                                var option = document.createElement('option');
                                option.value = object.id;
                                option.text = object.name;
                                docFragment.appendChild(option);
                            });
                            $select.append(docFragment);
                            // set default value of select
                            $select.val(value);
                        }

                        function set_selects(category_id, service_id, staff_id) {
                            var _staff = {}, _services = {}, _categories = {}, _nop = {};
                            $.each(staff, function (id, staff_member) {
                                if (!service_id) {
                                    if (!category_id) {
                                        _staff[id] = staff_member;
                                    } else {
                                        $.each(staff_member.services, function (s_id) {
                                            if (services[s_id].category_id == category_id) {
                                                _staff[id] = staff_member;
                                                return false;
                                            }
                                        });
                                    }
                                } else if (staff_member.services.hasOwnProperty(service_id)) {
                                    if (staff_member.services[service_id].price != null) {
                                        _staff[id] = {
                                            id: id,
                                            name: staff_member.name + ' (' + staff_member.services[service_id].price + ')',
                                            position: staff_member.position
                                        };
                                    } else {
                                        _staff[id] = staff_member;
                                    }
                                }
                            });

                            _categories = categories;
                            $.each(services, function (id, service) {
                                if (!category_id || service.category_id == category_id) {
                                    if (!staff_id || staff[staff_id].services.hasOwnProperty(id)) {
                                        _services[id] = service;
                                    }
                                }
                            });

                            var nop = $nop_field.val();
                            var max_capacity = service_id
                                ? (staff_id
                                    ? staff[staff_id].services[service_id].max_capacity
                                    : services[service_id].max_capacity)
                                : 1;
                            var min_capacity = service_id
                                ? (staff_id
                                    ? staff[staff_id].services[service_id].min_capacity
                                    : services[service_id].min_capacity)
                                : 1;
                            for (var i = min_capacity; i <= max_capacity; ++i) {
                                _nop[i] = {id: i, name: i, pos: i};
                            }
                            if (nop > max_capacity) {
                                nop = max_capacity;
                            }
                            if (nop < min_capacity || !attributes.show_number_of_persons) {
                                nop = min_capacity;
                            }
                            set_select($category_field, _categories, category_id);
                            set_select($service_field, _services, service_id);
                            set_select($employee_field, _staff, staff_id);
                            set_select($nop_field, _nop, nop);
                        }
                    }
                }
            });
        }

        function render_time_step(_data, error, _failed_callback){

            var data = $.extend({
                action: 'bookme_get_time_step',
                csrf_token: Bookme.csrf_token,
                form_id: form_id
            }, _data);

            $.ajax({
                url: Bookme.ajaxurl,
                data: data,
                dataType: 'json',
                xhrFields: {withCredentials: true},
                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                success: function (response) {
                    if (response.success == false) {
                        if(_failed_callback){
                            _failed_callback(response);
                        }
                        return;
                    }
                    Bookme.csrf_token = response.csrf_token;
                    $booking_wrapper.html(response.html);

                    if (error) {
                        $booking_wrapper.find('.bookme-form-error').html(error);
                    } else {
                        $booking_wrapper.find('.bookme-form-error').hide();
                    }

                    // scroll content
                    $('.bookme-timeslot-scroll').TrackpadScrollEmulator();

                    scrollTo($booking_wrapper);

                    $('.bookme-back', $booking_wrapper).on('click', function (e) {
                        e.preventDefault();
                        $(this).addClass('bookme-loader').prop('disabled',true);
                        render_service_step();
                    });

                    $('.bookme-cart', $booking_wrapper).on('click', function (e) {
                        e.preventDefault();
                        $(this).addClass('bookme-loader').prop('disabled',true);
                        render_cart_step({from_step: 'time'});
                    });

                    $('.bookme-timeslot-button', $booking_wrapper).on('click', function (e) {
                        e.preventDefault();
                        var $this = $(this);

                        $this.addClass('bookme-loader').prop('disabled',true);
                        if (Bookme.cart.enabled) {
                            render_cart_step({add_to_cart: true, from_step: 'time', slots: this.value});
                        } else {
                            render_detail_step({add_to_cart: true, slots: this.value});
                        }
                    });
                }
            });

        }

        function render_cart_step(_data, error, _failed_callback) {
            if (!Bookme.cart.enabled) {
                render_detail_step(_data);
            } else {
                if (_data && _data.from_step) {
                    Bookme.cart.prev_step = _data.from_step;
                }

                var data = $.extend({
                    action: 'bookme_get_cart_step',
                    csrf_token: Bookme.csrf_token,
                    form_id: form_id
                }, _data);

                $.ajax({
                    url: Bookme.ajaxurl,
                    data: data,
                    dataType: 'json',
                    xhrFields: {withCredentials: true},
                    crossDomain: 'withCredentials' in new XMLHttpRequest(),
                    success: function (response) {
                        if (response.success) {
                            Bookme.csrf_token = response.csrf_token;

                            $booking_wrapper.html(response.html);

                            if (error) {
                                $('.bookme-form-error', $booking_wrapper).html(error.message);
                                $('tr[data-key="' + error.failed_key + '"]', $booking_wrapper).addClass('bookme-form-error');
                            } else {
                                $('.bookme-form-error', $booking_wrapper).hide();
                            }
                            scrollTo($booking_wrapper);

                            $('.bookme-cart-add', $booking_wrapper).on('click', function () {
                                $(this).addClass('bookme-loader').prop('disabled',true);
                                render_service_step({reset_sequence: true});
                            });

                            $('.bookme-cart-edit', $booking_wrapper).on('click', function () {
                                var $this = $(this);
                                $this.addClass('bookme-loader').prop('disabled',true);
                                render_service_step({edit_cart_item: $this.closest('tr').data('key')});
                            });
                            $('.bookme-cart-delete', $booking_wrapper).on('click', function () {
                                var $this = $(this),
                                    $cart_item = $this.closest('tr');

                                $this.addClass('bookme-loader').prop('disabled',true);
                                $.ajax({
                                    url: Bookme.ajaxurl,
                                    data: {
                                        action: 'bookme_cart_delete_item',
                                        csrf_token: Bookme.csrf_token,
                                        form_id: form_id,
                                        key: $cart_item.data('key')
                                    },
                                    dataType: 'json',
                                    xhrFields: {withCredentials: true},
                                    crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                    success: function (response) {
                                        if (response.success) {
                                            var $trs_to_remove = $('tr[data-key="' + $cart_item.data('cart-key') + '"]', $booking_wrapper);

                                            $cart_item.delay(300).fadeOut(200, function () {
                                                $('.bookme-cart-total', $booking_wrapper).html(response.data.total_price);
                                                $trs_to_remove.remove();
                                                if ($('tr[data-key]', $booking_wrapper).length == 0) {
                                                    $('.bookme-back', $booking_wrapper).hide();
                                                    $('.bookme-next', $booking_wrapper).hide();
                                                }
                                            });
                                        }
                                    }
                                });
                            });

                            $('.bookme-back', $booking_wrapper).on('click', function (e) {
                                e.preventDefault();
                                $(this).addClass('bookme-loader').prop('disabled',true);
                                switch (Bookme.cart.prev_step) {
                                    case 'service':
                                        render_service_step();
                                        break;
                                    case 'time':
                                        render_time_step();
                                        break;
                                    default:
                                        render_service_step();
                                }
                            });

                            $('.bookme-next', $booking_wrapper).on('click', function () {
                                $(this).addClass('bookme-loader').prop('disabled',true);
                                render_detail_step();
                            });
                        }
                    }
                });
            }
        }

        function render_detail_step(_data, _failed_callback){
            var data = $.extend({
                action: 'bookme_get_detail_step',
                csrf_token: Bookme.csrf_token,
                form_id: form_id,
                page_url: document.URL.split('#')[0]
            }, _data);

            $.ajax({
                url: Bookme.ajaxurl,
                data: data,
                dataType: 'json',
                xhrFields: {withCredentials: true},
                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                success: function (response) {
                    if (response.success) {
                        Bookme.csrf_token = response.csrf_token;

                        $booking_wrapper.html(response.html);
                        scrollTo($booking_wrapper);

                        // Init stripe form
                        if ($booking_wrapper.find('#bookme-stripe-card-element').length) {
                            if (response.stripe_publishable_key) {
                                var stripe = Stripe(response.stripe_publishable_key, {
                                    betas: ['payment_intent_beta_3']
                                });
                                var elements = stripe.elements();
                                var stripe_card = elements.create("card");
                                stripe_card.mount("#bookme-stripe-card-element");
                            }
                        }

                        var $full_name_field = $('.bookme-full-name', $booking_wrapper),
                            $first_name_field = $('.bookme-first-name', $booking_wrapper),
                            $last_name_field = $('.bookme-last-name', $booking_wrapper),
                            $phone_field = $('.bookme-phone', $booking_wrapper),
                            $email_field = $('.bookme-email', $booking_wrapper),
                            $full_name_error = $('.bookme-full-name-error', $booking_wrapper),
                            $first_name_error = $('.bookme-first-name-error', $booking_wrapper),
                            $last_name_error = $('.bookme-last-name-error', $booking_wrapper),
                            $phone_error = $('.bookme-phone-error', $booking_wrapper),
                            $email_error = $('.bookme-email-error', $booking_wrapper),
                            $g_recaptcha = $('.bookme-g-recaptcha', $booking_wrapper),
                            $errors = $('.bookme-full-name-error, .bookme-first-name-error, .bookme-last-name-error, .bookme-phone-error, .bookme-email-error, .bookme-custom-field-error', $booking_wrapper),
                            $fields = $('.bookme-full-name, .bookme-first-name, .bookme-last-name, .bookme-phone, .bookme-email, .bookme-custom-field', $booking_wrapper),
                            $modals = $('.bookme-modal', $booking_wrapper),
                            $login_modal = $('.bookme-login-modal', $booking_wrapper),
                            $customer_modal = $('.bookme-customer-modal', $booking_wrapper),
                            $payments = $('.bookme-payment', $booking_wrapper),
                            $payment_tabs = $('.bookme-pay-tab', $booking_wrapper),
                            $apply_coupon_button = $('.bookme-apply-coupon', $booking_wrapper),
                            $coupon_input = $('input.bookme-coupon-field', $booking_wrapper),
                            $coupon_discount = $('.bookme-discount-price', $booking_wrapper),
                            $coupon_total = $('.bookme-total-price', $booking_wrapper),
                            $coupon_error = $('.bookme-coupon-error', $booking_wrapper),
                            $bookme_payment_wrapper = $('.bookme-payment-wrapper', $booking_wrapper),
                            phone_number = '',
                            g_recaptcha_id = null;

                            $(".bookme-custom-field").eq(0).attr("placeholder", "1252TU99")
                            $(".bookme-custom-field").eq(1).attr("placeholder", "000000km")
                            

                        if (booking_status.status == 'cancelled') {
                            booking_status.status = 'ok';
                        }

                        if (Bookme.intlTelInput.enabled) {
                            $phone_field.intlTelInput({
                                preferredCountries: [Bookme.intlTelInput.country],
                                initialCountry: Bookme.intlTelInput.country,
                                geoIpLookup: function (callback) {
                                    $.get('https://ipinfo.io', function () {
                                    }, 'jsonp').always(function (resp) {
                                        var countryCode = (resp && resp.country) ? resp.country : '';
                                        callback(countryCode);
                                    });
                                },
                                utilsScript: Bookme.intlTelInput.utils
                            });
                        }

                        if($g_recaptcha.length) {
                            var recaptcha = {
                                sitekey: ''
                            };
                            if ($g_recaptcha.width() <= 300) {
                                recaptcha['size'] = 'compact';
                            }
                            g_recaptcha_id = grecaptcha.render($g_recaptcha.get(0), recaptcha);
                        }

                        $payments.on('click', function () {
                            $payment_tabs.slideUp();
                            $('.bookme-' + $(this).data('tab'), $booking_wrapper).slideDown();
                        });
                        $payments.eq(0).trigger('click');

                        $('body > .bookme-modal.' + form_id).remove();
                        $modals
                            .addClass(form_id).appendTo('body')
                            .on('click', '.bookme-modal-dismiss', function (e) {
                                e.preventDefault();
                                $(e.delegateTarget).removeClass('bookme-modal-show')
                                    .find('form').trigger('reset').end()
                                    .find('input').removeClass('bookme-error').end()
                                    .find('.bookme-form-error').html('');
                            });

                        // Login modal
                        $('.bookme-login-dialog-show', $booking_wrapper).on('click', function (e) {
                            e.preventDefault();
                            $login_modal.addClass('bookme-modal-show');
                        });

                        $('form', $login_modal).on('submit', function (e) {
                            e.preventDefault();
                            var $button = $(this).find('.bookme-modal-submit');
                            $button.addClass('bookme-loader').prop('disabled',true);
                            $.ajax({
                                type: 'POST',
                                url: Bookme.ajaxurl,
                                data: {
                                    action: 'bookme_wp_user_login',
                                    csrf_token: Bookme.csrf_token,
                                    form_id: form_id,
                                    log: $login_modal.find('[name="log"]').val(),
                                    pwd: $login_modal.find('[name="pwd"]').val(),
                                    rememberme: $login_modal.find('[name="rememberme"]').prop('checked') ? 1 : 0
                                },
                                dataType: 'json',
                                xhrFields: {withCredentials: true},
                                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                success: function (response) {
                                    if (response.success) {
                                        Bookme.csrf_token = response.data.csrf_token;
                                        $('.bookme-login-dialog-show', $booking_wrapper).parent().fadeOut('slow');
                                        $full_name_field.val(response.data.full_name).removeClass('bookme-error');
                                        $first_name_field.val(response.data.first_name).removeClass('bookme-error');
                                        $last_name_field.val(response.data.last_name).removeClass('bookme-error');
                                        if (response.data.phone) {
                                            $phone_field.removeClass('bookme-error');
                                            if (Bookme.intlTelInput.enabled) {
                                                $phone_field.intlTelInput('setNumber', response.data.phone);
                                            } else {
                                                $phone_field.val(response.data.phone);
                                            }
                                        }
                                        $email_field.val(response.data.email).removeClass('bookme-error');
                                        $errors.filter(':not(.bookme-custom-field-error)').html('');
                                        $login_modal.removeClass('bookme-modal-show');
                                    } else if (response.error) {
                                        $login_modal.find('input').addClass('bookme-error');
                                        $login_modal.find('.bookme-form-error').html(response.error);
                                    }
                                    $button.removeClass('bookme-loader').prop('disabled',false);
                                }
                            })
                        });

                        // Customer modal
                        $('.bookme-modal-submit', $customer_modal).on('click', function (e) {
                            e.preventDefault();
                            $customer_modal.removeClass('bookme-modal-show');
                            $('.bookme-next', $booking_wrapper).trigger('click', [1]);
                        });

                        $apply_coupon_button.on('click', function (e) {
                            var $this = $(this);
                            $coupon_error.text('');
                            $coupon_input.removeClass('bookme-error');

                            var data = {
                                action: 'bookme_apply_coupon',
                                csrf_token: Bookme.csrf_token,
                                form_id: form_id,
                                coupon: $coupon_input.val()
                            };

                            $this.addClass('bookme-loader').prop('disabled',true);

                            $.ajax({
                                type: 'POST',
                                url: Bookme.ajaxurl,
                                data: data,
                                dataType: 'json',
                                xhrFields: {withCredentials: true},
                                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                success: function (response) {
                                    if (response.success) {
                                        $coupon_input.parent().removeClass('bookme-d-flex');
                                        $coupon_input.replaceWith(data.coupon);
                                        $apply_coupon_button.replaceWith(' <strong>✓</strong>');
                                        $coupon_discount.text(response.discount);
                                        $coupon_total.text(response.total);
                                        if (response.total_simple <= 0) {
                                            $bookme_payment_wrapper.hide();
                                            $('.bookme-coupon-free', $booking_wrapper).attr('checked', 'checked').val(data.coupon);
                                        } else {
                                            // Set new price for hidden payment fields
                                            $('input.bookme-payment-amount', $booking_wrapper).val(response.total_simple);
                                        }
                                    } else if (response.error) {
                                        $coupon_error.html(response.error);
                                        $coupon_input.addClass('bookme-error');
                                        scrollTo($coupon_error);
                                    }
                                    $this.removeClass('bookme-loader').prop('disabled',false);
                                },
                                error: function () {
                                    $this.removeClass('bookme-loader').prop('disabled',false);
                                }
                            });
                        });

                        $('.bookme-next', $booking_wrapper).on('click', function (e, force_update_customer) {
                            e.preventDefault();

                            var custom_fields = [],
                                checkbox_values,
                                captcha_ids = [],
                                $this = $(this);

                            $('.bookme-custom-fields-wrapper', $booking_wrapper).each(function () {
                                var $cf_container = $(this),
                                    key = $cf_container.data('key'),
                                    custom_fields_data = [];
                                $('.bookme-form-group', $cf_container).each(function () {
                                    var $this = $(this);
                                    switch ($this.data('type')) {
                                        case 'text-field':
                                            custom_fields_data.push({
                                                id: $this.data('id'),
                                                value: $this.find('input.bookme-custom-field').val()
                                            });
                                            break;
                                        case 'textarea':
                                            custom_fields_data.push({
                                                id: $this.data('id'),
                                                value: $this.find('textarea.bookme-custom-field').val()
                                            });
                                            break;
                                        case 'checkboxes':
                                            checkbox_values = [];
                                            $this.find('input.bookme-custom-field:checked').each(function () {
                                                checkbox_values.push(this.value);
                                            });
                                            custom_fields_data.push({
                                                id: $this.data('id'),
                                                value: checkbox_values
                                            });
                                            break;
                                        case 'radio-buttons':
                                            custom_fields_data.push({
                                                id: $this.data('id'),
                                                value: $this.find('input.bookme-custom-field:checked').val() || null
                                            });
                                            break;
                                        case 'drop-down':
                                            custom_fields_data.push({
                                                id: $this.data('id'),
                                                value: $this.find('select.bookme-custom-field').val()
                                            });
                                            break;
                                        case 'captcha':
                                            custom_fields_data.push({
                                                id: $this.data('id'),
                                                value: g_recaptcha_id != null ? grecaptcha.getResponse(g_recaptcha_id) : null
                                            });
                                            captcha_ids.push($this.data('id'));
                                            break;
                                    }
                                });

                                custom_fields[key] = {custom_fields: JSON.stringify(custom_fields_data)};


                            });

                            try {
                                phone_number = Bookme.intlTelInput.enabled ? $phone_field.intlTelInput('getNumber') : $phone_field.val();
                                if (phone_number == '') {
                                    phone_number = $phone_field.val();
                                }
                            } catch (error) {  // In case when intlTelInput can't return phone number.
                                phone_number = $phone_field.val();
                            }

                            var data = {
                                action: 'bookme_save_session',
                                csrf_token: Bookme.csrf_token,
                                form_id: form_id,
                                full_name: $full_name_field.val(),
                                first_name: $first_name_field.val(),
                                last_name: $last_name_field.val(),
                                phone: phone_number,
                                email: $email_field.val(),
                                cart: custom_fields,
                                captcha_ids: JSON.stringify(captcha_ids),
                                force_update_customer: force_update_customer
                            };

                            $this.addClass('bookme-loader').prop('disabled',true);
                            $.ajax({
                                type: 'POST',
                                url: Bookme.ajaxurl,
                                data: data,
                                dataType: 'json',
                                xhrFields: {withCredentials: true},
                                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                success: function (response) {
                                    // Error messages
                                    $errors.empty();
                                    $fields.removeClass('bookme-error');

                                    if (response.success) {
                                        // woocommerce payment
                                        if (Bookme.woocommerce.enabled) {
                                            var data = {
                                                action: 'bookme_add_to_wc_cart',
                                                csrf_token: Bookme.csrf_token,
                                                form_id: form_id
                                            };
                                            $.ajax({
                                                type: 'POST',
                                                url: Bookme.ajaxurl,
                                                data: data,
                                                dataType: 'json',
                                                xhrFields: {withCredentials: true},
                                                crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                success: function (response) {
                                                    if (response.success) {
                                                        window.location.href = Bookme.woocommerce.cart_url;
                                                    } else {
                                                        $this.removeClass('bookme-loader').prop('disabled',false);
                                                        render_time_step(undefined, response.error);
                                                    }
                                                }
                                            });
                                        } else {
                                            // local payment
                                            if ($('.bookme-payment[value=local]', $booking_wrapper).is(':checked') || $('.bookme-coupon-free', $booking_wrapper).is(':checked') || $('.bookme-payment:checked', $booking_wrapper).val() == undefined) {
                                                e.preventDefault();

                                                $.ajax({
                                                    type: 'POST',
                                                    url: Bookme.ajaxurl,
                                                    data: {
                                                        action: 'bookme_save_cart_bookings',
                                                        csrf_token: Bookme.csrf_token,
                                                        form_id: form_id
                                                    },
                                                    dataType: 'json',
                                                    xhrFields: {withCredentials: true},
                                                    crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                    success: function (response) {
                                                        if (response.success) {
                                                            render_done_step();
                                                        } else if (response.failed_cart_key != undefined) {
                                                            if (Bookme.cart.enabled) {
                                                                render_cart_step(undefined, {
                                                                    failed_key: response.failed_cart_key,
                                                                    message: response.error
                                                                });
                                                            } else {
                                                                render_time_step(undefined, response.error);
                                                            }
                                                        }
                                                    }
                                                });

                                            } else if ($('.bookme-payment[value=card]', $booking_wrapper).is(':checked')) {
                                                // card payment
                                                if($('.bookme-payment[data-tab=stripe]', $booking_wrapper).is(':checked')) {
                                                    // stripe SCA
                                                    var $form = $booking_wrapper.find('.bookme-stripe');

                                                    $.ajax({
                                                        type: 'POST',
                                                        url: Bookme.ajaxurl,
                                                        data: {
                                                            action: 'bookme_stripe_create_intent',
                                                            csrf_token: Bookme.csrf_token,
                                                            form_id: form_id
                                                        },
                                                        dataType: 'json',
                                                        xhrFields: {withCredentials: true},
                                                        crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                        success: function (response) {
                                                            if (response.success) {
                                                                stripe.handleCardPayment(
                                                                    response.intent_secret,
                                                                    stripe_card
                                                                ).then(function (result) {
                                                                    if (result.error) {
                                                                        $.ajax({
                                                                            type: 'POST',
                                                                            url: Bookme.ajaxurl,
                                                                            data: {
                                                                                action: 'bookme_stripe_failed_payment',
                                                                                csrf_token: Bookme.csrf_token,
                                                                                form_id: form_id,
                                                                                intent_id: response.intent_id
                                                                            },
                                                                            dataType: 'json',
                                                                            xhrFields: {withCredentials: true},
                                                                            crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                                            success: function (response) {
                                                                                if (response.success) {
                                                                                    $this.removeClass('bookme-loader').prop('disabled',false);
                                                                                    $form.find('.bookme-card-error').text(result.error.message);
                                                                                }
                                                                            }
                                                                        });
                                                                    } else {
                                                                        $.ajax({
                                                                            type: 'POST',
                                                                            url: Bookme.ajaxurl,
                                                                            data: {
                                                                                action: 'bookme_stripe_process_payment',
                                                                                csrf_token: Bookme.csrf_token,
                                                                                form_id: form_id,
                                                                                intent_id: response.intent_id
                                                                            },
                                                                            dataType: 'json',
                                                                            xhrFields: {withCredentials: true},
                                                                            crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                                            success: function (response) {
                                                                                if (response.success) {
                                                                                    render_done_step();
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }else if (response.failed_cart_key != undefined) {
                                                                if (Bookme.cart.enabled) {
                                                                    render_cart_step(undefined, {
                                                                        failed_key: response.failed_cart_key,
                                                                        message: response.error
                                                                    });
                                                                } else {
                                                                    render_time_step(undefined, response.error);
                                                                }
                                                            } else {
                                                                $this.removeClass('bookme-loader').prop('disabled',false);
                                                                $form.find('.bookme-card-error').text(response.error);
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    // authorize.net
                                                    var card_action = 'bookme_authorize_net';
                                                    var $form = $booking_wrapper.find('.bookme-authorize-net');
                                                    e.preventDefault();

                                                    var data = {
                                                        action: card_action,
                                                        csrf_token: Bookme.csrf_token,
                                                        card: {
                                                            number: $form.find('input[name="card_number"]').val(),
                                                            cvc: $form.find('input[name="card_cvc"]').val(),
                                                            exp_month: $form.find('select[name="card_exp_month"]').val(),
                                                            exp_year: $form.find('select[name="card_exp_year"]').val()
                                                        },
                                                        form_id: form_id
                                                    };

                                                    $.ajax({
                                                        type: 'POST',
                                                        url: Bookme.ajaxurl,
                                                        data: data,
                                                        dataType: 'json',
                                                        xhrFields: {withCredentials: true},
                                                        crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                        success: function (response) {
                                                            if (response.success) {
                                                                render_done_step();
                                                            } else if (response.failed_cart_key != undefined) {
                                                                if (Bookme.cart.enabled) {
                                                                    render_cart_step(undefined, {
                                                                        failed_key: response.failed_cart_key,
                                                                        message: response.error
                                                                    });
                                                                } else {
                                                                    render_time_step(undefined, response.error);
                                                                }
                                                            } else {
                                                                $this.removeClass('bookme-loader').prop('disabled',false);
                                                                $form.find('.bookme-card-error').text(response.error);
                                                            }
                                                        }
                                                    });
                                                }

                                            } else if ($('.bookme-payment[value=paypal]', $booking_wrapper).is(':checked')
                                                || $('.bookme-payment[value=2checkout]', $booking_wrapper).is(':checked')
                                                || $('.bookme-payment[value=mollie]', $booking_wrapper).is(':checked')
                                            ) {
                                                e.preventDefault();
                                                var $pay = $('.bookme-payment:checked', $booking_wrapper).val();
                                                $form = $('form.bookme-' + $pay + '-form', $booking_wrapper);
                                                $.ajax({
                                                    type: 'POST',
                                                    url: Bookme.ajaxurl,
                                                    xhrFields: {withCredentials: true},
                                                    crossDomain: 'withCredentials' in new XMLHttpRequest(),
                                                    data: {
                                                        action: 'bookme_check_cart',
                                                        csrf_token: Bookme.csrf_token,
                                                        form_id: form_id
                                                    },
                                                    dataType: 'json',
                                                    success: function (response) {
                                                        if (response.success) {
                                                            $form.submit();
                                                        } else if (response.failed_cart_key != undefined) {
                                                            if (Bookme.cart.enabled) {
                                                                render_cart_step(undefined, {
                                                                    failed_key: response.failed_cart_key,
                                                                    message: response.error
                                                                });
                                                            } else {
                                                                render_time_step(undefined, response.error);
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    }else{
                                        $this.removeClass('bookme-loader').prop('disabled',false);
                                        var $scroll_to = null;
                                        if (response.bookings_limit) {
                                            render_done_step(['bookings_limit'])
                                        } else {
                                            if (response.full_name) {
                                                $full_name_error.html(response.full_name);
                                                $full_name_field.addClass('bookme-error');
                                                $scroll_to = $full_name_field;
                                            }
                                            if (response.first_name) {
                                                $first_name_error.html(response.first_name);
                                                $first_name_field.addClass('bookme-error');
                                                if ($scroll_to === null) {
                                                    $scroll_to = $first_name_field;
                                                }
                                            }
                                            if (response.last_name) {
                                                $last_name_error.html(response.last_name);
                                                $last_name_field.addClass('bookme-error');
                                                if ($scroll_to === null) {
                                                    $scroll_to = $last_name_field;
                                                }
                                            }
                                            if (response.phone) {
                                                $phone_error.html(response.phone);
                                                $phone_field.addClass('bookme-error');
                                                if ($scroll_to === null) {
                                                    $scroll_to = $phone_field;
                                                }
                                            }
                                            if (response.email) {
                                                $email_error.html(response.email);
                                                $email_field.addClass('bookme-error');
                                                if ($scroll_to === null) {
                                                    $scroll_to = $email_field;
                                                }
                                            }
                                            if (response.custom_fields) {
                                                
                                             

                                                $.each(response.custom_fields, function (key, fields) {
                                                    $.each(fields, function (field_id, message) {
                                                        var $custom_fields_collector = $('.bookme-custom-fields-wrapper[data-key="' + key + '"]', $booking_wrapper);
                                                        var $div = $('[data-id="' + field_id + '"]', $custom_fields_collector);
                                                        $div.find('.bookme-custom-field-error').html('Veuillez saisir les champs en rouge');
                                                        //$(".bookme-custom-field-error").eq(0).html("")

                                                        $div.find('.bookme-custom-field').addClass('bookme-error');
                                                        if ($scroll_to === null) {
                                                            $scroll_to = $div;
                                                        }
                                                    });
                                                });
                                            }
                                            if (response.customer) {
                                                $customer_modal
                                                    .find('.bookme-modal-body').html(response.customer).end()
                                                    .addClass('bookme-modal-show')
                                                ;
                                            }
                                        }
                                        if ($scroll_to !== null) {
                                            scrollTo($scroll_to);
                                        }
                                    }
                                }
                            });
                        });

                        $('.bookme-back', $booking_wrapper).on('click', function (e) {
                            e.preventDefault();
                            $(this).addClass('bookme-loader').prop('disabled',true);
                            if (Bookme.cart.enabled) {
                                render_cart_step();
                            } else {
                                render_time_step();
                            }
                        });
                    }
                }
            });
        }

        function render_done_step(error){
            if ((typeof error === 'undefined' || error.length == 0) && Bookme.final_step_url) {
                document.location.href = Bookme.final_step_url;
            } else {
                $.ajax({
                    url: Bookme.ajaxurl,
                    data: {
                        action: 'bookme_get_done_step',
                        csrf_token: Bookme.csrf_token,
                        form_id: form_id,
                        errors: error,
                        page_url: document.URL.split('#')[0]
                    },
                    dataType: 'json',
                    xhrFields: {withCredentials: true},
                    crossDomain: 'withCredentials' in new XMLHttpRequest(),
                    success: function (response) {
                        if (response.success) {
                            $booking_wrapper.html(response.html);
                            scrollTo($booking_wrapper);
                        }
                    }
                });
            }
        }

        $.fn.bookme_tooltip = function () {
            var tips = $(this);
            if (!tips.find('.bookme-tooltip').length) {
                tips.append($('<span class="bookme-tooltip"></span>'));
            }

            var data = tips.attr("title");
            tips.attr("title", "");
            tips.find('.bookme-tooltip').html(data);

            tips.onmouseover = tipShow;
            tips.onmouseout = tipHide;
            tips.on('mouseover', tipShow);
            tips.on('mouseout', tipHide);
        };

        function tipShow(e) {
            $(this).find('.bookme-tooltip').addClass('bookme-tooltip-show');
        }

        function tipHide() {
            $(this).find('.bookme-tooltip').removeClass('bookme-tooltip-show');
        }

        function scrollTo($elem) {
            var elemTop = $elem.offset().top;
            var scrollTop = $(window).scrollTop();
            if (elemTop < $(window).scrollTop() || elemTop > scrollTop + window.innerHeight) {
                $('html,body').animate({scrollTop: (elemTop - 24)}, 500);
            }
        }
    };
})(jQuery);
// source --> https://www.suzuki.tn/wp-content/plugins/popup-with-fancybox/inc/jquery.fancybox.js?ver=6.8.2 
/*!
 * fancyBox - jQuery Plugin
 * version: 2.1.5 (Fri, 14 Jun 2013)
 * @requires jQuery v1.6 or later
 *
 * Examples at http://fancyapps.com/fancybox/
 * License: www.fancyapps.com/fancybox/#license
 *
 * Copyright 2012 Janis Skarnelis - janis@fancyapps.com
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

(function (window, document, $, undefined) {
	"use strict";

	var H = $("html"),
		W = $(window),
		D = $(document),
		F = $.fancybox = function () {
			F.open.apply( this, arguments );
		},
		IE =  navigator.userAgent.match(/msie/i),
		didUpdate	= null,
		isTouch		= document.createTouch !== undefined,

		isQuery	= function(obj) {
			return obj && obj.hasOwnProperty && obj instanceof $;
		},
		isString = function(str) {
			return str && $.type(str) === "string";
		},
		isPercentage = function(str) {
			return isString(str) && str.indexOf('%') > 0;
		},
		isScrollable = function(el) {
			return (el && !(el.style.overflow && el.style.overflow === 'hidden') && ((el.clientWidth && el.scrollWidth > el.clientWidth) || (el.clientHeight && el.scrollHeight > el.clientHeight)));
		},
		getScalar = function(orig, dim) {
			var value = parseInt(orig, 10) || 0;

			if (dim && isPercentage(orig)) {
				value = F.getViewport()[ dim ] / 100 * value;
			}

			return Math.ceil(value);
		},
		getValue = function(value, dim) {
			return getScalar(value, dim) + 'px';
		};

	$.extend(F, {
		// The current version of fancyBox
		version: '2.1.5',

		defaults: {
			padding : 15,
			margin  : 20,

			width     : 800,
			height    : 600,
			minWidth  : 100,
			minHeight : 50,
			maxWidth  : 9999,
			maxHeight : 9999,
			pixelRatio: 1, // Set to 2 for retina display support

			autoSize   : true,
			autoHeight : false,
			autoWidth  : false,

			autoResize  : true,
			autoCenter  : !isTouch,
			fitToView   : true,
			aspectRatio : false,
			topRatio    : 0.5,
			leftRatio   : 0.5,

			scrolling : 'auto', // 'auto', 'yes' or 'no'
			wrapCSS   : '',

			arrows     : true,
			closeBtn   : true,
			closeClick : false,
			nextClick  : false,
			mouseWheel : true,
			autoPlay   : false,
			playSpeed  : 3000,
			preload    : 3,
			modal      : false,
			loop       : true,

			ajax  : {
				dataType : 'html',
				headers  : { 'X-fancyBox': true }
			},
			iframe : {
				scrolling : 'auto',
				preload   : true
			},
			swf : {
				wmode: 'transparent',
				allowfullscreen   : 'true',
				allowscriptaccess : 'always'
			},

			keys  : {
				next : {
					13 : 'left', // enter
					34 : 'up',   // page down
					39 : 'left', // right arrow
					40 : 'up'    // down arrow
				},
				prev : {
					8  : 'right',  // backspace
					33 : 'down',   // page up
					37 : 'right',  // left arrow
					38 : 'down'    // up arrow
				},
				close  : [27], // escape key
				play   : [32], // space - start/stop slideshow
				toggle : [70]  // letter "f" - toggle fullscreen
			},

			direction : {
				next : 'left',
				prev : 'right'
			},

			scrollOutside  : true,

			// Override some properties
			index   : 0,
			type    : null,
			href    : null,
			content : null,
			title   : null,

			// HTML templates
			tpl: {
				wrap     : '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
				image    : '<img class="fancybox-image" src="{href}" alt="" />',
				iframe   : '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + '></iframe>',
				error    : '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
				closeBtn : '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',
				next     : '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',
				prev     : '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'
			},

			// Properties for each animation type
			// Opening fancyBox
			openEffect  : 'fade', // 'elastic', 'fade' or 'none'
			openSpeed   : 250,
			openEasing  : 'swing',
			openOpacity : true,
			openMethod  : 'zoomIn',

			// Closing fancyBox
			closeEffect  : 'fade', // 'elastic', 'fade' or 'none'
			closeSpeed   : 250,
			closeEasing  : 'swing',
			closeOpacity : true,
			closeMethod  : 'zoomOut',

			// Changing next gallery item
			nextEffect : 'elastic', // 'elastic', 'fade' or 'none'
			nextSpeed  : 250,
			nextEasing : 'swing',
			nextMethod : 'changeIn',

			// Changing previous gallery item
			prevEffect : 'elastic', // 'elastic', 'fade' or 'none'
			prevSpeed  : 250,
			prevEasing : 'swing',
			prevMethod : 'changeOut',

			// Enable default helpers
			helpers : {
				overlay : true,
				title   : true
			},

			// Callbacks
			onCancel     : $.noop, // If canceling
			beforeLoad   : $.noop, // Before loading
			afterLoad    : $.noop, // After loading
			beforeShow   : $.noop, // Before changing in current item
			afterShow    : $.noop, // After opening
			beforeChange : $.noop, // Before changing gallery item
			beforeClose  : $.noop, // Before closing
			afterClose   : $.noop  // After closing
		},

		//Current state
		group    : {}, // Selected group
		opts     : {}, // Group options
		previous : null,  // Previous element
		coming   : null,  // Element being loaded
		current  : null,  // Currently loaded element
		isActive : false, // Is activated
		isOpen   : false, // Is currently open
		isOpened : false, // Have been fully opened at least once

		wrap  : null,
		skin  : null,
		outer : null,
		inner : null,

		player : {
			timer    : null,
			isActive : false
		},

		// Loaders
		ajaxLoad   : null,
		imgPreload : null,

		// Some collections
		transitions : {},
		helpers     : {},

		/*
		 *	Static methods
		 */

		open: function (group, opts) {
			if (!group) {
				return;
			}

			if (!$.isPlainObject(opts)) {
				opts = {};
			}

			// Close if already active
			if (false === F.close(true)) {
				return;
			}

			// Normalize group
			if (!$.isArray(group)) {
				group = isQuery(group) ? $(group).get() : [group];
			}

			// Recheck if the type of each element is `object` and set content type (image, ajax, etc)
			$.each(group, function(i, element) {
				var obj = {},
					href,
					title,
					content,
					type,
					rez,
					hrefParts,
					selector;

				if ($.type(element) === "object") {
					// Check if is DOM element
					if (element.nodeType) {
						element = $(element);
					}

					if (isQuery(element)) {
						obj = {
							href    : element.data('fancybox-href') || element.attr('href'),
							title   : element.data('fancybox-title') || element.attr('title'),
							isDom   : true,
							element : element
						};

						if ($.metadata) {
							$.extend(true, obj, element.metadata());
						}

					} else {
						obj = element;
					}
				}

				href  = opts.href  || obj.href || (isString(element) ? element : null);
				title = opts.title !== undefined ? opts.title : obj.title || '';

				content = opts.content || obj.content;
				type    = content ? 'html' : (opts.type  || obj.type);

				if (!type && obj.isDom) {
					type = element.data('fancybox-type');

					if (!type) {
						rez  = element.prop('class').match(/fancybox\.(\w+)/);
						type = rez ? rez[1] : null;
					}
				}

				if (isString(href)) {
					// Try to guess the content type
					if (!type) {
						if (F.isImage(href)) {
							type = 'image';

						} else if (F.isSWF(href)) {
							type = 'swf';

						} else if (href.charAt(0) === '#') {
							type = 'inline';

						} else if (isString(element)) {
							type    = 'html';
							content = element;
						}
					}

					// Split url into two pieces with source url and content selector, e.g,
					// "/mypage.html #my_id" will load "/mypage.html" and display element having id "my_id"
					if (type === 'ajax') {
						hrefParts = href.split(/\s+/, 2);
						href      = hrefParts.shift();
						selector  = hrefParts.shift();
					}
				}

				if (!content) {
					if (type === 'inline') {
						if (href) {
							content = $( isString(href) ? href.replace(/.*(?=#[^\s]+$)/, '') : href ); //strip for ie7

						} else if (obj.isDom) {
							content = element;
						}

					} else if (type === 'html') {
						content = href;

					} else if (!type && !href && obj.isDom) {
						type    = 'inline';
						content = element;
					}
				}

				$.extend(obj, {
					href     : href,
					type     : type,
					content  : content,
					title    : title,
					selector : selector
				});

				group[ i ] = obj;
			});

			// Extend the defaults
			F.opts = $.extend(true, {}, F.defaults, opts);

			// All options are merged recursive except keys
			if (opts.keys !== undefined) {
				F.opts.keys = opts.keys ? $.extend({}, F.defaults.keys, opts.keys) : false;
			}

			F.group = group;

			return F._start(F.opts.index);
		},

		// Cancel image loading or abort ajax request
		cancel: function () {
			var coming = F.coming;

			if (!coming || false === F.trigger('onCancel')) {
				return;
			}

			F.hideLoading();

			if (F.ajaxLoad) {
				F.ajaxLoad.abort();
			}

			F.ajaxLoad = null;

			if (F.imgPreload) {
				F.imgPreload.onload = F.imgPreload.onerror = null;
			}

			if (coming.wrap) {
				coming.wrap.stop(true, true).trigger('onReset').remove();
			}

			F.coming = null;

			// If the first item has been canceled, then clear everything
			if (!F.current) {
				F._afterZoomOut( coming );
			}
		},

		// Start closing animation if is open; remove immediately if opening/closing
		close: function (event) {
			F.cancel();

			if (false === F.trigger('beforeClose')) {
				return;
			}

			F.unbindEvents();

			if (!F.isActive) {
				return;
			}

			if (!F.isOpen || event === true) {
				$('.fancybox-wrap').stop(true).trigger('onReset').remove();

				F._afterZoomOut();

			} else {
				F.isOpen = F.isOpened = false;
				F.isClosing = true;

				$('.fancybox-item, .fancybox-nav').remove();

				F.wrap.stop(true, true).removeClass('fancybox-opened');

				F.transitions[ F.current.closeMethod ]();
			}
		},

		// Manage slideshow:
		//   $.fancybox.play(); - toggle slideshow
		//   $.fancybox.play( true ); - start
		//   $.fancybox.play( false ); - stop
		play: function ( action ) {
			var clear = function () {
					clearTimeout(F.player.timer);
				},
				set = function () {
					clear();

					if (F.current && F.player.isActive) {
						F.player.timer = setTimeout(F.next, F.current.playSpeed);
					}
				},
				stop = function () {
					clear();

					D.unbind('.player');

					F.player.isActive = false;

					F.trigger('onPlayEnd');
				},
				start = function () {
					if (F.current && (F.current.loop || F.current.index < F.group.length - 1)) {
						F.player.isActive = true;

						D.bind({
							'onCancel.player beforeClose.player' : stop,
							'onUpdate.player'   : set,
							'beforeLoad.player' : clear
						});

						set();

						F.trigger('onPlayStart');
					}
				};

			if (action === true || (!F.player.isActive && action !== false)) {
				start();
			} else {
				stop();
			}
		},

		// Navigate to next gallery item
		next: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.next;
				}

				F.jumpto(current.index + 1, direction, 'next');
			}
		},

		// Navigate to previous gallery item
		prev: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.prev;
				}

				F.jumpto(current.index - 1, direction, 'prev');
			}
		},

		// Navigate to gallery item by index
		jumpto: function ( index, direction, router ) {
			var current = F.current;

			if (!current) {
				return;
			}

			index = getScalar(index);

			F.direction = direction || current.direction[ (index >= current.index ? 'next' : 'prev') ];
			F.router    = router || 'jumpto';

			if (current.loop) {
				if (index < 0) {
					index = current.group.length + (index % current.group.length);
				}

				index = index % current.group.length;
			}

			if (current.group[ index ] !== undefined) {
				F.cancel();

				F._start(index);
			}
		},

		// Center inside viewport and toggle position type to fixed or absolute if needed
		reposition: function (e, onlyAbsolute) {
			var current = F.current,
				wrap    = current ? current.wrap : null,
				pos;

			if (wrap) {
				pos = F._getPosition(onlyAbsolute);

				if (e && e.type === 'scroll') {
					delete pos.position;

					wrap.stop(true, true).animate(pos, 200);

				} else {
					wrap.css(pos);

					current.pos = $.extend({}, current.dim, pos);
				}
			}
		},

		update: function (e) {
			var type = (e && e.type),
				anyway = !type || type === 'orientationchange';

			if (anyway) {
				clearTimeout(didUpdate);

				didUpdate = null;
			}

			if (!F.isOpen || didUpdate) {
				return;
			}

			didUpdate = setTimeout(function() {
				var current = F.current;

				if (!current || F.isClosing) {
					return;
				}

				F.wrap.removeClass('fancybox-tmp');

				if (anyway || type === 'load' || (type === 'resize' && current.autoResize)) {
					F._setDimension();
				}

				if (!(type === 'scroll' && current.canShrink)) {
					F.reposition(e);
				}

				F.trigger('onUpdate');

				didUpdate = null;

			}, (anyway && !isTouch ? 0 : 300));
		},

		// Shrink content to fit inside viewport or restore if resized
		toggle: function ( action ) {
			if (F.isOpen) {
				F.current.fitToView = $.type(action) === "boolean" ? action : !F.current.fitToView;

				// Help browser to restore document dimensions
				if (isTouch) {
					F.wrap.removeAttr('style').addClass('fancybox-tmp');

					F.trigger('onUpdate');
				}

				F.update();
			}
		},

		hideLoading: function () {
			D.unbind('.loading');

			$('#fancybox-loading').remove();
		},

		showLoading: function () {
			var el, viewport;

			F.hideLoading();

			el = $('<div id="fancybox-loading"><div></div></div>').click(F.cancel).appendTo('body');

			// If user will press the escape-button, the request will be canceled
			D.bind('keydown.loading', function(e) {
				if ((e.which || e.keyCode) === 27) {
					e.preventDefault();

					F.cancel();
				}
			});

			if (!F.defaults.fixed) {
				viewport = F.getViewport();

				el.css({
					position : 'absolute',
					top  : (viewport.h * 0.5) + viewport.y,
					left : (viewport.w * 0.5) + viewport.x
				});
			}
		},

		getViewport: function () {
			var locked = (F.current && F.current.locked) || false,
				rez    = {
					x: W.scrollLeft(),
					y: W.scrollTop()
				};

			if (locked) {
				rez.w = locked[0].clientWidth;
				rez.h = locked[0].clientHeight;

			} else {
				// See http://bugs.jquery.com/ticket/6724
				rez.w = isTouch && window.innerWidth  ? window.innerWidth  : W.width();
				rez.h = isTouch && window.innerHeight ? window.innerHeight : W.height();
			}

			return rez;
		},

		// Unbind the keyboard / clicking actions
		unbindEvents: function () {
			if (F.wrap && isQuery(F.wrap)) {
				F.wrap.unbind('.fb');
			}

			D.unbind('.fb');
			W.unbind('.fb');
		},

		bindEvents: function () {
			var current = F.current,
				keys;

			if (!current) {
				return;
			}

			// Changing document height on iOS devices triggers a 'resize' event,
			// that can change document height... repeating infinitely
			W.bind('orientationchange.fb' + (isTouch ? '' : ' resize.fb') + (current.autoCenter && !current.locked ? ' scroll.fb' : ''), F.update);

			keys = current.keys;

			if (keys) {
				D.bind('keydown.fb', function (e) {
					var code   = e.which || e.keyCode,
						target = e.target || e.srcElement;

					// Skip esc key if loading, because showLoading will cancel preloading
					if (code === 27 && F.coming) {
						return false;
					}

					// Ignore key combinations and key events within form elements
					if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && !(target && (target.type || $(target).is('[contenteditable]')))) {
						$.each(keys, function(i, val) {
							if (current.group.length > 1 && val[ code ] !== undefined) {
								F[ i ]( val[ code ] );

								e.preventDefault();
								return false;
							}

							if ($.inArray(code, val) > -1) {
								F[ i ] ();

								e.preventDefault();
								return false;
							}
						});
					}
				});
			}

			if ($.fn.mousewheel && current.mouseWheel) {
				F.wrap.bind('mousewheel.fb', function (e, delta, deltaX, deltaY) {
					var target = e.target || null,
						parent = $(target),
						canScroll = false;

					while (parent.length) {
						if (canScroll || parent.is('.fancybox-skin') || parent.is('.fancybox-wrap')) {
							break;
						}

						canScroll = isScrollable( parent[0] );
						parent    = $(parent).parent();
					}

					if (delta !== 0 && !canScroll) {
						if (F.group.length > 1 && !current.canShrink) {
							if (deltaY > 0 || deltaX > 0) {
								F.prev( deltaY > 0 ? 'down' : 'left' );

							} else if (deltaY < 0 || deltaX < 0) {
								F.next( deltaY < 0 ? 'up' : 'right' );
							}

							e.preventDefault();
						}
					}
				});
			}
		},

		trigger: function (event, o) {
			var ret, obj = o || F.coming || F.current;

			if (!obj) {
				return;
			}

			if ($.isFunction( obj[event] )) {
				ret = obj[event].apply(obj, Array.prototype.slice.call(arguments, 1));
			}

			if (ret === false) {
				return false;
			}

			if (obj.helpers) {
				$.each(obj.helpers, function (helper, opts) {
					if (opts && F.helpers[helper] && $.isFunction(F.helpers[helper][event])) {
						F.helpers[helper][event]($.extend(true, {}, F.helpers[helper].defaults, opts), obj);
					}
				});
			}

			D.trigger(event);
		},

		isImage: function (str) {
			return isString(str) && str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
		},

		isSWF: function (str) {
			return isString(str) && str.match(/\.(swf)((\?|#).*)?$/i);
		},

		_start: function (index) {
			var coming = {},
				obj,
				href,
				type,
				margin,
				padding;

			index = getScalar( index );
			obj   = F.group[ index ] || null;

			if (!obj) {
				return false;
			}

			coming = $.extend(true, {}, F.opts, obj);

			// Convert margin and padding properties to array - top, right, bottom, left
			margin  = coming.margin;
			padding = coming.padding;

			if ($.type(margin) === 'number') {
				coming.margin = [margin, margin, margin, margin];
			}

			if ($.type(padding) === 'number') {
				coming.padding = [padding, padding, padding, padding];
			}

			// 'modal' propery is just a shortcut
			if (coming.modal) {
				$.extend(true, coming, {
					closeBtn   : false,
					closeClick : false,
					nextClick  : false,
					arrows     : false,
					mouseWheel : false,
					keys       : null,
					helpers: {
						overlay : {
							closeClick : false
						}
					}
				});
			}

			// 'autoSize' property is a shortcut, too
			if (coming.autoSize) {
				coming.autoWidth = coming.autoHeight = true;
			}

			if (coming.width === 'auto') {
				coming.autoWidth = true;
			}

			if (coming.height === 'auto') {
				coming.autoHeight = true;
			}

			/*
			 * Add reference to the group, so it`s possible to access from callbacks, example:
			 * afterLoad : function() {
			 *     this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
			 * }
			 */

			coming.group  = F.group;
			coming.index  = index;

			// Give a chance for callback or helpers to update coming item (type, title, etc)
			F.coming = coming;

			if (false === F.trigger('beforeLoad')) {
				F.coming = null;

				return;
			}

			type = coming.type;
			href = coming.href;

			if (!type) {
				F.coming = null;

				//If we can not determine content type then drop silently or display next/prev item if looping through gallery
				if (F.current && F.router && F.router !== 'jumpto') {
					F.current.index = index;

					return F[ F.router ]( F.direction );
				}

				return false;
			}

			F.isActive = true;

			if (type === 'image' || type === 'swf') {
				coming.autoHeight = coming.autoWidth = false;
				coming.scrolling  = 'visible';
			}

			if (type === 'image') {
				coming.aspectRatio = true;
			}

			if (type === 'iframe' && isTouch) {
				coming.scrolling = 'scroll';
			}

			// Build the neccessary markup
			coming.wrap = $(coming.tpl.wrap).addClass('fancybox-' + (isTouch ? 'mobile' : 'desktop') + ' fancybox-type-' + type + ' fancybox-tmp ' + coming.wrapCSS).appendTo( coming.parent || 'body' );

			$.extend(coming, {
				skin  : $('.fancybox-skin',  coming.wrap),
				outer : $('.fancybox-outer', coming.wrap),
				inner : $('.fancybox-inner', coming.wrap)
			});

			$.each(["Top", "Right", "Bottom", "Left"], function(i, v) {
				coming.skin.css('padding' + v, getValue(coming.padding[ i ]));
			});

			F.trigger('onReady');

			// Check before try to load; 'inline' and 'html' types need content, others - href
			if (type === 'inline' || type === 'html') {
				if (!coming.content || !coming.content.length) {
					return F._error( 'content' );
				}

			} else if (!href) {
				return F._error( 'href' );
			}

			if (type === 'image') {
				F._loadImage();

			} else if (type === 'ajax') {
				F._loadAjax();

			} else if (type === 'iframe') {
				F._loadIframe();

			} else {
				F._afterLoad();
			}
		},

		_error: function ( type ) {
			$.extend(F.coming, {
				type       : 'html',
				autoWidth  : true,
				autoHeight : true,
				minWidth   : 0,
				minHeight  : 0,
				scrolling  : 'no',
				hasError   : type,
				content    : F.coming.tpl.error
			});

			F._afterLoad();
		},

		_loadImage: function () {
			// Reset preload image so it is later possible to check "complete" property
			var img = F.imgPreload = new Image();

			img.onload = function () {
				this.onload = this.onerror = null;

				F.coming.width  = this.width / F.opts.pixelRatio;
				F.coming.height = this.height / F.opts.pixelRatio;

				F._afterLoad();
			};

			img.onerror = function () {
				this.onload = this.onerror = null;

				F._error( 'image' );
			};

			img.src = F.coming.href;

			if (img.complete !== true) {
				F.showLoading();
			}
		},

		_loadAjax: function () {
			var coming = F.coming;

			F.showLoading();

			F.ajaxLoad = $.ajax($.extend({}, coming.ajax, {
				url: coming.href,
				error: function (jqXHR, textStatus) {
					if (F.coming && textStatus !== 'abort') {
						F._error( 'ajax', jqXHR );

					} else {
						F.hideLoading();
					}
				},
				success: function (data, textStatus) {
					if (textStatus === 'success') {
						coming.content = data;

						F._afterLoad();
					}
				}
			}));
		},

		_loadIframe: function() {
			var coming = F.coming,
				iframe = $(coming.tpl.iframe.replace(/\{rnd\}/g, new Date().getTime()))
					.attr('scrolling', isTouch ? 'auto' : coming.iframe.scrolling)
					.attr('src', coming.href);

			// This helps IE
			$(coming.wrap).bind('onReset', function () {
				try {
					$(this).find('iframe').hide().attr('src', '//about:blank').end().empty();
				} catch (e) {}
			});

			if (coming.iframe.preload) {
				F.showLoading();

				iframe.one('load', function() {
					$(this).data('ready', 1);

					// iOS will lose scrolling if we resize
					if (!isTouch) {
						$(this).bind('load.fb', F.update);
					}

					// Without this trick:
					//   - iframe won't scroll on iOS devices
					//   - IE7 sometimes displays empty iframe
					$(this).parents('.fancybox-wrap').width('100%').removeClass('fancybox-tmp').show();

					F._afterLoad();
				});
			}

			coming.content = iframe.appendTo( coming.inner );

			if (!coming.iframe.preload) {
				F._afterLoad();
			}
		},

		_preloadImages: function() {
			var group   = F.group,
				current = F.current,
				len     = group.length,
				cnt     = current.preload ? Math.min(current.preload, len - 1) : 0,
				item,
				i;

			for (i = 1; i <= cnt; i += 1) {
				item = group[ (current.index + i ) % len ];

				if (item.type === 'image' && item.href) {
					new Image().src = item.href;
				}
			}
		},

		_afterLoad: function () {
			var coming   = F.coming,
				previous = F.current,
				placeholder = 'fancybox-placeholder',
				current,
				content,
				type,
				scrolling,
				href,
				embed;

			F.hideLoading();

			if (!coming || F.isActive === false) {
				return;
			}

			if (false === F.trigger('afterLoad', coming, previous)) {
				coming.wrap.stop(true).trigger('onReset').remove();

				F.coming = null;

				return;
			}

			if (previous) {
				F.trigger('beforeChange', previous);

				previous.wrap.stop(true).removeClass('fancybox-opened')
					.find('.fancybox-item, .fancybox-nav')
					.remove();
			}

			F.unbindEvents();

			current   = coming;
			content   = coming.content;
			type      = coming.type;
			scrolling = coming.scrolling;

			$.extend(F, {
				wrap  : current.wrap,
				skin  : current.skin,
				outer : current.outer,
				inner : current.inner,
				current  : current,
				previous : previous
			});

			href = current.href;

			switch (type) {
				case 'inline':
				case 'ajax':
				case 'html':
					if (current.selector) {
						content = $('<div>').html(content).find(current.selector);

					} else if (isQuery(content)) {
						if (!content.data(placeholder)) {
							content.data(placeholder, $('<div class="' + placeholder + '"></div>').insertAfter( content ).hide() );
						}

						content = content.show().detach();

						current.wrap.bind('onReset', function () {
							if ($(this).find(content).length) {
								content.hide().replaceAll( content.data(placeholder) ).data(placeholder, false);
							}
						});
					}
				break;

				case 'image':
					content = current.tpl.image.replace('{href}', href);
				break;

				case 'swf':
					content = '<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="' + href + '"></param>';
					embed   = '';

					$.each(current.swf, function(name, val) {
						content += '<param name="' + name + '" value="' + val + '"></param>';
						embed   += ' ' + name + '="' + val + '"';
					});

					content += '<embed src="' + href + '" type="application/x-shockwave-flash" width="100%" height="100%"' + embed + '></embed></object>';
				break;
			}

			if (!(isQuery(content) && content.parent().is(current.inner))) {
				current.inner.append( content );
			}

			// Give a chance for helpers or callbacks to update elements
			F.trigger('beforeShow');

			// Set scrolling before calculating dimensions
			current.inner.css('overflow', scrolling === 'yes' ? 'scroll' : (scrolling === 'no' ? 'hidden' : scrolling));

			// Set initial dimensions and start position
			F._setDimension();

			F.reposition();

			F.isOpen = false;
			F.coming = null;

			F.bindEvents();

			if (!F.isOpened) {
				$('.fancybox-wrap').not( current.wrap ).stop(true).trigger('onReset').remove();

			} else if (previous.prevMethod) {
				F.transitions[ previous.prevMethod ]();
			}

			F.transitions[ F.isOpened ? current.nextMethod : current.openMethod ]();

			F._preloadImages();
		},

		_setDimension: function () {
			var viewport   = F.getViewport(),
				steps      = 0,
				canShrink  = false,
				canExpand  = false,
				wrap       = F.wrap,
				skin       = F.skin,
				inner      = F.inner,
				current    = F.current,
				width      = current.width,
				height     = current.height,
				minWidth   = current.minWidth,
				minHeight  = current.minHeight,
				maxWidth   = current.maxWidth,
				maxHeight  = current.maxHeight,
				scrolling  = current.scrolling,
				scrollOut  = current.scrollOutside ? current.scrollbarWidth : 0,
				margin     = current.margin,
				wMargin    = getScalar(margin[1] + margin[3]),
				hMargin    = getScalar(margin[0] + margin[2]),
				wPadding,
				hPadding,
				wSpace,
				hSpace,
				origWidth,
				origHeight,
				origMaxWidth,
				origMaxHeight,
				ratio,
				width_,
				height_,
				maxWidth_,
				maxHeight_,
				iframe,
				body;

			// Reset dimensions so we could re-check actual size
			wrap.add(skin).add(inner).width('auto').height('auto').removeClass('fancybox-tmp');

			wPadding = getScalar(skin.outerWidth(true)  - skin.width());
			hPadding = getScalar(skin.outerHeight(true) - skin.height());

			// Any space between content and viewport (margin, padding, border, title)
			wSpace = wMargin + wPadding;
			hSpace = hMargin + hPadding;

			origWidth  = isPercentage(width)  ? (viewport.w - wSpace) * getScalar(width)  / 100 : width;
			origHeight = isPercentage(height) ? (viewport.h - hSpace) * getScalar(height) / 100 : height;

			if (current.type === 'iframe') {
				iframe = current.content;

				if (current.autoHeight && iframe.data('ready') === 1) {
					try {
						if (iframe[0].contentWindow.document.location) {
							inner.width( origWidth ).height(9999);

							body = iframe.contents().find('body');

							if (scrollOut) {
								body.css('overflow-x', 'hidden');
							}

							origHeight = body.outerHeight(true);
						}

					} catch (e) {}
				}

			} else if (current.autoWidth || current.autoHeight) {
				inner.addClass( 'fancybox-tmp' );

				// Set width or height in case we need to calculate only one dimension
				if (!current.autoWidth) {
					inner.width( origWidth );
				}

				if (!current.autoHeight) {
					inner.height( origHeight );
				}

				if (current.autoWidth) {
					origWidth = inner.width();
				}

				if (current.autoHeight) {
					origHeight = inner.height();
				}

				inner.removeClass( 'fancybox-tmp' );
			}

			width  = getScalar( origWidth );
			height = getScalar( origHeight );

			ratio  = origWidth / origHeight;

			// Calculations for the content
			minWidth  = getScalar(isPercentage(minWidth) ? getScalar(minWidth, 'w') - wSpace : minWidth);
			maxWidth  = getScalar(isPercentage(maxWidth) ? getScalar(maxWidth, 'w') - wSpace : maxWidth);

			minHeight = getScalar(isPercentage(minHeight) ? getScalar(minHeight, 'h') - hSpace : minHeight);
			maxHeight = getScalar(isPercentage(maxHeight) ? getScalar(maxHeight, 'h') - hSpace : maxHeight);

			// These will be used to determine if wrap can fit in the viewport
			origMaxWidth  = maxWidth;
			origMaxHeight = maxHeight;

			if (current.fitToView) {
				maxWidth  = Math.min(viewport.w - wSpace, maxWidth);
				maxHeight = Math.min(viewport.h - hSpace, maxHeight);
			}

			maxWidth_  = viewport.w - wMargin;
			maxHeight_ = viewport.h - hMargin;

			if (current.aspectRatio) {
				if (width > maxWidth) {
					width  = maxWidth;
					height = getScalar(width / ratio);
				}

				if (height > maxHeight) {
					height = maxHeight;
					width  = getScalar(height * ratio);
				}

				if (width < minWidth) {
					width  = minWidth;
					height = getScalar(width / ratio);
				}

				if (height < minHeight) {
					height = minHeight;
					width  = getScalar(height * ratio);
				}

			} else {
				width = Math.max(minWidth, Math.min(width, maxWidth));

				if (current.autoHeight && current.type !== 'iframe') {
					inner.width( width );

					height = inner.height();
				}

				height = Math.max(minHeight, Math.min(height, maxHeight));
			}

			// Try to fit inside viewport (including the title)
			if (current.fitToView) {
				inner.width( width ).height( height );

				wrap.width( width + wPadding );

				// Real wrap dimensions
				width_  = wrap.width();
				height_ = wrap.height();

				if (current.aspectRatio) {
					while ((width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight) {
						if (steps++ > 19) {
							break;
						}

						height = Math.max(minHeight, Math.min(maxHeight, height - 10));
						width  = getScalar(height * ratio);

						if (width < minWidth) {
							width  = minWidth;
							height = getScalar(width / ratio);
						}

						if (width > maxWidth) {
							width  = maxWidth;
							height = getScalar(width / ratio);
						}

						inner.width( width ).height( height );

						wrap.width( width + wPadding );

						width_  = wrap.width();
						height_ = wrap.height();
					}

				} else {
					width  = Math.max(minWidth,  Math.min(width,  width  - (width_  - maxWidth_)));
					height = Math.max(minHeight, Math.min(height, height - (height_ - maxHeight_)));
				}
			}

			if (scrollOut && scrolling === 'auto' && height < origHeight && (width + wPadding + scrollOut) < maxWidth_) {
				width += scrollOut;
			}

			inner.width( width ).height( height );

			wrap.width( width + wPadding );

			width_  = wrap.width();
			height_ = wrap.height();

			canShrink = (width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight;
			canExpand = current.aspectRatio ? (width < origMaxWidth && height < origMaxHeight && width < origWidth && height < origHeight) : ((width < origMaxWidth || height < origMaxHeight) && (width < origWidth || height < origHeight));

			$.extend(current, {
				dim : {
					width	: getValue( width_ ),
					height	: getValue( height_ )
				},
				origWidth  : origWidth,
				origHeight : origHeight,
				canShrink  : canShrink,
				canExpand  : canExpand,
				wPadding   : wPadding,
				hPadding   : hPadding,
				wrapSpace  : height_ - skin.outerHeight(true),
				skinSpace  : skin.height() - height
			});

			if (!iframe && current.autoHeight && height > minHeight && height < maxHeight && !canExpand) {
				inner.height('auto');
			}
		},

		_getPosition: function (onlyAbsolute) {
			var current  = F.current,
				viewport = F.getViewport(),
				margin   = current.margin,
				width    = F.wrap.width()  + margin[1] + margin[3],
				height   = F.wrap.height() + margin[0] + margin[2],
				rez      = {
					position: 'absolute',
					top  : margin[0],
					left : margin[3]
				};

			if (current.autoCenter && current.fixed && !onlyAbsolute && height <= viewport.h && width <= viewport.w) {
				rez.position = 'fixed';

			} else if (!current.locked) {
				rez.top  += viewport.y;
				rez.left += viewport.x;
			}

			rez.top  = getValue(Math.max(rez.top,  rez.top  + ((viewport.h - height) * current.topRatio)));
			rez.left = getValue(Math.max(rez.left, rez.left + ((viewport.w - width)  * current.leftRatio)));

			return rez;
		},

		_afterZoomIn: function () {
			var current = F.current;

			if (!current) {
				return;
			}

			F.isOpen = F.isOpened = true;

			F.wrap.css('overflow', 'visible').addClass('fancybox-opened');

			F.update();

			// Assign a click event
			if ( current.closeClick || (current.nextClick && F.group.length > 1) ) {
				F.inner.css('cursor', 'pointer').bind('click.fb', function(e) {
					if (!$(e.target).is('a') && !$(e.target).parent().is('a')) {
						e.preventDefault();

						F[ current.closeClick ? 'close' : 'next' ]();
					}
				});
			}

			// Create a close button
			if (current.closeBtn) {
				$(current.tpl.closeBtn).appendTo(F.skin).bind('click.fb', function(e) {
					e.preventDefault();

					F.close();
				});
			}

			// Create navigation arrows
			if (current.arrows && F.group.length > 1) {
				if (current.loop || current.index > 0) {
					$(current.tpl.prev).appendTo(F.outer).bind('click.fb', F.prev);
				}

				if (current.loop || current.index < F.group.length - 1) {
					$(current.tpl.next).appendTo(F.outer).bind('click.fb', F.next);
				}
			}

			F.trigger('afterShow');

			// Stop the slideshow if this is the last item
			if (!current.loop && current.index === current.group.length - 1) {
				F.play( false );

			} else if (F.opts.autoPlay && !F.player.isActive) {
				F.opts.autoPlay = false;

				F.play();
			}
		},

		_afterZoomOut: function ( obj ) {
			obj = obj || F.current;

			$('.fancybox-wrap').trigger('onReset').remove();

			$.extend(F, {
				group  : {},
				opts   : {},
				router : false,
				current   : null,
				isActive  : false,
				isOpened  : false,
				isOpen    : false,
				isClosing : false,
				wrap   : null,
				skin   : null,
				outer  : null,
				inner  : null
			});

			F.trigger('afterClose', obj);
		}
	});

	/*
	 *	Default transitions
	 */

	F.transitions = {
		getOrigPosition: function () {
			var current  = F.current,
				element  = current.element,
				orig     = current.orig,
				pos      = {},
				width    = 50,
				height   = 50,
				hPadding = current.hPadding,
				wPadding = current.wPadding,
				viewport = F.getViewport();

			if (!orig && current.isDom && element.is(':visible')) {
				orig = element.find('img:first');

				if (!orig.length) {
					orig = element;
				}
			}

			if (isQuery(orig)) {
				pos = orig.offset();

				if (orig.is('img')) {
					width  = orig.outerWidth();
					height = orig.outerHeight();
				}

			} else {
				pos.top  = viewport.y + (viewport.h - height) * current.topRatio;
				pos.left = viewport.x + (viewport.w - width)  * current.leftRatio;
			}

			if (F.wrap.css('position') === 'fixed' || current.locked) {
				pos.top  -= viewport.y;
				pos.left -= viewport.x;
			}

			pos = {
				top     : getValue(pos.top  - hPadding * current.topRatio),
				left    : getValue(pos.left - wPadding * current.leftRatio),
				width   : getValue(width  + wPadding),
				height  : getValue(height + hPadding)
			};

			return pos;
		},

		step: function (now, fx) {
			var ratio,
				padding,
				value,
				prop       = fx.prop,
				current    = F.current,
				wrapSpace  = current.wrapSpace,
				skinSpace  = current.skinSpace;

			if (prop === 'width' || prop === 'height') {
				ratio = fx.end === fx.start ? 1 : (now - fx.start) / (fx.end - fx.start);

				if (F.isClosing) {
					ratio = 1 - ratio;
				}

				padding = prop === 'width' ? current.wPadding : current.hPadding;
				value   = now - padding;

				F.skin[ prop ](  getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) ) );
				F.inner[ prop ]( getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) - (skinSpace * ratio) ) );
			}
		},

		zoomIn: function () {
			var current  = F.current,
				startPos = current.pos,
				effect   = current.openEffect,
				elastic  = effect === 'elastic',
				endPos   = $.extend({opacity : 1}, startPos);

			// Remove "position" property that breaks older IE
			delete endPos.position;

			if (elastic) {
				startPos = this.getOrigPosition();

				if (current.openOpacity) {
					startPos.opacity = 0.1;
				}

			} else if (effect === 'fade') {
				startPos.opacity = 0.1;
			}

			F.wrap.css(startPos).animate(endPos, {
				duration : effect === 'none' ? 0 : current.openSpeed,
				easing   : current.openEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomIn
			});
		},

		zoomOut: function () {
			var current  = F.current,
				effect   = current.closeEffect,
				elastic  = effect === 'elastic',
				endPos   = {opacity : 0.1};

			if (elastic) {
				endPos = this.getOrigPosition();

				if (current.closeOpacity) {
					endPos.opacity = 0.1;
				}
			}

			F.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : current.closeSpeed,
				easing   : current.closeEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomOut
			});
		},

		changeIn: function () {
			var current   = F.current,
				effect    = current.nextEffect,
				startPos  = current.pos,
				endPos    = { opacity : 1 },
				direction = F.direction,
				distance  = 200,
				field;

			startPos.opacity = 0.1;

			if (effect === 'elastic') {
				field = direction === 'down' || direction === 'up' ? 'top' : 'left';

				if (direction === 'down' || direction === 'right') {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) - distance);
					endPos[ field ]   = '+=' + distance + 'px';

				} else {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) + distance);
					endPos[ field ]   = '-=' + distance + 'px';
				}
			}

			// Workaround for http://bugs.jquery.com/ticket/12273
			if (effect === 'none') {
				F._afterZoomIn();

			} else {
				F.wrap.css(startPos).animate(endPos, {
					duration : current.nextSpeed,
					easing   : current.nextEasing,
					complete : F._afterZoomIn
				});
			}
		},

		changeOut: function () {
			var previous  = F.previous,
				effect    = previous.prevEffect,
				endPos    = { opacity : 0.1 },
				direction = F.direction,
				distance  = 200;

			if (effect === 'elastic') {
				endPos[ direction === 'down' || direction === 'up' ? 'top' : 'left' ] = ( direction === 'up' || direction === 'left' ? '-' : '+' ) + '=' + distance + 'px';
			}

			previous.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : previous.prevSpeed,
				easing   : previous.prevEasing,
				complete : function () {
					$(this).trigger('onReset').remove();
				}
			});
		}
	};

	/*
	 *	Overlay helper
	 */

	F.helpers.overlay = {
		defaults : {
			closeClick : true,      // if true, fancyBox will be closed when user clicks on the overlay
			speedOut   : 200,       // duration of fadeOut animation
			showEarly  : true,      // indicates if should be opened immediately or wait until the content is ready
			css        : {},        // custom CSS properties
			locked     : !isTouch,  // if true, the content will be locked into overlay
			fixed      : true       // if false, the overlay CSS position property will not be set to "fixed"
		},

		overlay : null,      // current handle
		fixed   : false,     // indicates if the overlay has position "fixed"
		el      : $('html'), // element that contains "the lock"

		// Public methods
		create : function(opts) {
			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.close();
			}

			this.overlay = $('<div class="fancybox-overlay"></div>').appendTo( F.coming ? F.coming.parent : opts.parent );
			this.fixed   = false;

			if (opts.fixed && F.defaults.fixed) {
				this.overlay.addClass('fancybox-overlay-fixed');

				this.fixed = true;
			}
		},

		open : function(opts) {
			var that = this;

			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.overlay.unbind('.overlay').width('auto').height('auto');

			} else {
				this.create(opts);
			}

			if (!this.fixed) {
				W.bind('resize.overlay', $.proxy( this.update, this) );

				this.update();
			}

			if (opts.closeClick) {
				this.overlay.bind('click.overlay', function(e) {
					if ($(e.target).hasClass('fancybox-overlay')) {
						if (F.isActive) {
							F.close();
						} else {
							that.close();
						}

						return false;
					}
				});
			}

			this.overlay.css( opts.css ).show();
		},

		close : function() {
			var scrollV, scrollH;

			W.unbind('resize.overlay');

			if (this.el.hasClass('fancybox-lock')) {
				$('.fancybox-margin').removeClass('fancybox-margin');

				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();

				this.el.removeClass('fancybox-lock');

				W.scrollTop( scrollV ).scrollLeft( scrollH );
			}

			$('.fancybox-overlay').remove().hide();

			$.extend(this, {
				overlay : null,
				fixed   : false
			});
		},

		// Private, callbacks

		update : function () {
			var width = '100%', offsetWidth;

			// Reset width/height so it will not mess
			this.overlay.width(width).height('100%');

			// jQuery does not return reliable result for IE
			if (IE) {
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);

				if (D.width() > offsetWidth) {
					width = D.width();
				}

			} else if (D.width() > W.width()) {
				width = D.width();
			}

			this.overlay.width(width).height(D.height());
		},

		// This is where we can manipulate DOM, because later it would cause iframes to reload
		onReady : function (opts, obj) {
			var overlay = this.overlay;

			$('.fancybox-overlay').stop(true, true);

			if (!overlay) {
				this.create(opts);
			}

			if (opts.locked && this.fixed && obj.fixed) {
				if (!overlay) {
					this.margin = D.height() > W.height() ? $('html').css('margin-right').replace("px", "") : false;
				}

				obj.locked = this.overlay.append( obj.wrap );
				obj.fixed  = false;
			}

			if (opts.showEarly === true) {
				this.beforeShow.apply(this, arguments);
			}
		},

		beforeShow : function(opts, obj) {
			var scrollV, scrollH;

			if (obj.locked) {
				if (this.margin !== false) {
					$('*').filter(function(){
						return ($(this).css('position') === 'fixed' && !$(this).hasClass("fancybox-overlay") && !$(this).hasClass("fancybox-wrap") );
					}).addClass('fancybox-margin');

					this.el.addClass('fancybox-margin');
				}

				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();

				this.el.addClass('fancybox-lock');

				W.scrollTop( scrollV ).scrollLeft( scrollH );
			}

			this.open(opts);
		},

		onUpdate : function() {
			if (!this.fixed) {
				this.update();
			}
		},

		afterClose: function (opts) {
			// Remove overlay if exists and fancyBox is not opening
			// (e.g., it is not being open using afterClose callback)
			//if (this.overlay && !F.isActive) {
			if (this.overlay && !F.coming) {
				this.overlay.fadeOut(opts.speedOut, $.proxy( this.close, this ));
			}
		}
	};

	/*
	 *	Title helper
	 */

	F.helpers.title = {
		defaults : {
			type     : 'float', // 'float', 'inside', 'outside' or 'over',
			position : 'bottom' // 'top' or 'bottom'
		},

		beforeShow: function (opts) {
			var current = F.current,
				text    = current.title,
				type    = opts.type,
				title,
				target;

			if ($.isFunction(text)) {
				text = text.call(current.element, current);
			}

			if (!isString(text) || $.trim(text) === '') {
				return;
			}

			title = $('<div class="fancybox-title fancybox-title-' + type + '-wrap">' + text + '</div>');

			switch (type) {
				case 'inside':
					target = F.skin;
				break;

				case 'outside':
					target = F.wrap;
				break;

				case 'over':
					target = F.inner;
				break;

				default: // 'float'
					target = F.skin;

					title.appendTo('body');

					if (IE) {
						title.width( title.width() );
					}

					title.wrapInner('<span class="child"></span>');

					//Increase bottom margin so this title will also fit into viewport
					F.current.margin[2] += Math.abs( getScalar(title.css('margin-bottom')) );
				break;
			}

			title[ (opts.position === 'top' ? 'prependTo'  : 'appendTo') ](target);
		}
	};

	// jQuery plugin initialization
	$.fn.fancybox = function (options) {
		var index,
			that     = $(this),
			selector = this.selector || '',
			run      = function(e) {
				var what = $(this).blur(), idx = index, relType, relVal;

				if (!(e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) && !what.is('.fancybox-wrap')) {
					relType = options.groupAttr || 'data-fancybox-group';
					relVal  = what.attr(relType);

					if (!relVal) {
						relType = 'rel';
						relVal  = what.get(0)[ relType ];
					}

					if (relVal && relVal !== '' && relVal !== 'nofollow') {
						what = selector.length ? $(selector) : that;
						what = what.filter('[' + relType + '="' + relVal + '"]');
						idx  = what.index(this);
					}

					options.index = idx;

					// Stop an event from bubbling if everything is fine
					if (F.open(what, options) !== false) {
						e.preventDefault();
					}
				}
			};

		options = options || {};
		index   = options.index || 0;

		if (!selector || options.live === false) {
			that.unbind('click.fb-start').bind('click.fb-start', run);

		} else {
			D.undelegate(selector, 'click.fb-start').delegate(selector + ":not('.fancybox-item, .fancybox-nav')", 'click.fb-start', run);
		}

		this.filter('[data-fancybox-start=1]').trigger('click');

		return this;
	};

	// Tests that need a body at doc ready
	D.ready(function() {
		var w1, w2;

		if ( $.scrollbarWidth === undefined ) {
			// http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
			$.scrollbarWidth = function() {
				var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body'),
					child  = parent.children(),
					width  = child.innerWidth() - child.height( 99 ).innerWidth();

				parent.remove();

				return width;
			};
		}

		if ( $.support.fixedPosition === undefined ) {
			$.support.fixedPosition = (function() {
				var elem  = $('<div style="position:fixed;top:20px;"></div>').appendTo('body'),
					fixed = ( elem[0].offsetTop === 20 || elem[0].offsetTop === 15 );

				elem.remove();

				return fixed;
			}());
		}

		$.extend(F.defaults, {
			scrollbarWidth : $.scrollbarWidth(),
			fixed  : $.support.fixedPosition,
			parent : $('body')
		});

		//Get real width of page scroll-bar
		w1 = $(window).width();

		H.addClass('fancybox-lock-test');

		w2 = $(window).width();

		H.removeClass('fancybox-lock-test');

		$("<style type='text/css'>.fancybox-margin{margin-right:" + (w2 - w1) + "px;}</style>").appendTo("head");
	});

}(window, document, jQuery));