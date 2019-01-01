# tfbvis
Visualizing TechEmpower benchmarks memory and load average in addition to requests per second

Downloading the 'results.zip' from the [continuous benchmark results](https://tfb-status.techempower.com/results/56076e97-0658-46a1-81bb-6f8890f2e85e) we can take a closer look at some of the data that comres from 'dstat' which TechEmpower's benchmark visualization (as of 2018-12-31) does not incorporate.

[Here you can see a chart showing the top 100 frameworks (as of the 2018-10-30 results) here.](https://johnsabr.github.io/tfbvis/)

## What is here

With the hundreds of frameworks being benchmarked, the 'dstat' tool provides multiple GB of data. This is far too much to download over a network, and we're only visualizing a tiny amount, hence this project. This is a dead simple Kotlin project that reads the unzipped 'results.zip' directory and produces a single JSON file with just the data we want to visualize in the browser.
