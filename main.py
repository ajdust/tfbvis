import os
import re
import sys
from dataclasses import asdict, dataclass, is_dataclass
from typing import Dict, List
from urllib.parse import urlparse
from urllib.request import urlopen
from zipfile import ZipFile

import numpy as np
import simplejson
from pandas import DataFrame, read_csv
from pyparsing import Combine, Group, Optional, Word, alphas, nums

GuidPattern = "[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}"  # noqa: W605, E501
Integer = Word(nums)
Floating = Combine(Word(nums) + Optional(Combine("." + Word(nums))))
# FloatUnit: 12.34ms, 12.34k, or just 12.34
FloatUnit = Group(Floating + Optional(Word(alphas)))
Percent = Group(Floating + "%")


class EnhancedJSONEncoder(simplejson.JSONEncoder):
    """
    Extended JSON encoder to handle numpy types used in pandas.
    """

    def default(self, o):
        if isinstance(o, np.integer):
            return int(o)
        elif isinstance(o, np.floating):
            if np.isnan(o) or np.isinf(o):
                return None
            return float(o)
        elif isinstance(o, np.ndarray):
            return o.tolist()
        elif is_dataclass(o):
            return asdict(o)
        return super().default(o)


def start(args):
    for arg in args:
        entry, name = arg
        results_dir = f"docs/{name}"
        if not os.path.exists(results_dir):
            os.makedirs(results_dir)

        with open(f"{results_dir}/test_metadata.json", "w") as f:
            with open(os.path.join(entry.path, "test_metadata.json"), "r") as mf:
                f.write(mf.read())

        test_files = get_test_result_files(entry.path)
        test_results = get_test_results(test_files)
        for testtype, results in test_results.items():
            with open(f"{results_dir}/{testtype}.json", "w") as f:
                print(f"Writing {results_dir}/{testtype}.json")
                f.write(
                    simplejson.dumps(results, cls=EnhancedJSONEncoder, ignore_nan=True)
                )

        record = "docs/result_directories.json"
        if not os.path.isfile(record):
            with open(record, "w") as f:
                f.write("[]")

        with open(record, "r+") as f:
            content = f.read()
            paths = simplejson.loads(content)
            paths.append(name)
            new_paths = simplejson.dumps(list(set(paths)))
            f.seek(0)
            f.write(new_paths)
            f.truncate()


@dataclass
class TestFiles(object):
    verification: str = ""  # verification.txt
    stats: str = ""  # stats.txt
    raw: str = ""  # raw.txt


def get_test_result_files(root: str) -> Dict[str, DataFrame]:
    allowed_test_types = {"db", "fortune", "json", "plaintext", "query", "update"}
    allowed_file_names = {"verification.txt", "stats.txt", "raw.txt"}
    files = DataFrame(
        (
            (test, framework, file)
            for framework in next(os.walk(root))[1]
            for test in next(os.walk(os.path.join(root, framework)))[1]
            if test in allowed_test_types
            for file in next(os.walk(os.path.join(root, framework, test)))[2]
            if file in allowed_file_names
        ),
        columns=["Test", "Framework", "File"],
    )

    def to_test_files(fwGrp) -> TestFiles:
        ver_path, stats_path, raw_path = "", "", ""
        for index, row in fwGrp.iterrows():
            fw, test, file = row["Framework"], row["Test"], row["File"]
            if file == "verification.txt":
                ver_path = os.path.join(root, fw, test, file)
            elif file == "stats.txt":
                stats_path = os.path.join(root, fw, test, file)
            elif file == "raw.txt":
                raw_path = os.path.join(root, fw, test, file)
        return TestFiles(verification=ver_path, stats=stats_path, raw=raw_path)

    return {
        test_type: files[files["Test"] == test_type]
        .groupby("Framework")
        .apply(to_test_files)
        .reset_index(name="Files")
        for test_type in allowed_test_types
    }


def get_verification(filename: str):
    with open(filename, "r") as verFile:
        for line in verFile:
            if line.startswith("   PASS for"):
                return True
        return False


def get_rps_and_latency_parser():
    count_conn = Group(
        Integer.setResultsName("ThreadCount")
        + "threads and"
        + Integer.setResultsName("ConnectionCount")
        + "connections;"
    ).setResultsName("TestCounts")
    lat_stats = Group(
        "Latency"
        + FloatUnit.setResultsName("Avg")
        + FloatUnit.setResultsName("Stdev")
        + FloatUnit.setResultsName("Max")
        + Percent.setResultsName("StdevRange")
        + ";"
    ).setResultsName("LatencySummary")
    rps_stats = Group(
        "Req/Sec"
        + FloatUnit.setResultsName("Avg")
        + FloatUnit.setResultsName("Stdev")
        + FloatUnit.setResultsName("Max")
        + Percent.setResultsName("StdevRange")
        + ";"
    ).setResultsName("ReqSecSummary")
    lat_dist_50 = Group("50%" + FloatUnit.setResultsName("Time") + ";").setResultsName(
        "Latency50"
    )
    lat_dist_75 = Group("75%" + FloatUnit.setResultsName("Time") + ";").setResultsName(
        "Latency75"
    )
    lat_dist_90 = Group("90%" + FloatUnit.setResultsName("Time") + ";").setResultsName(
        "Latency90"
    )
    lat_dist_99 = Group("99%" + FloatUnit.setResultsName("Time") + ";").setResultsName(
        "Latency99"
    )
    req_count = Group(
        Integer.setResultsName("RequestCount")
        + "requests in"
        + FloatUnit.setResultsName("OverSeconds")
        + ","
        + FloatUnit.setResultsName("BytesRead")
        + "read;"
    ).setResultsName("OverTime")
    non_2xx = Optional(
        Group("Non-2xx or 3xx responses:" + Integer.setResultsName("Non2xxCount") + ";")
    ).setResultsName("Non2xx")
    socket_errors = Optional(
        Group(
            "Socket errors: connect"
            + Integer.setResultsName("ConnectCount")
            + ", read"
            + Integer.setResultsName("ReadCount")
            + ", write"
            + Integer.setResultsName("WriteCount")
            + ", timeout"
            + Integer.setResultsName("TimeoutCount")
            + ";"
        )
    ).setResultsName("SocketErrors")
    rps_summary = Group(
        "Requests/sec:" + Floating.setResultsName("RequestsPerSec") + ";"
    ).setResultsName("ReqSecLine")
    tps_summary = Group(
        "Transfer/sec:" + FloatUnit.setResultsName("BytesReadPerSec") + ";"
    ).setResultsName("BytesReadLine")
    start_end = Group(
        "STARTTIME"
        + Integer.setResultsName("StartTime")
        + ";"
        + "ENDTIME"
        + Integer.setResultsName("EndTime")
        + ";"
    ).setResultsName("StartEndTime")
    parser = (
        count_conn
        + "Thread Stats   Avg      Stdev     Max   +/- Stdev;"
        + lat_stats
        + rps_stats
        + "Latency Distribution;"
        + lat_dist_50
        + lat_dist_75
        + lat_dist_90
        + lat_dist_99
        + req_count
        + socket_errors
        + non_2xx
        + rps_summary
        + tps_summary
        + start_end
    )

    return parser


@dataclass
class RpsSummary(object):
    requests_per_sec: float = 0
    transfer_megabytes_per_sec: int = 0
    request_count: int = 0
    megabytes_read: float = 0
    over_seconds: float = 0
    non_2xx_percent: float = 0
    thread_rps_mean: float = 0
    thread_rps_max: float = 0
    thread_rps_stdev: float = 0
    thread_rps_stdev_range: float = 0
    socket_error_count: int = 0


@dataclass
class LatencySummary(object):
    lat50: float = 0
    lat75: float = 0
    lat90: float = 0
    lat99: float = 0
    thread_mean: float = 0
    thread_max: float = 0
    thread_stdev: float = 0
    thread_stdev_range: float = 0


@dataclass
class MemorySummary(object):
    mean: float = 0
    median: float = 0
    max: float = 0
    stdev: float = 0
    stdev_range: float = 0


@dataclass
class CpuSummary(object):
    mean: float = 0
    median: float = 0
    max: float = 0
    stdev: float = 0
    stdev_range: float = 0


@dataclass
class RawSummary(object):
    threads: int = 0
    connections: int = 0
    rps: RpsSummary = None
    latency: LatencySummary = None
    starttime: float = 0
    endtime: float = 0


@dataclass
class FrameworkSummary(object):
    name: str = ""
    threads: int = 0
    connections: int = 0
    rps: RpsSummary = None
    latency: LatencySummary = None
    memory: MemorySummary = None
    cpu: CpuSummary = None
    usr: CpuSummary = None
    sys: CpuSummary = None


def no_units(nums: List[str]) -> float:
    """
    Remove unit annotations and convert to one scale.
    Prefer milliseconds when given seconds (s) or microseconds (us).
    Prefer megabytes when given kilobytes (KB) or gigabytes (GB).
    Prefer 0-100 for percent.
    """
    if len(nums) == 0:
        raise ValueError("nums must be non-empty list of str")
    if len(nums) > 2:
        raise ValueError("nums must have length less than 3")
    if len(nums) == 1:
        return float(nums[0])

    num = float(nums[0])
    unit = nums[1]
    if unit == "%":
        return num
    elif unit == "k":
        return num * 1e3
    elif unit == "M":
        return num * 1e6
    elif unit == "GB":
        return num * 1e3
    elif unit == "MB":
        return num  # prefer MB
    elif unit == "KB":
        return num * 1e-3
    elif unit == "B":
        return num * 1e-6
    elif unit == "s":
        return num * 1e3
    elif unit == "ms":
        return num  # prefer ms
    elif unit == "us":
        return num * 1e-3
    else:
        raise ValueError("Unknown unit: " + unit)


def get_rps_and_latency(filename: str) -> List[RawSummary]:
    text_sections = {}

    # preprocess the raw.txt here into sections
    with open(filename, "r") as rps_file:
        section = 0
        in_header = False
        # the Multiple Query test and Update test only uses the 'Query: 20 for query' test
        in_20_query_test = False
        in_20_query_test_section = False

        for line in rps_file:
            line = line.strip()
            if line.startswith("----"):
                if in_header:
                    in_header = False
                    continue
                in_header = True
                section += 1
                text_sections[section] = ""
                continue

            # Ignore all query tests except the last 20-query one
            if line.startswith("Running Primer query") or line.startswith(
                "Running Primer update"
            ):
                in_20_query_test = True
                in_20_query_test_section = False
            if in_20_query_test:
                if line.startswith("Queries: 20 for query") or line.startswith(
                    "Queries: 20 for update"
                ):
                    in_20_query_test_section = True
                if not in_20_query_test_section:
                    continue

            # ignore headers and 'Running' lines
            if in_header or line.startswith("Running"):
                continue

            # throw out failed tests
            if (
                line.startswith("unable to connect to")
                or line.startswith("0 requests")
                or line.endswith("nan%")
            ):
                return None

            text_sections[section] += " " + line + ";\n"

    rps_parser = get_rps_and_latency_parser()
    section_results = []
    for index, section in text_sections.items():
        # Warmup and primer don't have start/end time, so filter them out
        if "STARTTIME" not in section:
            continue
        try:
            t = rps_parser.parseString(section)

            threads = int(t["TestCounts"]["ThreadCount"])
            connections = int(t["TestCounts"]["ConnectionCount"])
            latavg = no_units(t["LatencySummary"]["Avg"])
            latstdev = no_units(t["LatencySummary"]["Stdev"])
            latmax = no_units(t["LatencySummary"]["Max"])
            latstdevrange = no_units(t["LatencySummary"]["StdevRange"])
            rpsavg = no_units(t["ReqSecSummary"]["Avg"])
            rpsstdev = no_units(t["ReqSecSummary"]["Stdev"])
            rpsmax = no_units(t["ReqSecSummary"]["Max"])
            rpsstdevrange = no_units(t["ReqSecSummary"]["StdevRange"])
            lat50 = no_units(t["Latency50"]["Time"])
            lat75 = no_units(t["Latency75"]["Time"])
            lat90 = no_units(t["Latency90"]["Time"])
            lat99 = no_units(t["Latency99"]["Time"])
            req_count = int(t["OverTime"]["RequestCount"])
            over_sec = 1e-3 * no_units(t["OverTime"]["OverSeconds"])
            mb_read = no_units(t["OverTime"]["BytesRead"])
            requests_per_sec = float(t["ReqSecLine"]["RequestsPerSec"])
            megabytes_per_sec = no_units(t["BytesReadLine"]["BytesReadPerSec"])
            starttime = float(t["StartEndTime"]["StartTime"])
            endtime = float(t["StartEndTime"]["EndTime"])

            non2xx = 0
            if "Non2xx" in t:
                non2xx = int(t["Non2xx"][0]["Non2xxCount"])

            socket_error_count = 0
            if "SocketErrors" in t:
                serrs = t["SocketErrors"][0]
                socket_error_count = (
                    int(serrs["ConnectCount"])
                    + int(serrs["ReadCount"])
                    + int(serrs["WriteCount"])
                    + int(serrs["TimeoutCount"])
                )

            # throw out any tests with over 0.5% socket error
            if socket_error_count > req_count * 0.005:
                print(f"Too many socket errors for {filename}")
                return None

            rps = RpsSummary(
                requests_per_sec=requests_per_sec,
                transfer_megabytes_per_sec=megabytes_per_sec,
                request_count=req_count,
                megabytes_read=mb_read,
                over_seconds=over_sec,
                non_2xx_percent=100.0 * (non2xx / req_count),
                thread_rps_mean=rpsavg,
                thread_rps_max=rpsmax,
                thread_rps_stdev=rpsstdev,
                thread_rps_stdev_range=rpsstdevrange,
                socket_error_count=socket_error_count,
            )

            latencies = LatencySummary(
                lat50=lat50,
                lat75=lat75,
                lat90=lat90,
                lat99=lat99,
                thread_mean=latavg,
                thread_max=latmax,
                thread_stdev=latstdev,
                thread_stdev_range=latstdevrange,
            )

            summary = RawSummary(
                threads=threads,
                connections=connections,
                rps=rps,
                latency=latencies,
                starttime=starttime,
                endtime=endtime,
            )
            section_results.append(summary)

        except ValueError as verr:
            raise ValueError("Problem parsing " + filename) from verr
        except TypeError as terr:
            raise TypeError("Problem parsing " + filename) from terr
        except Exception as err:
            print(section)
            raise Exception("Problem parsing " + filename) from err

    return section_results


def get_stats(filename: str):
    """
    Pulls stats CSV into a DataFrame.
    """
    # Stats CSV has two headers after 4 information lines. Skip the four lines
    # and parse the headers manually to use the double-key in our DataFrame.
    header1 = ""
    header2 = ""
    with open(filename, "r") as csv:
        for _ in range(4):
            next(csv)
        header1 = map(lambda x: x.strip('"'), csv.readline().strip().split(","))
        header2 = map(lambda x: x.strip('"'), csv.readline().strip().split(","))

    names = []
    for h1, h2 in zip(header1, header2):
        if h1:
            lasth1 = h1
            names.append((h1, h2))
        else:
            names.append((lasth1, h2))

    names[0] = "epoch"
    return read_csv(filename, skiprows=6, names=names, index_col=[0])


def get_memory_usage(stats: DataFrame):
    memory = stats["memory usage", "used"]
    mean = memory.mean()
    stdev = memory.std()
    # memory usage is in bytes in the data, convert to MB after calculation by dividing
    return MemorySummary(
        mean=mean / 1e6,
        median=memory.median() / 1e6,
        max=memory.max() / 1e6,
        stdev=stdev,
        stdev_range=100
        * memory[memory.between(mean - stdev, mean + stdev)].count()
        / memory.count(),
    )


def get_cpu(stats: DataFrame):
    usr = stats["total cpu usage", "usr"]
    sys = stats["total cpu usage", "sys"]
    mean = usr.mean() + sys.mean() 
    return CpuSummary(
        mean=mean,
    )

def get_cpu_usr(stats: DataFrame):
    cpu = stats["total cpu usage", "usr"]
    mean = cpu.mean()
    stdev = cpu.std()
    return CpuSummary(
        mean=mean,
        median=cpu.median(),
        max=cpu.max(),
        stdev=stdev,
        stdev_range=100
        * cpu[cpu.between(mean - stdev, mean + stdev)].count()
        / cpu.count(),
    )

def get_cpu_sys(stats: DataFrame):
    cpu = stats["total cpu usage", "sys"]
    mean = cpu.mean()
    stdev = cpu.std()
    return CpuSummary(
        mean=mean,
        median=cpu.median(),
        max=cpu.max(),
        stdev=stdev,
        stdev_range=100
        * cpu[cpu.between(mean - stdev, mean + stdev)].count()
        / cpu.count(),
    )

def get_test_results(
    testdic: Dict[str, DataFrame]
) -> Dict[str, List[FrameworkSummary]]:

    testresults = {}
    for testtype, frameworkframe in testdic.items():
        testresults[testtype] = []
        print(f"Parsing test type '{testtype}'")
        for index, files in frameworkframe.iterrows():
            framework, paths = files["Framework"], files["Files"]
            if not get_verification(paths.verification):
                continue

            rpslats = get_rps_and_latency(paths.raw)
            if rpslats is None or len(rpslats) == 0:
                continue

            # Get the best RPS result
            rpslat = max(rpslats, key=lambda r: r.rps.requests_per_sec)

            # Get a DataFrame of the Dstat CSV
            # Using only data from the fastest 15 second measurement
            # Add one second to starttime to allow framework to ramp up cpu/memory
            start, end = rpslat.starttime + 1, rpslat.endtime
            statframe = get_stats(paths.stats).loc[start:end]
            memory = get_memory_usage(statframe)
            cpu_usr = get_cpu_usr(statframe)
            cpu_sys = get_cpu_sys(statframe)
            cpu_total = get_cpu(statframe)
            summary = FrameworkSummary(
                name=framework,
                threads=rpslat.threads,
                connections=rpslat.connections,
                rps=rpslat.rps,
                latency=rpslat.latency,
                memory=memory,
                cpu=cpu_total,
                usr=cpu_usr,
                sys=cpu_sys,
            )
            testresults[testtype].append(summary)

    return testresults


def download_results(url):
    """
    Download the results zip from the web, e.g. from
    https://tfb-status.techempower.com/results/5bc93dbb-7aa6-49a1-ab39-a2d36106beb9,
    if it is not found already in 'cache/'.
    """

    content = urlopen(url).read().decode("utf-8")
    if "<body>" not in content:
        raise ValueError(f"Could not find '<body>' at '{url}'")

    # basic meta data from HTML for download path {environment}_{date}_{runid}
    body = content[content.index("<body>") :]  # noqa: E203
    f100 = body[:100]

    environment = "UnknownEnvironment"
    if "Azure" in f100:
        environment = "Azure"
    elif "Citrine" in f100:
        environment = "Citrine"

    runid = "UnknownRunId"
    match = re.search(GuidPattern, f100)
    if match:
        runid = match.group(0)

    started_date = "UnknownStartedDate"
    match = re.search("started [0-9]{4}-[0-9]{2}-[0-9]{2}", body)
    if match:
        started_date = match.group(0).replace(" ", "")

    # do a hacky search for results.zip download URL
    sentinal = ">results.zip</a>"
    if sentinal not in content:
        raise ValueError(f"Could not find '{sentinal}' at '{url}'")

    rzip_at = body.index(sentinal)
    back = 4
    match = re.search('href="(.*)"', body[(rzip_at - back) : rzip_at])  # noqa: E203
    while back < rzip_at and not match:
        match = re.search('href="(.*)"', body[(rzip_at - back) : rzip_at])  # noqa: E203
        back += 1

    relative_path = match.group(1)
    uparse = urlparse(url)
    download_url = f"{uparse.scheme}://{uparse.netloc}/{relative_path}"

    name = f"{environment}_{started_date}_{runid}"
    results_dir = os.path.join("cache", name)
    if os.path.isdir(results_dir):
        print(f"Found existing downloaded results in {results_dir}")
        return (results_dir, name)

    results_zip = results_dir + ".zip"
    print(f"Downloading {download_url} to {results_zip}")
    download_zip = urlopen(download_url).read()
    with open(results_zip, "wb") as rz:
        rz.write(download_zip)

    # we have the zip, create the directory and expand data into it
    if not os.path.isdir("cache"):
        os.makedirs("cache")
    if not os.path.isdir(results_dir):
        os.makedirs(results_dir)

    with ZipFile(results_zip, "r") as rz:
        rz.extractall(results_dir)

    return (results_dir, name)


def print_help():
    print(
        "Required arguments: "
        + "\n- URL to the status page of a run at https://tfb-status.techempower.com/"
        + "\n- Existing directory path followed by a name of your choice for results"
    )


def main(args):
    if len(args) == 1:
        # check if we have a URL
        as_url = urlparse(args[0])
        if as_url.scheme == "https" and len(as_url.netloc.split(".")) > 1:
            print(f"Getting result summary at {args[0]}")
            path, name = download_results(args[0])
        else:
            print_help()
    elif len(args) == 2:
        path, name = args[0], args[1]
    else:
        print_help()

    if not os.path.isdir(path):
        print(f"'{path}' is not a directory")
        return

    # use the results subdirectory if given unzipped path
    as_unzipped_azure = os.path.join(
        path, "mnt", "tfb", "FrameworkBenchmarks", "results"
    )
    as_unzipped_citrine = os.path.join(path, "results")
    if os.path.isdir(as_unzipped_azure):
        path = as_unzipped_azure
    elif os.path.isdir(as_unzipped_citrine):
        path = as_unzipped_citrine

    start([(d, name) for d in os.scandir(path) if d.is_dir()])


if __name__ == "__main__":
    main(sys.argv[1:])
