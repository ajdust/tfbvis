var columnDefs = [
    {
        headerName: "Framework", field: "name",
        sortable: true, filter: true
    },
    {
        headerName: "Threads", field: "threads",
        sortable: true
    },
    {
        headerName: "Connections", field: "connections",
        sortable: true
    },
    {
        headerName: "RPS", children: [
            {
                headerName: "Megabytes read", field: "rps.megabytes_read",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Non 2xx count", field: "rps.non_2xx_count",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Over seconds", field: "rps.over_seconds",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Request count", field: "rps.request_count",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Requests per sec", field: "rps.requests_per_sec",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Thread RPS max", field: "rps.thread_rps_max",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Thread RPS mean", field: "rps.thread_rps_mean",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Thread RPS stdev", field: "rps.thread_rps_stdev",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Thread RPS stdev range", field: "rps.thread_rps_stdev_range",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Transfer megabytes per sec", field: "rps.transfer_megabytes_per_sec",
                sortable: true, filter: 'agNumberColumnFilter'
            }
        ]
    },
    {
        headerName: "Latency", children: [
            {
                headerName: "50%", field: "latency.lat50",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "75%", field: "latency.lat75",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "90%", field: "latency.lat90",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "99%", field: "latency.lat99",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Max", field: "latency.thread_max",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Mean", field: "latency.thread_mean",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev", field: "latency.thread_stdev",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev range", field: "latency.thread_stdev_range",
                sortable: true, filter: 'agNumberColumnFilter'
            }
        ]
    },
    {
        headerName: "Memory", children: [
            {
                headerName: "Max", field: "memory.max",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Mean", field: "memory.mean",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Median", field: "memory.median",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev", field: "memory.stdev",
                sortable: true, filter: 'agNumberColumnFilter'
            },
            {
                headerName: "Stdev range", field: "memory.stdev_range",
                sortable: true, filter: 'agNumberColumnFilter'
            }
        ]
    }
];

var gridOptions = { columnDefs: columnDefs };

function loadTable() {
    var testtype = document.getElementById("testtype").value;
    var key = "tfb_" + testtype;

    if (window[key]) {
        gridOptions.api.setRowData(window[key]);
        return;
    }

    fetch(testtype + ".json")
        .then(response => response.json())
        .then(fetchedData => {
            window[key] = fetchedData;
            loadTable();
        });
}

document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector('#myGrid');
    var grid = new agGrid.Grid(gridDiv, gridOptions);
    loadTable();
});