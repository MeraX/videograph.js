(function (videojs) {
    'use strict';
    /*
     * color_cycle: return a new color of the defined color cycle.
     * parameter:
     *    name (optional) the color is saved and remembered under this name
     */
    var color_cycle = function () {
        var used_colors = {};
        var colors = ['0082C6', 'DBA619', '91C4EA', 'FF0000', '000000',
            '2B5A70', '83AF23', '822433', 'AF111D', '590F68'];
        var color_counter = 0;
        var color_cycle = function (name) {
            if (name !== undefined) {
                if (! (name in used_colors)) {
                    used_colors[name] = color_cycle();
                }
                return '#' + used_colors[name];
            } else {
                return colors[(Object.keys(used_colors).length + ++color_counter) % colors.length];
            }
        };
        return color_cycle;
    }();

    var videograph = function (options) {
        var graph = null,
            graph_file = options.graph_file || "test.csv",
            player = this,
            frames = null,
            times = null,
            dates = null,
            start = null,
            end = null,
            time_top_bottom=45e3,
            videoHeight = options.videoHeight || player.videoHeight() || player.el().offsetHeight,
            column_name = options.column_name || "data", // name of column_name to show
            scale = options.scale || 1., // scale factor for displaying data
            units = options.units || "" // units of column_name
            ;


        function getStyleRuleValue(selector, style, sheet_) {
            var sheets =  typeof sheet_ !== 'undefined' ? [sheet_] : document.styleSheets;
            for (var i = 0, l = sheets.length; i < l; i++) {
                var sheet = sheets[i];
                if( !sheet.cssRules ) { continue; }
                for (var j = 0, k = sheet.cssRules.length; j < k; j++) {
                    var rule = sheet.cssRules[j];
                    if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
                        if (typeof style !== 'undefined') {
                            return rule.style[style];
                        } else {
                            return rule.style;
                        }
                    }
                }
         }
            return null;
        }

        function findTargetParameter(parameterName) {
            var result = null,
                tmp = [];
            window.location.hash
                .substr(1)
                .split("&")
                .forEach(function (item) {
                    tmp = item.split("=");
                    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
                });
            return result;
        }

        function findGetParameter(parameterName) {
            var result = null,
                tmp = [];
            window.location.search
                .substr(1)
                .split("&")
                .forEach(function (item) {
                    tmp = item.split("=");
                    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
                });
            return result;
        }

        //var graphStyle = getStyleRuleValue('#graph i');
        var graphStyle = getStyleRuleValue('#moving-graph');
        var old_transition = graphStyle ? graphStyle.transition : null;

        function videoTimeToMeasurementTime(videoTime) {
            if (!videoTime) {
                videoTime = player.currentTime();
            }
            var frame = videoTime * 25;

            var i_frame = 0;
            for (i_frame = 1; i_frame < frames.length; i_frame++) {
                if (frames[i_frame] > frame) {
                    break;
                }
            }
            var deltaTime = (times[i_frame]-times[i_frame-1]),
                deltaFrame = (frames[i_frame]-frames[i_frame-1])
            ;
            var measurementTime = (frame-frames[i_frame-1]) / deltaFrame * deltaTime + times[i_frame-1];
            return measurementTime - times[0];;
        }

        function updateGraph () {
            var top = videoHeight/2-videoTimeToMeasurementTime() * videoHeight/time_top_bottom;
            graph.style.transform = 'translateY('+top+'px)';
        };


        function jumpGraph () {
            graphStyle.transition = '';
            updateGraph();
            setTimeout(function() {
                /* I don't know why I have to wait a short time, but if I reset transition
                     right after setting top, the deactivation of the transition does not work. */
                graphStyle.transition = old_transition;
            }, 10);

        };


        var timeout = null;

        function play () {
            updateGraph();
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(play, 200);
        };

        function pause () {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            jumpGraph();
        };


        function update_url() {
            // update url with current s parameter
            var s =  findTargetParameter('s');
            if (s) {
                var re = new RegExp('([#&]s=)'+s);
                window.location.hash = window.location.hash.replace(re, '$1'+player.currentTime());
            } else {
                if (window.location.hash) {
                    window.location.hash += '&s='+player.currentTime();
                } else {
                    window.location.hash = '#s='+player.currentTime();
                }
            }
        }

        player.on('play', function () {
            if (!graph) {
                graph = document.getElementById('XX');
            }
            play();
            //video.video.play();
            //video.listen('frame');
        });

        player.on('pause', function () {
            pause();
            update_url();
        });

        player.on('seeking', function () {
            pause();
            update_url();
        });

        function updateClockRate() {
        }

        player.on('ratechange', updateClockRate);

        var svg = d3.select("svg"),
                height = +svg.attr("height"),
                width = +svg.attr("width"),
                g = svg.append("g")
                ;

        var x = d3.scaleLinear()
                .rangeRound([0, width])
                .domain([-0.1*scale,1*scale]); // make flexible

        var y = d3.scaleTime();


        player.ready(function () {
            var file;

            file = player.currentSrc()
            if (file.endsWith('webm')) {
                file = file.slice(0,-4)+'json';
            } else {
                file = file.slice(0,-3)+'json';
            }

            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200) {
                    var newArr = JSON.parse(this.responseText);

                    frames = newArr.frames;
                    times = newArr.times;
                    dates = times.map(Date);

                    start = times[0];
                    end = times[times.length-1];
                    var plot_total_height = (end-start)*height/time_top_bottom;

                    y.range([0, plot_total_height]).domain([start, end]);

                    var day_start = start - start%(3600*24*1000);

                    d3.csv(graph_file, function(d, i, columns) {
                        columns.map(function (c) {d[c] = +d[c]});
                        if (d.sod) {
                            d.time = new Date(d.sod * 1e3 + day_start);
                            delete d.sod;
                        } else if (d.time_s) {
                            d.time = new Date(d.time_s * 1e3);
                            delete d.time_s;
                        } else {
                            d.time = new Date(d.time);
                        }
                        return d;
                    }, function(error, data) {
                        if (error) throw error;

                        //x.domain(d3.extent(data, function(d) { return d[column]; }));
                        //y.domain(d3.extent(data, function(d) { return d.sod; }));

                        g.append("g")
                                .attr("transform", "translate(0," + height/2 + ")")
                                .call(d3.axisTop(x))
                            .append("text")
                                .attr("fill", "#000")
                                //.attr("transform", "rotate(-90)")
                                .attr("x", width)
                                .attr("dy", "1.71em")
                                .attr("text-anchor", "end")
                                .text(column_name + " (" + units + ")")
                            ;

                        /*g.append("g")
                                .call(d3.axisLeft(y))
                                ;*/

                        var graph_g = g.append("g")
                            .attr("id", function(d, i){ return 'moving-graph'; })

                        graph = document.getElementById('moving-graph');

                        for (var column in data[0]) {
                            if (column == 'time') {
                                continue;
                            }
                            var line = d3.line()
                                .x(function(d) { return x(d[column]*scale); })
                                .y(function(d) { return y(d.time); })
                                .defined(function(d) { return !isNaN(d[column]); });
                            var graph_path = graph_g.append("path")
                                .datum(data)
                                .attr("fill", "none")
                                .attr("stroke", color_cycle(column))
                                .attr("stroke-linejoin", "round")
                                .attr("stroke-linecap", "round")
                                .attr("stroke-width", 1.5)
                                .attr("d", line);
                        }
                    });

                    //d3 end
                    var s = findTargetParameter('s') || findGetParameter('s');
                    if (s) {
                        player.currentTime(+s);
                        player.play();
                        player.pause();
                        jumpGraph();
                    }

                }
            };
            xhttp.open("GET", file, true);
            xhttp.send();

        });

    };

    videojs.plugin('videograph', videograph);
}(window.videojs));
