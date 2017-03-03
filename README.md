# Video Graph
A tool to analyze time series synchronously with the [specMACS campaign quicklook videos](https://macsserver.physik.uni-muenchen.de/campaigns/").

Marek Jacob, 2017

## Info
This is work in progress.
Ideas and contribution are warmly welcome!

## How to use
Video Graph has to be hosted on a web server.
Simple local access via `file://` does not work due to restricted cross origin requests.
But Python includes a simple HTTP server, which you can start within the Video Graph directory:
```
python -m SimpleHTTPServer
```
Than you should be able to open the index.html of Video Graph in your browser on [http://localhost:8000](http://localhost:8000).
The port may differ from 8000. Have a look on the python SimpleHTTPServer output.

## Further plans

  * Adjust the graph top-bottom expansion parameter to flight altitude and speed.
  * Add possibility to upload own data.
  * Make the flight/video exchangeable.
  * Provide possibility to change meta Data (FOW-width, data range, scale, legend).
  * Show multiple curves.
  * Show multiple curve panels or different axes on one panel.
  * Find a nice way to show time series of flags.
  * Improve browser compatibility.
  * Make animation smoother.
  * ? Loop feature. Add a stop marker to the url.
  * Github the project for pull and feature requests. ☑
