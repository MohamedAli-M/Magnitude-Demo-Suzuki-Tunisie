
(function ($) {
	 
 
	$('.wpcf7-form').submit(function() {
       $(".crm-form .btn").parent().append ('&nbsp;<i class="fa fa-spinner fa-pulse fa-fw" style="color:#005aa9"></i>');  
    });

    if ($('.wpcf7').length > 0) { 
        var wpcf7Elm = document.querySelector( '.wpcf7' );

        wpcf7Elm.addEventListener( 'wpcf7mailsent', function( event ) {
                    $(".fa-spinner").remove() }, false );
        
        wpcf7Elm.addEventListener( 'wpcf7invalid', function( event ) {
                    $(".fa-spinner").remove() }, false );
        
        wpcf7Elm.addEventListener( 'wpcf7mailfailed', function( event ) {
                    $(".fa-spinner").remove() }, false );
        }
    // check if cutom quote present 
    if ($('[name="prm-model"]').length > 0) { 
        populate_fields_modeles(); 	 
        var $model_dd = $('[name="prm-model"]');
        var $version_dd = $('[name="prm-version"]');
        $model_dd.change(function () {
                populate_fields();
            });

    }

	   function populate_fields_modeles() {
 
            var data = { action: "cf7_populate_values_modeles" , any: "any" };
            $.post(
                "/wp-admin/admin-ajax.php",
                data,
                function (response) {
                   
                    modeles  = response.GetModelResult;
                    $model_dd.empty(); 
                    
					var getCar = getParameterByName('subject')
                    console.log(getCar)
			
                    $.each( modeles.string , function (index  ) {
				       if (this != "") { 
					    $option = $("<option>").text(this ).val(this);
					    $model_dd.append($option); 
					   }
					   
				    });
   
   
                    if ( getCar==null ) { 
						$option  = $("<option>").text("");
						$model_dd.prepend($option);
						$model_dd.val($("[name='prm-model'] option:first").val()) }
					else { 
					   if ( getCar=="new-baleno" ) {$model_dd.val("NEW BALENO").change();}  
					   if ( getCar=="new-celerio" ) {$model_dd.val("NEW CELERIO").change();}  
					   if ( getCar=="ciaz" ) {$model_dd.val("CIAZ").change();}  
					   if ( getCar=="dzire" ) {$model_dd.val("DZIRE").change();}  
					   if ( getCar=="ertiga" ) {$model_dd.val("ERTIGA FL").change();}  
					   if ( getCar=="jimny" ) {$model_dd.val("JIMNY").change();}  
					   if ( getCar=="new-swift" ) {$model_dd.val("NEW SWIFT").change();}  
					   if ( getCar=="vitara" ) {$model_dd.val("NEW VITARA").change();}  
					   if ( getCar=="s-presso" ) {$model_dd.val("SPRESSO").change();}  
                       if ( getCar=="fronx" ) {$model_dd.val("FRONX").change();}  
                       if ( getCar=="grand-vitara" ) {$model_dd.val("GRAND VITARA").change();} 
                       if ( getCar=="jimny-5d-at" ) {$model_dd.val("JIMNY 5D AT").change();} 
                       if ( getCar=="swift-iv" ) {$model_dd.val("SWIFT IV").change();} 
 

					}
					
                },
                "json"
               );
            }
 
		
        function populate_fields() {
            var data = { action: "cf7_populate_values", mark_option: $model_dd.val() };
            $model_dd.css("background-color", "#eee");
            $version_dd.css("background-color", "#eee");
            $.post(
                "/wp-admin/admin-ajax.php",
                data,
                function (response) {
                    $model_dd.css("background-color", "#fff");
                    $version_dd.css("background-color", "#fff");
                    versions = response.GetVersionResult;
                    $version_dd.empty();
                    $option = $("<option>").text("");
                    $version_dd.append($option);
                    if (versions.VinVersion.VersionDesc === undefined) {
                        $.each(versions.VinVersion, function (index) {
                            $option = $("<option>").text(this.VersionDesc).val(this.VersionNo);
                            $version_dd.append($option);
                        });
                    } else {
                        $option = $("<option>").text(versions.VinVersion.VersionDesc).val(versions.VinVersion.VersionNo);
                        $version_dd.append($option);
                    }
                },
                "json"
            );
        }
    })(jQuery);
	
	function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
   }