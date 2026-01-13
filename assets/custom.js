<!-- ============================================================================= -->
<!-- Ella Custom JS - Customize The Style For Layout -->
<!-- ============================================================================= -->

<!-- ============================================================================= -->
<!-- IMPORTANT DISCLAIMER -->
<!-- Please use only JS to style the layout. -->
<!-- ============================================================================= -->


        window.addEventListener('scroll', function() {
    var section = document.querySelector('.container-content');
    var content = document.querySelector('.container-slider');
    var sectionBottom = section.getBoundingClientRect().bottom;
    var windowHeight = window.innerHeight;

    if (sectionBottom > windowHeight) {
        content.style.position = 'fixed';
        content.style.bottom = '0';
    } else {
        content.style.position = 'absolute';
        content.style.bottom = '0';
    }
});