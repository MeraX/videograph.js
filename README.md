# Video Graph
A tool to analyze time series synchronously with the [specMACS campaign quicklook videos](https://macsserver.physik.uni-muenchen.de/campaigns/").

Marek Jacob, 2017

[Example](http://gop.meteo.uni-koeln.de/~mjacob/videograph/)

## Info
This is work in progress.
Ideas and contribution are warmly welcome!

## How to use
If you hosts Video Graph yourself (see below) you can easily exchange the shown data.
Basically four steps are needed:

### Change Video file
First, exchange the specMACS video link in `index.html`.
Some data to match video frames and the time of the measurement are used from the specMACS server and the corresponding URLs are derived from the video link.
Therefore, it is the best to load the video from the specMACS server and just change the RF number and the campaign (`NARVAL` or `NAWDEX`).

### Use own data
Second, the shown data is defined by the `graph_file` option set for the videograph plugin (also in `index.html`).
For the "graph_file", a comma separated file is excepted that includes a header flowed by rows of floats.
One column has to specify the time.
Three different formats for the time are possible; the column name defines the format:

  1. `sod`: Seconds of the day. Seconds since 00:00:00 UTC of the day of the research flight.
  2. `time_s`: Seconds since 1970-01-01 00:00:00 UTC (Unix epoch).
  3. `time`: Milliseconds since 1970-01-01 00:00:00 UTC (Javascript Date).

All other columns are then shown as graphs in one figure.

### Adjust "y"-Axis
Finally, you have to specify the range of th y-axis, which is the horizontal axis in this case.
Todo so, set `min_value` and `max_value` in `index.html`.
The `scale` parameter can be used to multiply a constant with all shown data as well as `min_value` and `max_value`.

### Host Video Graph
Video Graph has to be hosted on a web server.
Simple local access via `file://` does not work due to restricted cross origin requests.
But Python includes a simple HTTP server, which you can start within the Video Graph directory:
```
python -m SimpleHTTPServer
```
Than you should be able to open the index.html of Video Graph in your browser on [http://localhost:8000](http://localhost:8000).
The port may differ from 8000. Have a look on the python SimpleHTTPServer output.


## Further plans

  * ☑ Adjust the graph top-bottom expansion parameter to flight altitude and speed.
  * ☐ Use real cloud top hight for the top-bottom scaling of the graph.
  * ☐ Add possibility to upload own data.
  * ☐ Make the flight/video exchangeable.
  * ☐ Provide possibility to change meta Data (FOW-width ☑, data range ½, scale ½, legend ☑).
  * ☑ Show multiple curves including legend.
  * ☐ Show multiple curve panels or different axes on one panel.
  * ☐ Find a nice way to show time series of flags.
  * ☐ Improve browser compatibility.
  * ☐ Make animation smoother.
  * ☐ ? Loop feature. Add a stop marker to the url.
  * ☑ Github the project for pull and feature requests.
