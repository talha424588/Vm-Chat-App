$(document).ready(function () {
    // Toggle sidebar on search icon click
    $("#search-icon").on("click", function () {
        $("#sidebar").toggleClass("sidebar-open sidebar-closed");
        $(".container-fluid").toggleClass("sidebar-open");
        $("#search-icon").toggleClass("icon-move-left");
        $("#search-icon").addClass("d-none");
        $("#message-area").toggleClass("col-md-8 col-md-4");
    });

    // Close sidebar on close button click
    $("#close-sidebar").on("click", function () {
        $("#search-icon").hasClass("d-none") ? $("#search-icon").removeClass("d-none") : '';
        $("#sidebar").removeClass("sidebar-open").addClass("sidebar-closed");
        $(".container-fluid").removeClass("sidebar-open");
        $("#search-icon").removeClass("icon-move-left");
        $("#message-area").toggleClass("col-md-4 col-md-8");
        document.getElementById("messsage_search_query").value = "";
        const searchResultsDiv = document.querySelector(".search-results");
        searchResultsDiv.innerHTML = "";
        const highlightedMessages = DOM.messages.querySelectorAll(".highlight");
        highlightedMessages.forEach((element) => {
            element.classList.remove("highlight");
        });
    });

    // Close sidebar on clicking outside of it
    $(document).on("click", function (event) {
        if (!$(event.target).closest("#sidebar, #search-icon").length) {
            $("#search-icon").hasClass("d-none") ? $("#search-icon").removeClass("d-none") : '';
            if ($("#sidebar").hasClass("sidebar-open")) {
                $("#sidebar").removeClass("sidebar-open").addClass("sidebar-closed");
                $(".container-fluid").removeClass("sidebar-open");
                $("#search-icon").removeClass("icon-move-left");
                $("#message-area").toggleClass("col-md-4 col-md-8");
            }
        }
    });
});


const searchInput = document.getElementById('searchInput');
const clearIcon = document.querySelector('.clear-icon');
if(searchInput)
{
    searchInput.addEventListener('input', function () {
        if (searchInput.value) {
            clearIcon.style.display = 'block';
        } else {
            clearIcon.style.display = 'none';
        }
    });
}

if(clearIcon)
{
    clearIcon.addEventListener('click', function () {
        searchInput.value = '';
        clearIcon.style.display = 'none';
        searchInput.focus();
    });
}
