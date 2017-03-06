var update_field_of_view = function () {
    var FWHM = findTargetParameter('FWHM');
    if (FWHM === null) {
        return;
    }
    //var videoWidth = +d3.select('#myvideo').node().getBoundingClientRect().width;
    var videoWidth = 640;

    var width = videoWidth/70 * FWHM;
    d3.selectAll('.graph .field_of_view, .graph .fwhm')
        .style('width', width + 'px')
        .style('left',(videoWidth - width)/2 - 1 + 'px');

    d3.selectAll('.graph .fwhm')
        .style('height', width)
        .style('top',(videoWidth - width)/2 - 1 + 'px')
        .style('border-radius', width/2 + 'px')
        .style('-webkit-border-radius', width/2 + 'px')
        .style('-moz-border-radius', width/2 + 'px');

    d3.selectAll('.graph .field_of_view3, .graph .fwhm3')
        .style('width', width*3 + 'px')
        .style('left',(videoWidth - width*3)/2 - 1 + 'px');

    d3.selectAll('.graph .fwhm3')
        .style('height', width*3)
        .style('top',(videoWidth - width*3)/2 - 1 + 'px')
        .style('border-radius', width*3/2 + 'px')
        .style('-webkit-border-radius', width*3/2 + 'px')
        .style('-moz-border-radius', width*3/2 + 'px');
}

d3.select("#FWHM").on("input", function() {
    setTargetParameter('FWHM',+this.value);
    update_field_of_view();
});

d3.select("#cloud_top_height").on("input", function() {
    setTargetParameter('cth',this.value);
    cloud_top_height = +this.value;
});

d3.select("#units").on("input", function() {
    setTargetParameter('units',this.value);
    update_units_text();
});

update_field_of_view();

cloud_top_height = findTargetParameter('cth') || 1000;
