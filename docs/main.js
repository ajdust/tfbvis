let regFilterParams = {
  filterOptions: [
    "Contains",
    "Does not contain",
    "Regex test",
    "Does not regex test",
  ],
  textCustomComparator: function (filter, value, filterText) {
    let query = filterText.toLowerCase();
    let source = value.toString().toLowerCase();
    if (filter === "Contains") {
      return query && source.indexOf(query) >= 0;
    } else if (filter === "Does not contain") {
      return query && source.indexOf(query) === -1;
    } else if (filter === "Regex test") {
      try {
        return new RegExp(query).test(source);
      } catch {
        return false;
      }
    } else if (filter == "Does not regex test") {
      try {
        return !new RegExp(query).test(source);
      } catch {
        return false;
      }
    }
  },
};

let columnDefs = [
  {
    colId: "rowNumber",
    headerName: "#",
    pinned: "left",
    valueGetter: (params) => params.node.rowIndex + 1,
    hide: true,
    width: 44,
  },
  {
    headerName: "Framework",
    field: "name",
    pinned: "left",
    cellStyle: { textAlign: "left" },
    tooltipValueGetter: (params) => params.data.meta.display_name,
    filter: true,
    filterParams: regFilterParams,
  },
  {
    headerName: "RPS (thousands of requests)",
    children: [
      {
        headerName: "Megabytes read",
        field: "rps.megabytes_read",
        filter: "agNumberColumnFilter",
        hide: true,
      },
      {
        headerName: "Over seconds",
        field: "rps.over_seconds",
        filter: "agNumberColumnFilter",
        hide: true,
      },
      {
        headerName: "Request count",
        field: "rps.request_count",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: rpsFormatter,
      },
      {
        headerName: "RPS total",
        field: "rps.requests_per_sec",
        filter: "agNumberColumnFilter",
        sort: "desc",
        valueFormatter: rpsFormatter,
        filterParams: { resetButton: true },
      },
      {
        headerName: "% max RPS",
        field: "rps.requests_per_sec",
        filter: false,
        sortable: false,
        colId: "percent_max_rps_bar",
        cellRenderer: "percentBarCellRenderer",
        width: 200,
      },
      {
        headerName: "RPS max per thread",
        field: "rps.thread_rps_max",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: rpsFormatter,
      },
      {
        headerName: "RPS mean per thread",
        field: "rps.thread_rps_mean",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: rpsFormatter,
      },
      {
        headerName: "RPS stdev per thread",
        field: "rps.thread_rps_stdev",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: rpsFormatter,
      },
      {
        headerName: "RPS stdev range per thread",
        field: "rps.thread_rps_stdev_range",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: percentFormatter,
      },
      {
        headerName: "Transfer MB per sec",
        field: "rps.transfer_megabytes_per_sec",
        filter: "agNumberColumnFilter",
        hide: true,
      },
      {
        headerName: "% Non 2xx",
        field: "rps.non_2xx_percent",
        filter: "agNumberColumnFilter",
        valueFormatter: non2xxFormatter,
      },
      {
        headerName: "Socket Errors",
        field: "rps.socket_error_count",
        filter: "agNumberColumnFilter",
        valueFormatter: errorCountFormatter,
      },
    ],
  },
  {
    headerName: "Latency (ms)",
    children: [
      {
        headerName: "50%",
        field: "latency.lat50",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "75%",
        field: "latency.lat75",
        filter: "agNumberColumnFilter",
        hide: false,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "90%",
        field: "latency.lat90",
        filter: "agNumberColumnFilter",
        hide: false,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "99%",
        field: "latency.lat99",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "% mean 90%",
        field: "latency.lat90",
        filter: false,
        sortable: false,
        colId: "percent_mean_90_bar",
        cellRenderer: "percentBarCellRenderer",
        width: 200,
      },
      {
        headerName: "Max",
        field: "latency.thread_max",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "Mean",
        field: "latency.thread_mean",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "Stdev",
        field: "latency.thread_stdev",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: latencyFormatter,
      },
      {
        headerName: "Stdev range",
        field: "latency.thread_stdev_range",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: percentFormatter,
      },
      {
        headerName: "Connections",
        field: "connections",
        hide: true,
      },
    ],
  },
  {
    headerName: "Memory (MB)",
    children: [
      {
        headerName: "Max",
        field: "memory.max",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: memoryFormatter,
      },
      {
        headerName: "Mean",
        field: "memory.mean",
        filter: "agNumberColumnFilter",
        valueFormatter: memoryFormatter,
      },
      {
        headerName: "% max mean",
        field: "memory.mean",
        filter: false,
        sortable: false,
        colId: "percent_max_mean_memory_bar",
        cellRenderer: "percentBarCellRenderer",
        width: 200,
      },
      {
        headerName: "Median",
        field: "memory.median",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: memoryFormatter,
      },
      {
        headerName: "Stdev",
        field: "memory.stdev",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: memoryFormatter,
      },
      {
        headerName: "Stdev range",
        field: "memory.stdev_range",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: percentFormatter,
      },
    ],
  },
  {
    headerName: "CPU (system)",
    children: [
      {
        headerName: "Max",
        field: "sys.max",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Mean",
        field: "sys.mean",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "% max mean",
        field: "sys.mean",
        filter: false,
        sortable: false,
        hide: true,
        colId: "percent_max_mean_sys_bar",
        cellRenderer: "percentBarCellRenderer",
        width: 200,
      },
      {
        headerName: "Median",
        field: "sys.median",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Stdev",
        field: "sys.stdev",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Stdev range",
        field: "sys.stdev_range",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
    ],
  },
  {
    headerName: "CPU (user)",
    children: [
      {
        headerName: "Max",
        field: "usr.max",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Mean",
        field: "usr.mean",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "% max mean",
        field: "usr.mean",
        filter: false,
        sortable: false,
        hide: true,
        colId: "percent_max_mean_usr_bar",
        cellRenderer: "percentBarCellRenderer",
        width: 200,
      },
      {
        headerName: "Median",
        field: "usr.median",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Stdev",
        field: "usr.stdev",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Stdev range",
        field: "usr.stdev_range",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
    ],
  },
  {
    headerName: "CPU (total)",
    children: [
      {
        headerName: "Max",
        field: "cpu.max",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Mean",
        field: "cpu.mean",
        filter: "agNumberColumnFilter",
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "% max mean",
        field: "cpu.mean",
        filter: false,
        sortable: false,
        colId: "percent_max_mean_cpu_bar",
        cellRenderer: "percentBarCellRenderer",
        width: 200,
      },
      {
        headerName: "Median",
        field: "cpu.median",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Stdev",
        field: "cpu.stdev",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Stdev range",
        field: "cpu.stdev_range",
        filter: "agNumberColumnFilter",
        hide: true,
        valueFormatter: cpuFormatter,
      },
      {
        headerName: "Threads",
        field: "threads",
        hide: true,
      },
    ],
  },
  {
    headerName: "Meta",
    children: [
      {
        headerName: "Language",
        field: "meta.language",
        filter: true,
        filterParams: regFilterParams,
        cellRenderer: (params) => {
          const meta = params.data.meta;
          if (!meta.language) return params.value;
          let gh = window.getLanguageGithub(meta.language);
          return `<a href="${gh}">${params.value}</a>`;
        },
      },
      {
        headerName: "Platform",
        field: "meta.platform",
        filter: true,
        filterParams: regFilterParams,
        cellRenderer: (params) => {
          if (params.value.toLowerCase() == "none") return params.value;
          const query = new URLSearchParams({
            q: `${params.value} stars:>10 language:${params.data.meta.language}`,
          });
          const github = `https://github.com/search?${query}`;
          return `<a href="${github}">${params.value}</a>`;
        },
      },
      {
        headerName: "Webserver",
        field: "meta.webserver",
        filter: true,
        filterParams: regFilterParams,
      },
      {
        headerName: "Classification",
        field: "meta.classification",
        filter: true,
        filterParams: regFilterParams,
      },
      {
        headerName: "Database",
        field: "meta.database",
        filter: true,
        filterParams: regFilterParams,
      },
      {
        headerName: "Orm",
        field: "meta.orm",
        filter: true,
        filterParams: regFilterParams,
      },
      {
        headerName: "Framework",
        field: "meta.framework",
        filter: true,
        filterParams: regFilterParams,
        cellRenderer: (params) => {
          const meta = params.data.meta;
          if (!meta.language || meta.framework === "none") return params.value;
          const gh = window.getLanguageGithub(meta.language);
          return `<a href="${gh}/${meta.framework}">${params.value}</a>`;
        },
      },
      {
        headerName: "Display Name",
        field: "meta.display_name",
        filter: true,
        hide: true,
        filterParams: regFilterParams,
      },
    ],
  },
];

let fTwoPoint = d3.format(",.2f");
let fOnePoint = d3.format(",.1f");
let fWhole = d3.format(",.0f");

function roundValue(value) {
  // round by one less than the number of digits
  const roundFactor = Math.pow(10, Math.round(Math.log10(value) - 1.0));
  return roundFactor * Math.round(value / roundFactor);
}

function memoryFormatter(params) {
  let v = params.value;
  if (TFB_GRID.displayRounded) v = roundValue(v);
  return fWhole(v);
}

function rpsFormatter(params) {
  let v = params.value / 1e3;
  if (TFB_GRID.displayRounded) v = roundValue(v);
  return v < 10 ? fTwoPoint(v) : fWhole(v);
}

function non2xxFormatter(params) {
  if (params.value <= 0) return "";
  let v = params.value;
  return (v < 10 ? fOnePoint(v) : fWhole(v)) + "%";
}

function errorCountFormatter(params) {
  if (params.value <= 0) return "";
  return params.value;
}

function latencyFormatter(params) {
  let v = params.value;
  if (TFB_GRID.displayRounded) v = roundValue(v);
  return fTwoPoint(v);
}

function cpuFormatter(params) {
  let v = params.value;
  if (TFB_GRID.displayRounded) v = roundValue(v);
  return fOnePoint(v) + "%";
}

function percentFormatter(params) {
  return fWhole(params.value) + "%";
}

// cell renderer class
function PercentBarCellRenderer() {}
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

    let maxThing = 0;
    if (params.colDef.field.indexOf("rps.") === 0)
      maxThing = window.TFB_GRID.minMaxes.maxRps;
    else if (params.colDef.field.indexOf("latency.") === 0)
      maxThing = window.TFB_GRID.minMaxes.meanLat90;
    else if (params.colDef.field.indexOf("memory.") === 0)
      maxThing = window.TFB_GRID.minMaxes.maxMem;
    else if (params.colDef.field.indexOf("usr.") === 0)
      maxThing = window.TFB_GRID.minMaxes.maxUsr;
    else if (params.colDef.field.indexOf("sys.") === 0)
      maxThing = window.TFB_GRID.minMaxes.maxSys;
    else if (params.colDef.field.indexOf("cpu.") === 0)
      maxThing = window.TFB_GRID.minMaxes.maxCpu;

    let percent = maxThing <= 0 ? 0 : (100 * value) / maxThing;
    let eDivPercentBarWrapper = document.createElement("div");
    eDivPercentBarWrapper.className = "div-percent-bar-wrapper";
    let eDivPercentBar = document.createElement("div");

    eDivPercentBarWrapper.appendChild(eDivPercentBar);
    eDivPercentBar.className = "div-percent-bar";
    eDivPercentBar.style.width = (percent > 100 ? "100" : percent) + "%";
    eDivPercentBar.style.backgroundColor =
      percent > 100 ? "red" : params.data.meta.color || "#cccccc";

    let eValue = document.createElement("div");
    eValue.className = "div-percent-value";
    eValue.innerHTML = fWhole(percent) + "%";
    if (percent > 85) {
      eValue.style["margin-left"] = "3%";
      eValue.style.color = "white";
      eValue.style["text-shadow"] = "black 1px 1px";
    } else if (percent > 70) {
      eValue.style["margin-left"] = percent - 5 + "%";
    } else if (percent > 10) {
      eValue.style["margin-left"] = percent + "%";
    } else if (percent > 5) {
      eValue.style["margin-left"] = percent + 2 + "%";
    } else {
      eValue.style["margin-left"] = percent + 4 + "%";
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
      cellStyle: { textAlign: "right" },
    },
    columnDefs: columnDefs,
    onFilterChanged: () => {
      // the rowNumber is sometimes out of date after a filter, so force refresh it here
      const rn = TFB_GRID.gridOptions.columnApi.getColumn("rowNumber");
      if (rn && rn.visible) {
        TFB_GRID.gridOptions.api.refreshCells({ columns: ["rowNumber"] });
      }
    },
    components: {
      percentBarCellRenderer: PercentBarCellRenderer,
    },
    onGridReady: (grid) => {
      // default to less than 5% socket error
      grid.api.setFilterModel({"rps.non_2xx_percent":{"filterType":"number","type":"lessThan","filter":5}});
    }
  },

  setUrlParams: function (testrun, testtype, round) {
    const url = new URL(window.location);
    url.searchParams.set("testrun", testrun);
    url.searchParams.set("testtype", testtype);
    url.searchParams.set("round", round ? "true" : "false");
    window.history.replaceState(null, null, "?" + url.searchParams.toString());
  },

  changeRun: function () {
    let el = document.getElementById("testrunLink");
    let testrun = document.getElementById("testrun").value;
    let [environment, date, runid] = testrun.split("_");
    date = date.replace("started", "");
    let url = `https://tfb-status.techempower.com/results/${runid}`;
    el.innerHTML = `<a href="${url}">This data is from the ${environment} run on ${date}</a>`;
    TFB_GRID.loadTable();
  },

  loadTable: async function () {
    let displayRounded = document.getElementById("displayRounded").checked;
    let testtype = document.getElementById("testtype").value;
    let testrun = document.getElementById("testrun").value;
    let key = `data_${testrun}_${testtype}`;

    TFB_GRID.displayRounded = displayRounded;
    TFB_GRID.setUrlParams(testrun, testtype, displayRounded);

    let colChecks = document.querySelectorAll(".column-check");
    for (let i = 0; i < colChecks.length; i++) {
      let colCheck = colChecks[i];
      let key = colCheck.getAttribute("data-key");
      if (!key) continue;
      TFB_GRID.gridOptions.columnApi.setColumnVisible(key, colCheck.checked);
    }

    let cached = TFB_GRID[key];
    if (cached) {
      let grid = TFB_GRID.gridOptions;
      let sortState = grid.columnApi.getColumnState();
      let filterState = grid.api.getFilterModel();
      TFB_GRID.minMaxes = calculateMinMaxes(cached);
      grid.api.setRowData(cached);
      grid.api.refreshCells();
      grid.columnApi.applyColumnState({
        state: sortState,
        applyOrder: true,
      });
      grid.api.setFilterModel(filterState);
      return;
    }

    async function attachMeta(fetchedData) {
      let response = await fetch(`${testrun}/test_metadata.json`);
      let metadatas = await response.json();
      let metamap = {};
      for (let metadata of metadatas) {
        metamap[metadata.name] = metadata;
      }

      for (let i = 0; i < fetchedData.length; i++) {
        let fw = fetchedData[i];
        fw.meta = {};
        let meta = metamap[fw.name];
        if (meta) {
          fw.meta.language = meta.language;
          fw.meta.platform = meta.platform;
          fw.meta.webserver = meta.webserver;
          fw.meta.classification = meta.classification;
          fw.meta.database = meta.database;
          fw.meta.orm = meta.orm;
          fw.meta.framework = meta.framework;
          fw.meta.display_name = meta.display_name;
          fw.meta.color = getLanguageColor(meta.language);
        }
      }
    }

    function calculateMinMaxes(fetchedData) {
      let maxRps = 0,
        sumLat90 = 0,
        countLat90 = 0,
        maxMem = 0,
        maxCpu = 0,
        maxSys = 0,
        maxUsr = 0;
      for (let i = 0; i < fetchedData.length; i++) {
        let fw = fetchedData[i];
        if (fw.rps.requests_per_sec > maxRps) maxRps = fw.rps.requests_per_sec;
        if (fw.memory.max > maxMem) maxMem = fw.memory.max;
        if (fw.usr.max > maxUsr) maxUsr = fw.usr.max;
        if (fw.sys.max > maxSys) maxSys = fw.sys.max;
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
        maxSys: maxSys,
        maxUsr: maxUsr,
        maxCpu: maxCpu,
      };
    }

    let response = await fetch(`${testrun}/${testtype}.json`);
    let fetchedData = await response.json();
    await attachMeta(fetchedData);
    TFB_GRID[key] = fetchedData;
    TFB_GRID.minMaxes = calculateMinMaxes(fetchedData);
    TFB_GRID.loadTable();
  },
};

async function setLanguageColors() {
  let response = await fetch("language_colors.json");
  let colors = await response.json();

  window.LANGUAGE_COLORS = {};
  for (let [language, color] of Object.entries(colors)) {
    LANGUAGE_COLORS[language.toLowerCase()] = color;
  }

  window.getLanguageColor = (lang) =>
    window.LANGUAGE_COLORS[lang.toLowerCase()];
}

async function setLanguageGithub() {
  let response = await fetch("language_github.json");
  let results = await response.json();
  window.LANGUAGE_GITHUB = results;
  window.getLanguageGithub = (lang) => window.LANGUAGE_GITHUB[lang];
}

function applyUrlParams() {
  const url = new URL(window.location);
  const testrun = url.searchParams.get("testrun");
  if (testrun) {
    const testrunOption = document.querySelector(
      `#testrun option[value='${testrun.replace("'", '"')}']`
    );
    if (testrunOption) {
      testrunOption.selected = true;
    }
  }

  const testtype = url.searchParams.get("testtype");
  if (testtype) {
    const testtypeOption = document.querySelector(
      `#testtype option[value='${testtype.replace("'", '"')}']`
    );
    if (testtypeOption) {
      testtypeOption.selected = true;
    }
  }

  const round = url.searchParams.get("round");
  if (round === "true") {
    document.getElementById("displayRounded").checked = true;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  let gridDiv = document.querySelector("#myGrid");
  new agGrid.Grid(gridDiv, TFB_GRID.gridOptions);
  await setLanguageColors();
  await setLanguageGithub();
  applyUrlParams();
  TFB_GRID.changeRun();

  document
    .getElementById("testrun")
    .addEventListener("change", TFB_GRID.changeRun);
  document
    .getElementById("testtype")
    .addEventListener("change", TFB_GRID.loadTable);
  document
    .getElementById("displayRounded")
    .addEventListener("change", TFB_GRID.loadTable);
  document
    .getElementById("displayRowNumber")
    .addEventListener("change", TFB_GRID.loadTable);

  function html(el, html) {
    let e = document.createElement(el);
    if (html) e.innerHTML = html;
    return e;
  }

  function appendColumnToggles(container, columns, filter) {
    for (let column of columns) {
      if (!filter(column)) {
        continue;
      }

      if (column.children) {
        const listHead = html("li", `${column.headerName}`);
        listHead.className = "column-check-head";

        const el = html("ul");
        el.className = "column-checks";
        el.appendChild(listHead);

        container.appendChild(el);
        appendColumnToggles(el, column.children, filter);
      } else {
        container.appendChild(
          html(
            "li",
            `<input type="checkbox" class="column-check" data-key="${
              column.colId || column.field
            }" onchange="TFB_GRID.loadTable()" ${
              column.hide ? "" : "checked"
            }>${column.headerName}</input>`
          )
        );
      }
    }
  }

  let checks = document.getElementById("columnChecksContainer");
  appendColumnToggles(
    checks,
    columnDefs,
    (c) => c.headerName != "Framework" && c.headerName != "#"
  );
});
