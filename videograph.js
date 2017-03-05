function escapeRegExp(str) {
    // see http://stackoverflow.com/a/6969486
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

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


function setTargetParameter(name, value) {
    value = encodeURIComponent(value);
    var current_value = findTargetParameter(name);
    if (current_value !== null) {
        var re = new RegExp('([#&]'+name+'=)'+escapeRegExp(encodeURIComponent(current_value)));
        window.location.hash = window.location.hash.replace(re, '$1'+value);
    } else {
        if (window.location.hash) {
            window.location.hash += '&'+name+'='+value;
        } else {
            window.location.hash = '#'+name+'='+value;
        }
    }
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

var update_units_text; /*fill it inside videograph' */


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
            frame_to_time = function() {return 0;},
            time_to_ground_speed = function() {return 0;},
            time_to_altitude = function() {return 0;},
            start = null,
            end = null,
            time_top_bottom=45e3,
            videoHeight = options.videoHeight || player.videoHeight() || player.el().offsetHeight,
            cloud_top_height = options.cloud_top_height || 1000, //cloud top height (m)
            min_value = options.min_value || -30, //minimal value
            max_value = options.max_value || 30, //maximal value
            scale = options.scale || 1., // scale factor for displaying data
            units = findTargetParameter('units') || options.units || "" // units of abscissa
            ;

        //var graphStyle = getStyleRuleValue('#graph i');
        var graphStyle = getStyleRuleValue('#moving-graph');
        var old_transition = graphStyle ? graphStyle.transition : null;

        function video_time_to_time(videoTime) {
            /* returns numer of millisecods in measurement time since start of video */
            if (!videoTime) {
                videoTime = player.currentTime();
            }
            var frame = videoTime * 25;
            return frame_to_time(frame);
        }

        function updateGraph (lead_time) {
            var time = video_time_to_time()
            var top = -(time - start +lead_time) * videoHeight/time_top_bottom;
            if(time_to_altitude(time)>cloud_top_height) {
                /* Use simple trigonometry to calculate the time a cloud at
                 * cloud_top_height needs to pass the viewing angle of 70°
                 * np.tan(np.deg2rad(35))*2 = 1.4 */
                var time_scale = (time_to_ground_speed(time)/1000 * time_top_bottom) / (1.4 * (time_to_altitude(time) - cloud_top_height));
                graph.style.transform = 'scale(1,'+time_scale+') translateY('+top+'px)';
            } else {
                graph.style.transform = 'translateY('+top+'px)';
            }
        };

        var units_text;
        update_units_text = function(units) {
            if (units === undefined) {
                units = findTargetParameter('units');
            }
            units_text.text(units);
        }

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
            updateGraph(200);
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
            setTargetParameter('s', player.currentTime());
        });

        player.on('seeking', function () {
            pause();
            setTargetParameter('s', player.currentTime());
        });

        function updateClockRate() {
        }

        player.on('ratechange', updateClockRate);

        var svg = d3.select("svg");
        var height = +svg.attr("height");
        var width = +svg.attr("width");
        var svg_group = svg.append("g").attr('transform', 'translate(0,'+videoHeight/2+')');

        var x = d3.scaleLinear()
                .rangeRound([0, width])
                .domain([min_value*scale,max_value*scale]);

        var y = d3.scaleTime();

        var plot_legend = function (columns) {
            var legend = svg.append("g")
                .attr("class", "legend")
                .attr("height", 100)
                .attr("width", 100)
                .attr('transform', 'translate(-50,10)')


            legend.selectAll('path')
                .data(columns)
                .enter()
                .append("path")
                .attr("d", function(d, i){
                    var x = width-65, y = i*20+3;
                    return "M "+x+" "+y+" h 10";
                })
                .attr("stroke-width", 1.5)
                .style("stroke", color_cycle);

            legend.selectAll('text')
                .data(columns)
                .enter()
                .append("text")
                .attr("x", width - 52)
                .attr("y", function(d, i){ return i *  20 + 9;})
                .text(function(column) {return column; });

        }

        player.ready(function () {
            var xhttp_frames_json = new XMLHttpRequest();
            xhttp_frames_json.onreadystatechange = function () {
                if(xhttp_frames_json.readyState === XMLHttpRequest.DONE && xhttp_frames_json.status === 200) {
                    var frames_json = JSON.parse(this.responseText);

                    frame_to_time = d3.scaleLinear().domain(frames_json.frames).range(frames_json.times);

                    start = frames_json.times[0];
                    end = frames_json.times[frames_json.times.length-1];
                    var plot_total_height = (end-start)*height/time_top_bottom;

                    y.range([0, plot_total_height]).domain([start, end]);

                    var day_start = start - start%(3600*24*1000);

                    d3.csv(graph_file, function(d, i, columns) {
                        columns.map(function (c) {d[c] = +d[c]});
                        if (d.sod !== undefined) {
                            d.time = new Date(d.sod * 1e3 + day_start);
                            delete d.sod;
                        } else if (d.time_s !== undefined) {
                            d.time = new Date(d.time_s * 1e3);
                            delete d.time_s;
                        } else {
                            d.time = new Date(d.time);
                        }
                        return d;
                    }, function(error, data) {
                        if (error) throw error;

                        units_text = svg_group.append("g")
                                .call(d3.axisTop(x))
                            .append("text")
                                .attr("fill", "#000")
                                .attr("x", width)
                                .attr("dy", "1.71em")
                                .attr("text-anchor", "end")
                            ;
                        update_units_text(units);

                        /*g.append("g")
                                .call(d3.axisLeft(y))
                                ;*/

                        var graph_g = svg_group.append("g")
                            .attr("id", "moving-graph")

                        graph = document.getElementById('moving-graph');

                        var columns = d3.keys(data[0]).filter(function(column) {return column != 'time';});
                        var line = function (column) {
                            var d3_line = d3.line()
                            .x(function(row) { return x(row[column]*scale); })
                            .y(function(row) { return y(row.time); })
                            .defined(function(row) { return !isNaN(row[column]); });
                            return d3_line(data);
                        }

                        var graph_paths = graph_g.selectAll("path")
                            .data(columns).enter()
                            .append("path")
                            .attr("fill", "none")
                            .attr("stroke", color_cycle)
                            .attr("stroke-linejoin", "round")
                            .attr("stroke-linecap", "round")
                            .attr("stroke-width", 1.5)
                            .attr("d", line);

                        plot_legend(columns);
                        var s = findTargetParameter('s') || findGetParameter('s');
                        if (s !== null) {
                            player.currentTime(+s);
                            player.play();
                            player.pause();
                            jumpGraph();
                        }
                    });


                }
            };
            var file;

            file = player.currentSrc()
            if (file.endsWith('webm')) {
                file = file.slice(0,-4)+'json';
            } else {
                file = file.slice(0,-3)+'json';
            }
            xhttp_frames_json.open("GET", file, true);
            xhttp_frames_json.send();

            var xhttp_nas_json = new XMLHttpRequest();
            xhttp_nas_json.onreadystatechange = function () {
                if(xhttp_nas_json.readyState === XMLHttpRequest.DONE && xhttp_nas_json.status === 200) {
                    var nas_json = JSON.parse(this.responseText);
                    time_to_ground_speed = d3.scaleLinear().domain(nas_json.ground_speed.time).range(nas_json.ground_speed.value);
                    time_to_altitude = d3.scaleLinear().domain(nas_json.height.time).range(nas_json.height.value);
                };
            }
            file = file.replace(/\/videos\/(RF[0-9]+.json)/, "/nas/$1")
            xhttp_nas_json.open("GET", file, true);
            xhttp_nas_json.send();



        });

    };

    videojs.plugin('videograph', videograph);

}(window.videojs));
