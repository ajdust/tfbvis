import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import java.io.File
import java.lang.Exception
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.stream.Collectors

data class DstatHeader(val category: String, val header: String)
data class FrameworkTestResult(val reqPerSec: Double, val memoryUsages: List<Double>, val loadAverages: List<Double>)
class BadDataException(override val message: String) : Exception(message)

fun Collection<Double>.median(): Double? {
    if (!this.any())
        return null

    val sorted = this.sorted()
    return sorted[sorted.count() / 2]
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

fun getRPS(filePath: String): Double {
    val text = File(filePath).readText()
    val matches = Regex("""Requests/sec: +([\d.]+)""").findAll(text).toList()
    return matches
        .drop(2) // drop the first two tests: primer and warm up tests
        .map { it.groups.drop(1).first()!!.value.toDouble() }.toList()
        .max() ?: throw BadDataException("No data to take max of")
        // would prefer median, but it looks like TechEmpower uses the max
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
                    val reqPerSec = getRPS("$testDir/raw.txt")
                    testMap[frameworkDir.fileName.toString()] = FrameworkTestResult(reqPerSec, memoryUsages, loadAverages)
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
    val top20 = fortunes.toList().sortedByDescending { it.second.reqPerSec }.take(20).toList()
    for (top in top20) {
        println("${top.first.padStart(20)} of ${top.second.reqPerSec} has ${top.second.memoryUsages.median()!! / 1_000_000 } MB and ${top.second.loadAverages.median()} load avg")
    }
}