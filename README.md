# tfbvis

This project is a quick exploration of visualizing the TechEmpower framework benchmarks latency, memory, and CPU load in addition to requests per second. By grabbing the results from the [continuous benchmark results](https://tfb-status.techempower.com/) we can take nicer look at some of the data that comes from 'dstat' which TechEmpower's benchmark records but its visualization does not yet incorporate.

[You can see a visual using ag-grid showing the top frameworks RPS, latency, memory and CPU load here](https://ajdust.github.io/tfbvis/).

## In this repo

With the hundreds of frameworks being benchmarked, the 'dstat' tool provides about 2.7 GB of data. This is far too much to download every time we want to visualize some data in the browser, especially since we're only visualizing aggregates (such as averages). We need something to munge the data, hence a simple Python script that reads through the unzipped 'results.zip' directory and generates a JSON file per test type with aggregated stats for RPS, latency, memory, and CPU.

The visualization uses ag-grid, with a single file `docs/main.js` which is loaded by `docs/index.html`.

## Running it locally

Continuous benchmarking means new benchmark results appear every few days. If you would like to see a run not available here, you can run this visualization locally. Below are instructions for Linux with Python 3.8+ (the code likely works for other Python versions and OS but has not been tested as such).

- `cd` into the cloned repo
- Create the virtual environment (optional):
  - `python3 -m venv ./tfbenv`
  - Activate the environment with `source ./tfbenv/bin/activate` before installing packages
- If it is the first time, install required packages: `python3 -m pip install -r ./requirements.txt`. To list packages `python3 -m pip list` can be used.
- Either

  - Identify the run to fetch by browsing [continuous benchmarking](https://tfb-status.techempower.com). Then run with the details URL. For instance: `python3 ./main.py https://tfb-status.techempower.com/results/3e8b131d-0f8b-40db-babe-eea7774b9e0b`
  - Use a directory with results already available. For instance: `python3 ./main.py ./cache/{path} {environment-name}_{run-date}_{run-id}`

- After the run is processed it will appear in the `docs` directory:
  - Add it to the `<select id="testrun">` dropdown in `index.html` with an `<option>` value matching the directory name as it appears in the `docs` directory
  - `cd` to `docs` and launch `./pyserv.sh`
  - Browse to `http://localhost:8000` to see the results
