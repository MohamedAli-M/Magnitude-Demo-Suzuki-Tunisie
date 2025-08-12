;(function () {
	
	'use strict';
	var el, elc, set, timeRemain, sliderContinue; // for slick 

	jQuery(".title-s h1").text(jQuery(".title-s h1").text().replace("Search Results for:", "Résultats de recherche pour:"))

  // flatpickr date selector
  	flatpickr(".flatpickr", {
      allowInput: true,
      dateFormat: "d/m/Y",
      minDate: new Date().fp_incr(1),
      maxDate: new Date().fp_incr(31),
  
      "locale": 'fr',
      "disable": [
        function(date) {
            // return true to disable
            return (date.getDay() === 0 );
            //return (date.getDay() === 0 || date.getDay() === 6);

        }
    ]
    });


    jQuery('.cf7mls_next').html('Suivant')
    jQuery('.cf7mls_back').html('Précédent')
	  jQuery('.cf7mls_back').val('Précédent')
	 
	 
    // Quotation Form Validation
    jQuery('#quotation-form').on('submit', function(e){
        
        var firstname = jQuery('#your-firstname').val()
        var lastname  = jQuery('#your-lastname').val()
        var address   = jQuery('#your-adresse').val()
        var zipcode   = jQuery('#your-zipcode').val()
        var city      = jQuery('#your-city').val()
        var phone     = jQuery('#your-phone').val()
        var email     = jQuery('#your-email').val()
        
        var error = false
        console.log("firstname : " + firstname)
        console.log("lastname : " + lastname)
        console.log("address : " + address)
        console.log("zipcode : " + zipcode)
        console.log("city : " + city)
        console.log("phone : " + phone)
        console.log("email : " + email)
        console.log("error : " + error)
        
        if(firstname == '' || typeof(firstname) === 'undefined') { jQuery('#invalid-firstname').show(); error = true }else{ jQuery('#invalid-firstname').hide() }
        if(lastname == '' || typeof(lastname) === 'undefined') { jQuery('#invalid-lastname').show(); error = true }else{ jQuery('#invalid-lastname').hide() }
        if(address == '' || typeof(address) === 'undefined') { jQuery('#invalid-address').show(); error = true }else { jQuery('#invalid-address').hide() }
        if(zipcode == '' || typeof(zipcode) === 'undefined') { jQuery('#invalid-zipcode').show(); error = true }else{ jQuery('#invalid-zipcode').hide() }
        if(city == '' || typeof(city) === 'undefined') { jQuery('#invalid-city').show(); error = true }else { jQuery('#invalid-city').hide() }
        if(phone == '' || typeof(phone) === 'undefined') { jQuery('#invalid-phone').show(); error = true }else{ jQuery('#invalid-phone').hide() }
        if(email == '' || typeof(email) === 'undefined') { jQuery('#invalid-email').show(); error = true }else{ jQuery('#invalid-email').hide() }
        
        if(error){
            //prevent form from submitting
            e.preventDefault()
        }
        
    });
    
    // Test Drive Form Validation
    jQuery('#test-drive-form').on('submit', function(e){        
        
        var civility  = jQuery('#civility').val()
        var firstname = jQuery('#your-firstname').val()
        var lastname  = jQuery('#your-lastname').val()
        var address   = jQuery('#your-adresse').val()
        var zipcode   = jQuery('#your-zipcode').val()
        var city      = jQuery('#your-city').val()
        var phone     = jQuery('#your-phone').val()
        var email     = jQuery('#your-email').val()
        var message   = jQuery('#your-message').val()
        
        var error = false

        if(jQuery('input[name=vehicule]:checked').length == 0){
            jQuery('#no-vehicule').show()
            error = true 
            jQuery('html, body').animate({ scrollTop: 0 }, 'slow')
        }else{ 
            jQuery('#no-vehicule').hide()
        }
        
        if(civility == '' || typeof(civility) === 'undefined') { jQuery('#invalid-civility').show(); error = true }else{ jQuery('#invalid-civility').hide() }                        
        if(firstname == '' || typeof(firstname) === 'undefined') { jQuery('#invalid-firstname').show(); error = true }else{ jQuery('#invalid-firstname').hide() }
        if(lastname == '' || typeof(lastname) === 'undefined') { jQuery('#invalid-lastname').show(); error = true }else{ jQuery('#invalid-lastname').hide() }
        if(address == '' || typeof(address) === 'undefined') { jQuery('#invalid-address').show(); error = true }else { jQuery('#invalid-address').hide() }
        if(zipcode == '' || typeof(zipcode) === 'undefined') { jQuery('#invalid-zipcode').show(); error = true }else{ jQuery('#invalid-zipcode').hide() }
        if(city == '' || typeof(city) === 'undefined') { jQuery('#invalid-city').show(); error = true }else { jQuery('#invalid-city').hide() }
        if(phone == '' || typeof(phone) === 'undefined') { jQuery('#invalid-phone').show(); error = true }else{ jQuery('#invalid-phone').hide() }
        if(email == '' || typeof(email) === 'undefined') { jQuery('#invalid-email').show(); error = true }else{ jQuery('#invalid-email').hide() }
        if(message == '' || typeof(message) === 'undefined') { jQuery('#invalid-message').show(); error = true }else{ jQuery('#invalid-message').hide() }
        
        if(error){
            //prevent form from submitting
            e.preventDefault()
        }
    });
    
    // smooth jump
     jQuery('.heading-tab-menu').on('click', 'a', function( e ) {
         e.preventDefault();
         var linkIndex =jQuery(this).attr('href');
         // alert (linkIndex);
          // go to captured id 
         jQuery('html, body').animate({
           scrollTop: jQuery(linkIndex).offset().top
         }, 1000);

     });
    // smooth top jumper
    jQuery('.go-top').addClass('animated fadeOutUp'); // reset  
    // show icon handler 
     jQuery(document).scroll(function() {
              var y = jQuery(this).scrollTop();
              if (y > 600) {
                jQuery('.go-top').removeClass("fadeOutUp").addClass('animated fadeInUp')
              } else {
                jQuery('.go-top').removeClass("fadeInUp").addClass('animated fadeOutUp')
              }
      });
     
      // trigger click  handler 
     jQuery("a[href='#top']").click(function() {
      jQuery("html, body").animate({ scrollTop: 0 }, "slow");
      return false;
    });
 
   // remove plus misplaced 
   jQuery('.collapse.in').parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
 
   jQuery('.collapse').on('shown.bs.collapse', function(){
        jQuery(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
        }).on('hidden.bs.collapse', function(){
        jQuery(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
   });

 
    // toggle accordian bs code 
    /*function toggleIcon(e) {
    jQuery(e.target)
        .prev('.panel-heading')
        .find(".more-less")
        .toggleClass('glyphicon-plus glyphicon-minus');
    }
    jQuery('.panel-group').on('hidden.bs.collapse', toggleIcon);
    jQuery('.panel-group').on('shown.bs.collapse', toggleIcon);
    */
    
    // custom wpcf7
    jQuery('.wpcf7-submit').removeClass('wpcf7-submit').removeClass('wpcf7-form-control').addClass('btn bigger btn-primary')
   
    
  
    // add hidden menu class for bs
   	 jQuery('#menu-item-237').addClass('visible-sm visible-xs'); /* temp idea must be walked or css direct*/
	// iPad and iPod detection	
	var isiPad = function(){
		return (navigator.platform.indexOf("iPad") != -1);
	};

	var isiPhone = function(){
	    return (
			(navigator.platform.indexOf("iPhone") != -1) || 
			(navigator.platform.indexOf("iPod") != -1)
	    ); 
	};
    
    // load ressources complete   
    jQuery(window).on("load", function() {
      jQuery(".loader-overlay").fadeOut();
     // hidden gallery attach auto nav hide idea
       
      jQuery("#inline-gallery .slick-viewslide").click(function() {
              var clicks = jQuery(this).data('clicks');
              if (clicks) {
                 jQuery('#inline-gallery .slick-navslide').slideDown();
              } else {
                 jQuery('#inline-gallery .slick-navslide').slideUp();
              }
              jQuery(this).data("clicks", !clicks);
          });
 
        // re-setup slick on the hidden gallery before open 
        jQuery(document).on('lity:open', function(e,instance) {
              // do it only for slick gal 
              if ( instance.opener().attr("href") == "#inline-gallery" ) {
               // reset car galery state
               jQuery('#inline-gallery .slick-navslide').slideDown();
               // reset slick positions 
               jQuery('#inline-gallery .slick-viewslide').get(0).slick.setPosition()
               jQuery('#inline-gallery .slick-navslide').get(0).slick.setPosition()
              }
        });

    });
    
 
 // Main Menu Superfish
	var mainMenu = function() {

		jQuery('#theme-primary-menu').superfish({
			delay: 0,
			animation: {
				opacity: 'show'
			},
			speed: 'fast',
			cssArrows: true,
			disableHI: true
		});

	};

	// Offcanvas and cloning of the main menu
	var offcanvas = function() {

		var jQueryclone = jQuery('#theme-menu-wrap').clone();
		jQueryclone.attr({
			'id' : 'offcanvas-menu'
		});
		jQueryclone.find('> ul').attr({
			'class' : '',
			'id' : ''
		});

		jQuery('#global-page').prepend(jQueryclone);
		
		var rdv_garage = jQuery('header .rdv-garage').clone();
		jQuery('#offcanvas-menu').append(rdv_garage);				var demande_devis = jQuery('header .demande-devis').clone();		jQuery('#offcanvas-menu').append(demande_devis);		 
		// click the burger
		jQuery('.js-theme-nav-toggle').on('click', function(){
 
			if ( jQuery('body').hasClass('theme-offcanvas') ) {
				jQuery('body').removeClass('theme-offcanvas');
			} else {
				jQuery('body').addClass('theme-offcanvas');
			}
			// jQuery('body').toggleClass('theme-offcanvas');

		});

       
		jQuery(window).resize(function(){
		   // stretchImg();
		   jQuery('.slick-slide .img--holder').height(jQuery(window).height());
			var w = jQuery(window);
               
			if ( w.width() > 769 ) {
				if ( jQuery('body').hasClass('theme-offcanvas') ) {
					jQuery('body').removeClass('theme-offcanvas');
				}
			}


		});	

	}

	// Superfish Sub Menu Click ( Mobiles/Tablets )
	var mobileClickSubMenus = function() {

		jQuery('body').on('click', '.theme-sub-ddown', function(event) {
			event.preventDefault();
			var jQuerythis = jQuery(this),
				li = jQuerythis.closest('li');
			li.find('> .sub-menu').slideToggle(200);
		});

	};


	// Animations
	var contentWayPoint = function() {
		var i = 0;
		jQuery('.animate-box').waypoint( function( direction ) {

			if( direction === 'down' && !jQuery(this.element).hasClass('animated') ) {
				
				i++;

				jQuery(this.element).addClass('item-animate');
				setTimeout(function(){

					jQuery('body .animate-box.item-animate').each(function(k){
						var el = jQuery(this);
						setTimeout( function () {
							el.addClass('fadeInUp animated');
							el.removeClass('item-animate');
						},  k * 200, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '85%' } );
	};
	
	/**
	 * Slider home
	 */
      var slickSlider = function() {
           
		   var elements = {
            slider: jQuery('#slick'),
            slickAllThumbs: jQuery('.slick-dots button'),
            slickActiveThumb: jQuery('.slick-dots .slick-active button')
	    	}
		
	 	  var settings =  {
            sliderAutoplaySpeed: 7000,
            sliderSpeed: 1200
          }

		   set = settings;
           el = elements;

            el.slider.on('init', function() {
               // jQuery(this).find('.slick-dots button').text('');
            });

			el.slider.on('beforeChange', function(event, slick, currentSlide, nextSlide){
               //console.log(nextSlide);
             });


            el.slider.slick({
                arrows: false,
                dots: true,
                autoplay: true,
                autoplaySpeed: set.sliderAutoplaySpeed,
                fade: false,
                speed: set.sliderSpeed,
                pauseOnHover: false,
                pauseOnDotsHover: true
            });
			 
			 jQuery('.slick-slide .img--holder').height(jQuery(window).height());  // force max height on load 

   }


   /**
	 * Slider cars
	 */
      var slickCarsSlider = function() {
           
		  var elements = { 
			  slider: jQuery('#slick-cars') 
			}
	 	  var settings =  {
			   sliderSpeed: 1200
          }

		   set = settings;
           elc = elements;

            elc.slider.on('init', function() {
               // jQuery(this).find('.slick-dots button').text('');
            });

 

            elc.slider.slick({
                arrows: false,
                dots: false,
                autoplay: false,
                fade: true,
                speed: set.sliderSpeed,
                pauseOnHover: false,
                pauseOnDotsHover: true
            });
			 
		    jQuery('.slick-slide .img--holder').height(jQuery(window).height());  // force max height on load ( class given on runtime )
            jQuery(".color-dots li:first").css("background-color","#ddd") // preselect the first element
           /* color switcher by index */
            jQuery('.color-dots').on('click', 'li', function( e ) {
                jQuery(".color-dots li").css("background-color","white")
                var slideIndex =jQuery(this).closest('li').index();
                jQuery(this).css("background-color","#ddd")
                elc.slider.slick( 'slickGoTo', parseInt( slideIndex ) );
                // e.preventDefault();
            });

     /**
	 *  cars Inline Photo Gallery 
	 */
     
                
            jQuery('#inline-gallery .slick-viewslide').slick({
              slidesToShow: 1,
              slidesToScroll: 1,
              arrows: false,
              dots:false,
              fade: true,
              asNavFor: '#inline-gallery .slick-navslide'
            });
            
            jQuery('#inline-gallery .slick-navslide').slick({
              slidesToShow: 12,
              slidesToScroll: 1,
              asNavFor: '#inline-gallery .slick-viewslide',
              arrows: true,
              dots: false,
              prevArrow: '#inline-gallery .nav-prev',
              nextArrow: '#inline-gallery .nav-next',
              centerMode: true,
              focusOnSelect: true,
              infinite : false,
              variableWidth:true,
              lazyLoad: 'ondemand'
            });
            
            
            
         
     /**
	 *  cars Inline Photo Gallery  ( will be off )
	 */
       /* 
		    // Inline Photo Gallery 		
				jQuery('#inline-gallery .slickslide').slick({
						dots: true,
				        arrows: false,
						infinite: true,
						speed: 500,
						fade: false,
						slide: 'li',
						cssEase: 'linear',
						centerMode: true,
						slidesToShow: 1,
						variableWidth: true,
						autoplay: true,
						autoplaySpeed: 4000,
						customPaging: function (slider, i) {
							return '<button class="tab">' + jQuery('.slick-thumbs li:nth-child(' + (i + 1) + ')').html() + '</button>';
						}
					});
 
	   */

   }
       

	// Document on load.
	jQuery(function(){
        
		offcanvas();
		contentWayPoint();
		slickSlider();
		slickCarsSlider();

	});
	
	
	/* Override */
	
	let title = jQuery('.elementor-element-52c256d h1').text();
	const myArray = title.split(": ");
	
	jQuery('.elementor-element-52c256d h1').text(myArray[1]).css('font-size', '72px')
	
	/*jQuery('.elementor-element-6d3d6b5 .elementor-posts-container').slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		arrows: false,
		dots: false,
		responsive: [
			{
			  breakpoint: 768,
			  settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '40px',
				slidesToShow: 2
			  }
			},
			{
			  breakpoint: 480,
			  settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '40px',
				slidesToShow: 1
			  }
			}
		]
	});*/
	
	/* Override */
	
	// Ementor posts excerpt position
	jQuery(".elementor-post").each(function(){
		jQuery(this).find(".elementor-post__excerpt").insertAfter(jQuery(this).find(".elementor-post__thumbnail"));
	});
	
	// Hover model cars menu popup
	/*jQuery(document).on('click', '.elementor-element-3b9c55e ul li > a', function(){
		
		setTimeout(function(){
			
			jQuery(".elementor-element-7beb6f2 .pp-tabs-label").hover(function(){
		
				jQuery(this).trigger('click');
				
			}, function(){
			  
			}); 
			
		}, 1000);
		
	})*/
	
	// models popup menu
	jQuery(document).on('click', '.elementor-element-3b9c55e ul li > a', function(){
		
		setTimeout(function(){
			
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label").hover(function(){
				
				const index = jQuery(this).data('index');
				
				jQuery(".pp-advanced-tabs-wrapper .pp-tabs-label").removeClass("pp-tab-active");
				
				jQuery(this).addClass("pp-tab-active");
				
				jQuery('.pp-tabs-panel .pp-advanced-tabs-tab_content').removeClass("pp-tab-active");
				
				jQuery('#pp-advanced-tabs-content-'+index).addClass("pp-tab-active");
				
			}, function(){
				
			});
			
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1291']").wrap('<a href="/modeles-suzuki/celerio/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1292']").wrap('<a href="/modeles-suzuki/jimny/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1293']").wrap('<a href="/modeles-suzuki/baleno/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1294']").wrap('<a href="/modeles-suzuki/ertiga/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1295']").wrap('<a href="/modeles-suzuki/fronx/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1296']").wrap('<a href="/modeles-suzuki/jimny-5d/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1297']").wrap('<a href="/modeles-suzuki/swift-iv/" ></a>');
			jQuery(".pp-advanced-tabs-wrapper > .pp-tabs-label[data-index='1298']").wrap('<a href="/modeles-suzuki/ciaz/" ></a>');

		}, 1000);
	}); 
	
	
	// History page slider
	var timelineSwiper = new Swiper ('.timeline .swiper-container', {
	  direction: 'vertical',
	  autoplay: 800,
	  autoHeight: true,
	  loop: false,
	  speed: 1600,
	  pagination: '.swiper-pagination',
	  paginationBulletRender: function (swiper, index, className) {
		var year = document.querySelectorAll('.swiper-slide')[index].getAttribute('data-year');
		return '<span class="' + className + '">' + year + '</span>';
	  },
	  paginationClickable: true,
	  nextButton: '.swiper-button-next',
	  prevButton: '.swiper-button-prev',
	  
	});
	
	// Download button
	/*jQuery(".download-button").click(function(){
		
		const title = document.querySelector('.nav-specifications li.active a').textContent;
		const spec = document.querySelector('.spec-wrapper .column-block');
		createPdf(spec, title);
	});*/
	
	// Menu color
	let page_title = jQuery('h1').text();
	
	jQuery('.elementor-element-3b9c55e ul > li').each(function(){
		if(jQuery(this).find('a > span').text() == page_title){
	
			jQuery(this).find('a > span').css('color', 'var(--e-global-color-4fba061 )');
		}
	})
	
	// Simulateur crédit
	jQuery(document).on('click', '.button.calculate_loan_payment', function(e){
		
		e.preventDefault();
		
		var _this = jQuery(this);
		
		jQuery('.page-id-2040 .nf-form-content input:not([type=button])').css('border-color', '#E2E2E2')

		if(jQuery('#nf-field-5').val() == ''){
		
			jQuery('#nf-field-5').css('border-color', '#D52B1E')
			
		}else if(jQuery('#nf-field-6').val() == ''){
			
			jQuery('#nf-field-6').css('border-color', '#D52B1E')
			
		}else if(jQuery('#nf-field-7').val() == ''){
			
			jQuery('#nf-field-7').css('border-color', '#D52B1E')
			
		}else if(jQuery('#nf-field-8').val() == ''){
			
			jQuery('#nf-field-8').css('border-color', '#D52B1E')
			
		}else{
			
			const prix_du_vehicule = Number(jQuery('#nf-field-5').val());
			const taux_d_interet = Number(jQuery('#nf-field-6').val());
			const periode = Number(jQuery('#nf-field-7').val());
			const acompte = Number(jQuery('#nf-field-8').val());
			
			_this.find(".loader").css('visibility', 'visible').css('opacity', '1');
			
			jQuery.ajax({
				type: 'POST',
				headers: { "cache-control": "no-cache" },
				url: 'https://'+window.location.hostname+'/wp-content/themes/astra/simulate.php',
				async: true,
				cache: false,
				dataType: 'json',
				data: 'simulate=1&prix_du_vehicule=' + prix_du_vehicule + '&taux_d_interet=' + taux_d_interet + '&periode=' + periode + '&acompte=' + acompte + '&ajax=true',
				success: function(response){ 
					
					
					if(response.has_success){
						
						setTimeout(function(){
							_this.find(".loader").css('visibility', 'hidden').css('opacity', '0');
							
							jQuery('.amount_month').text(response.amount_month)
							jQuery('.total_pay').text(response.total_pay)
							jQuery('.total_intrest').text(response.total_intrest)
							
						}, 800) 
						
					}
				}
			});
		}
		
	});
	
	// video popup homepage
	//jQuery('.elementor-element-a7b1c03 > div > a').attr("data-lity");
	jQuery(".elementor-element-a7b1c03 > div > a").attr("data-lity","data-lity");

	
}());






/*const createPdf = (element, title) => {
	
	
    var canvas = document.createElement('canvas');
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
    
	html2canvas(element, {}).then(function (canvas) {
        var ctx = canvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        var dataURL = canvas.toDataURL();
        
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF({ orientation: 'landscape' });
		
		
		var pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
		var pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
		
		
		doc.setTextColor(213,43,30);
		doc.text(title, (pageWidth / 2) - 10, 15, {align: 'center'});
		
		doc.addImage(dataURL, 'PNG', 20, 25, 250, 150);

		doc.save("caractéristique");
        
    });
	
}*/ 











// 3d link model page
jQuery(function(){
	(function() {
		var UAINFO = (function() {
			var ua = navigator.userAgent.toLowerCase();
			//browser
			var ie = !!ua.match(/(msie|trident)/i);
			var edge = !!ua.match(/edge/i);
			var chrome = edge ? false : !!ua.match(/(chrome|crios)/i);
			var safari = edge || chrome ? false : !!ua.match(/safari/i);
			var firefox = !!ua.match(/firefox/i);
			//mobile device and os
			var iPhone = ua.indexOf('iphone') >= 0;
			var iPod = ua.indexOf('ipod') >= 0;
			var iPad = ua.indexOf('ipad') >= 0;
			var iOS = iPhone || iPod || iPad;
			var Android = ua.indexOf('android') >= 0;
			var TB = iPad || (Android && ua.indexOf('mobile') < 0);
			var SP = !TB && (iOS || Android);
			return {
				IE: ie,
				Edge: edge,
				Chrome: chrome,
				Safari: safari,
				Firefox: firefox,

				iOS: iOS,
				iOS_SP: iOS && SP,
				iOS_TB: iOS && TB,
				Android: Android,
				Android_SP: Android && SP,
				Android_TB: Android && TB,
				TB: TB,
				SP: SP,
				iOS_Android: iOS || Android
			};
		})();

		var $anc = jQuery('.slick-cars-container .car-buttons > a:first-child');

		if (UAINFO.iOS_Android) {
			$anc.attr('target', '_blank');
		}
		else {
			$anc.addClass('fbIframeL');
		}
	})();

	// 3d popup model page
	jQuery("a.fbIframeL").fancybox({
		'width'			: 875,
		'height'			: 820,
		'padding'			: 0,
		'autoScale'		: false,
		'showCloseButton'	: true,
		'scrolling'			: 'no',
		'transitionIn'		: 'none',
		'transitionOut'		: 'none',
		'type'			: 'iframe',
		'overlayColor'		: '#000',
		'overlayOpacity'	: 0.75
	});
});

 