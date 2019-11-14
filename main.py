from dataclasses import dataclass
from pandas import DataFrame
from pyparsing import Word, Optional, nums, alphas, Group, Combine
from typing import Dict, List
import os

Integer = Word(nums)
Floating = Combine(Word(nums) + Optional(Combine("." + Word(nums))))
# FloatUnit: 12.34ms, 12.34k, or just 12.34
FloatUnit = Group(Floating + Optional(Word(alphas)))
Percent = Group(Floating + "%")


def main(args):

    # TODO: zip file unzipping/caching, zipfile = sys.argv[1]
    testFiles = getTestResultFiles(args[0])
    testResults = getTestResults(testFiles)


@dataclass
class TestFiles(object):
    verificationPath: str = ""  # verification.txt
    statsPath: str = ""  # stats.txt
    rawPath: str = ""  # raw.txt


def getTestResultFiles(root: str) -> Dict[str, DataFrame]:
    allowedTestTypes = set(["db", "fortune", "json", "plaintext", "query", "update"])
    allowedFileNames = set(["verification.txt", "stats.txt", "raw.txt"])
    files = DataFrame(
        (
            (test, framework, file)
            for framework in next(os.walk(root))[1]
            for test in next(os.walk(os.path.join(root, framework)))[1]
            if test in allowedTestTypes
            for file in next(os.walk(os.path.join(root, framework, test)))[2]
            if file in allowedFileNames
        ),
        columns=["Test", "Framework", "File"],
    )

    def toTestFiles(fwGrp) -> TestFiles:
        verPath, statsPath, rawPath = "", "", ""
        for index, row in fwGrp.iterrows():
            fw, test, file = row["Framework"], row["Test"], row["File"]
            if file == "verification.txt":
                verPath = os.path.join(root, fw, test, file)
            elif file == "stats.txt":
                statsPath = os.path.join(root, fw, test, file)
            elif file == "raw.txt":
                rawPath = os.path.join(root, fw, test, file)
        return TestFiles(verificationPath=verPath, statsPath=statsPath, rawPath=rawPath)

    return {
        testType: files[files["Test"] == testType]
        .groupby("Framework")
        .apply(toTestFiles)
        .reset_index(name="Files")
        for testType in allowedTestTypes
    }


def getVerification(filename: str):
    with open(filename, "r") as verFile:
        for line in verFile:
            if line.startswith("   PASS for"):
                return True
        return False


def getRpsAndLatencyParser():
    numConnLine = Group(Integer + "threads and" + Integer + "connections;")
    latencyLine = Group("Latency" + FloatUnit + FloatUnit + FloatUnit + Percent + ";")
    reqSecLine = Group("Req/Sec" + FloatUnit + FloatUnit + FloatUnit + Percent + ";")
    latencyDistLine = Group(Percent + FloatUnit + ";")
    latencyDistLines = latencyDistLine * 4
    countLine = Group(Integer + "requests in" + FloatUnit + "," + FloatUnit + "read;")
    non2xxLine = Optional(Group("Non-2xx or 3xx responses:" + Integer + ";"))
    socketErrorLine = Optional(
        Group(
            "Socket errors: connect"
            + Integer
            + ", read"
            + Integer
            + ", write"
            + Integer
            + ", timeout"
            + Integer
            + ";"
        )
    )
    reqPerSecLine = Group("Requests/sec:" + Floating + ";")
    transferPerSecLine = Group("Transfer/sec:" + FloatUnit + ";")
    rpsParser = (
        numConnLine
        + "Thread Stats   Avg      Stdev     Max   +/- Stdev;"
        + latencyLine
        + reqSecLine
        + "Latency Distribution;"
        + latencyDistLines
        + countLine
        + non2xxLine
        + socketErrorLine
        + reqPerSecLine
        + transferPerSecLine
    )

    return rpsParser


@dataclass
class RpsSummary(object):
    requestsPerSec: float = 0
    transferMegaBytesPerSec: int = 0
    average: float = 0
    maxRps: float = 0
    stdev: float = 0
    stdevRange: float = 0
    requestCount: int = 0
    megaBytesRead: float = 0
    overTimeSeconds: float = 0
    non2xxFailedCount: int = 0


@dataclass
class LatencySummary(object):
    avg: float = 0
    maxLat: float = 0
    stdev: float = 0
    stdevRange: float = 0
    lat50: float = 0
    lat75: float = 0
    lat90: float = 0
    lat99: float = 0


@dataclass
class MemorySummary(object):
    avg: float = 0
    stdev: float = 0
    maxMem: float = 0
    stdevRange: float = 0
    median: float = 0


@dataclass
class FrameworkSummary(object):
    threads: int = 0
    connections: int = 0
    rps: RpsSummary = None
    latency: LatencySummary = None
    memory: MemorySummary = None


# Normalize measurements
# Prefer milliseconds of seconds (s), milliseconds (ms) and microseconds (us)
# Prefer megabytes of kilobytes (KB), megabytes (MB), gigabytes (GB)
# Prefer 0-100 for percent
def noUnits(nums: List[str]) -> float:
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


def getRpsAndLatency(filename: str):
    textSections = {}
    with open(filename, "r") as rpsFile:
        section = 0
        inHeader = False
        for line in rpsFile:
            line = line.strip()
            if line.startswith("----"):
                if inHeader:
                    inHeader = False
                    continue
                inHeader = True
                section += 1
                textSections[section] = ""
                continue
            if inHeader:
                continue
            if line.startswith("unable to connect to"):
                return None
            if line.startswith("0 requests"):
                return None
            if line.startswith("Socket errors"):
                return None
            if (
                line.startswith("Running")
                or line.startswith("STARTTIME")
                or line.startswith("ENDTIME")
            ):
                continue
            textSections[section] += " " + line + ";\n"

    rpsParser = getRpsAndLatencyParser()
    sectionResults = []
    for index, section in textSections.items():
        try:
            t = rpsParser.parseString(section)

            threads, connections = int(t[0][0]), int(t[0][2])
            latAvg, latStdev, latMax, latStdevRange = [noUnits(e) for e in t[2][1:5]]
            rpsAvg, rpsStdev, rpsMax, rpsStdevRange = [noUnits(e) for e in t[3][1:5]]
            lat50, lat75, lat90, lat99 = [noUnits(e[1]) for e in t[5:9]]
            reqCount, overTime, read = (
                int(t[9][0]),
                1e-3 * noUnits(t[9][2]),
                noUnits(t[9][4]),
            )
            non2xx = 0
            if t[10][0] == "Non-2xx or 3xx responses:":
                non2xx = int(t[10][1])

            reqSec, bytesSec = float(t[-2][1]), noUnits(t[-1][1])

            rps = RpsSummary(
                requestsPerSec=reqSec,
                transferMegaBytesPerSec=bytesSec,
                average=rpsAvg,
                maxRps=rpsMax,
                stdev=rpsStdev,
                stdevRange=rpsStdevRange,
                requestCount=reqCount,
                megaBytesRead=read,
                overTimeSeconds=overTime,
                non2xxFailedCount=non2xx,
            )
            latencies = LatencySummary(
                avg=latAvg,
                maxLat=latMax,
                stdev=latStdev,
                stdevRange=latStdevRange,
                lat50=lat50,
                lat75=lat75,
                lat90=lat90,
                lat99=lat99,
            )

            results = {}
            results["threads"] = threads
            results["connections"] = connections
            results["rps"] = rps
            results["latency"] = latencies
            sectionResults.append(results)

        except ValueError as verr:
            raise ValueError("Problem parsing " + filename) from verr
        except TypeError as terr:
            raise TypeError("Problem parsing " + filename) from terr
        except Exception as err:
            raise Exception("Problem parsing " + filename) from err

    # TODO: fix after testing, return all but warmup
    return sectionResults[-1]


def getMemoryUsage(filename: str):
    # TODO: implement memory stats
    # open dataframe from CSV - caveats: skipping first lines? double header?
    # return df["memory-usage"].toStats()
    pass


def getTestResults(testDic: Dict[str, DataFrame]):
    for testType, frameworkFrame in testDic.items():
        print(testType)
        for index, files in frameworkFrame.iterrows():
            framework, paths = files["Framework"], files["Files"]
            if not getVerification(paths.verificationPath):
                continue

            rpsAndLatency = getRpsAndLatency(paths.rawPath)

            # TODO: remove after testing
            print(framework)
            print("   " + str(rpsAndLatency))
            # TODO memoryUsage = getMemoryUsage(paths.statsPath)

        # testing...
        print(testType)
        break

    return None


if __name__ == "__main__":
    # if len(sys.argv) != 2:
    #     raise IndexError(
    #         "You must pass in the path of the ZIP file or directory containing \
    #         the Techempower Framework Benchmark results"
    #     )
    # resultsDir = sys.argv[1]

    # TODO: remove after testing
    main(["/home/aaron/downloads/results/20191028112203/"])
