var columnDefs = [
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
        headerName: "RPS", children: [
            {
                headerName: "Megabytes read", field: "rps.megabytes_read",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "Non 2xx count", field: "rps.non_2xx_count",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Over seconds", field: "rps.over_seconds",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "Request count", field: "rps.request_count",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "RPS total", field: "rps.requests_per_sec",
                filter: 'agNumberColumnFilter', sort: 'desc',
                cellRenderer: 'percentBarCellRenderer', width: 150
            },
            {
                headerName: "RPS max per thread", field: "rps.thread_rps_max",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "RPS mean per thread", field: "rps.thread_rps_mean",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "RPS stdev per thread", field: "rps.thread_rps_stdev",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "RPS stdev range per thread", field: "rps.thread_rps_stdev_range",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Transfer megabytes per sec", field: "rps.transfer_megabytes_per_sec",
                filter: 'agNumberColumnFilter', hide: true
            }
        ]
    },
    {
        headerName: "Latency", children: [
            {
                headerName: "50%", field: "latency.lat50",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "75%", field: "latency.lat75",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "90%", field: "latency.lat90",
                filter: 'agNumberColumnFilter', hide: true
            },
            {
                headerName: "99%", field: "latency.lat99",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Max", field: "latency.thread_max",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Mean", field: "latency.thread_mean",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev", field: "latency.thread_stdev",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev range", field: "latency.thread_stdev_range",
                filter: 'agNumberColumnFilter'
            }
        ]
    },
    {
        headerName: "Memory", children: [
            {
                headerName: "Max", field: "memory.max",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Mean", field: "memory.mean",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Median", field: "memory.median",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev", field: "memory.stdev",
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev range", field: "memory.stdev_range",
                filter: 'agNumberColumnFilter'
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

// cell renderer class
function PercentBarCellRenderer() { }

// init method gets the details of the cell to be rendere
PercentBarCellRenderer.prototype.init = function (params) {
    this.eGui = percentCellRenderer(params);
};

PercentBarCellRenderer.prototype.getGui = function () {
    return this.eGui;
};

var percentCellRenderer = function (params) {
    console.log(params);
    var value = params.value;
    var percent = 100 * value / window.TFB_GRID.minMaxes.maxRps;

    var eDivPercentBarWrapper = document.createElement('div');
    eDivPercentBarWrapper.className = 'div-percent-bar-wrapper';
    var eDivPercentBar = document.createElement('div');

    eDivPercentBarWrapper.appendChild(eDivPercentBar);
    eDivPercentBar.className = "div-percent-bar";
    eDivPercentBar.style.width = percent + "%";

    // eDivPercentBar.style.backgroundColor = data.meta.color || "#cccccc"

    if (percent < 20) {
        eDivPercentBar.style.backgroundColor = "#f55d51";
    } else if (percent < 60) {
        eDivPercentBar.style.backgroundColor = "#ffb300";
    } else {
        eDivPercentBar.style.backgroundColor = "#82d249";
    }

    var eValue = document.createElement("div");
    eValue.className = "div-percent-value";
    eValue.innerHTML = value + " (" + percent + "%)";

    var eOuterDiv = document.createElement("div");
    eOuterDiv.className = "div-outer-div";
    eOuterDiv.appendChild(eDivPercentBarWrapper);
    eOuterDiv.appendChild(eValue);

    return eOuterDiv;
};

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
        // getRowStyle: function (params) {
        //     return { "border-bottom": "1px solid " + params.data.meta.color }
        // }
    },

    loadTable: function () {
        var testtype = document.getElementById("testtype").value;
        var key = "data" + testtype;

        var cached = TFB_GRID[key];
        if (cached) {
            TFB_GRID.minMaxes = calculateMinMaxes(cached);
            TFB_GRID.gridOptions.api.setRowData(cached);
            console.log('refreshhing');
            TFB_GRID.gridOptions.api.refreshCells();
            return;
        }

        // lookup from TechEmpower's tfb-lookup.js
        function attachMeta(fetchedData) {
            for (var i = 0; i < fetchedData.length; i++) {
                var fw = fetchedData[i];
                fw.meta = {};
                var meta = window.lookup.tests(fw.name);
                if (meta) {
                    var attr = meta.attributes;
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
            var maxRps = 0, minLat90 = Infinity, maxMem = 0;
            for (var i = 0; i < fetchedData.length; i++) {
                var fw = fetchedData[i];
                if (fw.rps.requests_per_sec > maxRps) maxRps = fw.rps.requests_per_sec;
                if (fw.memory.max > maxMem) maxMem = fw.memory.max;
                if (fw.latency.lat90 < minLat90) minLat90 = fw.latency.lat90;
            }

            return { maxRps: maxRps, minLat90: minLat90, maxMem: maxMem };
        }

        fetch(testtype + ".json")
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
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, TFB_GRID.gridOptions);
    TFB_GRID.loadTable();
});