# tfbvis

This project is a quick exploration of visualizing the TechEmpower framework benchmarks latency, memory, and CPU load in addition to requests per second. By grabbing the results from the [continuous benchmark results](https://tfb-status.techempower.com/) we can take nicer look at some of the data that comes from 'dstat' which TechEmpower's benchmark records but its visualization does not yet incorporate.

[You can see a visual using ag-grid showing the top frameworks RPS, latency, memory and CPU load here](https://ajdust.github.io/tfbvis/).

## In this repo

With the hundreds of frameworks being benchmarked, the 'dstat' tool provides about 2.7 GB of data. This is far too much to download every time we want to visualize some data in the browser, especially since we're only visualizing aggregates (such as averages). We need something to munge the data, hence a simple Python script that reads through the unzipped 'results.zip' directory and generates a JSON file per test type with aggregated stats for RPS, latency, memory, and CPU.

The visualization uses ag-grid, with a single file `docs/main.js` which is loaded by `docs/index.html`.
