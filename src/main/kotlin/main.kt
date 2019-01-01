import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import java.io.File
import java.lang.Exception
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.stream.Collectors

data class DstatHeader(val category: String, val header: String)
data class RpsAndLatencyStat(val requestsPerSecond: Double, val latencyAverageMs: Double, val latencyStandardDeviationMs: Double, val latencyMaxMs: Double)
data class FrameworkTestResult(val rpsAndLatency: RpsAndLatencyStat, val memoryUsages: List<Double>, val loadAverages: List<Double>)
class BadDataException(override val message: String) : Exception(message)

fun Collection<Double>.median(): Double? {
    if (!this.any())
        return null

    val sorted = this.sorted()
    return if (sorted.size % 2 == 0) {
        (sorted[sorted.size / 2] + sorted[(sorted.size / 2) - 1]) / 2.0
    } else {
        sorted[sorted.size / 2]
    }
}

fun getVerifiedStatus(filePath: String): Boolean {
    return Files.exists(Paths.get(filePath)) &&
           File(filePath).readText().contains("PASS")
}

fun getDstatColumnMap(filePath: String): Map<DstatHeader, List<String>> {
    val lines = File(filePath).readLines()

    // skip the first 5 lines which are not CSV
    // join the two headers dstat provides
    val headerLines = lines.drop(5).take(2).toList()
    val headers = headerLines[0].split(",")
        .fold(mutableListOf<String>()) {
            acc, next -> acc.add(if (next.isNotEmpty()) next else acc.last()); acc
        }
        .zip(headerLines[1].split(","))
        .map { (ch, sh) -> DstatHeader(ch.trim('"'), sh.trim('"')) }
        .toList()

    // pull into map of columns
    val columns = mutableMapOf<DstatHeader, MutableList<String>>()
    for (line in lines.drop(7)) {
        val values = line.split(",")
        for ((header, value) in headers.zip(values)) {
            val columnValues = columns[header]
            if (columnValues != null) {
                columnValues.add(value)
            } else {
                val newValues = mutableListOf<String>()
                newValues.add(value)
                columns[header] = newValues
            }
        }
    }

    return columns
}

fun getMilliseconds(number: String): Double {
    when {
        number.endsWith("ms") -> return number.substring(0, number.length - 2).toDouble()
        number.endsWith("us") -> return number.substring(0, number.length - 2).toDouble() * 0.001
        number.endsWith("s") -> return number.substring(0, number.length - 1).toDouble() * 1000
        else -> throw BadDataException("Cannot get milliseconds from $number")
    }
}

fun getRpsAndLatencyStat(filePath: String): RpsAndLatencyStat {
    val text = File(filePath).readText()
    val concurrencyRuns = text
        .split("\n---------------------------------------------------------")
        .filter { it.lines().last().startsWith("ENDTIME") }

    val numRegex = """\d+\.\d\d"""
    val timeRegex = """$numRegex(us|ms|s)"""
    val rpsRegex = """Requests/sec: +($numRegex)"""
    val latencyRegex = """Latency +$timeRegex +$timeRegex +$timeRegex"""

    val finds = concurrencyRuns
        .map {
            val rpsFind = Regex(rpsRegex).find(it)?.groups?.drop(1)?.first()?.value ?: throw BadDataException("Could not get RPS line")
            val latFind = Regex(latencyRegex).find(it)?.groups?.first()?.value ?: throw BadDataException("Could not get latency line")
            val lats = latFind.split(" ").filter { it.isNotEmpty() }.drop(1).toList()
            RpsAndLatencyStat(rpsFind.toDouble(), getMilliseconds(lats[0]), getMilliseconds(lats[1]), getMilliseconds(lats[2]))
        }
        .toList()

    return finds.maxBy { it.requestsPerSecond } ?: throw BadDataException("Failed to get max requests per second")
}

fun getFilteredResults(resultDirPath: Path): Map<String, Map<String, FrameworkTestResult>> {
    val frameworkDirs = Files.list(resultDirPath)
        .filter { Files.isDirectory(it) }
        .collect(Collectors.toList())

    val fortunes = mutableMapOf<String, FrameworkTestResult>()
    val plaintexts = mutableMapOf<String, FrameworkTestResult>()
    val jsons = mutableMapOf<String, FrameworkTestResult>()
    val all = mutableMapOf("fortune" to fortunes, "plaintext" to plaintexts, "json" to jsons)

    for (frameworkDir in frameworkDirs) {
        for (test in listOf("fortune", "plaintext", "json")) {
            val testMap = all[test]!!
            val testDir = Paths.get("$frameworkDir/$test")
            if (Files.isDirectory(testDir) && getVerifiedStatus("$testDir/verification.txt")) {
                try {
                    val columns = getDstatColumnMap("$testDir/stats.txt")
                    val memoryUsages = columns[DstatHeader("memory usage", "used")]!!.map { it.toDouble() }.toList()
                    val loadAverages = columns[DstatHeader("load avg", "1m")]!!.map { it.toDouble() }.toList()
                    val rpsAndLatency = getRpsAndLatencyStat("$testDir/raw.txt")
                    testMap[frameworkDir.fileName.toString()] = FrameworkTestResult(rpsAndLatency, memoryUsages, loadAverages)
                } catch (e: BadDataException) {
                    continue
                }
            }
        }
    }

    return all
}

fun main(args: Array<String>) {
    val homePath = System.getProperty("user.home")
    var inputResultDirPath = Paths.get("~/Downloads/results/20181027100951/".replaceFirst("~", homePath)).toAbsolutePath()
    var outputJsonFilePath = Paths.get("docs/filtered.json".replaceFirst("~", homePath)).toAbsolutePath()

    if (args.size == 2) {
        inputResultDirPath = Paths.get(args[0].replaceFirst("~", homePath)).toAbsolutePath()
        outputJsonFilePath = Paths.get(args[1].replaceFirst("~", homePath)).toAbsolutePath()
    }

    val filteredResults = getFilteredResults(inputResultDirPath)
    val mapper = ObjectMapper().registerModule(KotlinModule())
    val json = mapper.writeValueAsString(filteredResults)
    Files.write(outputJsonFilePath, mutableListOf(json))
    println("Wrote results to $outputJsonFilePath")

    // just for fun...
    println("Top 20 frameworks")
    val fortunes = filteredResults["fortune"]!!
    val top20 = fortunes.toList().sortedByDescending { (k, v) -> v.rpsAndLatency.requestsPerSecond }.take(20).toList()
    for ((k, v) in top20) {
        println("${k.padStart(20)} of ${v.rpsAndLatency.requestsPerSecond} has ${v.memoryUsages.median()!! / 1_000_000 } MB and ${v.loadAverages.median()} load avg")
    }
}