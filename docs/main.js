let columnDefs = [
    {
        headerName: "Framework", field: "name",
        filter: true, pinned: 'left', cellStyle: { textAlign: "left" }
    },
    {
        headerName: "Threads", field: "threads", hide: true

    },
    {
        headerName: "Connections", field: "connections", hide: true,

    },
    {
        headerName: "RPS (thousands of requests)", children: [
            {
                headerName: "Megabytes read", field: "rps.megabytes_read",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "Over seconds", field: "rps.over_seconds",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "Request count", field: "rps.request_count",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: rpsFormatter
            },
            {
                headerName: "RPS total", field: "rps.requests_per_sec",
                filter: 'agNumberColumnFilter', sort: 'desc', valueFormatter: rpsFormatter,
                filterParams: { resetButton: true }
            },
            {
                headerName: "% max RPS", field: "rps.requests_per_sec",
                filter: false, sortable: false,
                cellRenderer: 'percentBarCellRenderer', width: 200
            },
            {
                headerName: "RPS max per thread", field: "rps.thread_rps_max",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: rpsFormatter
            },
            {
                headerName: "RPS mean per thread", field: "rps.thread_rps_mean",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: rpsFormatter
            },
            {
                headerName: "RPS stdev per thread", field: "rps.thread_rps_stdev",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: rpsFormatter
            },
            {
                headerName: "RPS stdev range per thread", field: "rps.thread_rps_stdev_range",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: percentFormatter
            },
            {
                headerName: "Transfer MB per sec", field: "rps.transfer_megabytes_per_sec",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "Non 2xx count", field: "rps.non_2xx_count",
                filter: 'agNumberColumnFilter', valueFormatter: non2xxFormatter,
                cellStyle: { color: "red" }
            },
        ]
    },
    {
        headerName: "Latency (ms)", children: [
            {
                headerName: "50%", field: "latency.lat50",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "75%", field: "latency.lat75",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "90%", field: "latency.lat90",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "99%", field: "latency.lat99",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "% mean 90%", field: "latency.lat90",
                filter: false, sortable: false,
                cellRenderer: 'percentBarCellRenderer', width: 200
            },
            {
                headerName: "Max", field: "latency.thread_max",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "Mean", field: "latency.thread_mean",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "Stdev", field: "latency.thread_stdev",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: latencyFormatter
            },
            {
                headerName: "Stdev range", field: "latency.thread_stdev_range",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: percentFormatter
            }
        ]
    },
    {
        headerName: "Memory (MB)", children: [
            {
                headerName: "Max", field: "memory.max",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: memoryFormatter
            },
            {
                headerName: "Mean", field: "memory.mean",
                filter: 'agNumberColumnFilter', valueFormatter: memoryFormatter
            },
            {
                headerName: "% max mean", field: "memory.mean",
                filter: false, sortable: false,
                cellRenderer: 'percentBarCellRenderer', width: 200
            },
            {
                headerName: "Median", field: "memory.median",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: memoryFormatter
            },
            {
                headerName: "Stdev", field: "memory.stdev",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: memoryFormatter
            },
            {
                headerName: "Stdev range", field: "memory.stdev_range",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: percentFormatter
            }
        ]
    },
    {
        headerName: "CPU (total usage)", children: [
            {
                headerName: "Max", field: "cpu.max",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: cpuFormatter
            },
            {
                headerName: "Mean", field: "cpu.mean",
                filter: 'agNumberColumnFilter', valueFormatter: cpuFormatter
            },
            {
                headerName: "% max mean", field: "cpu.mean",
                filter: false, sortable: false,
                cellRenderer: 'percentBarCellRenderer', width: 200
            },
            {
                headerName: "Median", field: "cpu.median",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: cpuFormatter
            },
            {
                headerName: "Stdev", field: "cpu.stdev",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: cpuFormatter
            },
            {
                headerName: "Stdev range", field: "cpu.stdev_range",
                filter: 'agNumberColumnFilter', hide: true, valueFormatter: cpuFormatter
            }
        ]
    },
    {
        headerName: "Meta", children: [
            { headerName: "Language", field: "meta.language", filter: true },
            { headerName: "Platform", field: "meta.platform", filter: true },
            { headerName: "Webserver", field: "meta.webserver", filter: true },
            { headerName: "Classification", field: "meta.classification", filter: true },
            { headerName: "Database", field: "meta.database", filter: true },
            { headerName: "Orm", field: "meta.orm", filter: true },
            { headerName: "Framework", field: "meta.framework", filter: true }
        ]
    }
];


let fTwoPoint = d3.format(",.2f");
let fOnePoint = d3.format(",.1f");
let fWhole = d3.format(",.0f");

function memoryFormatter(params) {
    let v = params.value;
    return fWhole(v);
}

function rpsFormatter(params) {
    let v = params.value / 1e3;
    return (v < 10 ? fTwoPoint(v) : fWhole(v));
}

function non2xxFormatter(params) {
    if (params.value <= 0) return "";
    let v = params.value / 1e3;
    return (v < 10 ? fTwoPoint(v) : fWhole(v));
}

function latencyFormatter(params) {
    return fTwoPoint(params.value);
}

function cpuFormatter(params) {
    return fOnePoint(params.value) + "%";
}

function percentFormatter(params) {
    return fWhole(params.value) + "%";
}

// cell renderer class
function PercentBarCellRenderer() { }
{
    // init method gets the details of the cell to be rendere
    PercentBarCellRenderer.prototype.init = function (params) {
        this.eGui = percentCellRenderer(params);
    };

    PercentBarCellRenderer.prototype.getGui = function () {
        return this.eGui;
    };

    let percentCellRenderer = function (params) {
        let value = params.value;
        var maxThing = 0;
        if (params.colDef.field.indexOf("rps.") === 0)
            maxThing = window.TFB_GRID.minMaxes.maxRps;
        else if (params.colDef.field.indexOf("latency.") === 0)
            maxThing = window.TFB_GRID.minMaxes.meanLat90;
        else if (params.colDef.field.indexOf("memory.") === 0)
            maxThing = window.TFB_GRID.minMaxes.maxMem;
        else if (params.colDef.field.indexOf("cpu.") === 0)
            maxThing = window.TFB_GRID.minMaxes.maxCpu;

        let percent = maxThing <= 0 ? 0 : 100 * value / maxThing;
        let eDivPercentBarWrapper = document.createElement('div');
        eDivPercentBarWrapper.className = 'div-percent-bar-wrapper';
        let eDivPercentBar = document.createElement('div');

        eDivPercentBarWrapper.appendChild(eDivPercentBar);
        eDivPercentBar.className = "div-percent-bar";
        eDivPercentBar.style.width = (percent > 100 ? "100" : percent) + "%";
        eDivPercentBar.style.backgroundColor = percent > 100
            ? "red" : (params.data.meta.color || "#cccccc");

        // if (percent < 20) {
        //     eDivPercentBar.style.backgroundColor = "#f55d51";
        // } else if (percent < 60) {
        //     eDivPercentBar.style.backgroundColor = "#ffb300";
        // } else {
        //     eDivPercentBar.style.backgroundColor = "#82d249";
        // }

        let eValue = document.createElement("div");
        eValue.className = "div-percent-value";
        eValue.innerHTML = fWhole(percent) + "%";
        if (percent > 85) {
            eValue.style["margin-left"] = "3%";
            eValue.style.color = "white";
            eValue.style["text-shadow"] = "black 1px 1px";
        } else if (percent > 70) {
            eValue.style["margin-left"] = (percent - 5) + "%";
        } else if (percent > 10) {
            eValue.style["margin-left"] = percent + "%";
        } else if (percent > 5) {
            eValue.style["margin-left"] = (percent + 2) + "%";
        } else {
            eValue.style["margin-left"] = (percent + 4) + "%";
        }

        let eOuterDiv = document.createElement("div");
        eOuterDiv.className = "div-outer-div";
        eOuterDiv.appendChild(eDivPercentBarWrapper);
        eOuterDiv.appendChild(eValue);

        return eOuterDiv;
    };
}

window.TFB_GRID = {
    gridOptions: {
        defaultColDef: {
            sortable: true,
            resizable: true,
            width: 100,
            cellStyle: { textAlign: "right" }
        },
        columnDefs: columnDefs,
        components: {
            'percentBarCellRenderer': PercentBarCellRenderer
        }
    },

    changeRun: function () {
        let el = document.getElementById("testrunLink");
        let testrun = document.getElementById("testrun").value;
        let [environment, date, runid] = testrun.split('_');
        date = date.replace('started', '');
        let url = `https://tfb-status.techempower.com/results/${runid}`;
        el.innerHTML = `Showing <a href="${url}">data from the ${environment} run on ${date}.</a>`;
        TFB_GRID.loadTable();
    },

    loadTable: function () {
        let testtype = document.getElementById("testtype").value;
        let testrun = document.getElementById("testrun").value;
        let key = `data_${testrun}_${testtype}`;

        let colChecks = document.querySelectorAll("#columnChecks li input");
        for (let i = 0; i < colChecks.length; i++) {
            let colCheck = colChecks[i];
            let key = colCheck.getAttribute('data-key');
            if (!key) continue;
            TFB_GRID.gridOptions.columnApi.setColumnVisible(key, colCheck.checked);
        }

        let cached = TFB_GRID[key];
        if (cached) {
            TFB_GRID.minMaxes = calculateMinMaxes(cached);
            TFB_GRID.gridOptions.api.setRowData(cached);
            TFB_GRID.gridOptions.api.refreshCells();
            return;
        }

        // lookup from TechEmpower's tfb-lookup.js
        function attachMeta(fetchedData) {
            for (let i = 0; i < fetchedData.length; i++) {
                let fw = fetchedData[i];
                fw.meta = {};
                let meta = window.lookup.tests(fw.name);
                if (meta) {
                    let attr = meta.attributes;
                    fw.meta.language = attr.language.name;
                    fw.meta.platform = attr.platform.name;
                    fw.meta.webserver = attr.webserver.name;
                    fw.meta.classification = attr.classification.name;
                    fw.meta.database = attr.database.name;
                    fw.meta.orm = attr.orm.name;
                    fw.meta.framework = attr.framework.name;
                    fw.meta.color = attr.language.opaque;
                }
            }
        }

        function calculateMinMaxes(fetchedData) {
            let maxRps = 0, sumLat90 = 0, countLat90 = 0, maxMem = 0, maxCpu = 0;
            for (let i = 0; i < fetchedData.length; i++) {
                let fw = fetchedData[i];
                if (fw.rps.requests_per_sec > maxRps) maxRps = fw.rps.requests_per_sec;
                if (fw.memory.max > maxMem) maxMem = fw.memory.max;
                if (fw.cpu.max > maxCpu) maxCpu = fw.cpu.max;
                if (fw.latency.lat90 > 0) {
                    countLat90 += 1;
                    sumLat90 += fw.latency.lat90;
                }
            }

            return {
                maxRps: maxRps,
                meanLat90: sumLat90 / countLat90,
                maxMem: maxMem,
                maxCpu: maxCpu
            };
        }

        fetch(`${testrun}/${testtype}.json`)
            .then(response => response.json())
            .then(fetchedData => {
                attachMeta(fetchedData);
                TFB_GRID[key] = fetchedData;
                TFB_GRID.minMaxes = calculateMinMaxes(fetchedData);
                TFB_GRID.loadTable();
            });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    let gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, TFB_GRID.gridOptions);
    TFB_GRID.changeRun();

    let checks = document.getElementById("columnChecks");
    for (let i = 1; i < columnDefs.length; i++) {
        let columnDef = columnDefs[i];
        if (columnDef.children) {
            let e = document.createElement("li");
            e.innerHTML = columnDef.headerName + ":";
            checks.appendChild(e);
            for (let j = 0; j < columnDef.children.length; j++) {
                let e = document.createElement("li");
                childColumnDef = columnDef.children[j];
                e.innerHTML = `<input type="checkbox" data-key="${childColumnDef.field}" onchange="TFB_GRID.loadTable()" ${(childColumnDef.hide ? "" : "checked")}>${childColumnDef.headerName}</input>`;
                checks.appendChild(e);
            }
        } else {
            let e = document.createElement("li");
            e.innerHTML = `<input type="checkbox" data-key="${columnDef.field}" onchange="TFB_GRID.loadTable()" ${(columnDef.hide ? "" : "checked")}>${columnDef.headerName}</input>`;
            checks.appendChild(e);
        }
    }
});