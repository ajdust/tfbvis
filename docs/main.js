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
                filter: 'agNumberColumnFilter', sort: 'desc'
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

var gridOptions = {
    defaultColDef: {
        sortable: true,
        resizable: true,
        width: 100,
        cellStyle: { textAlign: "right" }
    },
    columnDefs: columnDefs,
};

gridOptions.getRowStyle = function (params) {
    return { "border-bottom": "1px solid " + params.data.meta.color }
}

function loadTable() {
    var testtype = document.getElementById("testtype").value;
    var key = "tfb_" + testtype;

    if (window[key]) {
        gridOptions.api.setRowData(window[key]);
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

    fetch(testtype + ".json")
        .then(response => response.json())
        .then(fetchedData => {
            attachMeta(fetchedData);
            window[key] = fetchedData;
            loadTable();
        });
}

document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    var grid = new agGrid.Grid(gridDiv, gridOptions);
    loadTable();
});