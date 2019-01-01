# tfbvis
This project is a quick exploration of visualizing the TechEmpower framework benchmarks memory, latency, load average in addition to requests per second. By grabbing the results from the [continuous benchmark results](https://tfb-status.techempower.com/results/56076e97-0658-46a1-81bb-6f8890f2e85e) we can take a closer look at some of the data that comes from 'dstat' which TechEmpower's benchmark records but its visualization (as of 2018-12-31) does not incorporate.

[You can see a chart showing the top frameworks here.](https://johnsabr.github.io/tfbvis/).

## What is here

With the hundreds of frameworks being benchmarked, the 'dstat' tool provides multiple GB of data. This is far too much to download every time we want to visualize some data in the browser, especially since we're only visualizing aggregates (averages for instance). We need something to munge the data, hence this project. This is a simple Kotlin project that reads through the unzipped 'results.zip' directory and produces a single JSON file with just the data we want to visualize in the browser.

The visualization is a single file (`index.html` in `docs`). It simply grabs this generated JSON file and uses the great charting library [plotly.js](https://plot.ly/javascript/) to make some charts with it.
