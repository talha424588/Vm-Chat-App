'use strict';

$(function() {

	$("input[type='password'][data-eye]").each(function(i) {
		var $this = $(this),
			id = 'eye-password-' + i,
			el = $('#' + id);

			$this.wrap($("<div/>", {
				class: 'eye-div',
				id: id
			}));
			
			// Create the <i> element with the SVG inside
			const iconElement = $("<i/>", {
				class: 'login-icons',
				html: `
					<svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg"> 
						<path d="M1 12.2C1 9.93759 1 8.80559 1.74715 8.10319C2.49345 7.39999 3.6962 7.39999 6.1 7.39999H12.9C15.3038 7.39999 16.5066 7.39999 17.2529 8.10319C18 8.80559 18 9.93759 18 12.2C18 14.4624 18 15.5944 17.2529 16.2968C16.5066 17 15.3038 17 12.9 17H6.1C3.6962 17 2.49345 17 1.74715 16.2968C1 15.5944 1 14.4624 1 12.2Z" stroke="#687780" stroke-width="1.5"></path>
						<path d="M4.40039 7.4V5.8C4.40039 4.52696 4.93771 3.30606 5.89415 2.40589C6.85058 1.50571 8.14779 1 9.50039 1C10.853 1 12.1502 1.50571 13.1066 2.40589C14.0631 3.30606 14.6004 4.52696 14.6004 5.8V7.4" stroke="#687780" stroke-width="1.5" stroke-linecap="round"></path>
						<path d="M6.09961 12.2H6.10726M9.49196 12.2H9.49961M12.892 12.2H12.8996" stroke="#687780" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
					</svg>
				`
			});
			
			// Append the icon to the wrapped element
			$this.before(iconElement);
			

		$this.css({
			paddingRight: 40
		});
		$this.after($("<span/>", {
			class: 'eye-icon',
			id: 'passeye-toggle-'+i,
			html: '<i class="fas fa-eye" aria-hidden="true"></i>'
		}).css({
			position: 'absolute',
			right: 10,
			top: ($this.outerHeight() / 2) - 12,
			cursor: 'pointer',
		}));

		$this.after($("<input/>", {
			type: 'hidden',
			id: 'passeye-' + i
		}));

		var invalid_feedback = $this.parent().parent().find('.invalid-feedback');

		if(invalid_feedback.length) {
			$this.after(invalid_feedback.clone());
		}

		$this.on("keyup paste", function() {
			$("#passeye-"+i).val($(this).val());
		});
		$("#passeye-toggle-"+i).on("click", function() {
			if($this.hasClass("show")) {
				$this.attr('type', 'password');
				$this.removeClass("show");
				$(this).children('i').removeClass('fa-eye-slash').addClass('fa-eye');
			}else{
				$this.attr('type', 'text');
				$this.val($("#passeye-"+i).val());				
				$this.addClass("show");
				$(this).children('i').removeClass('fa-eye').addClass('fa-eye-slash');
			}
		});
	});

	$(".my-login-validation").submit(function() {
		var form = $(this);
        if (form[0].checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
		form.addClass('was-validated');
	});
});